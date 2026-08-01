import * as THREE from 'three';
import JSZip from 'jszip';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import concreteImage from './assets/sidewalk-concrete.jpg';
import sourceImage from './assets/sidewalk-source.jpg';
import brickImage from './assets/brick-wall.jpg';
import brickSourceImage from './assets/brick-source.jpg';
import woodImage from './assets/wood-weathered.jpg';
import woodSourceImage from './assets/wood-source.jpg';
import { concretePebbleCard, materialCardForExport, materialDefaults } from './materials/concretePebble.js';
import { brickWallCard, brickWallDefaults } from './materials/brickWall.js';
import { weatheredWoodCard, weatheredWoodDefaults } from './materials/weatheredWood.js';
import { createDerivedMaps, createMacroTexture } from './lib/derivedMaps.js';
import { downloadBlob, downloadDataUrl, downloadJson, downloadText } from './lib/downloads.js';
import { validateMaterial } from './lib/validation.js';
import './style.css';

const app = document.querySelector('#app');
const materialLibrary = {
  concrete: { key: 'concrete', card: concretePebbleCard, defaults: materialDefaults, baseColorUrl: concreteImage, sourceUrl: sourceImage, name: 'Concrete Pebble' },
  brick: { key: 'brick', card: brickWallCard, defaults: brickWallDefaults, baseColorUrl: brickImage, sourceUrl: brickSourceImage, name: 'Weathered Tan Brick Wall' },
  wood: { key: 'wood', card: weatheredWoodCard, defaults: weatheredWoodDefaults, baseColorUrl: woodImage, sourceUrl: woodSourceImage, name: 'Weathered Wood Pole' },
};
let activeMaterialKey = 'concrete';
let activeMaterial = materialLibrary[activeMaterialKey];
let activeCard = activeMaterial.card;
const state = { ...activeMaterial.defaults };
const screenshotIndex = [];

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark">SM</div>
        <div>
          <p class="eyebrow">SURFACE LIBRARY / VERTICAL SLICE 01</p>
          <h1>Surface Material Lab</h1>
        </div>
      </div>
      <div class="topbar-status"><span class="status-dot"></span><span id="top-status">READY / MAT-CONCRETE-0001</span></div>
    </header>

    <main class="workspace">
      <section class="viewport-shell">
        <canvas id="world" aria-label="Three-dimensional material inspection stage"></canvas>
        <div class="world-label world-label-top"><span>THREE.JS MATERIAL STAGE</span><span>DRAG TO ORBIT · PINCH TO ZOOM</span></div>
        <div class="world-label world-label-bottom"><span id="world-readout">SIDEWALK / FINAL</span><span id="scale-readout">SCALE 1.00m × 1.00m · UNVERIFIED</span></div>
        <div class="loading-state" id="loading-state">Deriving estimated maps…</div>
        <div class="stage-reticle" aria-hidden="true"></div>
      </section>

      <aside class="inspector">
      <section class="panel material-panel">
          <div class="panel-heading">
            <div><p class="eyebrow">MATERIAL CARD</p><h2 id="material-name">Concrete Pebble</h2></div>
            <div class="id-stack"><span class="card-index">01</span><code id="material-id">MAT-CONCRETE-0001</code></div>
          </div>
          <label class="field-label" for="material-select">Material library</label>
          <select class="select-control" id="material-select">
            <option value="concrete">Concrete Pebble</option>
            <option value="brick">Weathered Tan Brick Wall</option>
            <option value="wood">Weathered Wood Pole</option>
          </select>
          <div class="source-card">
            <img id="source-preview" src="${sourceImage}" alt="Original material source photograph" />
            <div class="source-card-caption"><span id="source-type">SOURCE / USER PHOTOGRAPH</span><strong id="source-title">Exposed aggregate sidewalk</strong></div>
          </div>
          <p class="material-description" id="material-description">The original photo stays preserved. The lab derives approximate relief and roughness channels at runtime so the source can be tested as a complete material.</p>
          <div class="status-strip"><span id="material-status" class="status-badge status-warning">VALIDATION REQUIRED</span><span id="issue-count">0 issues</span></div>
        </section>

        <section class="panel">
          <div class="panel-heading compact"><div><p class="eyebrow">TEST GEOMETRY</p><h2>Same material, different form</h2></div></div>
          <label class="field-label" for="geometry-select">Geometry test</label>
          <select class="select-control" id="geometry-select">
            <option value="sidewalk">Sidewalk slab</option>
            <option value="wall">Vertical wall</option>
            <option value="cube">Cube</option>
            <option value="sphere">Sphere</option>
            <option value="cylinder">Cylinder</option>
            <option value="large-plane">Large plane / repetition</option>
            <option value="all">Comparison stage / all tests</option>
          </select>
          <div class="inline-status"><span>Mapping</span><strong>UV / normalized</strong></div>
          <div class="button-row compact-row"><button class="control-button is-active" id="seams-button" type="button">Seams on</button><button class="control-button" id="ruler-button" type="button">Ruler on</button><button class="control-button" id="antitiling-button" type="button">Anti-tiling off</button></div>
        </section>

        <section class="panel">
          <div class="panel-heading compact"><div><p class="eyebrow">INSPECTION CONDITIONS</p><h2>Light, camera, channel</h2></div></div>
          <div class="field-grid">
            <label class="field-label">Lighting<select class="select-control" id="lighting-select"><option value="neutral">Neutral studio</option><option value="overcast">Overcast daylight</option><option value="sunlight">Bright sunlight</option><option value="grazing">Grazing relief</option></select></label>
            <label class="field-label">Camera<select class="select-control" id="camera-select"><option value="close-up">Close-up</option><option value="medium" selected>Medium</option><option value="far">Far</option></select></label>
          </div>
          <label class="field-label">Channel<select class="select-control" id="channel-select"><option value="final">Final shaded material</option><option value="base-color">Base color only</option><option value="roughness">Roughness estimate</option><option value="normal">Normal estimate</option><option value="height">Height estimate</option><option value="uv">UV checker</option></select></label>
          <label class="control-row" for="fov-range"><span><b>Field of view</b><output id="fov-value">42°</output></span><input id="fov-range" type="range" min="28" max="70" step="1" value="42" /></label>
        </section>

        <section class="panel">
          <div class="panel-heading compact"><div><p class="eyebrow">REAL-WORLD SCALE</p><h2>Source dimensions</h2></div><span class="unverified-label">UNVERIFIED</span></div>
          <div class="field-grid two-col">
            <label class="field-label">Width / m<input class="number-control" id="source-width" type="number" min="0.01" step="0.01" value="1.00" /></label>
            <label class="field-label">Height / m<input class="number-control" id="source-height" type="number" min="0.01" step="0.01" value="1.00" /></label>
          </div>
          <label class="control-row" for="repeat-range"><span><b>Manual repeat multiplier</b><output id="repeat-value">1.00×</output></span><input id="repeat-range" type="range" min="0.25" max="4" step="0.05" value="1" /></label>
          <div class="scale-note" id="scale-note">Texture repetition is derived from object dimensions ÷ source dimensions.</div>
        </section>

        <section class="panel">
          <div class="panel-heading compact"><div><p class="eyebrow">PHYSICAL RESPONSE</p><h2>Material properties</h2></div></div>
          <label class="control-row" for="roughness-range"><span><b>Roughness</b><output id="roughness-value">0.94</output></span><input id="roughness-range" type="range" min="0.15" max="1" step="0.01" value="0.94" /></label>
          <label class="control-row" for="bump-range"><span><b>Estimated relief</b><output id="bump-value">0.07</output></span><input id="bump-range" type="range" min="0" max="0.2" step="0.01" value="0.07" /></label>
          <div class="estimate-note">Normal, height, and roughness are generated estimates—not physically scanned maps.</div>
        </section>

        <section class="panel action-panel">
          <div class="panel-heading compact"><div><p class="eyebrow">LAB ACTIONS</p><h2>Record the result</h2></div></div>
          <div class="action-grid"><button class="action-button accent" id="validate-button" type="button">Validate</button><button class="action-button" id="capture-button" type="button">Capture PNG</button><button class="action-button" id="export-button" type="button">Export package</button><button class="action-button" id="state-button" type="button">Export state JSON</button></div>
          <div class="quality-row"><label class="field-label">Preview quality<select class="select-control" id="quality-select"><option value="low">Low / phone</option><option value="medium">Medium</option><option value="high" selected>High</option></select></label><div class="telemetry"><span>FPS <strong id="fps-value">—</strong></span><span>DRAW <strong id="draw-value">—</strong></span><span>TEXTURE <strong id="memory-value">~32MB</strong></span></div></div>
        </section>

        <section class="panel validation-panel">
          <div class="panel-heading compact"><div><p class="eyebrow">AUTOMATED QA</p><h2>Validation queue</h2></div><span id="validation-status" class="count-label">READY</span></div>
          <div id="validation-summary" class="validation-summary">Run validation to generate stable material issue IDs.</div>
          <div id="issue-list" class="issue-list"></div>
        </section>

        <section class="panel command-panel">
          <div class="panel-heading compact"><div><p class="eyebrow">AI OPERATOR</p><h2>Command palette</h2></div><span class="count-label">JSON-READY</span></div>
          <div class="command-row"><input id="command-input" type="text" autocomplete="off" spellcheck="false" placeholder="GEOMETRY SPHERE" /><button class="run-button" id="run-command" type="button">Run</button></div>
          <p class="command-help">LOAD · GEOMETRY · LIGHT · CAMERA · SHOW · SET · ENABLE ANTITILING · COMPARE · CAPTURE · VALIDATE · EXPORT · STATE</p>
          <div class="command-status" id="command-status">Ready. The material card is loaded.</div>
        </section>
      </aside>
    </main>

    <footer class="footer-bar"><span><i></i> PUBLIC MATERIAL TEST</span><span id="footer-material-id">MAT-CONCRETE-0001 · SOURCE MAPS PRESERVED</span><span>Surface Material Lab · 2026</span></footer>
  </div>
