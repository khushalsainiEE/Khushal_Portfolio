/**
 * Interactive 3D studio — Three.js + OrbitControls
 * Model: Khronos glTF Sample Assets — Antique Camera (CC0)
 * https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/AntiqueCamera
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb';

const canvas = document.getElementById('cameraCanvas');
const wrap = document.getElementById('studioCanvasWrap');
const loaderEl = document.getElementById('studioLoader');
const fallbackEl = document.getElementById('studioFallback');

if (!canvas || !wrap) {
  // Section not on page
} else {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isVisible = true;
  let rafId = 0;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0.8, 0.55, 1.6);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 0.6;
  controls.maxDistance = 4.5;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.target.set(0, 0.35, 0);
  controls.autoRotate = !prefersReducedMotion;
  controls.autoRotateSpeed = 0.45;

  const rig = new THREE.Group();
  scene.add(rig);

  function themeColors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      bg: dark ? 0x12100e : 0xfdfbf8,
      key: dark ? 0xffe8d0 : 0xfff5eb,
      fill: dark ? 0x6a5a4a : 0xe8ddd0,
      rim: dark ? 0xd4a574 : 0xc4956a,
      ground: dark ? 0x1c1916 : 0xf7f4ef,
    };
  }

  let lights = {};

  function setupLights() {
    Object.values(lights).forEach((l) => scene.remove(l));
    lights = {};
    const c = themeColors();

    lights.ambient = new THREE.AmbientLight(c.fill, 0.55);
    scene.add(lights.ambient);

    lights.key = new THREE.DirectionalLight(c.key, 1.1);
    lights.key.position.set(3, 5, 4);
    scene.add(lights.key);

    lights.rim = new THREE.DirectionalLight(c.rim, 0.85);
    lights.rim.position.set(-4, 2, -3);
    scene.add(lights.rim);

    lights.bounce = new THREE.HemisphereLight(c.key, c.ground, 0.35);
    scene.add(lights.bounce);
  }

  setupLights();

  const groundGeo = new THREE.CircleGeometry(2.2, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: themeColors().ground,
    roughness: 0.92,
    metalness: 0.02,
    transparent: true,
    opacity: 0.85,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  function frameObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.35;
    camera.position.set(center.x + dist * 0.55, center.y + dist * 0.35, center.z + dist);
    controls.target.copy(center);
    controls.update();
  }

  function buildFallbackCamera() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2622,
      metalness: 0.55,
      roughness: 0.38,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xc4956a,
      metalness: 0.7,
      roughness: 0.25,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.28), bodyMat);
    body.position.y = 0.42;
    group.add(body);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 24), accentMat);
    lens.rotation.z = Math.PI / 2;
    lens.position.set(0, 0.44, 0.22);
    group.add(lens);

    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5, 8), bodyMat);
    tripod.position.y = 0.25;
    group.add(tripod);

    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.45, 6), bodyMat);
      leg.position.set(Math.cos((i * Math.PI * 2) / 3) * 0.2, 0.12, Math.sin((i * Math.PI * 2) / 3) * 0.2);
      leg.rotation.z = 0.35 * (i === 1 ? -1 : 1);
      group.add(leg);
    }

    return group;
  }

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      rig.add(model);
      frameObject(model);
      if (loaderEl) loaderEl.hidden = true;
    },
    undefined,
    () => {
      rig.add(buildFallbackCamera());
      frameObject(rig);
      if (loaderEl) loaderEl.hidden = true;
      if (fallbackEl) fallbackEl.hidden = false;
    }
  );

  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 1 || h < 1) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  resize();
  window.addEventListener('resize', resize);

  const visObs = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible && !rafId) animate();
    },
    { threshold: 0.08 }
  );
  visObs.observe(wrap);

  const themeObs = new MutationObserver(() => {
    setupLights();
    groundMat.color.setHex(themeColors().ground);
  });
  themeObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  canvas.addEventListener('pointerdown', () => {
    controls.autoRotate = false;
  });

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (!isVisible) {
      rafId = 0;
      return;
    }
    controls.update();
    rig.rotation.y += prefersReducedMotion ? 0 : 0.0008;
    renderer.render(scene, camera);
  }

  animate();
}
