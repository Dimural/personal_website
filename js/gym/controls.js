// js/gym/controls.js

// Live key state — mutated by event listeners
export const keys = { w: false, a: false, s: false, d: false, e: false, space: false };

// Single-frame press detection
let _prevE     = false;
let _prevSpace = false;

export function initControls() {
  window.addEventListener('keydown', _onKeyDown);
  window.addEventListener('keyup',   _onKeyUp);
}

export function disposeControls() {
  window.removeEventListener('keydown', _onKeyDown);
  window.removeEventListener('keyup',   _onKeyUp);
}

export function consumeEPress() {
  const pressed = keys.e && !_prevE;
  _prevE = keys.e;
  return pressed;
}

export function consumeSpacePress() {
  const pressed = keys.space && !_prevSpace;
  _prevSpace = keys.space;
  return pressed;
}

function _onKeyDown(e) {
  if (e.repeat) return;
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    keys.w     = true; break;
    case 'KeyA': case 'ArrowLeft':  keys.a     = true; break;
    case 'KeyS': case 'ArrowDown':  keys.s     = true; break;
    case 'KeyD': case 'ArrowRight': keys.d     = true; break;
    case 'KeyE':                    keys.e     = true; break;
    case 'Space':                   keys.space = true; e.preventDefault(); break;
  }
}

function _onKeyUp(e) {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    keys.w     = false; break;
    case 'KeyA': case 'ArrowLeft':  keys.a     = false; break;
    case 'KeyS': case 'ArrowDown':  keys.s     = false; break;
    case 'KeyD': case 'ArrowRight': keys.d     = false; break;
    case 'KeyE':                    keys.e     = false; break;
    case 'Space':                   keys.space = false; break;
  }
}