`;

const canvas = document.querySelector('#world');
const loadingState = document.querySelector('#loading-state');
const world = new THREE.Group();
const stage = new THREE.Group();
const rulerGroup = new THREE.Group();
const macroTexture = createMacroTexture();
const textureLoader = new THREE.TextureLoader();
function configureBaseTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

const textureLibrary = {
  concrete: configureBaseTexture(textureLoader.load(concreteImage, () => loadingState.classList.add('is-hidden'))),
  brick: configureBaseTexture(textureLoader.load(brickImage)),
  wood: configureBaseTexture(textureLoader.load(woodImage)),
};
let activeTexture = textureLibrary[activeMaterialKey];

let derivedMaps = null;
let activeSurfaceMaterial = null;
let activeGeometryMeshes = [];
let currentRuntime = { repeatX: 1, repeatY: 1, activeMapEstimate: true };
let latestValidation = null;
let fpsFrames = 0;
let fpsWindowStart = performance.now();
let lastTelemetry = performance.now();
let toastTimer = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#10151c');
scene.fog = new THREE.Fog('#10151c', 18, 44);
scene.add(world);
world.add(stage, rulerGroup);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = false;
controls.minDistance = 3.6;
controls.maxDistance = 28;
controls.minPolarAngle = Math.PI * 0.12;
controls.maxPolarAngle = Math.PI * 0.49;

const hemiLight = new THREE.HemisphereLight(0xb8cce4, 0x1b2024, 1.8);
const keyLight = new THREE.DirectionalLight(0xffd8ae, 4.2);
const fillLight = new THREE.DirectionalLight(0x6d9bc5, 1.8);
const practicalLight = new THREE.PointLight(0xf09b55, 12, 18, 2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -18;
keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18;
keyLight.shadow.camera.bottom = -18;
keyLight.shadow.bias = -0.0008;
practicalLight.castShadow = true;
scene.add(hemiLight, keyLight, fillLight, practicalLight);

const lightingPresets = {
  neutral: { sky: 0xb8cce4, ground: 0x1b2024, hemi: 1.8, key: 4.2, keyColor: 0xffd8ae, fill: 1.8, fillColor: 0x6d9bc5, practical: 10, position: [-7, 12, 8] },
  overcast: { sky: 0xcbd8df, ground: 0x49545b, hemi: 2.7, key: 1.25, keyColor: 0xe6f2ff, fill: 1.1, fillColor: 0xb4c7d5, practical: 0, position: [-4, 9, 5] },
  sunlight: { sky: 0x9ab8d4, ground: 0x22272a, hemi: 1.35, key: 6.2, keyColor: 0xffbe75, fill: 0.85, fillColor: 0x5077a0, practical: 3, position: [-10, 16, 4] },
  grazing: { sky: 0x9db8c6, ground: 0x11171c, hemi: 0.9, key: 5.1, keyColor: 0xffc27a, fill: 0.45, fillColor: 0x416d92, practical: 2, position: [-9, 2.2, 6] },
};

const cameraPresets = {
  'close-up': { position: [3.8, 2.2, 4.1], target: [0, 0.45, 0], fov: 42 },
  medium: { position: [8.8, 5.6, 9.6], target: [0, 0.45, 0], fov: 42 },
  far: { position: [15, 10, 17], target: [0, 0.75, 0], fov: 46 },
};

function applyTextureSettings(repeatX, repeatY) {
  currentRuntime.repeatX = repeatX;
  currentRuntime.repeatY = repeatY;
  const textures = [activeTexture, derivedMaps?.height, derivedMaps?.normal, derivedMaps?.roughness, derivedMaps?.checker].filter(Boolean);
  textures.forEach((texture) => {
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(state.antiTiling ? 0.17 : 0, state.antiTiling ? 0.11 : 0);
    texture.needsUpdate = true;
  });
}

function dimensionsForGeometry(geometry = state.geometry) {
  const dimensions = {
    sidewalk: { width: 11.16, height: 2.82 },
    wall: { width: 8, height: 4.5 },
    cube: { width: 2.2, height: 2.2 },
    sphere: { width: 2.5, height: 2.5 },
    cylinder: { width: 2.3, height: 2.7 },
    'large-plane': { width: 14, height: 8 },
    all: { width: 4, height: 2 },
  };
  return dimensions[geometry] ?? dimensions.sidewalk;
}

function calculateRepeat() {
  const dimensions = dimensionsForGeometry();
  return {
    x: Math.max(0.05, (dimensions.width / state.sourceWidth) * state.repeatMultiplier),
    y: Math.max(0.05, (dimensions.height / state.sourceHeight) * state.repeatMultiplier),
  };
}

function configureMacroVariation(material) {
  if (!state.antiTiling || !(material instanceof THREE.MeshStandardMaterial)) return;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMacroVariation = { value: macroTexture };
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      '#include <map_fragment>\n#ifdef USE_MAP\n  float macroValue = texture2D(uMacroVariation, vMapUv * 0.22 + vec2(0.17, 0.31)).r;\n  diffuseColor.rgb *= mix(vec3(0.90), vec3(1.08), macroValue);\n#endif',
    );
  };
}

function createSurfaceMaterial() {
  const channel = state.channel;
  if (channel === 'base-color') return new THREE.MeshBasicMaterial({ map: activeTexture });
  if (channel === 'roughness') return new THREE.MeshBasicMaterial({ map: derivedMaps?.roughness ?? activeTexture });
  if (channel === 'normal') return new THREE.MeshBasicMaterial({ map: derivedMaps?.normal ?? activeTexture });
  if (channel === 'height') return new THREE.MeshBasicMaterial({ map: derivedMaps?.height ?? activeTexture });
  if (channel === 'uv') return new THREE.MeshBasicMaterial({ map: derivedMaps?.checker ?? activeTexture });

  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: activeTexture,
    normalMap: derivedMaps?.normal ?? null,
    roughnessMap: derivedMaps?.roughness ?? null,
    bumpMap: derivedMaps?.height ?? activeTexture,
    bumpScale: state.bumpStrength,
    roughness: state.roughness,
    metalness: activeCard.metalness,
  });
  configureMacroVariation(material);
  return material;
}

function disposeStage() {
  stage.traverse((object) => {
    if (object.isMesh) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    }
  });
  while (stage.children.length) stage.remove(stage.children[stage.children.length - 1]);
  activeGeometryMeshes = [];
  activeSurfaceMaterial = null;
}

function addRoad() {
  const roadMaterial = new THREE.MeshStandardMaterial({ color: '#1b2026', roughness: 0.97, metalness: 0.01 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(17, 0.12, 12), roadMaterial);
  road.position.y = -0.06;
  road.receiveShadow = true;
  stage.add(road);
}

function addTexturedMesh(geometry, position, rotation = [0, 0, 0], name = 'test-geometry') {
  const mesh = new THREE.Mesh(geometry, activeSurfaceMaterial);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  stage.add(mesh);
  activeGeometryMeshes.push(mesh);
  return mesh;
}

function addSidewalk() {
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#77736d', roughness: 0.98 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.3, 2.85), edgeMaterial);
  base.position.y = 0.15;
  base.castShadow = true;
  base.receiveShadow = true;
  stage.add(base);
  addTexturedMesh(new THREE.PlaneGeometry(11.16, 2.82), [0, 0.306, 0], [-Math.PI / 2, 0, 0], 'sidewalk-surface');
  const curbMaterial = new THREE.MeshStandardMaterial({ color: '#68655f', roughness: 0.99 });
  for (const z of [-1.52, 1.52]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(11.25, 0.15, 0.12), curbMaterial);
    curb.position.set(0, 0.34, z);
    curb.castShadow = true;
    curb.receiveShadow = true;
    stage.add(curb);
  }
  addSeams(11.16, 2.82);
}

function addSeams(width, depth) {
  if (!state.seams) return;
  const seamMaterial = new THREE.MeshStandardMaterial({ color: '#5e5c58', roughness: 1, transparent: true, opacity: 0.42 });
  const count = Math.max(2, Math.floor(width / 3));
  for (let index = 1; index < count; index += 1) {
    const x = -width / 2 + (width / count) * index;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, depth), seamMaterial);
    seam.position.set(x, 0.312, 0);
    stage.add(seam);
  }
}

function addWall() {
  addRoad();
  addTexturedMesh(new THREE.BoxGeometry(8, 4.5, 0.22), [0, 2.25, -1.2], [0, 0, 0], 'vertical-wall');
  addSeams(8, 4.5);
}

function addPrimitive(type) {
  addRoad();
  if (type === 'cube') addTexturedMesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), [0, 1.1, 0], [0, 0, 0], 'cube');
  if (type === 'sphere') addTexturedMesh(new THREE.SphereGeometry(1.25, 64, 40), [0, 1.25, 0], [0, 0, 0], 'sphere');
  if (type === 'cylinder') addTexturedMesh(new THREE.CylinderGeometry(1.15, 1.15, 2.7, 64), [0, 1.35, 0], [0, 0, 0], 'cylinder');
}

function addLargePlane() {
  addRoad();
  addTexturedMesh(new THREE.PlaneGeometry(14, 8), [0, 0.08, 0], [-Math.PI / 2, 0, 0], 'large-plane');
  addSeams(14, 8);
}

function addComparisonStage() {
  addRoad();
  const comparisonMaterial = activeSurfaceMaterial;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 0.18), comparisonMaterial);
  wall.position.set(0, 1.9, -3.2);
  wall.castShadow = true;
  wall.receiveShadow = true;
  stage.add(wall);
  activeGeometryMeshes.push(wall);
  addTexturedMesh(new THREE.BoxGeometry(2, 2, 2), [-3.7, 1, 0.8], [0, 0.2, 0], 'comparison-cube');
  addTexturedMesh(new THREE.SphereGeometry(1.15, 48, 32), [-1.15, 1.15, 0.8], [0, 0, 0], 'comparison-sphere');
  addTexturedMesh(new THREE.CylinderGeometry(1, 1, 2.2, 48), [1.35, 1.1, 0.8], [0, 0, 0], 'comparison-cylinder');
  addTexturedMesh(new THREE.PlaneGeometry(4.4, 2.4), [4.2, 0.08, 0.8], [-Math.PI / 2, 0, 0], 'comparison-plane');
}

function rebuildStage() {
  disposeStage();
  const repeat = calculateRepeat();
  applyTextureSettings(repeat.x, repeat.y);
  activeSurfaceMaterial = createSurfaceMaterial();
  if (state.geometry === 'sidewalk') { addRoad(); addSidewalk(); }
  else if (state.geometry === 'wall') addWall();
  else if (state.geometry === 'large-plane') addLargePlane();
  else if (state.geometry === 'all') addComparisonStage();
  else addPrimitive(state.geometry);
  buildRuler();
  updateReadouts();
  runValidation(false);
}

function buildRuler() {
  while (rulerGroup.children.length) {
    const object = rulerGroup.children.pop();
    object.geometry?.dispose?.();
    object.material?.dispose?.();
  }
  rulerGroup.visible = state.scaleOverlay;
  if (!state.scaleOverlay) return;
  const material = new THREE.MeshBasicMaterial({ color: 0xffd36d });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(1, 0.025, 0.025), material);
  ruler.position.set(-5.2, 0.43, 2.1);
  rulerGroup.add(ruler);
  for (let index = 0; index <= 4; index += 1) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.018, index % 2 ? 0.1 : 0.16, 0.03), material);
    tick.position.set(-5.7 + index * 0.25, 0.5, 2.1);
    rulerGroup.add(tick);
  }
}

function applyLighting() {
  const preset = lightingPresets[state.lighting];
  hemiLight.color.setHex(preset.sky);
  hemiLight.groundColor.setHex(preset.ground);
  hemiLight.intensity = preset.hemi;
  keyLight.color.setHex(preset.keyColor);
  keyLight.intensity = preset.key;
  keyLight.position.set(...preset.position);
  fillLight.color.setHex(preset.fillColor);
  fillLight.intensity = preset.fill;
  practicalLight.intensity = preset.practical;
  practicalLight.position.set(-3, 2.6, 2.5);
  renderer.shadowMap.enabled = state.lighting !== 'overcast';
  updateReadouts();
}

function applyCamera() {
  const preset = cameraPresets[state.camera];
  camera.position.set(...preset.position);
  camera.fov = Number(document.querySelector('#fov-range').value);
  camera.updateProjectionMatrix();
  controls.target.set(...preset.target);
  controls.update();
  updateReadouts();
}

function updateQuality() {
  const ratios = { low: 0.75, medium: 1, high: Math.min(window.devicePixelRatio || 1, 2) };
  renderer.setPixelRatio(ratios[state.quality]);
  resize();
}

function resize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function runtimeForValidation() {
  return { ...currentRuntime, activeMapEstimate: !activeCard.normalMap || !activeCard.roughnessMap };
}

function updateReadouts() {
  const repeat = currentRuntime;
  document.querySelector('#world-readout').textContent = `${state.geometry.toUpperCase()} / ${state.channel.toUpperCase()} / ${state.lighting.toUpperCase()}`;
  document.querySelector('#scale-readout').textContent = `SCALE ${Number(state.sourceWidth).toFixed(2)}m × ${Number(state.sourceHeight).toFixed(2)}m · UNVERIFIED`;
  document.querySelector('#top-status').textContent = `${activeCard.id} / ${state.geometry.toUpperCase()}`;
  document.querySelector('#material-name').textContent = activeCard.name;
  document.querySelector('#material-id').textContent = activeCard.id;
  document.querySelector('#source-preview').src = activeMaterial.sourceUrl;
  document.querySelector('#source-preview').alt = `${activeCard.name} source photograph`;
  document.querySelector('#source-title').textContent = activeCard.description;
  document.querySelector('#source-type').textContent = `SOURCE / ${activeCard.sourceType.replaceAll('_', ' ').toUpperCase()}`;
  document.querySelector('#material-description').textContent = `${activeCard.description} The original stays preserved; derived relief and roughness channels remain estimates until authored maps replace them.`;
  document.querySelector('#footer-material-id').textContent = `${activeCard.id} · SOURCE MAPS PRESERVED`;
  document.querySelector('#repeat-value').value = `${Number(state.repeatMultiplier).toFixed(2)}×`;
  document.querySelector('#roughness-value').value = Number(state.roughness).toFixed(2);
  document.querySelector('#bump-value').value = Number(state.bumpStrength).toFixed(2);
  document.querySelector('#fov-value').value = `${Math.round(camera.fov)}°`;
  document.querySelector('#scale-note').textContent = `Derived repeat: ${repeat.repeatX.toFixed(2)}× horizontal · ${repeat.repeatY.toFixed(2)}× vertical · source scale is provisional.`;
  document.querySelector('#memory-value').textContent = `${state.quality === 'high' ? '~32' : state.quality === 'medium' ? '~20' : '~10'}MB`;
}

function renderIssueList(report) {
  const issueList = document.querySelector('#issue-list');
  const summary = document.querySelector('#validation-summary');
  const status = document.querySelector('#validation-status');
  const issueCount = document.querySelector('#issue-count');
  const actionable = report.issues.filter((item) => item.severity === 'warning' || item.severity === 'critical');
  issueCount.textContent = `${report.issues.length} issue${report.issues.length === 1 ? '' : 's'}`;
  status.textContent = report.status.replaceAll('_', ' ').toUpperCase();
  status.className = `count-label ${actionable.length ? 'count-warning' : 'count-pass'}`;
  summary.textContent = `${actionable.length} actionable · ${report.issues.length - actionable.length} informational · tested ${state.geometry}, ${state.lighting}, ${state.camera}`;
  issueList.innerHTML = report.issues.length ? report.issues.map((item) => `<article class="issue-card issue-${item.severity}"><div class="issue-top"><strong>${item.issueId}</strong><span>${item.severity}</span></div><b>${item.type.replaceAll('_', ' ')}</b><p>${item.actual}</p><small>${item.suggestedFixes[0]}</small></article>`).join('') : '<div class="empty-issue">No issues recorded for this test state.</div>';
}

function runValidation(download = false) {
  latestValidation = validateMaterial(activeCard, state, runtimeForValidation());
  renderIssueList(latestValidation);
  if (download) downloadJson(latestValidation, `${activeCard.id}-validation.json`);
  return latestValidation;
}

function getCurrentState() {
  const validation = latestValidation ?? runValidation(false);
  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    activeMaterial: activeCard.id,
    activeVariant: state.variant,
    geometry: state.geometry,
    lighting: state.lighting,
    cameraPreset: state.camera,
    camera: { position: camera.position.toArray(), target: controls.target.toArray(), fov: camera.fov },
    channel: state.channel,
    mapping: state.mapping,
    sourceScaleMeters: { width: state.sourceWidth, height: state.sourceHeight },
    materialParameters: { roughness: state.roughness, bumpStrength: state.bumpStrength, repeatMultiplier: state.repeatMultiplier, antiTiling: state.antiTiling },
    validationWarnings: validation.issues.filter((item) => item.severity !== 'info').map((item) => item.issueId),
    screenshotIndex,
    performance: { fps: document.querySelector('#fps-value').textContent, drawCalls: renderer.info.render.calls, quality: state.quality },
  };
}

function captureScreenshot() {
  renderer.render(scene, camera);
  const id = `SHOT-${String(screenshotIndex.length + 1).padStart(4, '0')}`;
  screenshotIndex.push({ id, materialId: activeCard.id, geometry: state.geometry, lighting: state.lighting, camera: state.camera, channel: state.channel, capturedAt: new Date().toISOString() });
  downloadDataUrl(renderer.domElement.toDataURL('image/png'), `${activeCard.id}-${state.geometry}-${state.channel}.png`);
  downloadJson({ schemaVersion: '0.1.0', screenshots: screenshotIndex }, 'SCREENSHOT_INDEX.json');
  showToast(`${id} captured.`);
}

function generatedThreeExample() {
  return `import * as THREE from 'three';\n\nconst baseColorMap = textureLoader.load('./maps/base-color.jpg');\nbaseColorMap.colorSpace = THREE.SRGBColorSpace;\nbaseColorMap.wrapS = THREE.RepeatWrapping;\nbaseColorMap.wrapT = THREE.RepeatWrapping;\nbaseColorMap.repeat.set(${currentRuntime.repeatX.toFixed(2)}, ${currentRuntime.repeatY.toFixed(2)});\n\nconst material = new THREE.MeshStandardMaterial({\n  map: baseColorMap,\n  roughness: ${state.roughness.toFixed(2)},\n  metalness: 0.0,\n  bumpScale: ${state.bumpStrength.toFixed(2)},\n});\n\n// Normal, roughness, and height maps are runtime estimates in this prototype.\n// Replace them with authored maps when the package is upgraded.\n`;
}

