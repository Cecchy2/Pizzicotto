import "./style.css";
import * as THREE from "three";

import vertexShader from "./shaders/fullscreen.vert.glsl?raw";
import fragmentShader from "./shaders/cheekPinch.frag.glsl?raw";

const root = document.querySelector("#app");
if (!root) {
  throw new Error("Elemento #app non trovato nel DOM");
}

root.innerHTML = `
  <div id="ui">
    <div>Foto di Sal · clic e trascina per tirare la guancia</div>
  </div>
`;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.domElement.id = "scene-canvas";

root.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const geometry = new THREE.PlaneGeometry(2, 2);

const uniforms = {
  iResolution: { value: new THREE.Vector3() },
  iMouse: { value: new THREE.Vector4() },
  iChannel0: { value: null },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const defaultTexture = new THREE.TextureLoader().load(
  "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f0f0f0' width='10' height='10'/%3e%3crect fill='%23e0e0e0' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect fill='url(%23a)' width='100' height='100'/%3e%3c/svg%3e"
);
defaultTexture.wrapS = THREE.ClampToEdgeWrapping;
defaultTexture.wrapT = THREE.ClampToEdgeWrapping;
defaultTexture.minFilter = THREE.LinearFilter;
defaultTexture.magFilter = THREE.LinearFilter;
uniforms.iChannel0.value = defaultTexture;

function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);

  uniforms.iResolution.value.set(width, height, 1);
}

window.addEventListener("resize", handleResize);
handleResize();

let isPointerDown = false;

function updateMouseFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const pixelRatio = renderer.getPixelRatio();

  const x = (event.clientX - rect.left) * pixelRatio;
  const y = (rect.bottom - event.clientY) * pixelRatio;

  uniforms.iMouse.value.set(x, y, isPointerDown ? 1 : 0, 0);
}

renderer.domElement.addEventListener("mousedown", (event) => {
  isPointerDown = true;
  updateMouseFromEvent(event);
});

window.addEventListener("mousemove", (event) => {
  if (!isPointerDown) return;
  updateMouseFromEvent(event);
});

window.addEventListener("mouseup", () => {
  isPointerDown = false;
  const current = uniforms.iMouse.value;
  current.z = 0;
});

renderer.domElement.addEventListener(
  "touchstart",
  (event) => {
    isPointerDown = true;
    const touch = event.touches[0];
    updateMouseFromEvent(touch);
    event.preventDefault();
  },
  { passive: false }
);

renderer.domElement.addEventListener(
  "touchmove",
  (event) => {
    if (!isPointerDown) return;
    const touch = event.touches[0];
    updateMouseFromEvent(touch);
    event.preventDefault();
  },
  { passive: false }
);

renderer.domElement.addEventListener("touchend", () => {
  isPointerDown = false;
  const current = uniforms.iMouse.value;
  current.z = 0;
});

const textureLoader = new THREE.TextureLoader();

textureLoader.load(
  "/Sal.jpg",
  (texture) => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    uniforms.iChannel0.value = texture;
    console.info("Foto di Sal caricata con successo");
  },
  undefined,
  (err) => {
    console.error("Errore nel caricamento della foto di Sal:", err);
  }
);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
