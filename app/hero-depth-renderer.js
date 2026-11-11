import * as THREE from './vendor/three/build/three.module.js';

/** One lightweight GPU surface for all five image planes. DOM images retain
 * layout/closed CSS loops and are revealed again if WebGL cannot be used. */
export async function createHeroDepthRenderer(
  host,
  planes,
  urls,
  options = {},
) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
  const canvas = renderer.domElement;
  canvas.className = 'reference-depth-canvas';
  let active = !options.deferReveal;
  let activatedAt = active ? performance.now() : Infinity;
  if (!active) canvas.style.visibility = 'hidden';
  canvas.setAttribute('aria-hidden', 'true');
  const loader = new THREE.TextureLoader();
  const textures = [];
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const meshes = [];
  const story = host.closest('[data-clockwork-story]');
  let destroyed = false;
  let failed = false;
  const restore = () => {
    for (const plane of planes) plane.image.style.visibility = '';
    host.dataset.depth = 'fallback';
    canvas.remove();
  };
  renderer.debug.onShaderError = () => {
    failed = true;
    restore();
  };
  const lost = (event) => {
    event.preventDefault();
    restore();
  };
  canvas.addEventListener('webglcontextlost', lost);
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    restore();
    canvas.removeEventListener('webglcontextlost', lost);
    geometry.dispose();
    for (const mesh of meshes) mesh.material.dispose();
    for (const texture of textures) texture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
  try {
    const loaded = await Promise.allSettled(
      Object.entries(urls).map(async ([key, url]) => {
        const texture = await loader.loadAsync(url);
        texture.colorSpace = key.endsWith('Depth')
          ? THREE.NoColorSpace
          : THREE.SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        textures.push(texture);
        urls[key] = texture;
      }),
    );
    const failure = loaded.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
    for (const plane of planes) {
      const cloud = plane.kind === 'cloud';
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          colorMap: { value: cloud ? urls.cloud : urls.hand },
          depthMap: { value: cloud ? urls.cloudDepth : urls.handDepth },
          view: { value: new THREE.Vector2() },
          amount: { value: cloud ? 0.032 : 0.009 },
          opacity: { value: 1 },
          clipSide: { value: plane.half || 0 },
          blurStep: { value: new THREE.Vector2() },
          lightPresence: { value: 0 },
        },
        vertexShader: `varying vec2 vUv;
          void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `uniform sampler2D colorMap,depthMap;
          uniform vec2 view;
          uniform vec2 blurStep;
          uniform float amount,opacity,clipSide,lightPresence;
          varying vec2 vUv;
          void main(){
            if((clipSide<0.0 && vUv.x>0.5)||(clipSide>0.0 && vUv.x<0.5)) discard;
            vec4 base=texture2D(colorMap,vUv);
            float depth=clipSide==0.0?texture2D(depthMap,vUv).r:0.0;
            // Hand anatomy must have one registered texture/silhouette. Warping
            // its shading against a locked alpha creates a second fingertip.
            // Hands use plane parallax + depth lighting; only vapor may deform.
            vec2 uv=clipSide==0.0?vUv+view*(depth-0.35)*amount:vUv;
            if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0)))) discard;
            vec4 color=texture2D(colorMap,uv);
            if(clipSide==0.0 && blurStep.x>0.0) {
              // A bounded five-tap cloud lens. Hands stay on the sharp plane.
              vec4 soft=color*0.4;
              soft+=texture2D(colorMap,uv+vec2(blurStep.x,0.0))*0.15;
              soft+=texture2D(colorMap,uv-vec2(blurStep.x,0.0))*0.15;
              soft+=texture2D(colorMap,uv+vec2(0.0,blurStep.y))*0.15;
              soft+=texture2D(colorMap,uv-vec2(0.0,blurStep.y))*0.15;
              color=soft;
            }
            // Relief moves interior shading, while the original alpha locks
            // the silhouette. Unseen pixels cannot open a halo at fingertips.
            float interior=smoothstep(0.85,0.99,base.a)*smoothstep(0.85,0.99,color.a);
            float border=clipSide==0.0?smoothstep(0.0,0.025,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y))):1.0;
            vec3 surface=mix(base.rgb,color.rgb,interior);
            if(clipSide!=0.0) {
              // V1 depth is not registered to the newer hand silhouettes.
              // Preserve V10's authored anatomy; only a broad studio light
              // varies across the image, never a second set of finger normals.
              float front=1.0-smoothstep(0.15,0.48,abs(vUv.x-0.5));
              float light=0.90+front*0.16;
              vec3 bounce=mix(vec3(0.94,0.975,1.025),vec3(1.025,1.008,0.985),front);
              surface=surface*mix(vec3(1.0),bounce*light,interior*lightPresence);
            }
            gl_FragColor=vec4(surface,base.a*opacity*border);
            #include <colorspace_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = plane.order;
      mesh.frustumCulled = false;
      scene.add(mesh);
      meshes.push(mesh);
    }
    host.appendChild(canvas);
    // Compile before the entrance clock starts, not on its final reveal frame.
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    destroy();
    throw error;
  }
  let width = 0,
    height = 0,
    last = -Infinity,
    lastTravel = -1;
  return {
    activate() {
      active = true;
      activatedAt = performance.now();
      canvas.style.visibility = '';
      host.dataset.handLighting = 'studio-key-fill';
      host.dataset.handFocus = 'foreground';
      for (const plane of planes) plane.image.style.visibility = 'hidden';
      last = -Infinity;
    },
    draw(x, y, now, force = false) {
      if (destroyed || failed || renderer.getContext().isContextLost()) return;
      const travel =
        Number(story?.style.getPropertyValue('--warm-camera-travel')) || 0;
      // Camera movement follows display cadence; resting relief stays at30Hz.
      if (!force && travel === lastTravel && now - last < 1000 / 30) return;
      last = now;
      lastTravel = travel;
      const stage = host.getBoundingClientRect();
      const resized = stage.width !== width || stage.height !== height;
      if (resized) {
        width = stage.width;
        height = stage.height;
      }
      const lightProgress = Math.min(
        1,
        Math.max(0, (now - activatedAt) / 450),
      );
      const lightPresence =
        lightProgress * lightProgress * (3 - 2 * lightProgress);
      planes.forEach((plane, i) => {
        const image = plane.image;
        const box = image.getBoundingClientRect();
        const parent = getComputedStyle(image.parentElement);
        const local = new DOMMatrixReadOnly(getComputedStyle(image).transform);
        const outer = new DOMMatrixReadOnly(parent.transform);
        const scale =
          Math.hypot(local.a, local.b) * Math.hypot(outer.a, outer.b);
        const mesh = meshes[i];
        const zoom =
          1 +
          travel *
            (plane.kind === 'hand' ? 0.12 : plane.order === 0 ? 0.025 : 0.065);
        const shift = plane.order === 0 ? -2 : plane.kind === 'hand' ? 5 : 14;
        mesh.position.set(
          (box.x + box.width / 2 - stage.x - width / 2) * zoom + x * shift,
          (height / 2 - (box.y + box.height / 2 - stage.y)) * zoom + y * shift,
          0,
        );
        mesh.scale.set(
          image.offsetWidth * scale * zoom,
          image.offsetHeight * scale * zoom,
          1,
        );
        mesh.rotation.z = -(
          Math.atan2(local.b, local.a) + Math.atan2(outer.b, outer.a)
        );
        mesh.material.uniforms.view.value.set(x, -y);
        mesh.material.uniforms.lightPresence.value = lightPresence;
        mesh.material.uniforms.opacity.value = Number(parent.opacity);
        const blur = plane.kind === 'cloud' && plane.order > 0 ? 3.5 : 0;
        mesh.material.uniforms.blurStep.value.set(
          blur / Math.max(1, box.width),
          blur / Math.max(1, box.height),
        );
      });
      // Resize only after geometry/style reads; canvas dimensions affect layout.
      if (resized) {
        renderer.setSize(width, height, false);
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
      if (failed) return;
      if (!active) {
        host.dataset.depth = 'prepared';
        return;
      }
      canvas.dataset.viewX = x.toFixed(4);
      canvas.dataset.viewY = y.toFixed(4);
      canvas.dataset.handZoom = String(1 + travel * 0.12);
      canvas.dataset.nearCloudZoom = String(1 + travel * 0.065);
      canvas.dataset.farCloudZoom = String(1 + travel * 0.025);
      for (const plane of planes) plane.image.style.visibility = 'hidden';
      host.dataset.depth = 'ready';
    },
    destroy,
  };
}