async function exportMaterialPackage() {
  const validation = runValidation(false);
  const card = materialCardForExport(state, activeCard);
  const zip = new JSZip();
  zip.file('material.json', JSON.stringify(card, null, 2));
  zip.file('provenance.json', JSON.stringify({ ...activeCard.provenance, license: activeCard.license, sourceType: activeCard.sourceType }, null, 2));
  zip.file('validation.json', JSON.stringify(validation, null, 2));
  zip.file('three-material.js', generatedThreeExample());
  zip.file('README.md', `# ${card.id}\n\n${card.description}\n\nThis prototype package includes a real photo base-color map. Normal, height, and roughness channels are runtime estimates and are not included as authored maps.\n\nReal-world source scale: ${state.sourceWidth}m × ${state.sourceHeight}m (unverified).\n`);
  const sourceBlob = await fetch(activeMaterial.sourceUrl).then((response) => response.blob());
  const mapBlob = await fetch(activeMaterial.baseColorUrl).then((response) => response.blob());
  zip.file('source/original-photo.jpg', sourceBlob);
  zip.file('source/crop-source.jpg', mapBlob);
  zip.file('maps/base-color.jpg', mapBlob);
  const packageBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(packageBlob, `${card.id}.zip`);
  showToast('Material package exported.');
}

