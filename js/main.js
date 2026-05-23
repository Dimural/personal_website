// js/main.js — Isometric voxel gym entry point
import * as THREE from 'three';
import { CONTENT }                         from './gym/content.js';
import { getMoveVector, aabbOverlap }      from './gym/math.js';
import { buildScene, HALF }                from './gym/scene.js';
import { buildAllEquipment }               from './gym/equipment.js';
import { buildAllProps }                   from './gym/props.js';
import { buildPlayer, updateFacing, animatePlayer, PLAYER_SPEED, PLAYER_RADIUS, SPAWN, JUMP_FORCE, GRAVITY } from './gym/player.js';
import { createCamera, updateCamera, resizeCamera } from './gym/camera.js';
import { initControls, disposeControls, keys, consumeEPress, consumeSpacePress } from './gym/controls.js';
import { updateInteraction, openPanel, closePanel, isPanelOpen } from './gym/interaction.js';

// ── Module-level state ────────────────────────────────────────
let renderer, camera, scene, clock;
let player;
let allInteractables = [];
let allColliders     = [];
let pauseOpen  = false;
let velocityY  = 0;
let isOnGround = true;

// ── Public init hook (called by gym.html inline script) ──────
window.__initGym = function initGym() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  scene  = new THREE.Scene();
  camera = createCamera(renderer);
  clock  = new THREE.Clock();

  buildScene(scene);

  const { interactables: eqInter, colliders: eqColl } = buildAllEquipment(scene);
  const { interactables: prInter, colliders: prColl }  = buildAllProps(scene);
  allInteractables = [...eqInter, ...prInter];
  allColliders     = [...eqColl,  ...prColl];

  player = buildPlayer();
  scene.add(player);

  initControls();
  _wireUI();

  // Fade loading screen, show welcome overlay
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('welcome-overlay').style.display = 'flex';
    }, 800);
  }, 2300);

  window.addEventListener('resize', _onResize);
  _animate();
};

// ── Animation loop ────────────────────────────────────────────
function _animate() {
  requestAnimationFrame(_animate);
  const delta = clock.getDelta();
  const time  = clock.getElapsedTime();

  if (!isPanelOpen() && !pauseOpen) {
    _movePlayer(delta);
    _applyGravity(delta);
  }

  animatePlayer(player, time, _isMoving(), isOnGround);
  updateCamera(camera, player.position, delta);

  const nearest = updateInteraction(
    { x: player.position.x, z: player.position.z },
    allInteractables,
    camera,
    renderer
  );

  if (consumeEPress() && nearest && !isPanelOpen()) {
    openPanel(nearest, CONTENT);
  }

  renderer.render(scene, camera);
}

// ── Player movement + collision ───────────────────────────────
function _movePlayer(delta) {
  const mv = getMoveVector(keys);
  if (mv.x === 0 && mv.z === 0) return;

  const speed = PLAYER_SPEED * delta;
  let nx = player.position.x + mv.x * speed;
  let nz = player.position.z + mv.z * speed;

  // Wall bounds (keep player inside the room)
  const bound = HALF - 0.6;
  nx = Math.max(-bound, Math.min(bound, nx));
  nz = Math.max(-bound, Math.min(bound, nz));

  // Equipment / prop collision (AABB)
  const pw = PLAYER_RADIUS * 2, pd = PLAYER_RADIUS * 2;
  let blocked = false;
  for (const c of allColliders) {
    if (aabbOverlap(nx, nz, pw, pd, c.cx, c.cz, c.w, c.d)) {
      blocked = true;
      break;
    }
  }

  if (!blocked) {
    player.position.x = nx;
    player.position.z = nz;
    updateFacing(player, mv.x, mv.z, delta);
  }
}

function _applyGravity(delta) {
  // Jump trigger
  if (consumeSpacePress() && isOnGround) {
    velocityY  = JUMP_FORCE;
    isOnGround = false;
  }

  if (!isOnGround) {
    velocityY += GRAVITY * delta;
    player.position.y += velocityY * delta;

    // Land on floor
    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY  = 0;
      isOnGround = true;
      player.userData.bobBase = 0;
    }
  }
}

function _isMoving() {
  return keys.w || keys.a || keys.s || keys.d;
}

// ── UI wiring ─────────────────────────────────────────────────
function _wireUI() {
  // Welcome overlay → start
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('welcome-overlay').style.display = 'none';
    document.getElementById('controls-reminder').style.display = 'block';
    document.getElementById('gym-menu-btn').style.display = 'flex';
  });

  // Info panel close button
  document.getElementById('close-panel').addEventListener('click', closePanel);

  // Escape closes panel
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      if (isPanelOpen()) { closePanel(); return; }
      if (pauseOpen)     { _closePause(); return; }
    }
    if (e.code === 'KeyM') {
      if (pauseOpen) _closePause();
      else           _openPause();
    }
  });

  // Pause menu
  document.getElementById('gym-menu-btn').addEventListener('click', _openPause);
  document.getElementById('pause-resume').addEventListener('click', _closePause);
  document.getElementById('pause-exit').addEventListener('click', () => {
    window.location.href = '/';
  });
}

function _openPause() {
  if (pauseOpen || isPanelOpen()) return;
  pauseOpen = true;
  const pm = document.getElementById('pause-menu');
  pm.classList.remove('fade-out');
  pm.style.display = 'flex';
}

function _closePause() {
  if (!pauseOpen) return;
  pauseOpen = false;
  const pm = document.getElementById('pause-menu');
  pm.classList.add('fade-out');
  setTimeout(() => {
    pm.style.display = 'none';
    pm.classList.remove('fade-out');
  }, 280);
}

function _onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeCamera(camera, renderer);
}
