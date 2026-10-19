import { SLEEP_RADIUS, type Pose } from "./scene3d";

const SPEED = 5; // world units per second: a calm stroll
const RADIUS = 0.6; // the walker's footprint, for collisions

// World directions per key: W/up goes north (toward the castle, up the screen).
const KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

/** The walking figure: held keys in, a Pose out. Starts where the stand-up in scene3d ends. */
export function createPlayer() {
  const held = new Set<string>();
  const pose: Pose = { x: 0, z: 2.2, heading: 0, stride: 0, moving: 0 };
  let walked = false;
  let leftLog = false; // waking leaves you beside the log; sleep is only offered once you've walked away and back

  return {
    pose,
    /** Has the visitor walked yet? (The "how to walk" hint shows until they do.) */
    get walked() {
      return walked;
    },

    /** Beside the log, after having walked away from it: space puts the figure back to sleep. */
    get atLog() {
      return leftLog && Math.hypot(pose.x, pose.z) < SLEEP_RADIUS;
    },

    /** Back to where the stand-up ends, as on first load (called on waking, before the stand-up plays). */
    reset() {
      Object.assign(pose, { x: 0, z: 2.2, heading: 0, stride: 0, moving: 0 });
      held.clear();
      walked = leftLog = false;
    },

    /** Track a key; returns true if it's a movement key (so the page shouldn't scroll). */
    key(code: string, down: boolean) {
      if (!(code in KEYS)) return code === "Space";
      if (down) held.add(code);
      else held.delete(code);
      return true;
    },

    /** Forget held keys, e.g. when the window loses focus and keyups would be missed. */
    release() {
      held.clear();
    },

    /** Move for dt seconds. Each axis is tried on its own, so walking into a wall at an angle slides along it. */
    update(dt: number, blocked: (x: number, z: number, r: number) => boolean) {
      let dx = 0;
      let dz = 0;
      for (const code of held) {
        dx += KEYS[code][0];
        dz += KEYS[code][1];
      }
      const len = Math.hypot(dx, dz);
      pose.moving += ((len ? 1 : 0) - pose.moving) * (1 - Math.exp(-dt * 10));
      if (!len) return;

      walked = true;
      const step = (SPEED * dt) / len;
      const x = pose.x + dx * step;
      const z = pose.z + dz * step;
      if (!blocked(x, pose.z, RADIUS)) pose.x = x;
      if (!blocked(pose.x, z, RADIUS)) pose.z = z;
      // Turn smoothly toward the direction of travel, the short way round.
      const turn = Math.atan2(dx, dz) - pose.heading;
      pose.heading += Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - Math.exp(-dt * 12));
      pose.heading = Math.atan2(Math.sin(pose.heading), Math.cos(pose.heading)); // stay in ±π, so lying down never spins
      pose.stride += dt * SPEED * 1.5;
      if (Math.hypot(pose.x, pose.z) > SLEEP_RADIUS + 1) leftLog = true;
    },
  };
}