function showToast(message) {
  const element = document.querySelector('#command-status');
  element.textContent = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { element.textContent = 'Ready. The material card is loaded.'; }, 3500);
}

function normalizedValue(value) {
  return value.toLowerCase().replaceAll('-', '').replaceAll('_', '').replaceAll(' ', '');
}

function loadDerivedMapsForActive() {
  const requestedKey = activeMaterialKey;
  loadingState.textContent = `Deriving estimated maps for ${activeCard.name}…`;
  loadingState.classList.remove('is-hidden', 'is-error');
  createDerivedMaps(activeMaterial.baseColorUrl).then((maps) => {
    if (requestedKey !== activeMaterialKey) return;
    derivedMaps = maps;
    loadingState.classList.add('is-hidden');
    rebuildStage();
  }).catch(() => {
    if (requestedKey !== activeMaterialKey) return;
    loadingState.textContent = 'Map estimates unavailable';
    loadingState.classList.add('is-error');
    rebuildStage();
  });
}

function setMaterial(value) {
  const next = materialLibrary[value];
  if (!next) throw new Error(`Unknown material: ${value}`);
  activeMaterialKey = next.key;
  activeMaterial = next;
  activeCard = next.card;
  activeTexture = textureLibrary[activeMaterialKey];
  Object.assign(state, next.defaults);
  latestValidation = null;
  document.querySelector('#material-select').value = activeMaterialKey;
  document.querySelector('#geometry-select').value = state.geometry;
  document.querySelector('#lighting-select').value = state.lighting;
  document.querySelector('#camera-select').value = state.camera;
  document.querySelector('#channel-select').value = state.channel;
  document.querySelector('#quality-select').value = state.quality;
  document.querySelector('#source-width').value = Number(state.sourceWidth).toFixed(2);
  document.querySelector('#source-height').value = Number(state.sourceHeight).toFixed(2);
  document.querySelector('#repeat-range').value = String(state.repeatMultiplier);
  document.querySelector('#roughness-range').value = String(state.roughness);
  document.querySelector('#bump-range').value = String(state.bumpStrength);
  document.querySelector('#seams-button').classList.toggle('is-active', state.seams);
  document.querySelector('#seams-button').textContent = state.seams ? 'Seams on' : 'Seams off';
  document.querySelector('#ruler-button').classList.toggle('is-active', state.scaleOverlay);
  document.querySelector('#ruler-button').textContent = state.scaleOverlay ? 'Ruler on' : 'Ruler off';
  document.querySelector('#antitiling-button').classList.toggle('is-active', state.antiTiling);
  document.querySelector('#antitiling-button').textContent = state.antiTiling ? 'Anti-tiling on' : 'Anti-tiling off';
  derivedMaps = null;
  rebuildStage();
  loadDerivedMapsForActive();
}

