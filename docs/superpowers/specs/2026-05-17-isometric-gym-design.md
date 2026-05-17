# Isometric Voxel Gym — Design Spec
**Date:** 2026-05-17  
**Status:** Approved

---

## Overview

Replace the existing first-person Three.js gym (`js/main.js`) with a third-person isometric voxel gym in the style of Crossy Road / Smashy Road, with the free-exploration movement mechanics of Pokémon. The player walks a small voxel character around an open gym floor and interacts with equipment to reveal portfolio content.

---

## Visual Style

- **Art style:** Crossy Road voxel aesthetic — all objects built from stacked `BoxGeometry` blocks, no textures, flat-shaded faces with top/left/right color variation to simulate lighting.
- **Color palette:** Warm Wood
  - Floor: oak planks (`#d4b896` / `#c8a880`, alternating tiles)
  - Equipment: terracotta / warm brown (`#c07850`, `#a07050`, `#8a5030`)
  - Accent / interactive highlight: site blue (`#0071e3`)
  - Walls: warm off-white (`#e8ddd0`)
  - Plants: muted green (`#5a8a5a`)
  - Metal (barbell, pull-up bar): dark gray (`#7a8a8a`)
  - Treadmill console: dark body with blue glowing screen
- **Character:** Small voxel humanoid — cube head with dark hair, blue torso (matching site accent), dark trousers. Snaps to face one of 8 directions on movement. Bobs slightly while walking.

---

## Camera

- **Type:** `PerspectiveCamera` at a fixed isometric angle (~40° pitch, fixed horizontal bearing).
- **Behavior:** Translates smoothly to follow the character's XZ position with slight lag (soft follow, not rigid). Never rotates under any circumstance.
- **Result:** Identical viewing experience to Crossy Road — the world scrolls under a locked camera.

---

## Gym Layout

- **Room:** 20×20 tile open floor plan — large enough that the full gym is never visible in a single frame. Player must explore to discover all stations and objects. Walls on the back two sides, open entrance at the front-bottom.
- **Style:** Open/boutique — equipment and fun-fact objects scattered naturally across the space, no forced path.
- **Decorative:** Potted plants in corners and along walls, windows on back walls (blue-tinted), entrance strip highlighted in site blue, some open stretching/rest areas to give breathing room.

### Equipment Stations (Portfolio Content)

| Station | Content | Position (approx.) |
|---|---|---|
| Bench Press | Experience | Back-left zone |
| Dumbbell Rack | Skills | Back-right zone |
| Treadmill | Projects | Front-left zone |
| Pull-up Rig | Education | Mid-right zone |
| Punching Bag | About Me | Center |

All content data (HTML strings) at the top of `main.js` is preserved unchanged.

### Fun Fact Objects (Sprinkled Around)

Smaller interactive voxel props scattered across the gym. Same interaction system as equipment (proximity + E), but open a lighter fun-fact panel instead. Each has a distinct voxel shape so it reads clearly.

| Object | Fun Fact |
|---|---|
| Soccer ball | Loves soccer |
| Boxing gloves (hung on wall) | Loves UFC and boxing |
| Film reel / clapperboard | Loves watching movies |
| Stethoscope on a shelf | Originally wanted to be a doctor; love for coding won |
| Suitcase / globe | Loves to travel |
| Lunch box / food container | Huge foodie, loves trying new food |

These objects are smaller in scale than the main equipment and positioned in open floor areas and along walls so discovering them feels rewarding.

---

## Movement & Controls

- **Scheme:** WASD free movement across the XZ floor plane.
- **Directions:** 8-directional (W, A, S, D and all diagonals). Character walks relative to the fixed isometric camera axes — W moves up-right into the scene, S moves down-left toward the viewer, A moves up-left, D moves down-right.
- **Collision:** Simple AABB checks against equipment bounding boxes and walls. Character cannot walk through objects or out of bounds.
- **No mouse-look, no camera rotation.**

### Control Map

| Key | Action |
|---|---|
| W A S D | Walk in 8 directions |
| E | Interact with nearby equipment |
| M | Open pause/menu overlay |
| Esc | Close info panel / release |

---

## Interaction System

1. Player walks within ~2 tile radius of a piece of equipment.
2. A "Press E" pill tooltip floats above the equipment (dark background, white text, small downward triangle).
3. Player presses E → existing `#info-panel` opens with that station's title and HTML content.
4. Press E again or Esc → panel closes, movement resumes.
5. Only one station can be active at a time.

---

## UI Changes

- **Welcome overlay** (`#welcome-overlay`): Controls section updated to WASD / E / M / Esc. "Mouse — Look around" and "Click — Interact" rows removed.
- **Crosshair** (`#crosshair`): Removed (first-person only).
- **Controls reminder bar** (`#controls-reminder`): Updated to "WASD — Move | E — Interact | M — Menu".
- **Info panel, loading screen, pause menu:** Unchanged.

---

## Implementation Scope

- **File changed:** `js/main.js` — full rewrite of scene, camera, renderer, controls, and interaction logic.
- **Files untouched:** `gym.html`, `css/style.css`, all overlay/panel HTML and CSS.
- **Content data preserved:** The `CONTENT` object at the top of `main.js` carries over as-is.
- **Library:** Three.js (already loaded via importmap in `gym.html`).

---

## Out of Scope

- Textures or normal maps on geometry
- Animated equipment (moving treadmill belt, swinging punching bag)
- Sound effects
- Mobile / touch controls
- Saving player position between sessions
