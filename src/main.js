const CDN_THREE = "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";

const runtimeMessage = document.querySelector("#runtimeMessage");

function showMessage(message) {
  runtimeMessage.hidden = false;
  runtimeMessage.textContent = message;
}

function setUploadStatus(message, tone = "muted") {
  ui.uploadStatus.textContent = message;
  ui.uploadStatus.classList.toggle("is-loading", tone === "loading");
  ui.uploadStatus.classList.toggle("is-ready", tone === "ready");
  ui.uploadStatus.classList.toggle("is-error", tone === "error");
}

let THREE;
try {
  THREE = await import(CDN_THREE);
} catch (error) {
  showMessage("Three.js 加载失败。请检查网络连接后刷新页面。");
  throw error;
}

const ui = {
  sourceBadge: document.querySelector("#sourceBadge"),
  depthStatus: document.querySelector("#depthStatus"),
  fileLabel: document.querySelector("#fileLabel"),
  fileDrop: document.querySelector(".file-drop"),
  stageUpload: document.querySelector(".stage-upload"),
  emptyState: document.querySelector("#emptyState"),
  slotButtons: Array.from(document.querySelectorAll(".slot-button")),
  slotDeleteButton: document.querySelector("#slotDeleteButton"),
  particleColorControl: document.querySelector(".particle-color-control"),
  particleColorButtons: Array.from(document.querySelectorAll("[data-particle-color]")),
  backgroundColorButtons: Array.from(document.querySelectorAll("[data-bg-color]")),
  particleOrb: document.querySelector("#particleOrb"),
  particleColorPreview: document.querySelector("#particleColorPreview"),
  uploadStatus: document.querySelector("#uploadStatus"),
  videoInput: document.querySelector("#videoInput"),
  clipAInput: document.querySelector("#clipAInput"),
  clipBInput: document.querySelector("#clipBInput"),
  clipALabel: document.querySelector("#clipALabel"),
  clipBLabel: document.querySelector("#clipBLabel"),
  sequenceStatus: document.querySelector("#sequenceStatus"),
  playButton: document.querySelector("#playButton"),
  playButtonText: document.querySelector("#playButton .sr-only"),
  exportMp4Button: document.querySelector("#exportMp4Button"),
  exportMp4Text: document.querySelector("#exportMp4Button span") || document.querySelector("#exportMp4Button"),
  exportWebmButton: document.querySelector("#exportWebmButton"),
  exportWebmText: document.querySelector("#exportWebmButton span") || document.querySelector("#exportWebmButton"),
  exportPngButton: document.querySelector("#exportPngButton"),
  exportPngText: document.querySelector("#exportPngButton span") || document.querySelector("#exportPngButton"),
  pngDownloadLink: document.querySelector("#pngDownloadLink"),
  mp4DownloadLink: document.querySelector("#mp4DownloadLink"),
  webmDownloadLink: document.querySelector("#webmDownloadLink"),
  exportDepthButton: document.querySelector("#exportDepthButton"),
  exportDepthText: document.querySelector("#exportDepthButton span"),
  exportActiveButton: document.querySelector("#exportActiveButton"),
  exportActiveLabel: document.querySelector("#exportActiveLabel"),
  exportToggleStack: document.querySelector(".export-toggle-stack"),
  exportMenuToggle: document.querySelector("#exportMenuToggle"),
  timelineFxToggle: document.querySelector("#timelineFxToggle"),
  exportMenu: document.querySelector("#exportMenu"),
  exportWebglButton: document.querySelector("#exportWebglButton"),
  downloadLink: document.querySelector("#downloadLink"),
  fpsMeter: document.querySelector("#fpsMeter"),
  depthMeter: document.querySelector("#depthMeter"),
  particleCount: document.querySelector("#particleCount"),
  orbCountMain: document.querySelector("#orbCountMain"),
  orbCountUnit: document.querySelector("#orbCountUnit"),
  timeLabel: document.querySelector("#timeLabel"),
  timelineWrap: document.querySelector("#timelineWrap"),
  timelineSegments: document.querySelector("#timelineSegments"),
  timelineSegmentLabel: document.querySelector("#timelineSegmentLabel"),
  timelineFxPanel: document.querySelector("#timelineFxPanel"),
  timelineFxTrack: document.querySelector("#timelineFxTrack"),
  timelineFxSegments: document.querySelector("#timelineFxSegments"),
  fxTicks: document.querySelector(".fx-ticks"),
  fxNodes: Array.from(document.querySelectorAll("[data-fx-node]")),
  depthRecipe: document.querySelector("#depthRecipe"),
  invertDepth: document.querySelector("#invertDepth"),
  exportAlpha: document.querySelector("#exportAlpha"),
  exportBackgrounds: Array.from(document.querySelectorAll('input[name="exportBackground"]')),
  scrub: document.querySelector("#scrub"),
  scrubOut: document.querySelector("#scrubOut"),
  ranges: {
    depthLook: document.querySelector("#depthLook"),
    particleLook: document.querySelector("#particleLook"),
    flowLook: document.querySelector("#flowLook"),
    depthStrength: document.querySelector("#depthStrength"),
    depthGamma: document.querySelector("#depthGamma"),
    edgeLift: document.querySelector("#edgeLift"),
    depthContrast: document.querySelector("#depthContrast"),
    density: document.querySelector("#density"),
    pointSize: document.querySelector("#pointSize"),
    particleOpacity: document.querySelector("#particleOpacity"),
    threshold: document.querySelector("#threshold"),
    motion: document.querySelector("#motion"),
    colorMix: document.querySelector("#colorMix"),
    sourcePull: document.querySelector("#sourcePull"),
    assembleDuration: document.querySelector("#assembleDuration"),
    dissolveDuration: document.querySelector("#dissolveDuration"),
    transitionDuration: document.querySelector("#transitionDuration"),
    sizeRandomness: document.querySelector("#sizeRandomness"),
  },
  outputs: {
    depthLook: document.querySelector("#depthLookOut"),
    particleLook: document.querySelector("#particleLookOut"),
    flowLook: document.querySelector("#flowLookOut"),
    depthStrength: document.querySelector("#depthStrengthOut"),
    depthGamma: document.querySelector("#depthGammaOut"),
    edgeLift: document.querySelector("#edgeLiftOut"),
    depthContrast: document.querySelector("#depthContrastOut"),
    density: document.querySelector("#densityOut"),
    pointSize: document.querySelector("#pointSizeOut"),
    particleOpacity: document.querySelector("#particleOpacityOut"),
    threshold: document.querySelector("#thresholdOut"),
    motion: document.querySelector("#motionOut"),
    colorMix: document.querySelector("#colorMixOut"),
    sourcePull: document.querySelector("#sourcePullOut"),
    assembleDuration: document.querySelector("#assembleDurationOut"),
    dissolveDuration: document.querySelector("#dissolveDurationOut"),
    transitionDuration: document.querySelector("#transitionDurationOut"),
    sizeRandomness: document.querySelector("#sizeRandomnessOut"),
  },
};

const webglCanvas = document.querySelector("#webglCanvas");
const sourceCanvas = document.querySelector("#sourcePreview");
const depthCanvas = document.querySelector("#depthPreview");
const sourceVideo = document.querySelector("#sourceVideo");
const sourceVideoB = document.querySelector("#sourceVideoB");
const sourceImage = new Image();
const SLOT_IDS = ["a", "b", "3", "4", "5"];

const process = {
  width: 320,
  height: 180,
  sourceCtx: sourceCanvas.getContext("2d", { willReadFrequently: true }),
  depthCtx: depthCanvas.getContext("2d", { willReadFrequently: true }),
  luma: new Float32Array(320 * 180),
  rawDepth: new Float32Array(320 * 180),
  previousDepth: new Float32Array(320 * 180),
  depthPixels: null,
  normLow: null,
  normHigh: null,
  lastDepthAt: 0,
  textureDirty: true,
  sourceContentRect: { x: 0, y: 0, width: 320, height: 180 },
};

process.depthPixels = process.depthCtx.createImageData(process.width, process.height);

const DEFAULT_DURATION = 8;
const IMAGE_LOOP_DURATION = 8;
const TAU = Math.PI * 2;
const EMPTY_ORIGINAL_PALETTE = Array.from({ length: 10 }, () => "#d9d9d9");

const state = {
  sourceMode: "empty",
  objectUrl: "",
  clipAUrl: "",
  clipBUrl: "",
  clipAName: "",
  clipBName: "",
  clipADuration: 0,
  clipBDuration: 0,
  clipAAspect: 16 / 9,
  clipBAspect: 16 / 9,
  activeSegmentKey: "",
  activeClipType: "empty",
  duration: DEFAULT_DURATION,
  elapsed: 0,
  effectTime: 0,
  scrub: 0,
  playing: false,
  autoPlay: true,
  recipe: "balanced",
  invertDepth: false,
  recording: false,
  recordingDisabledControls: null,
  frameReadBlocked: false,
  exportAlpha: false,
  exportBackground: "white",
  exportRender: null,
  particleColorMode: "black",
  backgroundColorMode: "white",
  exportFormat: "mp4",
  activeSlot: "a",
  loadedSlots: new Set(),
  originalPalette: EMPTY_ORIGINAL_PALETTE.slice(),
  depthLook: readRange("depthLook"),
  particleLook: readRange("particleLook"),
  flowLook: readRange("flowLook"),
  depthStrength: readRange("depthStrength"),
  depthGamma: readRange("depthGamma"),
  edgeLift: readRange("edgeLift"),
  depthContrast: readRange("depthContrast"),
  density: readRange("density"),
  pointSize: readRange("pointSize"),
  particleOpacity: readRange("particleOpacity"),
  threshold: readRange("threshold"),
  motion: readRange("motion"),
  colorMix: readRange("colorMix"),
  sourcePull: readRange("sourcePull"),
  assembleDuration: readRange("assembleDuration"),
  dissolveDuration: readRange("dissolveDuration"),
  transitionDuration: readRange("transitionDuration"),
  sizeRandomness: readRange("sizeRandomness"),
  transitionMode: 0,
  transitionProgress: 0,
  transitionBlend: 0,
  particleSoftness: 0.68,
  scatterAmount: 0.75,
  lagSpread: 0.42,
  holdDuration: 1.18,
  rotation: 0,
  rotationSpeed: TAU / IMAGE_LOOP_DURATION,
  imagePivotX: 0,
  imagePivotZ: 0,
  mediaAspect: 16 / 9,
};

const mediaSlots = new Map(SLOT_IDS.map((slot) => [slot, createEmptyMediaSlot(slot)]));
mediaSlots.get("a").video = sourceVideo;
mediaSlots.get("b").video = sourceVideoB;

const DEFAULT_SEGMENT_FX = {
  assembleEnd: 0.2,
  dissolveStart: 1,
};
const timelineFxBySlot = new Map();

const FX_SNAP_STEP = 0.1;
const FX_MIN_HOLD = FX_SNAP_STEP;

const PREVIEW_BACKGROUND = "#ffffff";
const EXPORT_BACKGROUNDS = {
  white: 0xffffff,
  black: 0x000000,
};
const GRID_DOT_COLOR = "#aaa9a4";
const PARTICLE_PREVIEW_FIT = 0.68;
const DEPTH_INTERVAL_PLAYING = 42;
const DEPTH_INTERVAL_IDLE = 120;