function setGeometry(value) {
  const options = ['sidewalk', 'wall', 'cube', 'sphere', 'cylinder', 'large-plane', 'all'];
  const normalized = normalizedValue(value);
  const match = options.find((option) => normalizedValue(option) === normalized);
  if (!match) throw new Error(`Unknown geometry: ${value}`);
  state.geometry = match;
  document.querySelector('#geometry-select').value = match;
  rebuildStage();
}

function setLighting(value) {
  const normalized = normalizedValue(value);
  const match = Object.keys(lightingPresets).find((option) => normalizedValue(option) === normalized);
  if (!match) throw new Error(`Unknown light preset: ${value}`);
  state.lighting = match;
  document.querySelector('#lighting-select').value = match;
  applyLighting();
}

function setCamera(value) {
  const normalized = normalizedValue(value);
  const match = Object.keys(cameraPresets).find((option) => normalizedValue(option) === normalized);
  if (!match) throw new Error(`Unknown camera preset: ${value}`);
  state.camera = match;
  document.querySelector('#camera-select').value = match;
  applyCamera();
}

function setChannel(value) {
  const normalized = normalizedValue(value);
  const aliases = { final: 'final', basecolor: 'base-color', roughness: 'roughness', normal: 'normal', height: 'height', uv: 'uv' };
  const match = aliases[normalized];
  if (!match) throw new Error(`Unknown channel: ${value}`);
  state.channel = match;
  document.querySelector('#channel-select').value = match;
  rebuildStage();
}

