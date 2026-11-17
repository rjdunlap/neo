/** Art lab, real-time view: the porch model drawn live by Three.js. No App, profile, saves, speech or production route. */
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import asset from '../sprout/porch.glb?url';
import { pose, ROLL_SECONDS, type LabView, type Mount } from './motion';

export const mount: Mount = async (host, say, pixelRatio) => {
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(pixelRatio);
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
  // scripts/art/sprout-porch-sprites.py renders the other view from this same camera.
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
    roll = -10,
    previous = 0;
  const abort = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const gltf = await new GLTFLoader().loadAsync(asset);
  scene.add(gltf.scene);
  gltf.scene.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  // scripts/art/sprout-porch.py models each eye style as a group under the head holding two blink pivots.
  const styles = new Map<string, { group: T.Object3D; pivots: T.Object3D[] }>();
  for (const [label, name] of [
    ['Classic', 'EyesClassic'],
    ['Bead', 'EyesBead'],
    ['Soft', 'EyesSoft'],
  ]) {
    const group = gltf.scene.getObjectByName(name);
    const pivots = group?.children.filter((o) => !(o instanceof T.Mesh)) ?? [];
    if (!group || pivots.length !== 2) throw new Error(`Missing eye style ${name}`);
    styles.set(label, { group, pivots });
  }
  let eyes: T.Object3D[] = [];
  const setEyes = (style: string) => {
    for (const [label, { group, pivots }] of styles) {
      group.visible = label === style;
      for (const pivot of pivots) pivot.scale.y = 1;
      if (group.visible) eyes = pivots;
    }
  };
  setEyes('Classic');
  const sprout = gltf.scene.getObjectByName('Sprout');
  const head = gltf.scene.getObjectByName('Head');
  const arm = gltf.scene.getObjectByName('RightArm');
  const ball = gltf.scene.getObjectByName('Ball');
  if (!sprout || !head || !arm || !ball) throw new Error('Missing model pivots');
  const armRest = arm.rotation.z;
  const ballRest = ball.position.clone();

  const view: LabView = {
    hello() {
      wave = time;
      say('Hello, Sprout!');
    },
    roll() {
      if (time - roll < ROLL_SECONDS) return;
      roll = time;
      say('A little nudge, right back to you.');
    },
    eyeStyles: [...styles.keys()],
    setEyes,
    detail: () =>
      `Three.js r${T.REVISION} · ${renderer.info.render.calls} draw calls · ${Math.round(renderer.info.render.triangles / 100) / 10}k triangles`,
    dispose() {
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
      renderer.domElement.remove();
    },
  };

  const ray = new T.Raycaster();
  renderer.domElement.addEventListener(
    'pointerdown',
    (e) => {
      if (!e.isPrimary || e.button !== 0) return;
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
      // One immediate action, no held state: cancellation or a lost release cannot strand it.
      if (node === ball) view.roll();
      else view.hello();
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

  renderer.setAnimationLoop((now: number) => {
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    if (document.hidden) return;
    time += dt;
    const p = pose(time, wave, roll, reduced.matches);
    head.rotation.z = p.head;
    arm.rotation.z = armRest + p.arm;
    sprout.scale.y = p.breath;
    for (const eye of eyes) eye.scale.y = p.blink ? 0.12 : 1;
    ball.position.copy(ballRest);
    ball.position.x -= p.roll * 1.1;
    ball.position.z -= p.roll * 0.35;
    ball.rotation.x = -p.roll * 3;
    ball.rotation.z = p.roll * 2;
    renderer.render(scene, camera);
  });
  return view;
};