const renderer = new THREE.WebGLRenderer({
  canvas: webglCanvas,
  alpha: true,
  premultipliedAlpha: false,
  antialias: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setClearColor(PREVIEW_BACKGROUND, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10);
camera.position.set(0, 0, 2.72);

const gridUniforms = {
  uGridCount: { value: new THREE.Vector2(80, 50) },
  uBaseColor: { value: new THREE.Color(PREVIEW_BACKGROUND) },
  uDotColor: { value: new THREE.Color(GRID_DOT_COLOR) },
};

const gridMaterial = new THREE.ShaderMaterial({
  uniforms: gridUniforms,
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform vec2 uGridCount;
    uniform vec3 uBaseColor;
    uniform vec3 uDotColor;

    varying vec2 vUv;

    void main() {
      vec2 gridUv = fract(vUv * uGridCount) - vec2(0.5);
      float d = length(gridUv);
      float dotMask = 1.0 - smoothstep(0.046, 0.064, d);
      vec3 color = mix(uBaseColor, uDotColor, dotMask * 0.42);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  depthWrite: false,
  depthTest: false,
});

const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), gridMaterial);
gridPlane.position.z = -2.2;
gridPlane.renderOrder = -100;
scene.add(gridPlane);

const depthTexture = new THREE.CanvasTexture(depthCanvas);
depthTexture.flipY = false;
depthTexture.minFilter = THREE.LinearFilter;
depthTexture.magFilter = THREE.LinearFilter;
depthTexture.generateMipmaps = false;

const sourceTexture = new THREE.CanvasTexture(sourceCanvas);
sourceTexture.flipY = false;
sourceTexture.minFilter = THREE.LinearFilter;
sourceTexture.magFilter = THREE.LinearFilter;
sourceTexture.generateMipmaps = false;
sourceTexture.colorSpace = THREE.SRGBColorSpace;

const shaderPalette = Array.from({ length: 10 }, () => new THREE.Color(1, 1, 1));

const uniforms = {
  uSource: { value: sourceTexture },
  uDepth: { value: depthTexture },
  uEffectTime: { value: state.effectTime },
  uDepthStrength: { value: state.depthStrength },
  uPointSize: { value: state.pointSize },
  uOpacityRandomness: { value: state.particleOpacity },
  uStaticSource: { value: 0 },
  uThreshold: { value: state.threshold },
  uSourcePull: { value: state.sourcePull },
  uAssembleDuration: { value: state.assembleDuration },
  uDissolveDuration: { value: state.dissolveDuration },
  uTransitionMode: { value: state.transitionMode },
  uTransitionProgress: { value: state.transitionProgress },
  uTransitionBlend: { value: state.transitionBlend },
  uSizeRandomness: { value: state.sizeRandomness },
  uParticleSoftness: { value: state.particleSoftness },
  uScatterAmount: { value: state.scatterAmount },
  uLagSpread: { value: state.lagSpread },
  uHoldDuration: { value: state.holdDuration },
  uDepthGamma: { value: state.depthGamma },
  uInvert: { value: state.invertDepth ? 1 : 0 },
  uPixelRatio: { value: window.devicePixelRatio || 1 },
  uPlaneScale: { value: new THREE.Vector2(1, 1) },
  uTunnelAmount: { value: 0 },
  uImageMode: { value: 0 },
  uImageRotation: { value: 0 },
  uImagePivot: { value: new THREE.Vector2(0, 0) },
  uParticleColorMode: { value: 0 },
  uSolidParticleColor: { value: new THREE.Color(1, 1, 1) },
  uPalette: { value: shaderPalette },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    attribute vec2 aUv;
    attribute float aSeed;

    uniform sampler2D uDepth;
    uniform float uEffectTime;
    uniform float uDepthStrength;
    uniform float uPointSize;
    uniform float uOpacityRandomness;
    uniform float uStaticSource;
    uniform float uThreshold;
    uniform float uSourcePull;
    uniform float uAssembleDuration;
    uniform float uDissolveDuration;
    uniform float uTransitionMode;
    uniform float uTransitionProgress;
    uniform float uTransitionBlend;
    uniform float uSizeRandomness;
    uniform float uParticleSoftness;
    uniform float uScatterAmount;
    uniform float uLagSpread;
    uniform float uHoldDuration;
    uniform float uDepthGamma;
    uniform float uInvert;
    uniform float uPixelRatio;
    uniform vec2 uPlaneScale;
    uniform float uTunnelAmount;
    uniform float uImageMode;
    uniform float uImageRotation;
    uniform vec2 uImagePivot;
    uniform float uParticleColorMode;
    uniform vec3 uSolidParticleColor;
    uniform vec3 uPalette[10];

    varying vec2 vSourceUv;
    varying vec3 vColor;
    varying float vColorGrain;
    varying float vAlpha;

    float hash11(float p) {
      return fract(sin(p * 127.1) * 43758.5453123);
    }

    float easeOutCubic(float x) {
      float t = clamp(x, 0.0, 1.0);
      return 1.0 - pow(1.0 - t, 3.0);
    }

    float easeInOut(float x) {
      float t = clamp(x, 0.0, 1.0);
      return t * t * (3.0 - 2.0 * t);
    }

    vec3 pickPalette(float seed) {
      float index = floor(clamp(seed, 0.0, 0.999) * 10.0);
      vec3 color = uPalette[0];
      color = mix(color, uPalette[1], step(0.5, index));
      color = mix(color, uPalette[2], step(1.5, index));
      color = mix(color, uPalette[3], step(2.5, index));
      color = mix(color, uPalette[4], step(3.5, index));
      color = mix(color, uPalette[5], step(4.5, index));
      color = mix(color, uPalette[6], step(5.5, index));
      color = mix(color, uPalette[7], step(6.5, index));
      color = mix(color, uPalette[8], step(7.5, index));
      color = mix(color, uPalette[9], step(8.5, index));
      return color;
    }

    void main() {
      float depth = texture2D(uDepth, aUv).r;
      depth = pow(clamp(depth, 0.0, 1.0), max(uDepthGamma, 0.001));
      depth = mix(depth, 1.0 - depth, step(0.5, uInvert));

      float depthThreshold = mix(uThreshold, uThreshold * 0.86, uSourcePull);
      float presence = smoothstep(depthThreshold + 0.035, 0.9, depth);
      float seedA = hash11(aSeed * 37.0 + 3.1);
      float seedB = hash11(aSeed * 19.0 + 11.7);
      float seedC = hash11(aSeed * 71.0 + 5.3);
      float confidenceGate = step(seedC, clamp(presence * 1.24, 0.0, 1.0));
      presence = pow(presence, 1.42) * confidenceGate;
      float imageMode = step(0.5, uImageMode);

      float holdDuration = max(uHoldDuration, 0.08);
      float assembleDuration = max(uAssembleDuration, 0.0);
      float dissolveDuration = max(uDissolveDuration, 0.0);
      float cycleDuration = max(0.18, assembleDuration + holdDuration + dissolveDuration);
      float localTime = mod(uEffectTime + seedA * 0.22, cycleDuration);
      float particleLag = seedB * uLagSpread;
      float assembleRaw = assembleDuration <= 0.0001 ? 1.0 : (localTime - particleLag) / assembleDuration;
      float assemble = easeOutCubic(assembleRaw);
      float dissolveStart = assembleDuration + holdDuration;
      float dissolveRaw = dissolveDuration <= 0.0001 ? step(dissolveStart, localTime) : (localTime - dissolveStart - particleLag * 0.35) / dissolveDuration;
      float dissolve = easeInOut(dissolveRaw);
      float staticMode = step(0.5, uStaticSource);
      float visiblePhase = clamp(assemble * (1.0 - dissolve), 0.0, 1.0);
      visiblePhase = mix(visiblePhase, 1.0, staticMode);
      float explicitTransition = clamp(uTransitionBlend, 0.0, 1.0);
      float transitionIn = step(1.5, uTransitionMode);
      float transitionProgress = clamp(uTransitionProgress, 0.0, 1.0);
      float transitionEase = easeInOut(transitionProgress);
      float transitionAssemble = easeOutCubic(transitionProgress);
      float transitionVisible = mix(1.0 - transitionEase, transitionAssemble, transitionIn);
      visiblePhase = mix(visiblePhase, transitionVisible, explicitTransition);

      vec3 pos = vec3((aUv.x - 0.5) * uPlaneScale.x, (0.5 - aUv.y) * uPlaneScale.y, 0.0);
      float depthLayer = smoothstep(0.05, 0.96, depth);
      float portraitVolume = pow(depthLayer, 0.78);
      float depthOffset = (portraitVolume - 0.5) * uDepthStrength * 1.28;
      pos.z += depthOffset + (seedB - 0.5) * uDepthStrength * 0.11 * presence;
      pos.xy *= 1.0 + depthOffset * mix(0.018, 0.0, imageMode);
      pos.xy += vec2(-0.014, 0.01) * depthOffset * (1.0 - imageMode);

      float tunnelTime = fract(uEffectTime * 0.075 + seedA * 0.38);
      float tunnelWindow = smoothstep(0.02, 0.2, tunnelTime) * (1.0 - smoothstep(0.78, 0.98, tunnelTime));
      float tunnelTravel = (tunnelTime - 0.5) * uTunnelAmount * 1.15 * (0.28 + (1.0 - depthLayer) * 0.72);
      pos.z += tunnelTravel * tunnelWindow * presence * staticMode * (1.0 - imageMode);
      pos.xy *= 1.0 + tunnelWindow * uTunnelAmount * 0.035 * (1.0 - depthLayer) * (1.0 - imageMode);

      float inAngle = seedA * 6.2831853;
      float outAngle = (seedB * 0.74 + seedC * 0.26) * 6.2831853;
      vec2 inDir = vec2(cos(inAngle), sin(inAngle));
      vec2 outDir = vec2(cos(outAngle), sin(outAngle));
      float planeMax = max(uPlaneScale.x, uPlaneScale.y);
      vec2 centerDir = normalize(pos.xy + vec2(seedA - 0.5, seedB - 0.5) * 0.0008);
      float scatterScale = planeMax * uScatterAmount * (0.18 + seedC * 0.62);
      float appearScatter = (1.0 - assemble) * (0.38 + seedB * 0.74);
      float dissolveScatter = dissolve * (0.24 + seedA * 0.92);
      float transitionAppearScatter = (1.0 - transitionAssemble) * (0.38 + seedB * 0.74) * transitionIn;
      float transitionDissolveScatter = transitionEase * (0.24 + seedA * 0.92) * (1.0 - transitionIn);
      appearScatter = mix(appearScatter, transitionAppearScatter, explicitTransition);
      dissolveScatter = mix(dissolveScatter, transitionDissolveScatter, explicitTransition);
      float motionMask = explicitTransition;
      pos.xy += inDir * scatterScale * appearScatter * motionMask;
      pos.xy += outDir * scatterScale * dissolveScatter * motionMask;
      pos.xy += vec2(cos(seedC * 31.2), sin(seedB * 29.1)) * uScatterAmount * 0.012 * (0.35 + presence) * motionMask;
      pos.z += mix(1.0 - assemble, 1.0 - transitionAssemble, explicitTransition) * (seedB - 0.5) * 0.75 * motionMask;
      pos.z += mix(dissolve, transitionEase * (1.0 - transitionIn), explicitTransition) * (seedC - 0.5) * 0.85 * motionMask;
      float tunnelOut = explicitTransition * (1.0 - transitionIn) * transitionEase;
      float tunnelIn = explicitTransition * transitionIn * (1.0 - transitionAssemble);
      float tunnelPhase = max(tunnelOut, tunnelIn);
      pos.xy += centerDir * planeMax * tunnelPhase * tunnelPhase * (0.42 + seedC * 0.92);
      pos.z += tunnelOut * (1.55 + seedB * 1.9);
      pos.z -= tunnelIn * (1.45 + seedB * 1.65);

      float c = cos(uImageRotation);
      float s = sin(uImageRotation);
      float pivotX = uImagePivot.x * uPlaneScale.x;
      float pivotZ = uImagePivot.y;
      float localX = pos.x - pivotX;
      float localZ = pos.z - pivotZ;
      float rotatedX = localX * c + localZ * s + pivotX;
      float rotatedZ = -localX * s + localZ * c + pivotZ;
      pos.x = mix(pos.x, rotatedX, imageMode);
      pos.z = mix(pos.z, rotatedZ, imageMode);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float randomSize = mix(1.0, 0.52 + pow(seedC, 1.72) * 2.05, uSizeRandomness);
      float phaseSize = mix(0.52, 1.0, assemble) * (1.0 + dissolve * 0.22);
      phaseSize = mix(phaseSize, 1.0, staticMode);
      float transitionSize = mix(1.0 + transitionEase * 0.18, mix(0.58, 1.0, transitionAssemble), transitionIn);
      phaseSize = mix(phaseSize, transitionSize, explicitTransition);
      float distanceScale = 1.0 / max(0.72, -mvPosition.z);
      float depthPerspectiveCompensation = mix(distanceScale, 0.72, clamp(uDepthStrength * 0.42, 0.0, 1.0));
      gl_PointSize = uPointSize * uPixelRatio * randomSize * phaseSize * (0.68 + depthLayer * 1.55) * (0.88 + presence * 0.26) * depthPerspectiveCompensation;

      float grain = 0.86 + seedA * 0.16;
      vec3 solidColor = uSolidParticleColor * grain;
      vSourceUv = aUv;
      vColor = solidColor;
      vColorGrain = grain;
      float alphaVariance = mix(1.0, 0.35 + seedB * 0.9, uOpacityRandomness);
      vAlpha = presence * visiblePhase * alphaVariance * (0.5 + depthLayer * 0.78);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform sampler2D uSource;
    uniform float uParticleSoftness;
    uniform float uParticleColorMode;

    varying vec2 vSourceUv;
    varying vec3 vColor;
    varying float vColorGrain;
    varying float vAlpha;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float r = length(coord);
      float inner = mix(0.43, 0.18, uParticleSoftness);
      float alpha = smoothstep(0.5, inner, r) * vAlpha;
      if (alpha < 0.028) discard;
      vec3 sourceColor = texture2D(uSource, vSourceUv).rgb * vColorGrain;
      vec3 particleColor = mix(vColor, sourceColor, step(1.5, uParticleColorMode));
      gl_FragColor = vec4(particleColor, min(alpha, 1.0));
    }
  `,
  transparent: true,
  depthWrite: false,
  depthTest: true,
});

let geometry = null;
let points = null;
let lastFrameTime = performance.now();
let fpsFrames = 0;
let fpsLastAt = performance.now();

function readRange(key) {
  return Number.parseFloat(ui.ranges[key].value);
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value) {
  const next = Number(value);
  return Number.isInteger(next) ? String(next) : next.toFixed(2);
}

function mixNumber(min, max, amount) {
  return min + (max - min) * clamp(amount);
}

function imageRotationAtTime(time) {
  const duration = Math.max(0.001, state.duration || IMAGE_LOOP_DURATION);
  return ((time % duration) / duration) * TAU;
}

function controlAmount(key) {
  const input = ui.ranges[key];
  if (!input) return clamp(state[key]);
  const min = Number.parseFloat(input.min || "0");
  const max = Number.parseFloat(input.max || "1");
  return max > min ? clamp((Number(state[key]) - min) / (max - min)) : 0;
}

function depthStrengthValue() {
  return mixNumber(0.62, 1.72, controlAmount("depthStrength"));
}

function depthStrengthAmount() {
  return controlAmount("depthStrength");
}

function densityValue() {
  return mixNumber(0.55, 2.0, controlAmount("density"));
}

function pointSizeValue() {
  return mixNumber(1, 2, controlAmount("pointSize"));
}

function sizeRandomnessAmount() {
  return controlAmount("sizeRandomness");
}

function opacityRandomnessAmount() {
  return controlAmount("particleOpacity");
}

function particleLookAmount() {
  return controlAmount("particleLook");
}

function exportBackgroundColor() {
  return EXPORT_BACKGROUNDS[state.exportBackground] ?? EXPORT_BACKGROUNDS.white;
}

function applyRenderBackground() {
  const exportMode = state.exportRender;
  if (exportMode) {
    gridPlane.visible = false;
    renderer.setClearColor(exportBackgroundColor(), exportMode.alpha ? 0 : 1);
    return;
  }

  if (state.sourceMode === "empty") {
    gridPlane.visible = false;
    renderer.setClearColor(PREVIEW_BACKGROUND, 1);
    return;
  }

  const background = previewBackgroundHex();
  gridPlane.visible = state.backgroundColorMode === "black";
  if (gridPlane.visible) {
    setColorObject(gridUniforms.uBaseColor.value, background);
    setColorObject(gridUniforms.uDotColor.value, "#4d4d4d");
  }
  renderer.setClearColor(background, 1);
}

function beginExportRender({ alpha = false } = {}) {
  state.exportRender = { alpha };
  applyRenderBackground();
}

function endExportRender() {
  state.exportRender = null;
  applyRenderBackground();
}

function setRangeValue(key, value) {
  const input = ui.ranges[key];
  const output = ui.outputs[key];
  if (!input) return;
  const next = Number(value);
  input.value = String(next);
  state[key] = next;
  if (output) {
    output.textContent = formatNumber(next);
  }
  updateRangeProgress(input);
}

function resetDepthMemory({ clearPrevious = false } = {}) {
  process.normLow = null;
  process.normHigh = null;
  process.lastDepthAt = 0;
  if (clearPrevious) {
    process.previousDepth.fill(0);
  }
}

function configureProcessSize(aspect = 16 / 9) {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const maxSide = 320;
  let width;
  let height;

  if (safeAspect >= 1) {
    width = maxSide;
    height = Math.max(96, Math.round(maxSide / safeAspect));
  } else {
    height = maxSide;
    width = Math.max(96, Math.round(maxSide * safeAspect));
  }

  if (width === process.width && height === process.height) {
    state.mediaAspect = safeAspect;
    sourceCanvas.style.aspectRatio = `${width} / ${height}`;
    depthCanvas.style.aspectRatio = `${width} / ${height}`;
    ui.fileDrop?.style.setProperty("--preview-aspect", `${width} / ${height}`);
    depthCanvas.parentElement?.style.setProperty("--preview-aspect", `${width} / ${height}`);
    process.sourceContentRect = { x: 0, y: 0, width, height };
    return;
  }

  process.width = width;
  process.height = height;
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  depthCanvas.width = width;
  depthCanvas.height = height;
  sourceCanvas.style.aspectRatio = `${width} / ${height}`;
  depthCanvas.style.aspectRatio = `${width} / ${height}`;
  ui.fileDrop?.style.setProperty("--preview-aspect", `${width} / ${height}`);
  depthCanvas.parentElement?.style.setProperty("--preview-aspect", `${width} / ${height}`);
  process.luma = new Float32Array(width * height);
  process.rawDepth = new Float32Array(width * height);
  process.previousDepth = new Float32Array(width * height);
  process.depthPixels = process.depthCtx.createImageData(width, height);
  process.sourceContentRect = { x: 0, y: 0, width, height };
  resetDepthMemory();
  state.mediaAspect = safeAspect;
  sourceTexture.needsUpdate = true;
  depthTexture.needsUpdate = true;
  if (points) {
    resizeRenderer();
  }
}

function setEmptyState(isEmpty) {
  document.body.classList.toggle("is-empty", isEmpty);
  document.body.classList.toggle("has-source", !isEmpty);
}

function applyLookControls({ forceDepth = false, resetEffect = false } = {}) {
  const particle = particleLookAmount();
  const flow = clamp(state.flowLook);

  state.particleSoftness = mixNumber(0.18, 0.9, particle);

  state.lagSpread = mixNumber(0.04, 0.62, flow);
  state.holdDuration = mixNumber(1.4, 0.82, flow);
  state.scatterAmount = mixNumber(0, 1.08, flow);

  if (resetEffect) {
    state.effectTime = 0;
  }

  if (forceDepth) {
    resetDepthMemory({ clearPrevious: true });
    generateDepthFrame(performance.now(), true);
  }
  renderParticleColorPreview();
}

function createEmptyMediaSlot(slot) {
  return {
    slot,
    type: "empty",
    url: "",
    name: "",
    duration: 0,
    aspect: 16 / 9,
    video: null,
    image: null,
  };
}

function normalizeSlot(slot) {
  return SLOT_IDS.includes(slot) ? slot : SLOT_IDS[0];
}

function getSlotMedia(slot) {
  return mediaSlots.get(normalizeSlot(slot));
}

function loadedSlotIds() {
  return SLOT_IDS.filter((slot) => {
    const media = getSlotMedia(slot);
    return Boolean(media?.url && media.type !== "empty");
  });
}

function loadedMediaClips() {
  return loadedSlotIds().map((slot) => getSlotMedia(slot));
}

function mediaClipCount() {
  return loadedSlotIds().length;
}

function firstLoadedSlot() {
  return loadedSlotIds()[0] || "";
}

function firstEmptySlot() {
  return SLOT_IDS.find((slot) => !getSlotMedia(slot)?.url) || "";
}

function syncLoadedSlots() {
  state.loadedSlots.clear();
  loadedSlotIds().forEach((slot) => state.loadedSlots.add(slot));
}

function ensureSlotVideo(slot) {
  const media = getSlotMedia(slot);
  if (media.video) return media.video;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.className = "technical-hidden";
  document.body.appendChild(video);
  media.video = video;
  return video;
}

function ensureSlotImage(slot) {
  const media = getSlotMedia(slot);
  if (!media.image) {
    media.image = new Image();
  }
  return media.image;
}

function resetMediaElement(media) {
  if (media.video) {
    media.video.pause();
    media.video.removeAttribute("src");
    media.video.load();
  }
  if (media.image) {
    media.image.removeAttribute("src");
  }
}

function clearMediaSlot(slot, { revoke = true } = {}) {
  const media = getSlotMedia(slot);
  if (!media) return;
  if (revoke && media.url) {
    URL.revokeObjectURL(media.url);
  }
  resetMediaElement(media);
  media.type = "empty";
  media.url = "";
  media.name = "";
  media.duration = 0;
  media.aspect = 16 / 9;
  timelineFxBySlot.delete(normalizeSlot(slot));
  syncLoadedSlots();
  syncLegacyClipState();
}

function clearAllMediaSlots() {
  SLOT_IDS.forEach((slot) => clearMediaSlot(slot));
  syncLoadedSlots();
  syncLegacyClipState();
}

function syncLegacyClipState() {
  const clipA = getSlotMedia("a");
  const clipB = getSlotMedia("b");
  state.clipAUrl = clipA?.url || "";
  state.clipBUrl = clipB?.url || "";
  state.clipAName = clipA?.name || "";
  state.clipBName = clipB?.name || "";
  state.clipADuration = clipA?.duration || 0;
  state.clipBDuration = clipB?.duration || 0;
  state.clipAAspect = clipA?.aspect || 16 / 9;
  state.clipBAspect = clipB?.aspect || 16 / 9;
  const first = loadedMediaClips()[0];
  state.objectUrl = first?.url || "";
}

function mediaDrawable(media) {
  if (!media || media.type === "empty") return null;
  if (media.type === "image" && media.image?.complete && media.image.naturalWidth > 0) return media.image;
  if (media.type === "video" && media.video?.readyState >= 2) return media.video;
  return null;
}

function primaryMediaClip() {
  const slot = firstLoadedSlot();
  return slot ? getSlotMedia(slot) : null;
}

function singleMediaClip() {
  const slot = state.activeSlot && state.loadedSlots.has(state.activeSlot) ? state.activeSlot : firstLoadedSlot();
  return slot ? getSlotMedia(slot) : null;
}

function slotNumber(slot) {
  return Math.max(1, SLOT_IDS.indexOf(slot) + 1);
}

function mediaKindLabel(media) {
  if (!media) return "素材";
  return media.type === "image" ? "图片" : "视频";
}

function refreshMediaMode({ resetTime = true } = {}) {
  syncLoadedSlots();
  syncLegacyClipState();
  const clips = loadedMediaClips();

  if (!clips.length) {
    state.sourceMode = "empty";
    state.activeClipType = "empty";
    state.duration = DEFAULT_DURATION;
    state.activeSlot = "a";
    configureProcessSize(16 / 9);
    setEmptyState(true);
    return;
  }

  const selected = getSlotMedia(state.activeSlot);
  if (!selected?.url) {
    state.activeSlot = clips[clips.length - 1].slot;
  }

  const primary = primaryMediaClip() || clips[0];
  configureProcessSize(primary.aspect);

  if (clips.length === 1) {
    const media = clips[0];
    state.sourceMode = media.type;
    state.duration = media.duration || (media.type === "image" ? IMAGE_LOOP_DURATION : DEFAULT_DURATION);
    state.mediaAspect = media.aspect;
    if (media.video) media.video.loop = media.type === "video";
  } else {
    state.sourceMode = "sequence";
    state.duration = sequenceTotalDuration();
    clips.forEach((media) => {
      if (media.video) media.video.loop = false;
    });
  }

  if (resetTime) {
    state.elapsed = 0;
    state.scrub = 0;
    state.effectTime = 0;
    state.rotation = 0;
    state.transitionMode = 0;
    state.transitionProgress = 0;
    state.transitionBlend = 0;
    state.activeSegmentKey = "";
    state.activeClipType = state.sourceMode === "sequence" ? "empty" : state.sourceMode;
  }

  if (!resetTime && state.sourceMode !== "sequence") {
    state.activeClipType = state.sourceMode;
  }

  setEmptyState(false);
}

function activeClipIsImage() {
  return state.sourceMode === "image" || (state.sourceMode === "sequence" && state.activeClipType === "image");
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
}

function particleModeValue() {
  if (state.particleColorMode === "original") return 2;
  return state.particleColorMode === "white" ? 1 : 0;
}

function solidParticleHex() {
  return state.particleColorMode === "white" ? "#ffffff" : "#050505";
}

function previewBackgroundHex() {
  if (state.backgroundColorMode === "black") return "#000000";
  return "#ffffff";
}

function setColorObject(color, hex) {
  const rgb = hexToRgb(hex);
  color.setRGB(rgb.r, rgb.g, rgb.b);
}

function updateSlotUI() {
  syncLoadedSlots();
  const count = Math.min(5, mediaClipCount());
  ui.sourceBadge.innerHTML = `<span class="slot-current">${count}</span><span class="slot-total">/5</span>`;
  ui.slotButtons.forEach((button) => {
    const slot = button.dataset.slot;
    if (!slot) return;
    if (slot === "add") {
      button.classList.toggle("is-dormant", count === 0 || count >= 5);
      return;
    }
    const loaded = state.loadedSlots.has(slot);
    const shouldShow = count === 0 ? slot === "a" : loaded;
    button.classList.toggle("is-active", slot === state.activeSlot);
    button.classList.toggle("is-empty", !loaded);
    button.classList.toggle("is-loaded", loaded);
    button.classList.toggle("is-dormant", !shouldShow);
  });
  window.requestAnimationFrame(updateSlotDeleteButton);
}

function updateSlotDeleteButton() {
  if (!ui.slotDeleteButton) return;
  const activeButton = ui.slotButtons.find((button) => button.dataset.slot === state.activeSlot);
  const canDelete = Boolean(activeButton && state.loadedSlots.has(state.activeSlot));
  ui.slotDeleteButton.hidden = !canDelete;
  if (!canDelete) return;
  const x = activeButton.offsetLeft + activeButton.offsetWidth / 2;
  ui.slotDeleteButton.style.left = `${Math.round(x)}px`;
}

function activeUploadSlot() {
  const active = getSlotMedia(state.activeSlot);
  if (!active?.url) return normalizeSlot(state.activeSlot);
  return firstEmptySlot() || normalizeSlot(state.activeSlot);
}

function setActiveSlot(slot) {
  if (!slot || slot === "add") {
    const next = firstEmptySlot();
    if (!next) {
      showMessage("最多支持 5 段素材。需要替换时，先删除其中一段再上传。");
      return;
    }
    ui.videoInput.click();
    return;
  }
  state.activeSlot = normalizeSlot(slot);
  updateSlotUI();
  if (!state.loadedSlots.has(state.activeSlot)) {
    ui.videoInput.click();
  }
}

function deleteActiveSlot() {
  if (!state.loadedSlots.has(state.activeSlot)) return;
  const deleted = state.activeSlot;
  clearMediaSlot(deleted);
  const remaining = loadedSlotIds();
  if (!remaining.length) {
    loadEmpty();
    showMessage("已删除当前素材。");
    return;
  }
  state.activeSlot = remaining[Math.min(SLOT_IDS.indexOf(deleted), remaining.length - 1)] || remaining[0];
  refreshMediaMode();
  updateSequenceStatus();
  resetDepthMemory({ clearPrevious: true });
  drawSourceFrame(performance.now());
  generateDepthFrame(performance.now(), true);
  updateSlotUI();
  syncTimelineFxPanel();
  updateColorControls();
  setUploadStatus(`已删除第 ${slotNumber(deleted)} 段，当前保留 ${remaining.length}/5 段。`, "ready");
  setPlaying(false);
}

function syncExportControlsFromColor() {
  state.exportAlpha = state.backgroundColorMode === "alpha";
  const exportBackground = state.backgroundColorMode === "black" ? "black" : "white";
  state.exportBackground = exportBackground;
  if (ui.exportAlpha) ui.exportAlpha.checked = state.exportAlpha;
  ui.exportBackgrounds.forEach((input) => {
    input.checked = input.value === exportBackground;
  });
}

function hasLoadedSource() {
  return state.sourceMode !== "empty";
}

function setParticleColorMode(mode) {
  if (mode === "white") {
    state.particleColorMode = "white";
    state.backgroundColorMode = "black";
  } else if (mode === "black") {
    state.particleColorMode = "black";
    state.backgroundColorMode = "white";
  } else {
    state.particleColorMode = "original";
    state.backgroundColorMode = "white";
  }
  updateColorControls();
}

function setBackgroundColorMode(mode) {
  if (mode === "white") {
    state.backgroundColorMode = "white";
    if (state.particleColorMode === "white") state.particleColorMode = "black";
  } else if (mode === "black") {
    state.backgroundColorMode = "black";
    if (state.particleColorMode === "black") state.particleColorMode = "white";
  } else {
    state.backgroundColorMode = "alpha";
  }
  updateColorControls();
}

function updateColorControls() {
  syncExportControlsFromColor();
  ui.particleColorButtons.forEach((button) => {
    const mode = button.dataset.particleColor;
    button.disabled = false;
    button.classList.toggle("is-active", mode === state.particleColorMode);
  });
  ui.backgroundColorButtons.forEach((button) => {
    const mode = button.dataset.bgColor;
    const disabled =
      (state.particleColorMode === "white" && mode === "white") ||
      (state.particleColorMode === "black" && mode === "black");
    button.disabled = disabled;
    button.classList.toggle("is-active", mode === state.backgroundColorMode);
  });
  updateColorGuides();
  renderParticleColorPreview();
  applyRenderBackground();
}

function updateColorGuides() {
  if (!ui.particleColorControl || !ui.particleOrb) return;
  if (!hasLoadedSource()) {
    ui.particleColorControl.style.setProperty("--particle-guide-opacity", "0");
    ui.particleColorControl.style.setProperty("--background-guide-opacity", "0");
    ui.particleColorControl.style.setProperty("--particle-guide-length", "0px");
    ui.particleColorControl.style.setProperty("--background-guide-length", "0px");
    return;
  }
  const controlRect = ui.particleColorControl.getBoundingClientRect();
  const orbRect = ui.particleOrb.getBoundingClientRect();
  if (!controlRect.width || !orbRect.width) return;

  const orbCenter = {
    x: orbRect.left - controlRect.left + orbRect.width / 2,
    y: orbRect.top - controlRect.top + orbRect.height / 2,
  };
  const orbRadius = orbRect.width / 2;

  const setGuide = (prefix, button, targetMode) => {
    const opacityName = `--${prefix}-guide-opacity`;
    if (!button) {
      ui.particleColorControl.style.setProperty(opacityName, "0");
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const buttonCenter = {
      x: buttonRect.left - controlRect.left + buttonRect.width / 2,
      y: buttonRect.top - controlRect.top + buttonRect.height / 2,
    };
    const dx = orbCenter.x - buttonCenter.x;
    const dy = orbCenter.y - buttonCenter.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      ui.particleColorControl.style.setProperty(opacityName, "0");
      return;
    }

    const unitX = dx / distance;
    const unitY = dy / distance;
    const buttonRadius = Math.max(buttonRect.width, buttonRect.height) / 2 + 4;
    const start = {
      x: buttonCenter.x + unitX * buttonRadius,
      y: buttonCenter.y + unitY * buttonRadius,
    };
    const end =
      targetMode === "particle"
        ? orbCenter
        : {
            x: orbCenter.x - unitX * (orbRadius - 2),
            y: orbCenter.y - unitY * (orbRadius - 2),
          };
    const length = Math.max(0, Math.hypot(end.x - start.x, end.y - start.y));
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    ui.particleColorControl.style.setProperty(`--${prefix}-guide-x`, `${start.x.toFixed(2)}px`);
    ui.particleColorControl.style.setProperty(`--${prefix}-guide-y`, `${start.y.toFixed(2)}px`);
    ui.particleColorControl.style.setProperty(`--${prefix}-guide-length`, `${length.toFixed(2)}px`);
    ui.particleColorControl.style.setProperty(`--${prefix}-guide-angle`, `${angle.toFixed(2)}deg`);
    ui.particleColorControl.style.setProperty(opacityName, length > 2 ? "1" : "0");
  };

  const particleButton = ui.particleColorButtons.find((button) => button.dataset.particleColor === state.particleColorMode);
  const backgroundButton = ui.backgroundColorButtons.find((button) => button.dataset.bgColor === state.backgroundColorMode);
  setGuide("particle", particleButton, "particle");
  setGuide("background", backgroundButton, "background");
}

function extractOriginalPalette() {
  const { width, height, sourceCtx } = process;
  let data;
  try {
    data = sourceCtx.getImageData(0, 0, width, height).data;
  } catch {
    return;
  }
  const rect = process.sourceContentRect || { x: 0, y: 0, width, height };
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(width, Math.ceil(rect.x + rect.width));
  const y1 = Math.min(height, Math.ceil(rect.y + rect.height));
  const depthMask = process.previousDepth;
  const hasDepthMask =
    hasLoadedSource() &&
    depthMask?.length === width * height &&
    depthMask.some((value) => value > 0.08);
  const buckets = new Map();
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalWeight = 0;
  const stepX = Math.max(1, Math.floor((x1 - x0) / 140));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 140));

  for (let y = y0; y < y1; y += stepY) {
    for (let x = x0; x < x1; x += stepX) {
      const p = (y * width + x) * 4;
      const index = y * width + x;
      const depthConfidence = hasDepthMask ? depthMask[index] : 1;
      if (hasDepthMask && depthConfidence < 0.16) continue;

      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const a = data[p + 3];
      if (a < 64) continue;

      const maxChannel = Math.max(r, g, b);
      const minChannel = Math.min(r, g, b);
      const saturation = maxChannel <= 0 ? 0 : (maxChannel - minChannel) / maxChannel;
      const luma = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
      const neutralPenalty = saturation < 0.08 && (luma > 0.88 || luma < 0.08) ? 0.18 : 1;
      const centerWeight =
        1 -
        Math.min(
          1,
          Math.hypot((x - (x0 + x1) * 0.5) / Math.max(1, x1 - x0), (y - (y0 + y1) * 0.5) / Math.max(1, y1 - y0)) *
            1.55,
        );
      const weight =
        (1 + saturation * 1.7 + centerWeight * 0.35 + depthConfidence * 1.8 + (1 - Math.abs(luma - 0.5) * 2) * 0.18) *
        neutralPenalty;
      const q = 28;
      const key = `${Math.min(255, Math.round(r / q) * q)},${Math.min(255, Math.round(g / q) * q)},${Math.min(255, Math.round(b / q) * q)}`;
      buckets.set(key, (buckets.get(key) || 0) + weight);
      totalR += r * weight;
      totalG += g * weight;
      totalB += b * weight;
      totalWeight += weight;
    }
  }

  const fallbackColor =
    totalWeight > 0
      ? rgbToHex(totalR / totalWeight, totalG / totalWeight, totalB / totalWeight)
      : EMPTY_ORIGINAL_PALETTE[0];
  const colors = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map((value) => clamp(Number(value), 0, 255));
      return rgbToHex(r, g, b);
    });
  while (colors.length < 10) colors.push(colors[colors.length % Math.max(1, colors.length)] || fallbackColor);
  state.originalPalette = colors.slice(0, 10);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function particlePreviewColors() {
  if (state.particleColorMode === "white") return ["#ffffff"];
  if (state.particleColorMode === "black") return ["#000000"];
  return state.originalPalette;
}

function currentParticleCount() {
  return points?.geometry?.attributes?.position?.count || 0;
}

function seeded(index, salt = 0) {
  return fract(Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453);
}

function renderParticleColorPreview() {
  if (!ui.particleColorPreview || !ui.particleOrb) return;
  const bg = state.backgroundColorMode;
  const isEmpty = !hasLoadedSource();
  ui.particleOrb.classList.toggle("is-alpha", bg === "alpha");
  ui.particleOrb.style.setProperty("--orb-bg", isEmpty || bg === "black" ? "#000000" : "#ffffff");
  ui.particleOrb.style.setProperty("--orb-text", isEmpty || bg === "black" || bg === "alpha" ? "#272727" : "#eeeeee");
  ui.particleOrb.classList.toggle("is-empty-preview", isEmpty);
  if (isEmpty) {
    ui.particleColorPreview.innerHTML = "";
    updateOrbCount(0);
    return;
  }
  const densityAmount = controlAmount("density");
  const pointAmount = controlAmount("pointSize");
  const count = Math.round(mixNumber(10, 20, densityAmount));
  const baseSize = mixNumber(2, 10, pointAmount);
  const colors = particlePreviewColors();
  ui.particleColorPreview.style.setProperty("--preview-blur", `${particleLookAmount().toFixed(2)}px`);
  updateOrbCount(currentParticleCount());
  ui.particleColorPreview.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const angle = seeded(i, 1.7) * Math.PI * 2;
    const radius = Math.sqrt(seeded(i, 2.9)) * 46;
    const dot = document.createElement("span");
    const randomSize = mixNumber(baseSize, mixNumber(2, 10, seeded(i, 3.7)), sizeRandomnessAmount());
    const alpha = mixNumber(1, mixNumber(0.1, 1, seeded(i, 4.1)), opacityRandomnessAmount());
    dot.className = "orb-dot";
    dot.style.left = `${50 + Math.cos(angle) * radius}px`;
    dot.style.top = `${50 + Math.sin(angle) * radius}px`;
    dot.style.width = `${randomSize}px`;
    dot.style.height = `${randomSize}px`;
    dot.style.setProperty("--dot-color", colors[i % colors.length]);
    dot.style.setProperty("--dot-alpha", alpha.toFixed(3));
    ui.particleColorPreview.appendChild(dot);
  }
}

function setExportFormat(format) {
  state.exportFormat = format;
  const labels = {
    webgl: '<span class="format-web-prefix">Web</span><span class="format-web-suffix gl">GL</span>',
    webm: '<span class="format-web-prefix">Web</span><span class="format-web-suffix m">M</span>',
    mp4: '<span class="format-plain">MP4</span>',
    png: '<span class="format-plain">PNG</span>',
  };
  ui.exportActiveLabel.innerHTML = labels[format] || labels.mp4;
  ui.exportActiveButton.classList.remove("export-webgl", "export-webm", "export-mp4", "export-png");
  ui.exportActiveButton.classList.add(`export-${format}`);
  [ui.exportWebglButton, ui.exportWebmButton, ui.exportMp4Button, ui.exportPngButton].forEach((button) => {
    button?.classList.toggle("is-current", button.dataset.format === format);
  });
}

function exportActiveFormat() {
  if (state.exportFormat === "png") {
    exportCurrentFrame();
  } else if (state.exportFormat === "webm") {
    exportEffectVideo("webm");
  } else if (state.exportFormat === "webgl") {
    exportWebglScenePackage();
  } else {
    exportEffectVideo("mp4");
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatCount(count) {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)}万`;
  }
  return `${count}`;
}

