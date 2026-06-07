// js/gym/parkour.js
// A hidden parkour path made of plyo-box platforms that climb up to a
// secret trophy podium in the back-right corner. The boxes read as
// ordinary gym gear until you start hopping across them.
import * as THREE from 'three';
import { box } from './voxel.js';

const BLUE    = 0x0071e3;
const ORANGE  = 0xff5a1f;
const WHITE   = 0xf5f5f5;
const DARK    = 0x1d1d1f;
const GOLD    = 0xffc83d;
const GOLD_DK = 0xd9a017;

// Ascending plyo-box steps. Heights step by ≤0.6 so every gap is
// clearable in a single jump (max jump height ≈1.6). The lane insets
// inward around z≈1 to clear the wall-mounted boxing gloves.
const STEPS = [
  { cx: 8.4, cz:  6.5, top: 0.50, size: 1.3, color: BLUE   },
  { cx: 8.4, cz:  4.6, top: 1.05, size: 1.2, color: ORANGE },
  { cx: 8.4, cz:  2.7, top: 1.60, size: 1.2, color: BLUE   },
  { cx: 6.6, cz:  2.4, top: 2.15, size: 1.2, color: ORANGE },
  { cx: 6.6, cz:  0.4, top: 2.70, size: 1.2, color: BLUE   },
];

// Summit podium — the payoff at the top of the climb.
const SUMMIT = { cx: 7.6, cz: -2.2, top: 3.0, size: 1.8 };

export function buildParkour(scene) {
  const interactables = [];
  const colliders     = [];

  STEPS.forEach((s) => _plyoBox(scene, s, colliders));
  _summit(scene, colliders);
  _trophy(scene, interactables, colliders);

  return { interactables, colliders };
}

// ── A single plyo box: colored body, white top pad, dark base, face stripe ──
function _plyoBox(scene, { cx, cz, top, size, color }, colliders) {
  const h = top;
  const w = size, d = size;

  scene.add(box(w, h, d, color, cx, h / 2, cz));                 // body
  scene.add(box(w * 0.92, 0.08, d * 0.92, WHITE, cx, h - 0.04, cz)); // top pad
  scene.add(box(w * 1.04, 0.14, d * 1.04, DARK, cx, 0.07, cz));  // base trim
  scene.add(box(w * 0.5, 0.13, 0.02, WHITE, cx, h * 0.52, cz + d / 2 + 0.01)); // front stripe

  colliders.push({ cx, cz, w, d, top: h });
}

// ── Summit podium block with a gold cap ───────────────────────────
function _summit(scene, colliders) {
  const { cx, cz, top, size } = SUMMIT;
  scene.add(box(size, top, size, DARK, cx, top / 2, cz));
  scene.add(box(size * 0.94, 0.12, size * 0.94, GOLD_DK, cx, top - 0.06, cz));
  // subtle inset glow ring on the cap
  scene.add(box(size * 0.6, 0.14, size * 0.6, GOLD, cx, top - 0.05, cz));
  colliders.push({ cx, cz, w: size, d: size, top });
}

// ── Trophy + glow beacon + the secret interactable ────────────────
function _trophy(scene, interactables, colliders) {
  const tx = SUMMIT.cx, tz = SUMMIT.cz, ty = SUMMIT.top;
  const goldMat = new THREE.MeshLambertMaterial({ color: GOLD });

  // Pedestal block under the cup
  scene.add(box(0.6, 0.28, 0.6, GOLD_DK, tx, ty + 0.14, tz));
  // Stem
  scene.add(box(0.12, 0.32, 0.12, GOLD, tx, ty + 0.44, tz));

  // Cup bowl
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.13, 0.4, 14), goldMat);
  cup.position.set(tx, ty + 0.78, tz);
  cup.castShadow = true;
  scene.add(cup);

  // Handles
  [-1, 1].forEach((s) => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12), goldMat);
    handle.position.set(tx + s * 0.3, ty + 0.82, tz);
    handle.rotation.y = Math.PI / 2;
    handle.castShadow = true;
    scene.add(handle);
  });

  // Star on top (a tilted cube)
  const star = box(0.16, 0.16, 0.16, GOLD, tx, ty + 1.06, tz);
  star.rotation.set(Math.PI / 4, Math.PI / 4, 0);
  scene.add(star);

  // Soft golden beacon — noticeable from across the room, the only hint
  const beamMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.1 });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 3.2, 16, 1, true), beamMat);
  beam.position.set(tx, ty + 1.7, tz);
  scene.add(beam);

  const glow = new THREE.PointLight(0xffd060, 1.3, 9);
  glow.position.set(tx, ty + 1.6, tz);
  scene.add(glow);

  // Solid little pedestal so you bump into the trophy instead of walking through it
  colliders.push({ cx: tx, cz: tz, w: 0.6, d: 0.6, top: ty + 0.3 });

  // The secret reward — gated by minY so it only appears once you're on the summit
  interactables.push({
    position: new THREE.Vector3(tx, ty, tz),
    radius: 1.9,
    contentKey: 'parkourReward',
    label: '🏆 ???',
    minY: 2.5,
  });
}
