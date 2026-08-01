import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import concreteImage from './assets/sidewalk-concrete.jpg';
import sourceImage from './assets/sidewalk-source.jpg';
import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark">SM</div>
        <div>
          <p class="eyebrow">SURFACE LIBRARY / PROTOTYPE 01</p>
          <h1>Material Lab</h1>
        </div>
      </div>
      <div class="topbar-status"><span class="status-dot"></span> LIVE WORLD TEST</div>
    </header>

    <main class="workspace">
      <section class="viewport-shell">
        <canvas id="world" aria-label="Three-dimensional sidewalk material preview"></canvas>
        <div class="world-label world-label-top"><span>THREE.JS WORLD</span><span>DRAG TO ORBIT</span></div>
        <div class="world-label world-label-bottom"><span id="world-readout">SURFACE / CONCRETE-PEBBLE-01</span><span>REAL PHOTO SKIN</span></div>
        <div class="loading-state" id="loading-state">Loading surface…</div>
      </section>

      <aside class="inspector">
        <div class="inspector-heading">
          <div>
            <p class="eyebrow">MATERIAL CARD</p>
            <h2>Concrete pebble</h2>
          </div>
          <span class="card-index">01</span>
        </div>

        <div class="source-card">
          <img src="${sourceImage}" alt="Original concrete and asphalt reference photograph" />
          <div class="source-card-caption"><span>PHOTO SOURCE</span><strong>Sidewalk / aggregate</strong></div>
        </div>

        <div class="material-description">A simple sidewalk mesh wearing a real photographed surface. The geometry stays deliberately plain so the material does the work.</div>

        <div class="control-stack">
          <label class="control-row" for="tile-range">
            <span><b>Tile density</b><output id="tile-value">4.0×</output></span>
            <input id="tile-range" type="range" min="1" max="8" step="0.1" value="4" />
          </label>
          <label class="control-row" for="roughness-range">
            <span><b>Roughness</b><output id="roughness-value">0.94</output></span>
            <input id="roughness-range" type="range" min="0.45" max="1" step="0.01" value="0.94" />
          </label>
          <label class="control-row" for="bump-range">
            <span><b>Surface relief</b><output id="bump-value">0.07</output></span>
            <input id="bump-range" type="range" min="0" max="0.18" step="0.01" value="0.07" />
          </label>
        </div>

        <div class="button-row">
          <button class="control-button is-active" id="seams-button" type="button">Seams on</button>
          <button class="control-button" id="source-button" type="button">Photo source</button>
          <button class="control-button" id="reset-button" type="button">Reset view</button>
        </div>

        <div class="material-facts">
          <div><span>Surface</span><strong>Concrete aggregate</strong></div>
          <div><span>Geometry</span><strong>11.2 × 2.85 m slab</strong></div>
          <div><span>Mapping</span><strong>Repeat + bump</strong></div>
        </div>

        <p class="hint">This is the core experiment: swap the material card and the same world geometry becomes a different place.</p>
      </aside>
    </main>

    <footer class="footer-bar">
      <span><i></i> PUBLIC MATERIAL TEST</span>
      <span>Surface Material Lab · 2026</span>
    </footer>
  </div>