function updateOrbCount(count = 0) {
  if (!ui.orbCountMain || !ui.orbCountUnit) return;
  if (!hasLoadedSource()) {
    ui.orbCountMain.textContent = "0";
    ui.orbCountUnit.textContent = "k";
    return;
  }
  if (count <= 0) {
    ui.orbCountMain.textContent = "0";
    ui.orbCountUnit.textContent = "";
    return;
  }
  if (count >= 1000) {
    ui.orbCountMain.textContent = String(Math.round(count / 1000));
    ui.orbCountUnit.textContent = "k";
  } else {
    ui.orbCountMain.textContent = String(count);
    ui.orbCountUnit.textContent = "";
  }
}

function updateRangeProgress(input) {
  if (!input) return;
  const min = Number.parseFloat(input.min || "0");
  const max = Number.parseFloat(input.max || "1");
  const value = Number.parseFloat(input.value || "0");
  const amount = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const progress = `${clamp(amount, 0, 100)}%`;
  input.style.setProperty("--range-progress", progress);
  input.closest(".field")?.style.setProperty("--range-progress", progress);
}

function defaultSegmentFx() {
  return { ...DEFAULT_SEGMENT_FX };
}

function getTimelineFxForSlot(slot) {
  const normalized = normalizeSlot(slot);
  if (!timelineFxBySlot.has(normalized)) {
    timelineFxBySlot.set(normalized, defaultSegmentFx());
  }
  return timelineFxBySlot.get(normalized);
}