async function executeCommand(source) {
  const tokens = source.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return;
  const verb = tokens.shift().toUpperCase();
  const argument = tokens.join(' ');
  if (verb === 'LOAD') {
    const material = Object.values(materialLibrary).find(({ card }) => card.id === argument.toUpperCase());
    if (!material) throw new Error(`Unknown material: ${argument}`);
    setMaterial(material.key);
    showToast(`${material.card.id} loaded.`);
    return;
  }
  if (verb === 'GEOMETRY') return setGeometry(argument);
  if (verb === 'LIGHT') return setLighting(argument);
  if (verb === 'CAMERA') return setCamera(argument);
  if (verb === 'SHOW') return setChannel(argument);
  if (verb === 'SET' && tokens[0]?.toUpperCase() === 'ROUGHNESS') {
    const value = Number(tokens[1]);
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Roughness must be between 0 and 1.');
    state.roughness = value;
    document.querySelector('#roughness-range').value = String(value);
    rebuildStage();
    return;
  }
  if (verb === 'SET' && tokens[0]?.toUpperCase() === 'SCALE') {
    const value = Number(tokens[1]);
    if (!Number.isFinite(value) || value <= 0) throw new Error('Scale must be a positive number of meters.');
    state.sourceWidth = value;
    state.sourceHeight = value;
    document.querySelector('#source-width').value = value.toFixed(2);
    document.querySelector('#source-height').value = value.toFixed(2);
    rebuildStage();
    return;
  }
  if (verb === 'ENABLE' && tokens.join(' ').toUpperCase() === 'ANTITILING') {
    state.antiTiling = true;
    document.querySelector('#antitiling-button').textContent = 'Anti-tiling on';
    document.querySelector('#antitiling-button').classList.add('is-active');
    rebuildStage();
    return;
  }
  if (verb === 'DISABLE' && tokens.join(' ').toUpperCase() === 'ANTITILING') {
    state.antiTiling = false;
    document.querySelector('#antitiling-button').textContent = 'Anti-tiling off';
    document.querySelector('#antitiling-button').classList.remove('is-active');
    rebuildStage();
    return;
  }
  if (verb === 'COMPARE') return setGeometry('all');
  if (verb === 'CAPTURE') return captureScreenshot();
  if (verb === 'VALIDATE') return runValidation(true);
  if (verb === 'EXPORT') return exportMaterialPackage();
  if (verb === 'STATE') return downloadJson(getCurrentState(), `${activeCard.id}-state.json`);
  throw new Error(`Unknown command: ${verb}`);
}

