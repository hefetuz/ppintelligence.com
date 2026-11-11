import * as THREE from './vendor/three/build/three.module.js';
import { GLTFLoader } from './vendor/three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from './vendor/three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from './vendor/three/addons/environments/RoomEnvironment.js';
import { createReferenceCoinStudio } from './reference-coin-studio.js';
import {
  mintedCoinRotation,
  mintedCoinProjection,
} from './minted-coin-pose.mjs';

async function loadOutlineData() {
  const compressed = typeof DecompressionStream !== 'undefined';
  const response = await fetch(
    '/models/pretty-penny-minted-v1-hero-edges.bin' + (compressed ? '.gz' : ''),
  );
  if (!response.ok) throw Error('Coin outlines could not load');
  const transferred = await response.arrayBuffer();
  const magic = new Uint8Array(
    transferred,
    0,
    Math.min(2, transferred.byteLength),
  );
  // Some hosts send .gz with Content-Encoding, so fetch already decodes it.
  const buffer =
    compressed && magic[0] === 0x1f && magic[1] === 0x8b
      ? await new Response(
          new Blob([transferred])
            .stream()
            .pipeThrough(new DecompressionStream('gzip')),
        ).arrayBuffer()
      : transferred;
  const length = new DataView(buffer).getUint32(0, true);
  const metadata = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 4, length)),
  );
  return { buffer, metadata, start: Math.ceil((4 + length) / 4) * 4 };
}