function getTimelineFxForIndex(index = currentTimelineVisualSegmentIndex()) {
  const clips = loadedMediaClips();
  const clip = clips[index] || clips[0];
  return getTimelineFxForSlot(clip?.slot || state.activeSlot || SLOT_IDS[0]);
}

function activeTimelineFxIndex() {
  return currentTimelineVisualSegmentIndex(timelineSegmentCount());
}

function timelineSegmentCount() {
  if (state.sourceMode === "sequence" && sequenceReady()) return mediaClipCount();
  const loadedCount = Math.min(5, mediaClipCount());
  return Math.max(1, loadedCount);
}

function ensureTimelineSegments(count) {
  if (!ui.timelineSegments) return [];
  const current = Number.parseInt(ui.timelineSegments.dataset.count || "0", 10);
  if (current !== count) {
    const segments = Array.from({ length: count }, () => {
      const segment = document.createElement("span");
      segment.className = "timeline-segment";
      segment.style.setProperty("--segment-fill", "0");
      return segment;
    });
    ui.timelineSegments.replaceChildren(...segments);
    ui.timelineSegments.dataset.count = String(count);
  }
  return Array.from(ui.timelineSegments.children);
}

function updateTimelineDisplay(progress) {
  if (!ui.timelineWrap || !ui.timelineSegments) return;
  const safeProgress = clamp(Number.isFinite(progress) ? progress : state.scrub, 0, 1);
  const count = timelineSegmentCount();
  const segments = ensureTimelineSegments(count);
  ui.timelineWrap.style.setProperty("--timeline-progress", safeProgress.toFixed(5));
  ui.timelineWrap.classList.toggle("is-multi", count > 1);
  ui.timelineWrap.classList.toggle("is-single", count <= 1);

  segments.forEach((segment, index) => {
    const fill = clamp(safeProgress * count - index, 0, 1);
    segment.style.setProperty("--segment-fill", fill.toFixed(4));
  });

  if (ui.timelineSegmentLabel) {
    const activeSegment = Math.min(count, Math.max(1, Math.floor(safeProgress * count) + 1));
    ui.timelineSegmentLabel.textContent = count > 1 ? String(activeSegment) : "";
  }
  positionFxNodes();
}

function snapFxValue(value) {
  const stepped = Math.round(clamp(value, 0, 1) / FX_SNAP_STEP) * FX_SNAP_STEP;
  return Number(clamp(stepped, 0, 1).toFixed(1));
}

function constrainedSnapFxValue(value, min = 0, max = 1) {
  return snapFxValue(clamp(value, min, max));
}

function currentTimelineVisualSegmentIndex(count = timelineSegmentCount()) {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor(clamp(state.scrub) * count)));
}

function fxTrackMetrics() {
  const count = timelineSegmentCount();
  const rect = ui.timelineFxTrack?.getBoundingClientRect();
  const width = Math.max(1, rect?.width || 1);
  const gap = count > 1 ? 4 : 0;
  const segmentWidth = Math.max(1, (width - gap * Math.max(0, count - 1)) / count);
  return { count, gap, segmentWidth, width };
}

function fxNodeLeft(value, segmentIndex = activeTimelineFxIndex()) {
  const { count, gap, segmentWidth } = fxTrackMetrics();
  const index = Math.min(count - 1, Math.max(0, segmentIndex));
  return index * (segmentWidth + gap) + clamp(value) * segmentWidth;
}

function positionFxNodes() {
  if (!ui.timelineFxTrack) return;
  const nodes = Array.from(ui.timelineFxTrack.querySelectorAll(".fx-node"));
  ui.timelineFxTrack.classList.toggle("is-multi", timelineSegmentCount() > 1);
  nodes.forEach((node) => {
    const key = node.dataset.fxNode;
    const segmentIndex = Number.parseInt(node.dataset.segmentIndex || "0", 10);
    const fx = getTimelineFxForIndex(segmentIndex);
    if (!key || !(key in fx)) return;
    node.style.setProperty("--fx-node-left", `${fxNodeLeft(fx[key], segmentIndex).toFixed(2)}px`);
  });
}

function ensureFxSegments(count) {
  if (!ui.timelineFxSegments) return [];
  const current = Number.parseInt(ui.timelineFxSegments.dataset.count || "0", 10);
  if (current !== count) {
    const parts = Array.from({ length: count }, () => {
      const part = document.createElement("span");
      part.className = "fx-part";
      ["pre", "assemble", "dissolve", "post"].forEach((name) => {
        const zone = document.createElement("span");
        zone.className = `fx-zone fx-zone-${name}`;
        part.appendChild(zone);
      });
      return part;
    });
    ui.timelineFxSegments.replaceChildren(...parts);
    ui.timelineFxSegments.dataset.count = String(count);
    ui.timelineFxTrack?.querySelectorAll(".fx-node").forEach((node) => node.remove());
    if (ui.timelineFxTrack && ui.fxTicks) {
      const nodes = [];
      for (let index = 0; index < count; index += 1) {
        ["assembleEnd", "dissolveStart"].forEach((key) => {
          const node = document.createElement("button");
          node.className = "fx-node";
          node.dataset.fxNode = key;
          node.dataset.segmentIndex = String(index);
          node.type = "button";
          const label = document.createElement("span");
          node.appendChild(label);
          nodes.push(node);
        });
      }
      ui.timelineFxTrack.insertBefore(document.createDocumentFragment(), ui.fxTicks);
      const fragment = document.createDocumentFragment();
      nodes.forEach((node) => fragment.appendChild(node));
      ui.timelineFxTrack.insertBefore(fragment, ui.fxTicks);
      ui.fxNodes = nodes;
    }
  }
  return Array.from(ui.timelineFxSegments.children);
}

function syncFxSegments() {
  const count = timelineSegmentCount();
  const parts = ensureFxSegments(count);

  parts.forEach((part, index) => {
    const fx = getTimelineFxForIndex(index);
    const assembleWidth = fx.assembleEnd * 100;
    const dissolveStart = fx.dissolveStart * 100;
    const dissolveWidth = Math.max(0, 1 - fx.dissolveStart) * 100;
    const pre = part.querySelector(".fx-zone-pre");
    const assemble = part.querySelector(".fx-zone-assemble");
    const dissolve = part.querySelector(".fx-zone-dissolve");
    const post = part.querySelector(".fx-zone-post");
    if (pre) {
      pre.style.left = "0%";
      pre.style.width = "0%";
    }
    if (assemble) {
      assemble.style.left = "0%";
      assemble.style.width = `${assembleWidth.toFixed(2)}%`;
    }
    if (dissolve) {
      dissolve.style.left = `${dissolveStart.toFixed(2)}%`;
      dissolve.style.width = `${dissolveWidth.toFixed(2)}%`;
    }
    if (post) {
      post.style.left = "100%";
      post.style.width = "0%";
    }
  });
}