function bindInput(id, callback) {
  document.querySelector(id).addEventListener('input', callback);
  document.querySelector(id).addEventListener('change', callback);
}

document.querySelector('#material-select').addEventListener('change', (event) => setMaterial(event.target.value));
document.querySelector('#geometry-select').addEventListener('change', (event) => setGeometry(event.target.value));
document.querySelector('#lighting-select').addEventListener('change', (event) => setLighting(event.target.value));
document.querySelector('#camera-select').addEventListener('change', (event) => setCamera(event.target.value));
document.querySelector('#channel-select').addEventListener('change', (event) => setChannel(event.target.value));
document.querySelector('#quality-select').addEventListener('change', (event) => { state.quality = event.target.value; updateQuality(); });
document.querySelector('#seams-button').addEventListener('click', (event) => { state.seams = !state.seams; event.currentTarget.classList.toggle('is-active', state.seams); event.currentTarget.textContent = state.seams ? 'Seams on' : 'Seams off'; rebuildStage(); });
document.querySelector('#ruler-button').addEventListener('click', (event) => { state.scaleOverlay = !state.scaleOverlay; event.currentTarget.classList.toggle('is-active', state.scaleOverlay); event.currentTarget.textContent = state.scaleOverlay ? 'Ruler on' : 'Ruler off'; buildRuler(); });
document.querySelector('#antitiling-button').addEventListener('click', (event) => { state.antiTiling = !state.antiTiling; event.currentTarget.classList.toggle('is-active', state.antiTiling); event.currentTarget.textContent = state.antiTiling ? 'Anti-tiling on' : 'Anti-tiling off'; rebuildStage(); });
bindInput('#repeat-range', (event) => { state.repeatMultiplier = Number(event.target.value); rebuildStage(); });
bindInput('#roughness-range', (event) => { state.roughness = Number(event.target.value); rebuildStage(); });
bindInput('#bump-range', (event) => { state.bumpStrength = Number(event.target.value); rebuildStage(); });
bindInput('#source-width', (event) => { state.sourceWidth = Math.max(0.01, Number(event.target.value) || 1); rebuildStage(); });
bindInput('#source-height', (event) => { state.sourceHeight = Math.max(0.01, Number(event.target.value) || 1); rebuildStage(); });
bindInput('#fov-range', (event) => { camera.fov = Number(event.target.value); camera.updateProjectionMatrix(); updateReadouts(); });
document.querySelector('#validate-button').addEventListener('click', () => runValidation(true));
document.querySelector('#capture-button').addEventListener('click', captureScreenshot);
document.querySelector('#export-button').addEventListener('click', () => void exportMaterialPackage());
document.querySelector('#state-button').addEventListener('click', () => downloadJson(getCurrentState(), `${activeCard.id}-state.json`));
document.querySelector('#run-command').addEventListener('click', async () => {
  const input = document.querySelector('#command-input');
  const source = input.value;
  input.value = '';
  try { await executeCommand(source); document.querySelector('#command-status').textContent = `✓ ${source}`; }
  catch (error) { document.querySelector('#command-status').textContent = `✕ ${error.message}`; }
});
document.querySelector('#command-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') document.querySelector('#run-command').click(); });

loadDerivedMapsForActive();

applyLighting();
applyCamera();
rebuildStage();
resize();
updateQuality();
window.addEventListener('resize', resize);

const clock = new THREE.Clock();
function animate() {
  const elapsed = clock.getElapsedTime();
  practicalLight.intensity = lightingPresets[state.lighting].practical + (state.lighting === 'neutral' ? Math.sin(elapsed * 0.65) * 0.55 : 0);
  controls.update();
  renderer.render(scene, camera);
  fpsFrames += 1;
  const now = performance.now();
  if (now - fpsWindowStart >= 1000) {
    document.querySelector('#fps-value').textContent = String(Math.round((fpsFrames * 1000) / (now - fpsWindowStart)));
    fpsFrames = 0;
    fpsWindowStart = now;
  }
  if (now - lastTelemetry >= 500) {
    document.querySelector('#draw-value').textContent = String(renderer.info.render.calls);
    lastTelemetry = now;
  }
}
renderer.setAnimationLoop(animate);
