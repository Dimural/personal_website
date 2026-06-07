// js/gym/interaction.js
import * as THREE from 'three';
import { isNearby } from './math.js';

const _hintEl    = () => document.getElementById('interact-hint');
const _hintTitle = () => document.querySelector('#interact-hint .hint-title');
const _hintSub   = () => document.querySelector('#interact-hint .hint-sub');
const _panelEl   = () => document.getElementById('info-panel');
const _panelIcon = () => document.getElementById('panel-icon');
const _panelTitle= () => document.getElementById('panel-title');
const _panelBody = () => document.getElementById('panel-content');

let _panelOpen    = false;
let _nearestKey   = null; // contentKey of nearest interactable

/**
 * Scans all interactables for proximity to player.
 * Updates the screen-space tooltip if something is nearby.
 * Returns the contentKey of the nearest interactable, or null.
 *
 * @param {{ x: number, z: number, y?: number }} playerPos
 * @param {Array<{ position: THREE.Vector3, radius: number, contentKey: string, label: string }>} interactables
 * @param {THREE.Camera} camera
 * @param {THREE.WebGLRenderer} renderer
 */
export function updateInteraction(playerPos, interactables, camera, renderer) {
  if (_panelOpen) return _nearestKey;

  let nearest     = null;
  let minDist     = Infinity;

  for (const obj of interactables) {
    // Height-gated interactables (e.g. the summit trophy) only register
    // once the player has actually climbed up to them.
    if (obj.minY !== undefined && (playerPos.y ?? 0) < obj.minY) continue;

    const dx = playerPos.x - obj.position.x;
    const dz = playerPos.z - obj.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= obj.radius && dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  }

  _nearestKey = nearest ? nearest.contentKey : null;

  if (nearest) {
    _positionTooltip(nearest.position, nearest.label, camera, renderer);
  } else {
    _hideTooltip();
  }

  return _nearestKey;
}

/**
 * Opens the info panel for the given contentKey.
 * @param {string} contentKey
 * @param {Record<string, { title: string, icon: string, html: string }>} content
 */
export function openPanel(contentKey, content) {
  const data = content[contentKey];
  if (!data) return;

  _panelIcon().textContent  = data.icon  || '🏋️';
  _panelTitle().textContent = data.title || '';
  _panelBody().innerHTML    = data.html  || '';
  _panelEl().style.display  = 'flex';
  _hideTooltip();
  _panelOpen = true;
}

/**
 * Closes the info panel if it is open.
 */
export function closePanel() {
  if (!_panelOpen) return;
  _panelEl().style.display = 'none';
  _panelOpen = false;
}

export function isPanelOpen() {
  return _panelOpen;
}

// ── Internals ─────────────────────────────────────────────────

function _positionTooltip(worldPos, label, camera, renderer) {
  // Project the point 2.6 units above the object into screen space
  const above = worldPos.clone();
  above.y += 2.6;
  const v = above.project(camera);

  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const sx = (v.x + 1) / 2 * w;
  const sy = (-v.y + 1) / 2 * h;

  const hint = _hintEl();
  hint.style.display    = 'flex';
  hint.style.position   = 'fixed';
  hint.style.left       = sx + 'px';
  hint.style.top        = sy + 'px';
  hint.style.transform  = 'translate(-50%, -100%)';
  _hintTitle().textContent = label;
  _hintSub().textContent   = 'Press E to interact';
}

function _hideTooltip() {
  _hintEl().style.display = 'none';
}