function syncFxTicks() {
  if (!ui.fxTicks) return;
  const count = timelineSegmentCount();
  const current = Number.parseInt(ui.fxTicks.dataset.count || "0", 10);
  if (current !== count) {
    ui.fxTicks.replaceChildren(
      ...Array.from({ length: count }, () => {
        const group = document.createElement("span");
        group.className = "fx-tick-group";
        group.replaceChildren(
          ...Array.from({ length: 11 }, (_, index) => {
            const tick = document.createElement("span");
            tick.className = "fx-tick";
            tick.style.left = `${index * 10}%`;
            return tick;
          }),
        );
        return group;
      }),
    );
    ui.fxTicks.dataset.count = String(count);
  }
  ui.fxTicks.classList.toggle("is-multi", count > 1);
  Array.from(ui.fxTicks.querySelectorAll(".fx-tick-group")).forEach((group, segmentIndex) => {
    const fx = getTimelineFxForIndex(segmentIndex);
    const selected = hasLoadedSource()
      ? new Set([Math.round(fx.assembleEnd * 10), Math.round(fx.dissolveStart * 10)])
      : new Set();
    Array.from(group.querySelectorAll(".fx-tick")).forEach((tick, tickIndex) => {
      tick.classList.toggle("is-selected", selected.has(tickIndex));
    });
  });
}

function setTimelineFxNode(key, value, segmentIndex = activeTimelineFxIndex()) {
  const fx = getTimelineFxForIndex(segmentIndex);
  if (key === "assembleEnd") {
    fx.assembleEnd = constrainedSnapFxValue(value, 0, 1 - FX_MIN_HOLD);
    if (fx.dissolveStart < fx.assembleEnd + FX_MIN_HOLD) {
      fx.dissolveStart = constrainedSnapFxValue(fx.assembleEnd + FX_MIN_HOLD, FX_MIN_HOLD, 1);
    }
  } else if (key === "dissolveStart") {
    fx.dissolveStart = constrainedSnapFxValue(value, FX_MIN_HOLD, 1);
    if (fx.assembleEnd > fx.dissolveStart - FX_MIN_HOLD) {
      fx.assembleEnd = constrainedSnapFxValue(fx.dissolveStart - FX_MIN_HOLD, 0, 1 - FX_MIN_HOLD);
    }
  }
  syncTimelineFxPanel();
}

function timelineFxLabel(key, segmentIndex = activeTimelineFxIndex()) {
  const fx = getTimelineFxForIndex(segmentIndex);
  if (key === "assembleEnd") return String(Math.round(fx.assembleEnd * 10));
  if (key === "dissolveStart") return String(Math.round((1 - fx.dissolveStart) * 10));
  return "";
}

function syncTimelineFxPanel() {
  if (!ui.timelineFxPanel) return;
  ui.timelineFxPanel.classList.toggle("is-empty-fx", !hasLoadedSource());
  syncFxSegments();
  syncFxTicks();
  const nodes = Array.from(ui.timelineFxTrack?.querySelectorAll(".fx-node") || []);
  nodes.forEach((node) => {
    const key = node.dataset.fxNode;
    const segmentIndex = Number.parseInt(node.dataset.segmentIndex || "0", 10);
    node?.querySelector("span")?.replaceChildren(timelineFxLabel(key, segmentIndex));
  });
  const activeIndex = activeTimelineFxIndex();
  const activeClip = loadedMediaClips()[activeIndex];
  const activeFx = getTimelineFxForIndex(activeIndex);
  const baseDuration = Math.max(0.001, activeClip?.duration || state.duration || DEFAULT_DURATION);
  setRangeValue("assembleDuration", activeFx.assembleEnd * baseDuration);
  setRangeValue("dissolveDuration", (1 - activeFx.dissolveStart) * baseDuration);
  positionFxNodes();
}

function bindTimelineFxPanel() {
  if (!ui.timelineFxTrack) return;
  let activeNode = null;
  const valueFromPointer = (event, segmentIndex) => {
    const rect = ui.timelineFxTrack.getBoundingClientRect();
    const { count, gap, segmentWidth } = fxTrackMetrics();
    const index = Math.min(count - 1, Math.max(0, segmentIndex));
    const segmentLeft = index * (segmentWidth + gap);
    return clamp((event.clientX - rect.left - segmentLeft) / segmentWidth);
  };
  const move = (event) => {
    if (!activeNode) return;
    event.preventDefault();
    setTimelineFxNode(activeNode.key, valueFromPointer(event, activeNode.segmentIndex), activeNode.segmentIndex);
  };
  const stop = () => {
    activeNode = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };
  ui.timelineFxTrack.addEventListener("pointerdown", (event) => {
    const button = event.target.closest?.(".fx-node");
    if (!button) return;
    activeNode = {
      key: button.dataset.fxNode,
      segmentIndex: Number.parseInt(button.dataset.segmentIndex || "0", 10),
    };
    button.setPointerCapture?.(event.pointerId);
    move(event);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  });
  syncTimelineFxPanel();
}

function setButtonIcon(button, iconName) {
  if (button) button.dataset.icon = iconName;
}

function setButtonText(target, text) {
  if (target) {
    target.textContent = text;
  }
}

function recordingControls() {
  return Array.from(document.querySelectorAll("button, input, select, textarea"));
}

function setControlsDisabledForRecording(disabled) {
  if (disabled) {
    state.recordingDisabledControls = new Map();
    recordingControls().forEach((control) => {
      state.recordingDisabledControls.set(control, control.disabled);
      control.disabled = true;
    });
    return;
  }

  state.recordingDisabledControls?.forEach((wasDisabled, control) => {
    control.disabled = wasDisabled;
  });
  state.recordingDisabledControls = null;
  updateColorControls();
}

function setRecordingState(recording) {
  state.recording = recording;
  document.body.classList.toggle("is-recording", recording);
  runtimeMessage.classList.toggle("is-recording", recording);

  if (recording) {
    runtimeMessage.hidden = false;
    runtimeMessage.textContent = "录制中";
    ui.depthStatus.textContent = "录制";
    setButtonIcon(ui.playButton, "record");
    ui.playButtonText.textContent = "录制中";
    setControlsDisabledForRecording(true);
    return;
  }

  setControlsDisabledForRecording(false);
  if (runtimeMessage.textContent === "录制中") {
    runtimeMessage.hidden = true;
  }
  ui.depthStatus.textContent = "实时";
  setButtonIcon(ui.playButton, state.playing ? "pause" : "play");
  ui.playButtonText.textContent = state.playing ? "暂停" : "播放";
}

function getParticleTarget() {
  const width = Math.min(window.innerWidth, 1600);
  const base = width < 720 ? 28000 : width < 1100 ? 68000 : 100000;
  const cores = navigator.hardwareConcurrency || 4;
  const cap = cores < 4 || width < 720 ? 70000 : width < 1100 ? 135000 : 205000;
  const retinaFactor = (window.devicePixelRatio || 1) >= 2 ? 0.82 : 1;
  return Math.round(Math.min(cap, base * densityValue() * retinaFactor));
}

function buildGeometry() {
  const target = getParticleTarget();
  const aspect = process.width / process.height;
  const columns = Math.max(64, Math.round(Math.sqrt(target * aspect)));
  const rows = Math.max(64, Math.round(columns / aspect));
  const count = columns * rows;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const seeds = new Float32Array(count);

  let p = 0;
  let u = 0;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const baseH = (x + 0.5) / columns;
      const baseV = (y + 0.5) / rows;
      const seed = fract(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453);
      const seedB = fract(Math.sin((x + 1) * 39.3468 + (y + 1) * 11.1351) * 24634.6345);
      const seedC = fract(Math.sin((x + 1) * 73.1562 + (y + 1) * 52.2358) * 12414.7142);
      const h = clamp(baseH + (seed - 0.5) * 0.92 / columns);
      const v = clamp(baseV + (seedB - 0.5) * 0.92 / rows);
      positions[p] = h - 0.5;
      positions[p + 1] = 0.5 - v;
      positions[p + 2] = 0;
      uvs[u] = h;
      uvs[u + 1] = v;
      seeds[p / 3] = seedC;
      p += 3;
      u += 2;
    }
  }

  const nextGeometry = new THREE.BufferGeometry();
  nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  nextGeometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
  nextGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  if (points) {
    scene.remove(points);
    geometry?.dispose();
  }

  geometry = nextGeometry;
  points = new THREE.Points(geometry, material);
  scene.add(points);
  ui.particleCount.textContent = formatCount(count);
  updateOrbCount(count);
}

function fract(value) {
  return value - Math.floor(value);
}

function resizeRenderer() {
  const rect = webglCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, width < 720 ? 1.25 : 1.6);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  uniforms.uPixelRatio.value = pixelRatio;

  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
  const visibleWidth = visibleHeight * camera.aspect;
  const gridDistance = camera.position.z - gridPlane.position.z;
  const gridHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * gridDistance;
  const gridWidth = gridHeight * camera.aspect;
  gridPlane.scale.set(gridWidth, gridHeight, 1);
  gridUniforms.uGridCount.value.set(Math.max(12, width / 18), Math.max(12, height / 18));

  const sourceAspect = process.width / process.height;
  let planeWidth = visibleWidth * PARTICLE_PREVIEW_FIT;
  let planeHeight = planeWidth / sourceAspect;
  if (planeHeight > visibleHeight * PARTICLE_PREVIEW_FIT) {
    planeHeight = visibleHeight * PARTICLE_PREVIEW_FIT;
    planeWidth = planeHeight * sourceAspect;
  }
  uniforms.uPlaneScale.value.set(planeWidth, planeHeight);

  buildGeometry();
}

function getClip(slot) {
  const media = getSlotMedia(slot);
  return {
    ...media,
    loaded: Boolean(media?.url),
  };
}

function sequenceReady() {
  return mediaClipCount() > 1;
}

function sequenceTotalDuration() {
  const clips = loadedMediaClips();
  if (!clips.length) return DEFAULT_DURATION;
  if (clips.length === 1) return clips[0].duration || DEFAULT_DURATION;
  return clips.reduce((total, clip) => total + Math.max(0.001, clip.duration || DEFAULT_DURATION), 0);
}

function sequenceStartForSlot(slot) {
  const target = normalizeSlot(slot);
  let cursor = 0;
  const clips = loadedMediaClips();
  for (const clip of clips) {
    if (clip.slot === target) return cursor;
    cursor += Math.max(0.001, clip.duration || DEFAULT_DURATION);
  }
  return 0;
}

function focusTimelineOnSlot(slot) {
  const target = normalizeSlot(slot);
  if (state.sourceMode === "sequence") {
    refreshSequenceDuration();
    state.elapsed = clamp(sequenceStartForSlot(target), 0, Math.max(0, state.duration - 0.001));
  } else {
    state.elapsed = 0;
  }
  state.scrub = state.duration > 0 ? clamp(state.elapsed / state.duration) : 0;
  state.effectTime = state.elapsed;
}

function refreshSequenceDuration() {
  if (state.sourceMode === "sequence" || sequenceReady()) {
    state.duration = Math.max(0.01, sequenceTotalDuration());
    state.scrub = clamp(state.elapsed / state.duration);
  }
}

function getSequenceSegment(time = state.elapsed) {
  const safeTime = clamp(time, 0, Math.max(0.01, state.duration - 0.001));
  const clips = loadedMediaClips();

  if (!clips.length) {
    return { type: "empty", slot: "a", localTime: 0, key: "empty" };
  }

  if (clips.length === 1) {
    return {
      type: "clip",
      slot: clips[0].slot,
      localTime: clamp(safeTime, 0, Math.max(0, clips[0].duration - 0.04)),
      key: `clip-${clips[0].slot}`,
      index: 0,
    };
  }

  let cursor = 0;
  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index];
    const clipDuration = Math.max(0.001, clip.duration || DEFAULT_DURATION);
    const clipEnd = cursor + clipDuration;

    if (safeTime < clipEnd || index === clips.length - 1) {
      return {
        type: "clip",
        slot: clip.slot,
        localTime: clamp(safeTime - cursor, 0, Math.max(0, clipDuration - 0.04)),
        key: `clip-${clip.slot}`,
        index,
      };
    }

    cursor = clipEnd;
  }

  const last = clips[clips.length - 1];
  return {
    type: "clip",
    slot: last.slot,
    localTime: Math.max(0, (last.duration || DEFAULT_DURATION) - 0.04),
    key: `clip-${last.slot}`,
    index: clips.length - 1,
  };
}

function pauseInactiveVideos(activeVideo = null) {
  const videos = new Set([sourceVideo, sourceVideoB, ...SLOT_IDS.map((slot) => getSlotMedia(slot)?.video).filter(Boolean)]);
  videos.forEach((video) => {
    if (video !== activeVideo) {
      video.pause();
    }
  });
}

function requestVideoTime(video, time, tolerance = 0.08) {
  if (!video || video.readyState < 1 || !Number.isFinite(time)) return;
  const maxTime = Math.max(0, (Number.isFinite(video.duration) ? video.duration : time) - 0.04);
  const next = clamp(time, 0, maxTime);
  if (Math.abs((video.currentTime || 0) - next) > tolerance) {
    video.currentTime = next;
  }
}

function syncSequencePlayback() {
  if (state.sourceMode !== "sequence") {
    const media = state.sourceMode === "video" ? singleMediaClip() : null;
    pauseInactiveVideos(media?.video || null);
    return;
  }
  const segment = getSequenceSegment();
  const clip = getClip(segment.slot);
  if (clip.type === "video") {
    requestVideoTime(clip.video, segment.localTime, segment.type === "transition" ? 0.02 : 0.18);
  }
  if (segment.type === "transition" || !state.playing || !state.autoPlay || clip.type !== "video") {
    pauseInactiveVideos();
    return;
  }

  pauseInactiveVideos(clip.video);
  clip.video.play().catch(() => {});
}

