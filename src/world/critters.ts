import * as THREE from "three";

// Small life in the meadow: birds gliding over it (seen from above, the camera shows no sky) and rabbits
// that hop, sit, and hop away from the walker. Calm and slow, like everything else (docs/look.md).

const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1 });

/** A cheap, repeatable random number in [0, 1) for a pair of integers. */
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const BIRD_SPEED = 5; // units per second
const BIRD_SPAN = 140; // length of one crossing, from off one edge of the map to off the other
const FLEE = 4.5; // a rabbit bolts when the walker gets this close…
const SAFE = 8; // …and keeps hopping until it's this far away
const FLEE_TURNS = [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]; // away from the walker, veering around obstacles, never back toward them

function bird() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 2, 6), mat("#8c95aa"));
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const wingGeo = new THREE.PlaneGeometry(1.5, 0.6);
  wingGeo.translate(0.75, 0, 0);
  const wings = [1, -1].map((side) => {
    const pivot = new THREE.Group();
    const wing = new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ color: "#7d869c", roughness: 1, side: THREE.DoubleSide }));
    wing.rotation.x = -Math.PI / 2;
    pivot.add(wing);
    pivot.scale.x = side;
    group.add(pivot);
    return pivot;
  });
  return { group, wings };
}

function rabbitMesh() {
  const group = new THREE.Group();
  const fur = mat("#8a7a68");
  const add = (geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
    return m;
  };
  add(new THREE.SphereGeometry(0.35, 10, 8), fur, 0, 0.35, 0).scale.set(1, 0.85, 1.35);
  add(new THREE.SphereGeometry(0.22, 10, 8), fur, 0, 0.62, 0.42);
  for (const x of [-0.08, 0.08]) add(new THREE.BoxGeometry(0.07, 0.42, 0.12), fur, x, 0.98, 0.36).rotation.x = -0.25;
  add(new THREE.SphereGeometry(0.11, 8, 6), mat("#d8d2c4"), 0, 0.42, -0.48);
  return group;
}

type Rabbit = {
  x: number;
  z: number;
  heading: number;
  mesh: THREE.Group;
  wait: number; // seconds left sitting
  hops: number; // hops left in this run
  hop: number; // progress through the current hop, 0..1 (0 = between hops)
  from: { x: number; z: number };
  to: { x: number; z: number };
  fleeing: boolean;
};

/** Birds and rabbits, added to `scene`. `blocked` keeps rabbits on the walkable meadow. */
export function createCritters(scene: THREE.Scene, blocked: (x: number, z: number, r: number) => boolean) {
  const birds = [0, 1, 2, 3].map((i) => ({ ...bird(), offset: i * (BIRD_SPAN / 4) + i * 7 }));
  for (const b of birds) {
    b.group.scale.setScalar(0.8);
    scene.add(b.group);
  }

  const rabbits: Rabbit[] = [
    [-8, 6],
    [9, -5],
    [-16, 28],
    [24, 24],
  ].map(([x, z], i) => {
    const mesh = rabbitMesh();
    scene.add(mesh);
    return { x, z, heading: i * 1.7, mesh, wait: 1 + i, hops: 0, hop: 0, from: { x, z }, to: { x, z }, fleeing: false };
  });

  /** Aim the next hop, trying each turn in order until the way is clear. Returns false if it can't hop at all. */
  const aim = (r: Rabbit, length: number, turns: number[]) => {
    for (const turn of turns) {
      const h = r.heading + turn;
      const x = r.x + Math.sin(h) * length;
      const z = r.z + Math.cos(h) * length;
      if (!blocked(x, z, 0.4)) {
        r.heading = h;
        r.from = { x: r.x, z: r.z };
        r.to = { x, z };
        return true;
      }
    }
    return false;
  };

  return {
    rabbits,

    /** `t` is the ambient clock (frozen under reduced motion, so `dt` is 0 then). `player` is null while asleep. */
    update(t: number, dt: number, player: { x: number; z: number } | null) {
      // Birds: each crosses the map on its own line, then comes back on a new one. Mostly gliding,
      // with a few slow wing beats now and then.
      birds.forEach((b, i) => {
        const travelled = t * BIRD_SPEED + b.offset;
        const lap = Math.floor(travelled / BIRD_SPAN);
        const p = travelled / BIRD_SPAN - lap;
        const dir = hash(lap, i) < 0.5 ? 1 : -1;
        const z = -12 + hash(lap, i + 9) * 44;
        const drift = (hash(lap, i + 17) - 0.5) * 16; // lines run a little diagonal
        b.group.position.set(dir * (p - 0.5) * BIRD_SPAN, 9 + hash(lap, i + 3) * 5, z + (p - 0.5) * drift);
        b.group.rotation.y = Math.atan2(dir * BIRD_SPAN, drift);
        const beating = Math.max(0, Math.sin(t * 0.45 + i * 2.3) - 0.55) / 0.45;
        const flap = 0.15 + beating * 0.5 * Math.sin(t * 5 + i);
        for (const w of b.wings) w.rotation.z = flap;
      });

      // Rabbits: sit, hop a few times, sit. Bolt away from the walker.
      for (const r of rabbits) {
        const near = player && Math.hypot(r.x - player.x, r.z - player.z);
        if (player && near !== null && near < FLEE && !r.fleeing) {
          r.fleeing = true;
          r.wait = 0;
          r.hops = 0;
        }
        if (r.hop > 0) {
          r.hop = Math.min(1, r.hop + dt / (r.fleeing ? 0.28 : 0.38));
          r.x = r.from.x + (r.to.x - r.from.x) * r.hop;
          r.z = r.from.z + (r.to.z - r.from.z) * r.hop;
          if (r.hop >= 1) r.hop = 0;
        } else if (r.fleeing) {
          if (!player || near! > SAFE) {
            r.fleeing = false;
            r.wait = 1.5;
          } else {
            r.heading = Math.atan2(r.x - player.x, r.z - player.z);
            if (aim(r, 1.6, FLEE_TURNS)) r.hop = 1e-6;
          }
        } else if (r.hops > 0) {
          r.hops--;
          if (aim(r, 1.2, [0, Math.PI])) r.hop = 1e-6;
          else r.hops = 0;
        } else if ((r.wait -= dt) <= 0) {
          r.wait = 2 + hash(t, r.x) * 3;
          r.hops = 2 + Math.floor(hash(r.z, t) * 3);
          r.heading += (hash(r.x, r.z) - 0.5) * 2;
        }
        const arc = r.hop > 0 ? Math.sin(Math.PI * r.hop) : 0;
        r.mesh.position.set(r.x, arc * (r.fleeing ? 0.6 : 0.5), r.z);
        r.mesh.rotation.set(-arc * 0.3, r.heading, 0);
      }
    },
  };
}
