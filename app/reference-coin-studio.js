import * as THREE from './vendor/three/build/three.module.js';

/** Fixed photographic light cards baked once into an environment map. */
export function createReferenceCoinStudio() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color().setRGB(0.16, 0.18, 0.21);
  const resources = [];
  const card = (width, height, position, color) => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(...color),
      side: THREE.DoubleSide,
    });
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.lookAt(0, 0, 0);
    scene.add(object);
    resources.push(geometry, material);
  };
  card(3.4, 4.5, [-4, 1.4, -1.6], [2.8, 2.65, 2.4]);
  card(1.2, 5, [3, 1, 3], [2.5, 2.6, 2.8]);
  card(6, 3, [0, 5, 0], [1.7, 1.65, 1.5]);
  card(3, 4, [1, -2, -4], [1.1, 1.2, 1.4]);
  card(0.75, 5, [-3.4, -0.3, 1.5], [0.045, 0.05, 0.06]);
  scene.dispose = () => resources.forEach((resource) => resource.dispose());
  return scene;
}