function setPlaying(nextPlaying) {
  state.playing = nextPlaying;
  if (state.sourceMode === "sequence") {
    syncSequencePlayback();
  } else if (state.sourceMode === "video") {
    const media = singleMediaClip();
    const video = media?.video || sourceVideo;
    if (nextPlaying && state.autoPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    pauseInactiveVideos(video);
  } else {
    pauseInactiveVideos();
  }

  setButtonIcon(ui.playButton, nextPlaying ? "pause" : "play");
  ui.playButtonText.textContent = nextPlaying ? "暂停" : "播放";
}

async function resumePlaybackAfterUpload(slot) {
  const target = normalizeSlot(slot);
  state.autoPlay = true;
  state.transitionMode = 0;
  state.transitionProgress = 0;
  state.transitionBlend = 0;

  if (state.sourceMode === "sequence") {
    focusTimelineOnSlot(target);
    await seekSequence(state.elapsed);
  } else if (state.sourceMode === "video") {
    const media = singleMediaClip();
    if (media?.video) await seekVideo(media.video, 0);
    state.elapsed = 0;
    state.scrub = 0;
    state.effectTime = 0;
  } else {
    state.elapsed = 0;
    state.scrub = 0;
    state.effectTime = 0;
    state.rotation = 0;
  }

  setPlaying(true);
  syncSequencePlayback();
  drawSourceFrame(performance.now());
  generateDepthFrame(performance.now(), true);
  extractOriginalPalette();
  updateColorControls();
  updateUniforms();
  updateHud();
}

function drawImageFrame() {
  const media = singleMediaClip();
  const image = media?.image || sourceImage;
  if (!image.complete || !image.naturalWidth) return;
  drawMediaContain(image, image.naturalWidth / image.naturalHeight, "#ffffff");
}

function drawMediaContain(media, mediaAspect, fill = "#ffffff") {
  const ctx = process.sourceCtx;
  const { width, height } = process;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);

  const canvasAspect = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (mediaAspect > canvasAspect) {
    drawWidth = width;
    drawHeight = width / mediaAspect;
  } else {
    drawHeight = height;
    drawWidth = height * mediaAspect;
  }
  const x = (width - drawWidth) * 0.5;
  const y = (height - drawHeight) * 0.5;
  process.sourceContentRect = { x, y, width: drawWidth, height: drawHeight };
  ctx.drawImage(media, x, y, drawWidth, drawHeight);
  sourceTexture.needsUpdate = true;
}

function applySegmentFxPhase(localTime, duration, segmentIndex = activeTimelineFxIndex()) {
  const safeDuration = Math.max(0.001, duration || DEFAULT_DURATION);
  const progress = clamp(localTime / safeDuration);
  const fx = getTimelineFxForIndex(segmentIndex);
  const assembleEnd = fx.assembleEnd;
  const dissolveStart = Math.max(assembleEnd + FX_MIN_HOLD, fx.dissolveStart);

  if (assembleEnd > 0 && progress < assembleEnd) {
    const phase = progress / assembleEnd;
    state.transitionMode = 2;
    state.transitionProgress = phase;
    state.transitionBlend = 1 - smoothstep(0.72, 1, phase);
    return;
  }

  if (progress >= dissolveStart) {
    const phase = dissolveStart >= 1 ? 0 : (progress - dissolveStart) / (1 - dissolveStart);
    state.transitionMode = 1;
    state.transitionProgress = phase;
    state.transitionBlend = smoothstep(0, 0.28, phase);
    return;
  }

  state.transitionMode = 0;
  state.transitionProgress = 0;
  state.transitionBlend = 0;
}

function drawSourceFrame(now) {
  const ctx = process.sourceCtx;
  const { width, height } = process;

  state.transitionMode = 0;
  state.transitionProgress = 0;
  state.transitionBlend = 0;

  if (state.sourceMode === "sequence") {
    const segment = getSequenceSegment();
    const clip = getClip(segment.slot);
    state.activeSegmentKey = segment.key;
    state.activeClipType = clip.type || "empty";
    if (segment.type === "transition") {
      state.transitionMode = segment.mode;
      state.transitionProgress = segment.progress;
      state.transitionBlend = 1;
    }
    if (clip.type === "video") {
      requestVideoTime(clip.video, segment.localTime, segment.type === "transition" ? 0.02 : 0.18);
    }
    const drawable = mediaDrawable(clip);
    if (drawable) {
      drawMediaContain(drawable, clip.aspect, "#ffffff");
    }
    if (segment.type !== "transition") {
      applySegmentFxPhase(segment.localTime, clip.duration, segment.index);
    }
    state.scrub = state.duration > 0 ? clamp(state.elapsed / state.duration) : 0;
    state.effectTime = state.elapsed;
  } else if (state.sourceMode === "video") {
    state.activeClipType = "video";
    const media = singleMediaClip();
    if (media?.video?.readyState >= 2) {
      state.duration = Number.isFinite(media.video.duration) ? media.video.duration : state.duration;
      if (state.playing && state.autoPlay) {
        requestVideoTime(media.video, state.elapsed, 0.18);
      } else {
        state.elapsed = media.video.currentTime || state.elapsed;
      }
      drawMediaContain(media.video, media.aspect, "#ffffff");
      applySegmentFxPhase(state.elapsed, state.duration, 0);
      state.scrub = state.duration > 0 ? clamp(state.elapsed / state.duration) : 0;
      state.effectTime = state.elapsed;
    }
  } else if (state.sourceMode === "image") {
    state.activeClipType = "image";
    drawImageFrame();
    applySegmentFxPhase(state.elapsed, state.duration, 0);
    state.scrub = state.duration > 0 ? clamp(state.elapsed / state.duration) : 0;
    state.effectTime = state.elapsed;
  } else if (state.sourceMode === "empty") {
    state.activeClipType = "empty";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    process.sourceContentRect = { x: 0, y: 0, width, height };
    sourceTexture.needsUpdate = true;
    state.scrub = 0;
  }
}

function getRecipeWeights(recipe) {
  switch (recipe) {
    case "subject":
      return { luma: 0.9, local: 0.3, radial: 0.18, vertical: 0.04, edge: 0.52, contrast: 1.26 };
    case "edges":
      return { luma: 0.42, local: 0.48, radial: 0.03, vertical: 0.01, edge: 1.18, contrast: 1.48 };
    case "luma":
      return { luma: 1.05, local: 0.24, radial: 0.04, vertical: 0.01, edge: 0.38, contrast: 1.2 };
    default:
      return { luma: 0.84, local: 0.34, radial: 0.15, vertical: 0.03, edge: 0.62, contrast: 1.2 };
  }
}

function generateDepthFrame(now, force = false) {
  if (state.sourceMode === "empty") {
    process.depthCtx.fillStyle = "#0f0e12";
    process.depthCtx.fillRect(0, 0, process.width, process.height);
    depthTexture.needsUpdate = true;
    ui.depthMeter.textContent = `${process.width} x ${process.height}`;
    return;
  }

  const depthInterval = state.playing ? DEPTH_INTERVAL_PLAYING : DEPTH_INTERVAL_IDLE;
  if (!force && now - process.lastDepthAt < depthInterval) {
    return;
  }
  process.lastDepthAt = now;

  const { width, height, sourceCtx, depthCtx, luma, rawDepth, previousDepth, depthPixels } = process;
  let sourceData;
  try {
    sourceData = sourceCtx.getImageData(0, 0, width, height);
  } catch {
    if (!state.frameReadBlocked) {
      state.frameReadBlocked = true;
      setUploadStatus("浏览器阻止读取这个视频帧。跨域视频需要 CORS；本地文件请用上传/拖拽。", "error");
      showMessage("无法从该视频生成深度图：视频源没有允许 Canvas 读取像素。请上传本地文件，或使用同源/CORS 视频 URL。");
    }
    return;
  }
  const sourcePixels = sourceData.data;
  const output = depthPixels.data;
  const depthAmount = depthStrengthAmount();
  const weights = getRecipeWeights("balanced");
  const depthCurve = smoothstep(0, 1, depthAmount);
  const foregroundScale = mixNumber(0.82, 1.52, depthCurve);
  const edgeScale = mixNumber(0.28, 0.78, depthCurve);
  const subjectPriorScale = mixNumber(0.12, 0.72, depthCurve);
  const mapContrast = mixNumber(0.92, 3.1, depthCurve);
  const localContrastScale = mixNumber(1, 1.34, depthCurve);
  const previewGamma = mixNumber(1.08, 0.46, depthCurve);
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const maxDistance = Math.hypot(centerX, centerY);

  for (let i = 0, p = 0; i < luma.length; i += 1, p += 4) {
    luma[i] = (sourcePixels[p] * 0.2126 + sourcePixels[p + 1] * 0.7152 + sourcePixels[p + 2] * 0.0722) / 255;
  }

  let borderTotal = 0;
  let borderCount = 0;
  for (let x = 0; x < width; x += 1) {
    borderTotal += luma[x] + luma[(height - 1) * width + x];
    borderCount += 2;
  }
  for (let y = 1; y < height - 1; y += 1) {
    borderTotal += luma[y * width] + luma[y * width + width - 1];
    borderCount += 2;
  }
  const backgroundLuma = borderTotal / Math.max(1, borderCount);

  let minDepth = Number.POSITIVE_INFINITY;
  let maxDepth = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const right = y * width + Math.min(width - 1, x + 1);
      const left = y * width + Math.max(0, x - 1);
      const down = Math.min(height - 1, y + 1) * width + x;
      const up = Math.max(0, y - 1) * width + x;
      const edge = Math.min(
        1,
        Math.abs(luma[right] - luma[left]) * 4.8 + Math.abs(luma[down] - luma[up]) * 4.8,
      );
      const neighborhood = (luma[left] + luma[right] + luma[up] + luma[down]) * 0.25;
      const localContrast = Math.min(1, Math.abs(luma[index] - neighborhood) * 8.5 + edge * 0.42);
      const dx = x - centerX;
      const dy = (y - centerY) * 1.12;
      const radial = 1 - clamp(Math.hypot(dx, dy) / maxDistance);
      const vertical = 1 - y / (height - 1);
      const floorPull = 0;
      const backgroundDelta = Math.abs(luma[index] - backgroundLuma);
      const foreground = clamp((backgroundDelta * 2.35 + localContrast * 0.16 * localContrastScale) * foregroundScale);
      const nx = (x - centerX) / Math.max(1, width * 0.5);
      const ny = (y - height * 0.44) / Math.max(1, height * 0.58);
      const subjectOval = Math.pow(clamp(1 - Math.hypot(nx * 0.82, ny * 1.12)), 1.85);
      const shoulderBand = Math.pow(clamp(1 - Math.abs(y / Math.max(1, height - 1) - 0.62) / 0.32), 2.2) * clamp(1 - Math.abs(nx) * 0.7);
      const subjectRegion = Math.max(subjectOval, shoulderBand * 0.52);
      const subjectPrior = subjectRegion * (0.18 + foreground * 0.86 + localContrast * 0.12);
      const foregroundConfidence = clamp(foreground * 0.96 + localContrast * 0.2 + subjectRegion * 0.18);
      const backgroundSuppression = smoothstep(0.16, 0.42, foregroundConfidence);
      const frameFade =
        smoothstep(0, width * 0.035, x) *
        smoothstep(0, width * 0.035, width - 1 - x) *
        smoothstep(0, height * 0.035, y) *
        smoothstep(0, height * 0.035, height - 1 - y);

      let depth =
        foreground * weights.luma +
        localContrast * weights.local +
        radial * weights.radial * (0.18 + foreground * 0.82) +
        vertical * weights.vertical * foreground +
        subjectPrior * subjectPriorScale +
        Math.pow(edge, 0.62) * weights.edge * state.edgeLift * edgeScale +
        floorPull;
      depth *= backgroundSuppression * frameFade;
      rawDepth[index] = depth;
      minDepth = Math.min(minDepth, depth);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  const range = Math.max(0.0001, maxDepth - minDepth);
  const targetLow = minDepth + range * 0.055;
  const targetHigh = maxDepth - range * 0.025;
  if (force || process.normLow === null || process.normHigh === null) {
    process.normLow = targetLow;
    process.normHigh = targetHigh;
  } else {
    const adapt = state.playing ? 0.07 : 0.22;
    process.normLow += (targetLow - process.normLow) * adapt;
    process.normHigh += (targetHigh - process.normHigh) * adapt;
  }
  if (process.normHigh - process.normLow < 0.0001) {
    process.normLow = targetLow;
    process.normHigh = targetHigh;
  }
  const low = process.normLow;
  const high = process.normHigh;
  const normRange = Math.max(0.0001, high - low);
  let pivotWeight = 0;
  let pivotX = 0;
  let pivotZ = 0;

  for (let index = 0; index < rawDepth.length; index += 1) {
    let depth = clamp((rawDepth[index] - low) / normRange);
    depth = smoothstep(mixNumber(0.08, 0.035, depthCurve), mixNumber(0.92, 0.82, depthCurve), depth);
    depth = clamp((depth - 0.5) * weights.contrast * mapContrast + 0.5);
    depth = mix(depth, Math.pow(depth, mixNumber(1.08, 0.74, depthCurve)), depthCurve * 0.72);

    const temporal = state.playing ? 0.58 : 0.18;
    depth = previousDepth[index] * temporal + depth * (1 - temporal);
    previousDepth[index] = depth;

    if (state.invertDepth) {
      depth = 1 - depth;
    }

    if (activeClipIsImage()) {
      const mask = Math.pow(smoothstep(0.18, 0.62, depth), 2.2);
      if (mask > 0.0001) {
        const x = index % width;
        const textureDepth = Math.pow(clamp(Math.pow(depth, previewGamma)), Math.max(state.depthGamma, 0.001));
        const depthLayer = smoothstep(0.05, 0.96, textureDepth);
        const portraitVolume = Math.pow(depthLayer, 0.78);
        const z = (portraitVolume - 0.5) * (depthStrengthValue() * 0.86) * 1.38;
        pivotWeight += mask;
        pivotX += (((x + 0.5) / width) - 0.5) * mask;
        pivotZ += z * mask;
      }
    }

    const p = index * 4;
    const value = Math.round(Math.pow(depth, previewGamma) * 255);
    output[p] = value;
    output[p + 1] = value;
    output[p + 2] = value;
    output[p + 3] = 255;
  }

  if (activeClipIsImage() && pivotWeight > 1) {
    state.imagePivotX = clamp(pivotX / pivotWeight, -0.5, 0.5);
    state.imagePivotZ = clamp(pivotZ / pivotWeight, -1.5, 1.5);
  } else if (!activeClipIsImage()) {
    state.imagePivotX = 0;
    state.imagePivotZ = 0;
  }

  depthCtx.putImageData(depthPixels, 0, 0);
  depthTexture.needsUpdate = true;
  ui.depthMeter.textContent = `${width} x ${height}`;
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function updateUniforms() {
  uniforms.uEffectTime.value = state.effectTime;
  uniforms.uDepthStrength.value = depthStrengthValue() * 0.92;
  uniforms.uDepthGamma.value = state.depthGamma;
  uniforms.uPointSize.value = pointSizeValue();
  uniforms.uOpacityRandomness.value = opacityRandomnessAmount();
  uniforms.uStaticSource.value = state.sourceMode === "empty" ? 0 : 1;
  uniforms.uThreshold.value = mixNumber(0.38, 0.24, depthStrengthAmount());
  uniforms.uSourcePull.value = state.sourcePull;
  uniforms.uAssembleDuration.value = state.assembleDuration;
  uniforms.uDissolveDuration.value = state.dissolveDuration;
  uniforms.uTransitionMode.value = state.transitionMode;
  uniforms.uTransitionProgress.value = state.transitionProgress;
  uniforms.uTransitionBlend.value = state.transitionBlend;
  uniforms.uSizeRandomness.value = sizeRandomnessAmount();
  uniforms.uParticleSoftness.value = state.particleSoftness;
  uniforms.uScatterAmount.value = state.scatterAmount;
  uniforms.uLagSpread.value = state.lagSpread;
  uniforms.uHoldDuration.value = state.holdDuration;
  uniforms.uInvert.value = state.invertDepth ? 1 : 0;
  uniforms.uTunnelAmount.value = state.sourceMode === "empty" ? 0 : mixNumber(0.12, 0.86, state.flowLook);
  uniforms.uImageMode.value = activeClipIsImage() ? 1 : 0;
  uniforms.uImageRotation.value = activeClipIsImage() ? state.rotation : 0;
  uniforms.uImagePivot.value.set(state.imagePivotX, state.imagePivotZ);
  uniforms.uParticleColorMode.value = particleModeValue();
  setColorObject(uniforms.uSolidParticleColor.value, solidParticleHex());
  state.originalPalette.forEach((hex, index) => {
    if (uniforms.uPalette.value[index]) {
      setColorObject(uniforms.uPalette.value[index], hex);
    }
  });
}

function updateHud() {
  const single = singleMediaClip();
  const current =
    state.sourceMode === "sequence"
      ? state.elapsed
      : state.sourceMode === "video"
        ? single?.video?.currentTime || 0
        : state.scrub * state.duration;
  ui.timeLabel.textContent = formatTime(current);
  ui.scrub.value = String(clamp(state.scrub));
  ui.scrubOut.textContent = formatTime(state.duration);
  updateRangeProgress(ui.scrub);
  updateTimelineDisplay(state.scrub);
}

function animate(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  if (state.playing && state.autoPlay) {
    state.elapsed = (state.elapsed + dt) % state.duration;
  }

  if (state.sourceMode === "sequence") {
    const segment = getSequenceSegment(state.elapsed);
    const clip = getClip(segment.slot);
    state.rotation = clip.type === "image" ? imageRotationAtTime(segment.localTime) : 0;
  } else if (state.sourceMode === "image") {
    state.rotation = imageRotationAtTime(state.elapsed);
  }

  syncSequencePlayback();

  drawSourceFrame(now);
  generateDepthFrame(now);
  updateUniforms();
  updateHud();

  if (points) {
    points.visible = state.sourceMode !== "empty";
    const imageLike = activeClipIsImage();
    points.rotation.x = imageLike || state.sourceMode === "empty" ? 0 : -0.045;
    points.rotation.y = imageLike || state.sourceMode === "empty" ? 0 : 0.055;
    points.rotation.z = 0;
  }

  applyRenderBackground();
  renderer.render(scene, camera);
  updateFps(now);
  requestAnimationFrame(animate);
}

function updateFps(now) {
  fpsFrames += 1;
  if (now - fpsLastAt > 600) {
    const fps = Math.round((fpsFrames * 1000) / (now - fpsLastAt));
    ui.fpsMeter.textContent = `${fps} 帧/秒`;
    fpsFrames = 0;
    fpsLastAt = now;
  }
}

function bindRanges() {
  Object.entries(ui.ranges).forEach(([key, input]) => {
    if (!input) return;
    const output = ui.outputs[key];
    if (output) output.textContent = formatNumber(input.value);
    updateRangeProgress(input);
    input.addEventListener("input", () => {
      state[key] = Number.parseFloat(input.value);
      if (output) output.textContent = formatNumber(input.value);
      updateRangeProgress(input);
      renderParticleColorPreview();
      if (key === "depthLook") {
        applyLookControls({ forceDepth: true });
      }
      if (key === "particleLook") {
        applyLookControls();
      }
      if (key === "flowLook") {
        applyLookControls({ resetEffect: true });
      }
      if (key === "transitionDuration") {
        refreshSequenceDuration();
        state.effectTime = 0;
      }
      if (key === "threshold") {
        state.effectTime = 0;
      }
      if (["depthContrast", "edgeLift", "depthGamma", "depthStrength"].includes(key)) {
        resetDepthMemory({ clearPrevious: true });
        generateDepthFrame(performance.now(), true);
      }
      if (key === "density") {
        buildGeometry();
      }
    });
  });
}

function setExpandablePanel(panel, toggle, open) {
  if (!panel || !toggle) return;
  if (panel.hideTimer) {
    window.clearTimeout(panel.hideTimer);
    panel.hideTimer = null;
  }

  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));

  if (open) {
    panel.hidden = false;
    window.requestAnimationFrame(() => {
      panel.classList.add("is-expanded");
    });
    return;
  }

  panel.classList.remove("is-expanded");
  panel.hideTimer = window.setTimeout(() => {
    if (!panel.classList.contains("is-expanded")) {
      panel.hidden = true;
    }
  }, 170);
}