/** No animation loop: the hero owns rendering, visibility and pixel density. */
export async function createMintedCoinRenderer(onContextLost, appearance = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = appearance.exposure ?? 1;
  const lost = () => onContextLost();
  renderer.domElement.addEventListener('webglcontextlost', lost);
  const scene = new THREE.Scene();
  const draco = new DRACOLoader()
    .setDecoderPath('/vendor/draco/')
    .setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  draco.preload();
  const modelRequest = loader.loadAsync(
    appearance.modelUrl ?? '/models/pretty-penny-minted-v1-hero.glb',
  );
  const blueprint = appearance.blueprint !== false;
  const technicalRequest =
    blueprint && appearance.blueprintUrl
      ? fetch(appearance.blueprintUrl)
          .then((response) => {
            if (!response.ok) throw Error('Technical contours could not load');
            return response.json();
          })
          .catch(() => null)
      : Promise.resolve(null);
  const outlineRequest =
    blueprint && appearance.bakedOutlines !== false
      ? loadOutlineData().catch(() => null)
      : Promise.resolve(null);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room =
    appearance.studio === 'reference'
      ? createReferenceCoinStudio()
      : new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = appearance.environmentIntensity ?? 0.8;
  scene.environmentRotation.set(
    ...(appearance.environmentRotation ?? [0.25, 0.9, 0]),
  );
  if (appearance.studio === 'reference') {
    // Relief needs directional occlusion as well as reflected light cards.
    // One small shadow map is shared by all lettering and both coin faces.
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const key = new THREE.DirectionalLight('#fff4df', 3.5);
    key.position.set(-3, 4, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    Object.assign(key.shadow.camera, {
      left: -1.5,
      right: 1.5,
      top: 1.5,
      bottom: -1.5,
      near: 0.1,
      far: 15,
    });
    key.shadow.bias = -0.00008;
    key.shadow.normalBias = 0.001;
    scene.add(key);
    const back = new THREE.DirectionalLight('#dceaff', 2);
    back.position.set(2, 3, -4);
    scene.add(back);
  }
  room.dispose();
  pmrem.dispose();
  let model;
  const disposeModel = () => {
    const textures = new Set();
    model?.traverse((object) => {
      object.geometry?.dispose();
      for (const material of object.material
        ? [].concat(object.material)
        : []) {
        for (const value of Object.values(material))
          if (value?.isTexture) textures.add(value);
        material.dispose();
      }
    });
    for (const texture of textures) {
      texture.source?.data?.close?.();
      texture.dispose();
    }
  };
  try {
    model = (await modelRequest).scene;
  } catch (error) {
    environment.dispose();
    renderer.dispose();
    draco.dispose();
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    throw error;
  } finally {
    draco.dispose();
  }
  const box = new THREE.Box3().setFromObject(model);
  const scale = 2 / box.getSize(new THREE.Vector3()).x;
  const center = box.getCenter(new THREE.Vector3());
  const normalized = new THREE.Group();
  normalized.scale.setScalar(scale);
  normalized.position.copy(center).multiplyScalar(-scale);
  normalized.add(model);
  const pivot = new THREE.Group();
  pivot.add(normalized);
  scene.add(pivot);
  // Cancel the view translation in projection while retaining the physical
  // camera position for PBR shading. Clip coordinates match the Canvas camera.
  const camera = new THREE.Camera();
  camera.position.z = 5.5;
  const cameraOffset = new THREE.Matrix4().makeTranslation(0, 0, 5.5);
  const outlines = [];
  const baked = await outlineRequest;
  const technical = await technicalRequest;
  const depthMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const metals = new Set();
  model.traverse((object) => {
    if (!object.isMesh) return;
    if (appearance.studio === 'reference') {
      object.castShadow = true;
      object.receiveShadow = true;
    }
    for (const material of [].concat(object.material)) {
      metals.add(material);
      material.transparent = true;
    }
    if (!blueprint) return;
    const group = baked?.metadata.groups.find(
      (group) => group.material === object.material.name,
    );
    const edges = technical
      ? null
      : group
        ? new THREE.BufferGeometry().setAttribute(
            'position',
            new THREE.BufferAttribute(
              new Float32Array(
                baked.buffer,
                baked.start + group.offset,
                group.count,
              ),
              3,
            ),
          )
        : new THREE.EdgesGeometry(
            object.geometry,
            appearance.edgeThreshold ?? 25,
          );
    const line =
      edges &&
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: '#bfd5ed',
          transparent: true,
          opacity: 0,
          depthTest: true,
          depthWrite: false,
        }),
      );
    if (line) {
      line.visible = false;
      line.renderOrder = 10;
    }
    const depth = new THREE.Mesh(object.geometry, depthMaterial);
    depth.visible = false;
    depth.renderOrder = -1;
    outlines.push([object, line, depth]);
  });
  // Add after traversal so newly added children are not visited recursively.
  for (const [object, line, depth] of outlines) {
    object.add(depth);
    if (line) object.add(line);
  }
  // Smooth lathed walls have no hard edges for EdgesGeometry to retain.
  // Trace the actual body profile's shoulder and lip, in normalized coin units.
  const profileLines = [];
  for (const group of technical?.groups ?? []) {
    const line = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(group.positions, 3),
      ),
      new THREE.LineBasicMaterial({
        color: '#d6e6f5',
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
      }),
    );
    line.userData.inkOpacity = group.opacity;
    line.visible = false;
    line.renderOrder = 10;
    pivot.add(line);
    profileLines.push(line);
  }
  for (const side of blueprint && !technical ? [-1, 1] : [])
    for (const [radius, z] of [
      [1, 0.043],
      [0.968, 0.079],
    ]) {
      const points = Array.from({ length: 256 }, (_, i) => {
        const angle = (i / 256) * Math.PI * 2;
        return new THREE.Vector3(
          radius * Math.cos(angle),
          radius * Math.sin(angle),
          z * side,
        );
      });
      const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: '#bfd5ed',
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      line.visible = false;
      line.renderOrder = 10;
      pivot.add(line);
      profileLines.push(line);
    }
  // Only the outer pivot animates. Keep every imported/local transform exact,
  // but avoid recomposing these immutable matrices on each rendered frame.
  // World matrices still update normally as the pivot rotates.
  normalized.traverse((object) => {
    if (object.matrixAutoUpdate) object.updateMatrix();
    object.matrixAutoUpdate = false;
  });
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    disposeModel();
    depthMaterial.dispose();
    for (const line of profileLines) {
      line.geometry.dispose();
      line.material.dispose();
    }
    environment.dispose();
    scene.traverse((object) => object.shadow?.map?.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
  };
  // Warm the solid and blueprint shaders before the opening clock starts.
  camera.projectionMatrix
    .fromArray(mintedCoinProjection(1))
    .multiply(cameraOffset);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  pivot.rotation.set(-0.17, 0, 0, 'XYZ');
  renderer.setSize(256, 256, false);
  for (const [, line, depth] of outlines) {
    if (line) line.visible = true;
    depth.visible = true;
  }
  for (const line of profileLines) line.visible = true;
  try {
    await renderer.compileAsync(scene, camera);
    // The first render uploads material maps and vertex buffers; keep that work
    // outside the visible orbit rather than paying it on its first coin frame.
    renderer.render(scene, camera);
  } catch (error) {
    destroy();
    throw error;
  }
  for (const [, line, depth] of outlines) {
    if (line) line.visible = false;
    depth.visible = false;
  }
  for (const line of profileLines) line.visible = false;
  let projectedPerspective = 1;
  let previousInk;
  let drawingSize = 256;
  let drawingDpr = 1;
  return {
    canvas: renderer.domElement,
    label: 'Minted GLB · 74,752 triangles',
    resize(size, dpr) {
      if (size === drawingSize && dpr === drawingDpr) return;
      // setPixelRatio also calls setSize; set both in one buffer resize.
      renderer.setDrawingBufferSize(size, size, dpr);
      drawingSize = size;
      drawingDpr = dpr;
    },
    draw(pose) {
      if (destroyed) return;
      const rotation = mintedCoinRotation(pose.yaw, pose.tilt);
      pivot.rotation.set(rotation.x, rotation.y, rotation.z, rotation.order);
      if (pose.perspective !== projectedPerspective) {
        camera.projectionMatrix.fromArray(
          mintedCoinProjection(pose.perspective),
        );
        camera.projectionMatrix.multiply(cameraOffset);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        projectedPerspective = pose.perspective;
      }
      const ink = Math.max(0, Math.min(1, pose.wireframe || 0));
      if (ink !== previousInk) {
        for (const material of metals) {
          material.opacity = 1 - ink;
          material.depthWrite = ink < 1;
          material.visible = ink < 1;
        }
        for (const [, line, depth] of outlines) {
          if (line) {
            line.visible = ink > 0;
            line.material.opacity = ink * 0.55;
          }
          depth.visible = ink > 0;
        }
        for (const line of profileLines) {
          line.visible = ink > 0;
          line.material.opacity = ink * (line.userData.inkOpacity ?? 0.55);
        }
        previousInk = ink;
      }
      renderer.render(scene, camera);
    },
    destroy,
    setProfiling() {},
    diagnostics() {
      return {
        contextLost: renderer.getContext().isContextLost(),
        triangles: renderer.info.render.triangles,
      };
    },
  };
}