`;

const canvas = document.querySelector('#world');
const loadingState = document.querySelector('#loading-state');
const tileRange = document.querySelector('#tile-range');
const roughnessRange = document.querySelector('#roughness-range');
const bumpRange = document.querySelector('#bump-range');
const tileValue = document.querySelector('#tile-value');
const roughnessValue = document.querySelector('#roughness-value');
const bumpValue = document.querySelector('#bump-value');
const seamsButton = document.querySelector('#seams-button');
const sourceButton = document.querySelector('#source-button');
const resetButton = document.querySelector('#reset-button');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#10151c');
scene.fog = new THREE.Fog('#10151c', 18, 42);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
camera.position.set(8.8, 5.6, 9.6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.3, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 5.2;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minPolarAngle = Math.PI * 0.18;
controls.enablePan = false;
controls.update();

const hemi = new THREE.HemisphereLight(0xb8cce4, 0x1b2024, 1.8);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffd8ae, 4.2);
key.position.set(-7, 12, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -15;
key.shadow.camera.right = 15;
key.shadow.camera.top = 15;
key.shadow.camera.bottom = -15;
key.shadow.bias = -0.0008;
scene.add(key);

const coolFill = new THREE.DirectionalLight(0x6d9bc5, 1.8);
coolFill.position.set(8, 7, -10);
scene.add(coolFill);

const warmPractical = new THREE.PointLight(0xf09b55, 12, 18, 2);
warmPractical.position.set(-3, 2.6, 2.5);
scene.add(warmPractical);

const world = new THREE.Group();
scene.add(world);

const roadMaterial = new THREE.MeshStandardMaterial({ color: '#1b2026', roughness: 0.97, metalness: 0.01 });
const road = new THREE.Mesh(new THREE.BoxGeometry(15, 0.12, 11), roadMaterial);
road.position.y = -0.06;
road.receiveShadow = true;
world.add(road);

const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#78756f', roughness: 0.98 });
const sidewalkBase = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.3, 2.85), edgeMaterial);
sidewalkBase.position.y = 0.15;
sidewalkBase.castShadow = true;
sidewalkBase.receiveShadow = true;
world.add(sidewalkBase);

const textureLoader = new THREE.TextureLoader();
const concreteTexture = textureLoader.load(concreteImage, () => {
  loadingState.classList.add('is-hidden');
});
concreteTexture.colorSpace = THREE.SRGBColorSpace;
concreteTexture.wrapS = THREE.RepeatWrapping;
concreteTexture.wrapT = THREE.RepeatWrapping;
concreteTexture.repeat.set(4, 1.08);
concreteTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const sidewalkMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.07,
  roughness: 0.94,
  metalness: 0,
});

const sidewalkTop = new THREE.Mesh(new THREE.PlaneGeometry(11.16, 2.82), sidewalkMaterial);
sidewalkTop.rotation.x = -Math.PI / 2;
sidewalkTop.position.y = 0.306;
sidewalkTop.receiveShadow = true;
world.add(sidewalkTop);

const curbMaterial = new THREE.MeshStandardMaterial({ color: '#68655f', roughness: 0.99 });
for (const z of [-1.52, 1.52]) {
  const curb = new THREE.Mesh(new THREE.BoxGeometry(11.25, 0.15, 0.12), curbMaterial);
  curb.position.set(0, 0.34, z);
  curb.castShadow = true;
  curb.receiveShadow = true;
  world.add(curb);
}

const seamGroup = new THREE.Group();
const seamMaterial = new THREE.MeshStandardMaterial({ color: '#5e5c58', roughness: 1, transparent: true, opacity: 0.42 });
for (const x of [-2.8, 0, 2.8]) {
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, 2.8), seamMaterial);
  seam.position.set(x, 0.312, 0);
  seamGroup.add(seam);
}
world.add(seamGroup);

const backdropMaterial = new THREE.MeshStandardMaterial({ color: '#29313b', roughness: 0.9 });
const backdrop = new THREE.Mesh(new THREE.BoxGeometry(15, 5.5, 0.18), backdropMaterial);
backdrop.position.set(0, 2.55, -5.2);
backdrop.receiveShadow = true;
world.add(backdrop);

const markerMaterial = new THREE.MeshStandardMaterial({ color: '#c78d55', roughness: 0.72, metalness: 0.08 });
for (const x of [-4.5, 4.5]) {
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 16), markerMaterial);
  marker.position.set(x, 0.4, -3.9);
  marker.castShadow = true;
  world.add(marker);
}

function updateMaterial() {
  const tile = Number(tileRange.value);
  const roughness = Number(roughnessRange.value);
  const bump = Number(bumpRange.value);
  concreteTexture.repeat.set(tile, 1.08);
  sidewalkMaterial.roughness = roughness;
  sidewalkMaterial.bumpScale = bump;
  tileValue.value = `${tile.toFixed(1)}×`;
  roughnessValue.value = roughness.toFixed(2);
  bumpValue.value = bump.toFixed(2);
}

function resetView() {
  camera.position.set(8.8, 5.6, 9.6);
  controls.target.set(0, 0.3, 0);
  controls.update();
  tileRange.value = '4';
  roughnessRange.value = '0.94';
  bumpRange.value = '0.07';
  updateMaterial();
}

tileRange.addEventListener('input', updateMaterial);
roughnessRange.addEventListener('input', updateMaterial);
bumpRange.addEventListener('input', updateMaterial);

seamsButton.addEventListener('click', () => {
  seamGroup.visible = !seamGroup.visible;
  seamsButton.classList.toggle('is-active', seamGroup.visible);
  seamsButton.textContent = seamGroup.visible ? 'Seams on' : 'Seams off';
});

sourceButton.addEventListener('click', () => {
  document.querySelector('.source-card').classList.toggle('is-expanded');
  sourceButton.classList.toggle('is-active');
});

resetButton.addEventListener('click', resetView);

function resize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas.parentElement);
resize();
updateMaterial();

const clock = new THREE.Clock();
function animate() {
  const elapsed = clock.getElapsedTime();
  warmPractical.intensity = 10.5 + Math.sin(elapsed * 0.65) * 0.55;
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