function toggleExpandablePanel(panel, toggle) {
  const willOpen = panel.hidden || !panel.classList.contains("is-expanded");
  setExpandablePanel(panel, toggle, willOpen);
}

function bindControls() {
  bindRanges();
  bindTimelineFxPanel();

  ui.depthRecipe.addEventListener("change", () => {
    state.recipe = ui.depthRecipe.value;
    resetDepthMemory({ clearPrevious: true });
    generateDepthFrame(performance.now(), true);
  });

  ui.invertDepth.addEventListener("change", () => {
    state.invertDepth = ui.invertDepth.checked;
  });

  ui.exportAlpha.addEventListener("change", () => {
    state.exportAlpha = ui.exportAlpha.checked;
  });

  ui.exportBackgrounds.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        state.exportBackground = input.value;
      }
    });
  });

  ui.slotButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveSlot(button.dataset.slot);
    });
  });

  ui.slotDeleteButton.addEventListener("click", deleteActiveSlot);

  ui.particleColorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setParticleColorMode(button.dataset.particleColor);
    });
  });

  ui.backgroundColorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled) setBackgroundColorMode(button.dataset.bgColor);
    });
  });

  ui.exportMenuToggle.addEventListener("click", () => {
    toggleExpandablePanel(ui.exportMenu, ui.exportMenuToggle);
  });

  ui.timelineFxToggle.addEventListener("click", () => {
    toggleExpandablePanel(ui.timelineFxPanel, ui.timelineFxToggle);
  });

  ui.exportActiveButton.addEventListener("click", () => {
    exportActiveFormat();
  });

  [ui.exportWebglButton, ui.exportWebmButton, ui.exportMp4Button, ui.exportPngButton].forEach((button) => {
    button.addEventListener("click", () => {
      setExportFormat(button.dataset.format);
      setExpandablePanel(ui.exportMenu, ui.exportMenuToggle, false);
    });
  });

  ui.playButton.addEventListener("click", () => {
    setPlaying(!state.playing);
  });

  ui.scrub.addEventListener("input", async () => {
    state.scrub = Number.parseFloat(ui.scrub.value);
    setPlaying(false);
    if (state.sourceMode === "sequence") {
      await seekSequence(state.scrub * state.duration);
      state.effectTime = state.elapsed;
      drawSourceFrame(performance.now());
      generateDepthFrame(performance.now(), true);
    } else if (state.sourceMode === "video") {
      const media = singleMediaClip();
      if (media?.video && Number.isFinite(media.video.duration)) {
        const targetTime = clamp(state.scrub) * Math.max(0.01, media.video.duration - 0.04);
        await seekVideo(media.video, targetTime);
        state.elapsed = targetTime;
        state.scrub = state.duration > 0 ? clamp(state.elapsed / state.duration) : state.scrub;
      }
      state.effectTime = state.elapsed;
      drawSourceFrame(performance.now());
      generateDepthFrame(performance.now(), true);
    } else {
      state.elapsed = state.scrub * state.duration;
      if (state.sourceMode === "image") {
        state.effectTime = state.elapsed;
        state.rotation = imageRotationAtTime(state.elapsed);
      } else {
        state.effectTime = 0;
      }
      drawSourceFrame(performance.now());
      generateDepthFrame(performance.now(), true);
    }
  });

  ui.videoInput.addEventListener("change", async (event) => {
    await handlePickedFile(event.target.files?.[0], activeUploadSlot());
    event.target.value = "";
  });

  ui.clipAInput.addEventListener("change", async (event) => {
    await handlePickedFile(event.target.files?.[0], "a");
    event.target.value = "";
  });

  ui.clipBInput.addEventListener("change", async (event) => {
    await handlePickedFile(event.target.files?.[0], "b");
    event.target.value = "";
  });

  bindDropTarget(ui.fileDrop);
  bindDropTarget(ui.stageUpload);
  bindDropTarget(document.body, { decorate: false });

  ui.exportDepthButton.addEventListener("click", () => {
    exportDepthVideo();
  });

  webglCanvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const next = clamp(state.scrub + event.deltaY * 0.00045);
      ui.scrub.value = String(next);
      ui.scrub.dispatchEvent(new Event("input"));
    },
    { passive: false },
  );
}

async function handlePickedFile(file, slot = activeUploadSlot(), options = {}) {
  if (state.recording) {
    showMessage("录制中");
    return;
  }
  if (!file) {
    setUploadStatus("没有选中文件。请点击右侧区域，或把图片/视频拖进预览区。", "error");
    return;
  }
  const targetSlot = normalizeSlot(slot);
  if (file.type.startsWith("image/")) {
    await loadImageFile(file, targetSlot, options);
    return;
  }
  if (file.type.startsWith("video/")) {
    await loadVideoFile(file, targetSlot, options);
    return;
  }
  setUploadStatus("这个文件不是浏览器可读取的图片或视频。请使用 PNG/JPG/WebP、MP4 或 WebM。", "error");
}

function bindDropTarget(target, { decorate = true } = {}) {
  if (!target) return;

  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (state.recording) return;
    if (decorate) {
      ui.fileDrop.classList.add("is-dragging");
      ui.stageUpload.classList.add("is-dragging");
    }
  });

  target.addEventListener("dragleave", () => {
    if (decorate) {
      ui.fileDrop.classList.remove("is-dragging");
      ui.stageUpload.classList.remove("is-dragging");
    }
  });

  target.addEventListener("drop", async (event) => {
    event.preventDefault();
    ui.fileDrop.classList.remove("is-dragging");
    ui.stageUpload.classList.remove("is-dragging");
    if (state.recording) {
      showMessage("录制中");
      return;
    }
    const files = [...event.dataTransfer.files].filter((item) =>
      item.type.startsWith("image/") || item.type.startsWith("video/"),
    );
    if (!files.length) {
      setUploadStatus("没有找到可读取的图片或视频文件。", "error");
      return;
    }
    const availableSlots = SLOT_IDS.filter((slot) => !getSlotMedia(slot)?.url);
    const targets = availableSlots.length ? availableSlots : [state.activeSlot];
    const filesToLoad = files.slice(0, targets.length);
    for (let index = 0; index < filesToLoad.length; index += 1) {
      await handlePickedFile(filesToLoad[index], targets[index], { deferPlay: index < filesToLoad.length - 1 });
    }
    if (files.length > filesToLoad.length) {
      showMessage("最多支持 5 段素材，超出的文件没有载入。");
    }
  });
}

function shortName(name) {
  return name.length > 18 ? `${name.slice(0, 15)}...` : name;
}

function setClipLabel(slot, text) {
  const target = slot === "b" ? ui.clipBLabel : ui.clipALabel;
  if (target) target.textContent = text || "未选择";
}

function updateSequenceStatus() {
  const count = mediaClipCount();
  if (count > 1) {
    ui.sequenceStatus.textContent = `已启用 ${count} 段拼接：总时长 ${state.duration.toFixed(1)} 秒`;
    ui.sequenceStatus.classList.add("is-ready");
    return;
  }
  ui.sequenceStatus.classList.remove("is-ready");
  if (count === 1) {
    ui.sequenceStatus.textContent = "继续上传素材即可启用多段拼接时间线";
    return;
  }
  ui.sequenceStatus.textContent = "上传 1 段即为当前素材，上传 2-5 段后自动启用拼接时间线";
}

async function loadImageFile(file, slot = activeUploadSlot(), { deferPlay = false } = {}) {
  const targetSlot = normalizeSlot(slot);
  const media = getSlotMedia(targetSlot);
  runtimeMessage.hidden = true;
  state.frameReadBlocked = false;
  setUploadStatus(`正在读取：${file.name}`, "loading");
  ui.fileLabel.textContent = file.name.length > 22 ? `${file.name.slice(0, 19)}...` : file.name;

  clearMediaSlot(targetSlot);
  const image = ensureSlotImage(targetSlot);
  const objectUrl = URL.createObjectURL(file);
  media.type = "image";
  media.url = objectUrl;
  media.name = file.name;
  media.duration = IMAGE_LOOP_DURATION;
  image.src = objectUrl;
  if (targetSlot === "a") {
    sourceImage.src = objectUrl;
  }

  try {
    if (image.decode) {
      await image.decode();
    } else {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
    }
  } catch {
    clearMediaSlot(targetSlot);
    setUploadStatus("图片读取失败。请换用 PNG、JPG 或 WebP。", "error");
    showMessage("无法读取这张图片。请确认文件没有损坏，并换用浏览器支持的图片格式。");
    if (!mediaClipCount()) loadEmpty({ keepMessage: true });
    return;
  }

  media.aspect = image.naturalWidth / image.naturalHeight;
  state.activeSlot = targetSlot;
  syncLoadedSlots();
  refreshMediaMode();
  state.imagePivotX = 0;
  state.imagePivotZ = 0;
  resetDepthMemory({ clearPrevious: true });
  const count = mediaClipCount();
  focusTimelineOnSlot(targetSlot);
  setUploadStatus(
    count > 1
      ? `第 ${slotNumber(targetSlot)} 段图片已载入：当前 ${count}/5 段，已启用拼接时间线`
      : "图片已载入：已生成正面粒子图，可导出单帧或旋转视频",
    "ready",
  );
  drawSourceFrame(performance.now());
  generateDepthFrame(performance.now(), true);
  extractOriginalPalette();
  updateSequenceStatus();
  syncTimelineFxPanel();
  updateSlotUI();
  updateColorControls();
  if (!deferPlay) await resumePlaybackAfterUpload(targetSlot);
}

