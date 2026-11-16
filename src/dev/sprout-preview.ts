/** Isolated art study. No App, profile, saves, speech or production route. */
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import asset from './sprout/porch.glb?url';

const host = document.querySelector<HTMLElement>('#view')!;
const status = document.querySelector<HTMLElement>('#status')!;
const waveButton = document.querySelector<HTMLButtonElement>('#wave')!;
const ballButton = document.querySelector<HTMLButtonElement>('#ball')!;
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
host.prepend(renderer.domElement);
renderer.domElement.setAttribute(
  'aria-label',
  'Sprout on a sunny porch. Use the buttons to say hello or roll a ball.',
);
const scene = new T.Scene();
scene.background = new T.Color('#e8e8d6');
const camera = new T.OrthographicCamera(-4, 4, 4, -4, 0.1, 50);
camera.position.set(4.4, 4.2, 7.5);
camera.lookAt(0, 1.25, -0.4);
scene.add(new T.HemisphereLight('#fff2d7', '#8a9a77', 2.8));
const sun = new T.DirectionalLight('#ffead0', 3.5);
sun.position.set(-3, 7, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.1, far: 20 });
sun.shadow.normalBias = 0.04;
scene.add(sun);
let alive = true,
  time = 0,
  wave = -10,
  roll = -10;
let sprout: T.Object3D, head: T.Object3D, arm: T.Object3D, ball: T.Object3D;
let armRest = 0;
const eyes: T.Object3D[] = [];
const ballRest = new T.Vector3();
const abort = new AbortController();
function sayHello() {
  if (!sprout) return;
  wave = time;
  status.textContent = 'Hello, Sprout!';
}
function rollBall() {
  if (!ball || time - roll < 2.6) return;
  roll = time;
  status.textContent = 'A little nudge, right back to you.';
}
waveButton.addEventListener('click', sayHello, { signal: abort.signal });
ballButton.addEventListener('click', rollBall, { signal: abort.signal });
const ray = new T.Raycaster();
renderer.domElement.addEventListener(
  'pointerdown',
  (e) => {
    if (!e.isPrimary || e.button !== 0 || !sprout) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(
      new T.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hits = ray.intersectObjects([sprout, ball], true);
    if (!hits.length) return;
    let node: T.Object3D | null = hits[0].object;
    while (node && node !== ball && node !== sprout) node = node.parent;
    if (node === ball) rollBall();
    else sayHello();
    // One immediate action, no held state: cancellation/lost release cannot strand it.
  },
  { signal: abort.signal },
);
function resize() {
  const w = host.clientWidth,
    h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  const aspect = w / h,
    width = Math.max(7.5, 5.8 * aspect),
    height = width / aspect;
  Object.assign(camera, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2 });
  camera.updateProjectionMatrix();
}
const observer = new ResizeObserver(resize);
observer.observe(host);
resize();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let previous = 0;
renderer.setAnimationLoop((now: number) => {
  const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
  previous = now;
  if (document.hidden) return;
  time += dt;
  if (sprout) {
    const t = time - wave,
      active = t >= 0 && t < 2;
    head.rotation.z = active ? Math.sin(t * 3) * 0.08 : reduced.matches ? 0 : Math.sin(time * 0.9) * 0.025;
    arm.rotation.z =
      armRest +
      (active
        ? Math.sin((Math.min(t * 4, 1) * Math.PI) / 2) *
          (0.65 + Math.sin(t * 13) * 0.2) *
          Math.min(1, (2 - t) * 4)
        : 0);
    sprout.scale.y = 1 + (reduced.matches ? 0 : Math.sin(time * 2) * 0.008);
    const blink = time % 4.7;
    for (const eye of eyes) eye.scale.y = blink < 0.14 ? 0.12 : 1;
    const r = (time - roll) / 2.6;
    ball.position.copy(ballRest);
    if (r >= 0 && r < 1) {
      const travel = Math.sin(Math.PI * r);
      ball.position.x -= travel * 1.1;
      ball.position.z -= travel * 0.35;
      ball.rotation.x = -travel * 3;
      ball.rotation.z = travel * 2;
    }
  }
  renderer.render(scene, camera);
});
function dispose() {
  if (!alive) return;
  alive = false;
  abort.abort();
  observer.disconnect();
  renderer.setAnimationLoop(null);
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  sun.shadow.dispose();
  renderer.dispose();
}
window.addEventListener('pagehide', dispose, { once: true });
try {
  const gltf = await new GLTFLoader().loadAsync(asset);
  if (alive) {
    scene.add(gltf.scene);
    gltf.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
      if (!(o instanceof T.Mesh) && /^Eye(?:[_.]?\d+)?$/.test(o.name)) eyes.push(o);
    });
    sprout = gltf.scene.getObjectByName('Sprout')!;
    head = gltf.scene.getObjectByName('Head')!;
    arm = gltf.scene.getObjectByName('RightArm')!;
    ball = gltf.scene.getObjectByName('Ball')!;
    if (!sprout || !head || !arm || !ball || eyes.length !== 2) throw new Error('Missing model pivots');
    armRest = arm.rotation.z;
    ballRest.copy(ball.position);
    status.textContent = 'Tap Sprout or try the buttons.';
    waveButton.disabled = false;
    ballButton.disabled = false;
    document.body.dataset.ready = 'true';
  } else {
    gltf.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      }
    });
  }
} catch (error) {
  status.textContent = 'The porch could not load. Refresh to try again.';
  console.error(error);
}
