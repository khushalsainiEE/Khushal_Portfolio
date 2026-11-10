/* ============================================================
   WAFER — a mouse-reactive silicon wafer.
   • Physical material with thin-film iridescence (oxide layer look)
   • A diffraction shader on top: the die grid splits light into a
     rainbow that slides as the viewing angle changes — the way a
     real patterned wafer shimmers under a lamp.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DIE = 64;         // die pitch in texture px
const TEX = 2048;

function rebaseUV(geo) {
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) + 1) / 2;
    uv[i * 2 + 1] = (p.getY(i) + 1) / 2;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/* --- procedural textures --- */
function makeDieTextures() {
  const rng = mulberry(7);
  const base = document.createElement('canvas');
  base.width = base.height = TEX;
  const b = base.getContext('2d');
  const thick = document.createElement('canvas');
  thick.width = thick.height = TEX / 4;
  const t = thick.getContext('2d');
  const grid = document.createElement('canvas');
  grid.width = grid.height = TEX;
  const g = grid.getContext('2d');

  // base: polished silicon gray
  const grd = b.createRadialGradient(TEX * 0.45, TEX * 0.42, 0, TEX / 2, TEX / 2, TEX * 0.6);
  grd.addColorStop(0, '#d9dde4');
  grd.addColorStop(1, '#a9afb9');
  b.fillStyle = grd;
  b.fillRect(0, 0, TEX, TEX);
  g.fillStyle = '#000';
  g.fillRect(0, 0, TEX, TEX);

  const R = TEX / 2 - DIE * 1.1;    // edge exclusion
  const c = TEX / 2;
  const street = 5;

  for (let y = 0; y < TEX; y += DIE) {
    for (let x = 0; x < TEX; x += DIE) {
      const cx = x + DIE / 2 - c, cy = y + DIE / 2 - c;
      const far = Math.max(Math.hypot(x - c, y - c), Math.hypot(x + DIE - c, y - c), Math.hypot(x - c, y + DIE - c), Math.hypot(x + DIE - c, y + DIE - c));
      if (far > R) continue;
      const shade = 150 + Math.floor(rng() * 40);
      // die body
      b.fillStyle = `rgb(${shade - 10},${shade - 6},${shade + 4})`;
      b.fillRect(x + street, y + street, DIE - street * 2, DIE - street * 2);
      // circuitry blocks
      for (let k = 0; k < 9; k++) {
        const w = 6 + rng() * 22, h = 3 + rng() * 14;
        const px = x + street + 3 + rng() * (DIE - street * 2 - w - 6);
        const py = y + street + 3 + rng() * (DIE - street * 2 - h - 6);
        const v = shade + (rng() > 0.5 ? 35 : -30);
        b.fillStyle = `rgb(${v},${v + 3},${v + 10})`;
        b.fillRect(px, py, w, h);
      }
      // bond pads around the die edge
      b.fillStyle = 'rgba(235,225,200,0.75)';
      for (let k = 0; k < 6; k++) {
        b.fillRect(x + street + 4 + k * 9, y + street + 2, 4, 3);
        b.fillRect(x + street + 4 + k * 9, y + DIE - street - 5, 4, 3);
      }
      // grating mask for diffraction (fine lines inside each die)
      g.fillStyle = '#fff';
      g.globalAlpha = 0.35 + rng() * 0.65;
      g.fillRect(x + street, y + street, DIE - street * 2, DIE - street * 2);
      g.globalAlpha = 1;
      g.fillStyle = '#000';
      const horiz = rng() > 0.5;
      for (let k = 0; k < DIE; k += 4) {
        if (horiz) g.fillRect(x + street, y + k, DIE - street * 2, 1.5);
        else g.fillRect(x + k, y + street, 1.5, DIE - street * 2);
      }
      // oxide thickness varies die to die
      t.fillStyle = `rgb(${Math.floor(60 + rng() * 195)},0,0)`;
      t.fillRect(x / 4, y / 4, DIE / 4, DIE / 4);
    }
  }
  // soft radial thickness gradient on top (spin-coat look)
  const tg = t.createRadialGradient(TEX / 8, TEX / 8, 0, TEX / 8, TEX / 8, TEX / 8);
  tg.addColorStop(0, 'rgba(255,0,0,0.0)');
  tg.addColorStop(1, 'rgba(255,0,0,0.55)');
  t.fillStyle = tg;
  t.fillRect(0, 0, TEX / 4, TEX / 4);

  const toTex = (cv, srgb) => {
    const tx = new THREE.CanvasTexture(cv);
    tx.anisotropy = 8;
    if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
  return { map: toTex(base, true), thickness: toTex(thick, false), grating: toTex(grid, false) };
}

function mulberry(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const diffractionShader = {
  uniforms: { uGrating: { value: null }, uTime: { value: 0 }, uStrength: { value: 1 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vN;
    varying vec3 vTx;
    varying vec3 vTy;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vN = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
      vTx = normalize(mat3(modelMatrix) * vec3(1.0, 0.0, 0.0));
      vTy = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D uGrating;
    uniform float uTime;
    uniform float uStrength;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vN;
    varying vec3 vTx;
    varying vec3 vTy;
    vec3 hsv2rgb(vec3 c) {
      vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
      return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
    }
    void main() {
      vec3 V = normalize(cameraPosition - vWorldPos);
      // a fixed key light direction to diffract
      vec3 L = normalize(vec3(-0.4, 0.8, 0.6));
      vec3 H = V + L;
      float gx = dot(H, vTx);
      float gy = dot(H, vTy);
      float m = texture2D(uGrating, vUv).r;
      // two gratings (x / y) produce crossing rainbow bands
      float hueA = fract(gx * 1.6 + vUv.y * 0.35 + uTime * 0.015);
      float hueB = fract(gy * 1.6 + vUv.x * 0.35 - uTime * 0.012);
      vec3 cA = hsv2rgb(vec3(hueA, 0.85, 1.0));
      vec3 cB = hsv2rgb(vec3(hueB, 0.85, 1.0));
      float bandA = pow(0.5 + 0.5 * sin(gx * 9.0 + uTime * 0.2), 3.0);
      float bandB = pow(0.5 + 0.5 * sin(gy * 9.0 - uTime * 0.17), 3.0);
      float fres = pow(1.0 - clamp(dot(vN, V), 0.0, 1.0), 1.2);
      vec3 col = (cA * bandA + cB * bandB) * m * (0.28 + 0.9 * fres) * uStrength;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createWafer(canvas, { onReady } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.documentElement.classList.add('no-webgl');
    onReady && onReady();
    return { setActive() {}, setScroll() {}, burst() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  const tex = makeDieTextures();
  const shape = makeWaferShapeSafe();

  const group = new THREE.Group();
  scene.add(group);

  // body (edge)
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 160 });
  bodyGeo.translate(0, 0, -0.035);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshPhysicalMaterial({ color: 0x8d939c, metalness: 1, roughness: 0.25 }));
  group.add(body);

  // polished, iridescent top
  const topGeo = new THREE.ShapeGeometry(shape, 160);
  rebaseUV(topGeo);
  const topMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tex.map,
    metalness: 0.92,
    roughness: 0.14,
    iridescence: 1,
    iridescenceIOR: 1.55,
    iridescenceThicknessRange: [180, 820],
    iridescenceThicknessMap: tex.thickness,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.25,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.z = 0.0015;
  group.add(top);

  // diffraction layer
  const difMat = new THREE.ShaderMaterial({
    ...diffractionShader,
    uniforms: THREE.UniformsUtils.clone(diffractionShader.uniforms),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  difMat.uniforms.uGrating.value = tex.grating;
  const dif = new THREE.Mesh(topGeo, difMat);
  dif.position.z = 0.003;
  group.add(dif);

  // moving coloured lights sweep highlights across the surface
  const lights = [
    [0xff7ad9, 6], [0x5ff5d2, 6], [0xffe27a, 5], [0x8fb4ff, 5],
  ].map(([c, i]) => { const l = new THREE.PointLight(c, i, 12, 1.6); scene.add(l); return l; });
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-2, 3, 4);
  scene.add(key);

  // soft contact shadow
  const shCanvas = document.createElement('canvas');
  shCanvas.width = shCanvas.height = 128;
  const sc = shCanvas.getContext('2d');
  const sg = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
  sg.addColorStop(0, 'rgba(0,0,0,0.35)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  sc.fillStyle = sg;
  sc.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCanvas), transparent: true, depthWrite: false }));
  shadow.position.set(0, -1.55, -0.6);
  scene.add(shadow);

  /* --- interaction state --- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let spin = 0, spinV = 0;
  let intro = 0;          // 0 → 1 intro animation
  let scrollP = 0;        // 0..1 how far hero has scrolled away
  let active = true;
  let raf = 0;
  const clock = new THREE.Clock();
  const fine = window.matchMedia('(pointer: fine)').matches;

  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the wafer a sensible size on tall / narrow screens
    camera.position.z = w / h < 0.8 ? 8.6 : 6.2;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!active) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!fine) { mouse.tx = Math.sin(t * 0.4) * 0.6; mouse.ty = Math.cos(t * 0.3) * 0.4; }
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    intro = Math.min(1, intro + dt * 0.55);
    const ei = 1 - Math.pow(1 - intro, 4);

    spinV *= 0.94;
    spin += spinV * dt;

    // tilt toward mouse (like ToyFight's console), lean back so we see the face
    group.rotation.x = -0.62 + mouse.y * 0.42 + (1 - ei) * -1.0 + scrollP * 0.9;
    group.rotation.y = mouse.x * 0.75 + (1 - ei) * 2.4;
    group.rotation.z = spin + t * 0.03 + mouse.x * -0.08;
    group.position.y = 0.42 + Math.sin(t * 0.9) * 0.04 + scrollP * 1.6;
    group.scale.setScalar(0.6 + 0.4 * ei);
    shadow.material.opacity = 0.8 * ei * (1 - scrollP);

    lights.forEach((l, i) => {
      const a = t * (0.35 + i * 0.07) + i * Math.PI * 0.5;
      l.position.set(Math.cos(a) * 2.6, Math.sin(a * 1.3) * 1.8, 1.6 + Math.sin(a) * 0.6);
    });
    difMat.uniforms.uTime.value = t;
    difMat.uniforms.uStrength.value = 0.85 + Math.min(1.2, Math.abs(spinV) * 0.25);

    renderer.render(scene, camera);
  }
  frame();
  requestAnimationFrame(() => onReady && onReady());

  return {
    setActive(v) { active = v; if (v) clock.getDelta(); },
    setScroll(p) { scrollP = Math.max(0, Math.min(1, p)); },
    burst(dir = 1) { spinV += 9 * dir; },
  };
}

function makeWaferShapeSafe() {
  // straightforward construction: arc from right end of the flat, counter-clockwise
  // all the way round to the left end of the flat, then close with a straight line.
  const r = 1, flat = 0.955;
  const half = Math.sqrt(r * r - flat * flat);
  const aRight = Math.atan2(-flat, half);        // ≈ -73°
  const aLeft = Math.atan2(-flat, -half);        // ≈ -107°
  const s = new THREE.Shape();
  s.moveTo(half, -flat);
  s.absarc(0, 0, r, aRight, aLeft + Math.PI * 2, false);
  s.lineTo(half, -flat);
  return s;
}