async function loadVideoFile(file, slot = activeUploadSlot(), { deferPlay = false } = {}) {
  const targetSlot = normalizeSlot(slot);
  const media = getSlotMedia(targetSlot);
  const video = ensureSlotVideo(targetSlot);
  runtimeMessage.hidden = true;
  state.frameReadBlocked = false;
  setUploadStatus(`正在读取第 ${slotNumber(targetSlot)} 段视频：${file.name}`, "loading");
  ui.fileLabel.textContent = shortName(file.name);
  setClipLabel(targetSlot, shortName(file.name));

  const support = file.type ? video.canPlayType(file.type) : "";
  if (file.type && support === "") {
    setUploadStatus("浏览器可能不支持这个视频编码，正在尝试加载...", "loading");
  }

  clearMediaSlot(targetSlot);

  const objectUrl = URL.createObjectURL(file);
  media.type = "video";
  media.url = objectUrl;
  media.name = file.name;

  video.removeAttribute("crossorigin");
  video.src = objectUrl;
  video.loop = false;
  video.muted = true;
  video.playsInline = true;
  video.load();

  try {
    await waitForVideoReady(video);
  } catch (error) {
    clearMediaSlot(targetSlot);
    setUploadStatus(error.message, "error");
    showMessage(error.message);
    if (!mediaClipCount()) loadEmpty({ keepMessage: true });
    return;
  }

  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : DEFAULT_DURATION;
  const aspect = video.videoWidth / video.videoHeight;
  media.duration = duration;
  media.aspect = aspect;
  state.activeSlot = targetSlot;
  syncLoadedSlots();
  refreshMediaMode();
  const count = mediaClipCount();
  setUploadStatus(
    count > 1
      ? `第 ${slotNumber(targetSlot)} 段视频已载入：当前 ${count}/5 段，总时长 ${state.duration.toFixed(1)} 秒`
      : `视频已载入：${duration.toFixed(1)} 秒`,
    "ready",
  );

  state.imagePivotX = 0;
  state.imagePivotZ = 0;
  resetDepthMemory({ clearPrevious: true });
  updateSequenceStatus();
  focusTimelineOnSlot(targetSlot);
  drawSourceFrame(performance.now());
  generateDepthFrame(performance.now(), true);
  extractOriginalPalette();
  syncTimelineFxPanel();
  updateSlotUI();
  updateColorControls();

  if (deferPlay || state.sourceMode === "empty") return;
  await resumePlaybackAfterUpload(targetSlot);
  const activeSegment = state.sourceMode === "sequence" ? getSequenceSegment(state.elapsed) : null;
  const activeVideo = activeSegment ? getClip(activeSegment.slot).video : video;
  if (!activeVideo) return;
  activeVideo.play().catch(() => {
    setUploadStatus("视频已载入。浏览器阻止了自动播放，请点“播放”。", "ready");
  });
}

function waitForVideoReady(video) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        finish(resolve);
        return;
      }
      finish(() =>
        reject(new Error("视频加载超时。请换用 H.264 MP4 或 WebM，过大的文件也可能需要先压缩。")),
      );
    }, 4000);

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
      callback();
    };

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        finish(resolve);
      }
    };

    const onError = () => {
      finish(() => reject(new Error(videoErrorMessage(video))));
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);

    if (video.readyState >= 2 && video.videoWidth > 0) {
      finish(resolve);
    }
  });
}

function videoErrorMessage(video) {
  const code = video.error?.code;
  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return "浏览器无法解码这个视频。请导出为 H.264 编码的 MP4，或 WebM VP9/VP8 后再上传。";
  }
  if (code === MediaError.MEDIA_ERR_DECODE) {
    return "视频解码失败。文件可能损坏，或编码格式不被当前浏览器支持。";
  }
  if (code === MediaError.MEDIA_ERR_NETWORK) {
    return "视频读取失败。请重新选择本地文件。";
  }
  return "视频加载失败。建议使用 H.264 MP4 或 WebM 格式。";
}

function loadEmpty({ keepMessage = false } = {}) {
  clearAllMediaSlots();
  state.objectUrl = "";
  sourceImage.removeAttribute("src");
  configureProcessSize(16 / 9);
  state.activeSlot = "a";
  state.sourceMode = "empty";
  state.duration = DEFAULT_DURATION;
  state.elapsed = 0;
  state.effectTime = 0;
  state.rotation = 0;
  state.imagePivotX = 0;
  state.imagePivotZ = 0;
  state.scrub = 0;
  state.activeSegmentKey = "";
  state.transitionMode = 0;
  state.transitionProgress = 0;
  state.transitionBlend = 0;
  state.frameReadBlocked = false;
  resetDepthMemory({ clearPrevious: true });
  process.sourceCtx.fillStyle = "#ffffff";
  process.sourceCtx.fillRect(0, 0, process.width, process.height);
  process.sourceContentRect = { x: 0, y: 0, width: process.width, height: process.height };
  process.depthCtx.fillStyle = "#0f0e12";
  process.depthCtx.fillRect(0, 0, process.width, process.height);
  sourceTexture.needsUpdate = true;
  depthTexture.needsUpdate = true;
  updateSlotUI();
  ui.fileLabel.textContent = "点击上传 or 拖进页面";
  if (!keepMessage) {
    setUploadStatus("支持 PNG/JPG/WebP\n支持 MP4、MOV、WebM 视频");
    runtimeMessage.hidden = true;
  }
  setEmptyState(true);
  syncTimelineFxPanel();
  updateColorControls();
  setPlaying(false);
}

function seekVideo(videoOrTime, maybeTime) {
  const video = typeof videoOrTime === "number" ? sourceVideo : videoOrTime;
  const time = typeof videoOrTime === "number" ? videoOrTime : maybeTime;
  return new Promise((resolve) => {
    if (!video || video.readyState < 1) {
      resolve();
      return;
    }

    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done, { once: true });
    video.currentTime = clamp(time, 0, Math.max(0, video.duration - 0.04));
    window.setTimeout(done, 450);
  });
}

async function seekSequence(time) {
  refreshSequenceDuration();
  state.elapsed = clamp(time, 0, Math.max(0, state.duration - 0.001));
  state.scrub = state.duration > 0 ? clamp(state.elapsed / state.duration) : 0;
  const segment = getSequenceSegment(state.elapsed);
  const clip = getClip(segment.slot);
  pauseInactiveVideos();
  if (clip.type === "video" && clip.video) {
    await seekVideo(clip.video, segment.localTime);
  }
  state.activeSegmentKey = segment.key;
  state.activeClipType = clip.type || "empty";
}

function getSupportedEffectMime(format = "webm") {
  const mp4Types = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=h264",
    "video/mp4",
  ];
  const webmTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const candidates = format === "mp4" ? mp4Types : webmTypes;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function extensionForMime(mimeType) {
  return mimeType.includes("mp4") ? "mp4" : "webm";
}

function effectExportSeconds() {
  const sourceSeconds = state.duration || DEFAULT_DURATION;
  return Math.max(1, Math.min(60, sourceSeconds));
}

async function exportEffectVideo(format = "webm") {
  if (state.recording) return;
  if (state.sourceMode === "empty") {
    showMessage("请先上传图片或视频，再导出视频。");
    return;
  }
  if (!("MediaRecorder" in window) || !webglCanvas.captureStream) {
    showMessage("当前浏览器无法录制 WebGL 预览。请使用支持 MediaRecorder 的 Chrome、Edge 或 Safari。");
    return;
  }

  const mimeType = getSupportedEffectMime(format);
  if (!mimeType) {
    const label = format === "mp4" ? "MP4/H.264" : "WebM";
    showMessage(`当前浏览器不支持原生 ${label} 录制。请换用支持该编码的浏览器，或先导出 WebM 后转码。`);
    return;
  }

  const extension = extensionForMime(mimeType);
  const useAlpha = format === "webm" && state.exportAlpha;
  const buttonText = format === "mp4" ? ui.exportMp4Text : ui.exportWebmText;
  const downloadLink = format === "mp4" ? ui.mp4DownloadLink : ui.webmDownloadLink;
  runtimeMessage.hidden = true;

  beginExportRender({ alpha: useAlpha });
  const stream = webglCanvas.captureStream(60);
  let recorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 9_000_000,
    });
  } catch {
    endExportRender();
    stream.getTracks().forEach((track) => track.stop());
    showMessage("视频录制器初始化失败。当前浏览器可能不支持这个编码配置。");
    return;
  }

  const chunks = [];

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.addEventListener("stop", () => {
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `particle-effect.${extension}`;
    downloadLink.click();
    setButtonText(buttonText, format.toUpperCase());
    endExportRender();
    stream.getTracks().forEach((track) => track.stop());
    setRecordingState(false);
  });

  setRecordingState(true);
  setButtonText(buttonText, "录制中");

  const previousMode = {
    playing: state.playing,
    autoPlay: state.autoPlay,
    elapsed: state.elapsed,
    effectTime: state.effectTime,
    rotation: state.rotation,
    scrub: state.scrub,
    time: singleMediaClip()?.video?.currentTime || 0,
  };

  const seconds = effectExportSeconds();

  state.effectTime = 0;
  try {
    recorder.start(180);
  } catch {
    setButtonText(buttonText, format.toUpperCase());
    endExportRender();
    stream.getTracks().forEach((track) => track.stop());
    setRecordingState(false);
    showMessage("视频录制启动失败。当前浏览器可能不支持这个导出格式。");
    return;
  }

  if (state.sourceMode === "sequence") {
    await seekSequence(0);
    state.autoPlay = true;
    setPlaying(true);
  } else if (state.sourceMode === "video") {
    const media = singleMediaClip();
    if (media?.video) await seekVideo(media.video, 0);
    state.autoPlay = true;
    setPlaying(true);
    singleMediaClip()?.video?.play()?.catch(() => {});
  } else {
    state.elapsed = 0;
    if (activeClipIsImage()) {
      state.rotation = 0;
    }
    state.autoPlay = true;
    setPlaying(true);
  }

  window.setTimeout(async () => {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    state.autoPlay = previousMode.autoPlay;
    state.effectTime = previousMode.effectTime;
    if (state.sourceMode === "sequence") {
      await seekSequence(previousMode.elapsed);
      setPlaying(previousMode.playing);
    } else if (state.sourceMode === "video") {
      const media = singleMediaClip();
      if (media?.video) await seekVideo(media.video, previousMode.time);
      setPlaying(previousMode.playing);
    } else {
      state.elapsed = previousMode.elapsed;
      state.scrub = previousMode.scrub;
      state.rotation = previousMode.rotation;
      setPlaying(previousMode.playing);
    }
  }, seconds * 1000);
}

function exportCurrentFrame() {
  if (state.sourceMode === "empty") {
    showMessage("请先上传图片或视频，再导出单帧。");
    return;
  }

  runtimeMessage.hidden = true;
  setButtonText(ui.exportPngText, "生成中");
  const previousRotation = state.rotation;
  if (activeClipIsImage()) {
    state.rotation = 0;
  }

  beginExportRender({ alpha: state.exportAlpha });
  drawSourceFrame(performance.now());
  generateDepthFrame(performance.now(), true);
  updateUniforms();
  if (points) {
    points.visible = true;
    const imageLike = activeClipIsImage();
    points.rotation.x = imageLike || state.sourceMode === "empty" ? 0 : -0.045;
    points.rotation.y = imageLike || state.sourceMode === "empty" ? 0 : 0.055;
    points.rotation.z = 0;
  }
  renderer.render(scene, camera);

  webglCanvas.toBlob((blob) => {
    if (!blob) {
      showMessage("单帧导出失败。当前浏览器没有成功读取 WebGL 画布。");
      setButtonText(ui.exportPngText, "PNG");
      state.rotation = previousRotation;
      endExportRender();
      return;
    }
    const url = URL.createObjectURL(blob);
    ui.pngDownloadLink.href = url;
    ui.pngDownloadLink.download = "particle-frame.png";
    ui.pngDownloadLink.click();
    setButtonText(ui.exportPngText, "PNG");
    state.rotation = previousRotation;
    endExportRender();
  }, "image/png");
}

function exportWebglScenePackage() {
  if (state.sourceMode === "empty") {
    showMessage("请先上传图片或视频，再导出 WebGL 场景包。");
    return;
  }
  const manifest = {
    version: 1,
    type: "synths-particle-scene",
    exportedAt: new Date().toISOString(),
    sourceMode: state.sourceMode,
    duration: state.duration,
    timeline: {
      assembleDuration: state.assembleDuration,
      dissolveDuration: state.dissolveDuration,
      transitionDuration: state.transitionDuration,
    },
    particles: {
      density: state.density,
      pointSize: state.pointSize,
      sizeRandomness: state.sizeRandomness,
      opacityRandomness: state.particleOpacity,
      lensBlur: state.particleLook,
      flowLook: state.flowLook,
      depthStrength: state.depthStrength,
    },
    color: {
      particle: state.particleColorMode,
      background: state.backgroundColorMode,
      originalPalette: state.originalPalette,
    },
    renderer: {
      width: webglCanvas.width,
      height: webglCanvas.height,
      scrollControlled: true,
      api: ["setProgress(progress)", "play()", "pause()", "resize()"],
    },
  };
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "particle-scene.manifest.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportDepthVideo() {
  if (state.recording) return;
  if (!("MediaRecorder" in window) || !depthCanvas.captureStream) {
    showMessage("当前浏览器无法录制 Canvas 视频。请尝试 Chrome、Edge 或较新的桌面浏览器。");
    return;
  }

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const stream = depthCanvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.addEventListener("stop", () => {
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    ui.downloadLink.href = url;
    ui.downloadLink.classList.remove("disabled");
    ui.downloadLink.querySelector("span").textContent = "下载";
    ui.exportDepthText.textContent = "导出深度 WebM";
    stream.getTracks().forEach((track) => track.stop());
    setRecordingState(false);
  });

  setRecordingState(true);
  ui.exportDepthText.textContent = "录制中";
  ui.downloadLink.classList.add("disabled");

  const previousMode = {
    playing: state.playing,
    autoPlay: state.autoPlay,
    elapsed: state.elapsed,
    scrub: state.scrub,
    time: singleMediaClip()?.video?.currentTime || 0,
  };

  const seconds = effectExportSeconds();
  try {
    recorder.start(250);
  } catch {
    ui.exportDepthText.textContent = "导出深度 WebM";
    ui.downloadLink.classList.remove("disabled");
    stream.getTracks().forEach((track) => track.stop());
    setRecordingState(false);
    showMessage("深度视频录制启动失败。当前浏览器可能不支持这个编码配置。");
    return;
  }

  if (state.sourceMode === "sequence") {
    await seekSequence(0);
    state.autoPlay = true;
    setPlaying(true);
  } else if (state.sourceMode === "video") {
    const media = singleMediaClip();
    if (media?.video) await seekVideo(media.video, 0);
    state.autoPlay = true;
    setPlaying(true);
    singleMediaClip()?.video?.play()?.catch(() => {});
  } else {
    state.elapsed = 0;
    state.rotation = activeClipIsImage() ? 0 : state.rotation;
    state.autoPlay = true;
    setPlaying(true);
  }

  window.setTimeout(async () => {
    recorder.stop();
    state.autoPlay = previousMode.autoPlay;
    if (state.sourceMode === "sequence") {
      await seekSequence(previousMode.elapsed);
      setPlaying(previousMode.playing);
    } else if (state.sourceMode === "video") {
      const media = singleMediaClip();
      if (media?.video) await seekVideo(media.video, previousMode.time);
      setPlaying(previousMode.playing);
    } else {
      state.elapsed = previousMode.elapsed;
      state.scrub = previousMode.scrub;
      setPlaying(previousMode.playing);
    }
  }, seconds * 1000);
}

window.addEventListener("resize", () => {
  resizeRenderer();
  updateColorGuides();
});

applyLookControls();
bindControls();
setExportFormat(state.exportFormat);
resizeRenderer();
loadEmpty();
requestAnimationFrame(animate);
