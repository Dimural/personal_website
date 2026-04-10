import * as THREE from 'three';

// ============================================================
// CONTENT DATA — Edit your personal info here!
// ============================================================
const CONTENT = {
    benchPress: {
        icon: '💼',
        title: 'Experience',
        html: `
            <h3>Job Title — Company Name</h3>
            <p>Month Year – Present</p>
            <ul>
                <li>Describe what you did here</li>
                <li>Another accomplishment or responsibility</li>
                <li>Impact you made</li>
            </ul>
            <h3>Previous Role — Previous Company</h3>
            <p>Month Year – Month Year</p>
            <ul>
                <li>Describe what you did here</li>
                <li>Another accomplishment</li>
            </ul>
        `
    },
    dumbbellRack: {
        icon: '🛠️',
        title: 'Skills',
        html: `
            <h3>Languages</h3>
            <p>
                <span class="tag">JavaScript</span>
                <span class="tag">Python</span>
                <span class="tag">TypeScript</span>
                <span class="tag">C++</span>
                <span class="tag">SQL</span>
            </p>
            <h3>Frameworks & Tools</h3>
            <p>
                <span class="tag">React</span>
                <span class="tag">Node.js</span>
                <span class="tag">Three.js</span>
                <span class="tag">Git</span>
                <span class="tag">Docker</span>
                <span class="tag">AWS</span>
            </p>
            <h3>Soft Skills</h3>
            <p>
                <span class="tag">Problem Solving</span>
                <span class="tag">Team Leadership</span>
                <span class="tag">Communication</span>
            </p>
        `
    },
    treadmill: {
        icon: '🚀',
        title: 'Projects',
        html: `
            <h3>Project Name One</h3>
            <p>Brief description of the project. What problem did it solve? What tech did you use?</p>
            <ul>
                <li>Key feature or achievement</li>
                <li>Technologies used</li>
            </ul>
            <h3>Project Name Two</h3>
            <p>Brief description of another project.</p>
            <ul>
                <li>Key feature or achievement</li>
                <li>Technologies used</li>
            </ul>
            <h3>Project Name Three</h3>
            <p>Brief description of yet another project.</p>
            <ul>
                <li>Key feature or achievement</li>
                <li>Technologies used</li>
            </ul>
        `
    },
    pullUpBar: {
        icon: '🎓',
        title: 'Education',
        html: `
            <h3>Degree — University Name</h3>
            <p>Expected Graduation: Month Year</p>
            <ul>
                <li>Relevant coursework or achievements</li>
                <li>GPA (if you want to include it)</li>
                <li>Clubs or organizations</li>
            </ul>
        `
    },
    punchingBag: {
        icon: '👋',
        title: 'About Me',
        html: `
            <p>Hey! I'm [Your Name]. Welcome to my virtual gym — thanks for stopping by!</p>
            <p>I'm passionate about [your interests]. When I'm not coding, you can find me [hobbies].</p>
            <h3>Fun Facts</h3>
            <ul>
                <li>Fun fact about yourself</li>
                <li>Another fun fact</li>
                <li>Something quirky or interesting</li>
            </ul>
        `
    },
    mirror: {
        icon: '📬',
        title: 'Contact',
        html: `
            <h3>Let's Connect!</h3>
            <ul>
                <li>Email: your.email@example.com</li>
                <li>GitHub: github.com/yourusername</li>
                <li>LinkedIn: linkedin.com/in/yourusername</li>
                <li>Twitter: @yourhandle</li>
            </ul>
            <p>Feel free to reach out — I'd love to chat!</p>
        `
    }
};

// ============================================================
// GLOBALS
// ============================================================
let scene, camera, renderer;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isLocked = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let interactables = [];
let panelOpen = false;
let animatedObjects = [];
const clock = new THREE.Clock();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

// Player settings
const PLAYER_HEIGHT = 1.7;
const MOVE_SPEED = 22;
const ROOM_HALF = 14;

// Shared materials
const CHROME = new THREE.MeshStandardMaterial({ color: 0xd0d0d8, metalness: 0.95, roughness: 0.08 });
const DARK_METAL = new THREE.MeshStandardMaterial({ color: 0x2c2c3a, metalness: 0.85, roughness: 0.2 });
const MATTE_BLACK = new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.95, metalness: 0.05 });
const RED_LEATHER = new THREE.MeshStandardMaterial({ color: 0xc0353f, roughness: 0.75, metalness: 0.05 });
const RUBBER_MAT = new THREE.MeshStandardMaterial({ color: 0x2a2a38, roughness: 0.98, metalness: 0 });
const NEON_PINK = new THREE.MeshStandardMaterial({ color: 0xe94560, emissive: 0xe94560, emissiveIntensity: 1.5 });
const NEON_BLUE = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x4fc3f7, emissiveIntensity: 1.5 });
const NEON_YELLOW = new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0xffd93d, emissiveIntensity: 1.0 });

// ============================================================
// INIT
// ============================================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d1a);
    scene.fog = new THREE.FogExp2(0x0d0d1a, 0.008);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, PLAYER_HEIGHT, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    document.body.appendChild(renderer.domElement);

    setupLighting();
    buildRoom();
    buildEquipment();
    buildProps();
    setupEvents();

    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('welcome-overlay').style.display = 'flex';
        }, 800);
    }, 1500);

    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('welcome-overlay').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        document.getElementById('controls-reminder').style.display = 'block';
        renderer.domElement.requestPointerLock();
    });

    document.getElementById('close-panel').addEventListener('click', closePanel);
    animate();
}

// ============================================================
// LIGHTING — dramatic gym atmosphere
// ============================================================
function setupLighting() {
    // Strong ambient so everything is visible
    scene.add(new THREE.AmbientLight(0xddddf0, 1.8));

    // Hemisphere for fill
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 1.5));

    // Overhead rectangular light fixtures (fluorescent tubes)
    const fixturePositions = [
        [-5, 4.9, -6], [5, 4.9, -6],
        [-5, 4.9, 0], [5, 4.9, 0],
        [-5, 4.9, 6], [5, 4.9, 6],
        [0, 4.9, -3], [0, 4.9, 3]
    ];
    fixturePositions.forEach(pos => {
        // Light
        const pl = new THREE.PointLight(0xeeeeff, 2.5, 30, 1.0);
        pl.position.set(...pos);
        pl.castShadow = true;
        pl.shadow.mapSize.set(512, 512);
        scene.add(pl);

        // Fixture housing
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.06, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7, roughness: 0.3 })
        );
        housing.position.set(...pos);
        scene.add(housing);

        // Glowing tube
        const tube = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.03, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeeeeff, emissiveIntensity: 4 })
        );
        tube.position.set(pos[0], pos[1] - 0.04, pos[2]);
        scene.add(tube);
    });

    // Neon accent strips along ceiling edges
    const neonGeo = new THREE.BoxGeometry(0.04, 0.04, ROOM_HALF * 2);
    [{ x: -ROOM_HALF + 0.1, mat: NEON_PINK }, { x: ROOM_HALF - 0.1, mat: NEON_BLUE }].forEach(({ x, mat }) => {
        const strip = new THREE.Mesh(neonGeo, mat);
        strip.position.set(x, 4.95, 0);
        scene.add(strip);
        const light = new THREE.PointLight(mat.emissive.getHex(), 0.4, 15);
        light.position.set(x, 4.5, 0);
        scene.add(light);
    });

    const neonGeoX = new THREE.BoxGeometry(ROOM_HALF * 2, 0.04, 0.04);
    [{ z: -ROOM_HALF + 0.1, mat: NEON_YELLOW }, { z: ROOM_HALF - 0.1, mat: NEON_PINK }].forEach(({ z, mat }) => {
        const strip = new THREE.Mesh(neonGeoX, mat);
        strip.position.set(0, 4.95, z);
        scene.add(strip);
    });

    // Spotlights on equipment areas
    const spotTargets = [
        { pos: [-6, 4.8, -6], target: [-6, 0, -6], color: 0xffe0e0 },
        { pos: [6, 4.8, -6], target: [6, 0, -6], color: 0xffeedd },
        { pos: [-6, 4.8, 4], target: [-6, 0, 4], color: 0xe0eeff },
        { pos: [6, 4.8, 4], target: [6, 0, 4], color: 0xffe0e8 },
        { pos: [0, 4.8, -10], target: [0, 0, -10], color: 0xffffdd },
    ];
    spotTargets.forEach(({ pos, target, color }) => {
        const spot = new THREE.SpotLight(color, 3.0, 25, Math.PI / 4, 0.5, 1.0);
        spot.position.set(...pos);
        spot.target.position.set(...target);
        spot.castShadow = true;
        scene.add(spot);
        scene.add(spot.target);
    });
}

// ============================================================
// ROOM — detailed gym interior
// ============================================================
function buildRoom() {
    const S = ROOM_HALF * 2;

    // === FLOOR: checkered rubber tiles ===
    const tileSize = 2;
    const darkTile = new THREE.MeshStandardMaterial({ color: 0x3a3a50, roughness: 0.85, metalness: 0.02 });
    const lightTile = new THREE.MeshStandardMaterial({ color: 0x4a4a62, roughness: 0.8, metalness: 0.02 });
    const tileGeo = new THREE.BoxGeometry(tileSize - 0.02, 0.08, tileSize - 0.02);

    for (let x = -ROOM_HALF; x < ROOM_HALF; x += tileSize) {
        for (let z = -ROOM_HALF; z < ROOM_HALF; z += tileSize) {
            const isDark = ((x / tileSize + z / tileSize) % 2 === 0);
            const tile = new THREE.Mesh(tileGeo, isDark ? darkTile : lightTile);
            tile.position.set(x + tileSize / 2, 0.04, z + tileSize / 2);
            tile.receiveShadow = true;
            scene.add(tile);
        }
    }

    // Sub-floor
    const subFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(S + 2, S + 2),
        new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 1 })
    );
    subFloor.rotation.x = -Math.PI / 2;
    subFloor.position.y = -0.01;
    subFloor.receiveShadow = true;
    scene.add(subFloor);

    // === WALLS: paneled with baseboard and accent ===
    const wallH = 5.5;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x404058, roughness: 0.75, metalness: 0.05 });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, roughness: 0.7, metalness: 0.1 });
    const accentStripMat = NEON_PINK.clone();
    accentStripMat.emissiveIntensity = 0.6;

    const walls = [
        { pos: [0, wallH / 2, -ROOM_HALF], rot: [0, 0, 0], size: [S, wallH] },         // back
        { pos: [0, wallH / 2, ROOM_HALF], rot: [0, Math.PI, 0], size: [S, wallH] },     // front
        { pos: [-ROOM_HALF, wallH / 2, 0], rot: [0, Math.PI / 2, 0], size: [S, wallH] }, // left
        { pos: [ROOM_HALF, wallH / 2, 0], rot: [0, -Math.PI / 2, 0], size: [S, wallH] }, // right
    ];

    walls.forEach(({ pos, rot, size }) => {
        // Main wall
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), wallMat);
        wall.position.set(...pos);
        wall.rotation.set(...rot);
        wall.receiveShadow = true;
        scene.add(wall);

        // Baseboard
        const bb = new THREE.Mesh(new THREE.PlaneGeometry(size[0], 0.2), baseboardMat);
        bb.position.set(pos[0], 0.1, pos[2]);
        bb.rotation.set(...rot);
        // Offset slightly in front of wall
        const dir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...rot));
        bb.position.addScaledVector(dir, 0.005);
        scene.add(bb);

        // Horizontal neon accent at ~2.5m height
        const accent = new THREE.Mesh(new THREE.PlaneGeometry(size[0], 0.025), accentStripMat);
        accent.position.set(pos[0], 2.5, pos[2]);
        accent.rotation.set(...rot);
        accent.position.addScaledVector(dir, 0.005);
        scene.add(accent);

        // Upper accent
        const accent2 = new THREE.Mesh(new THREE.PlaneGeometry(size[0], 0.015),
            new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x4fc3f7, emissiveIntensity: 0.5 }));
        accent2.position.set(pos[0], 4.5, pos[2]);
        accent2.rotation.set(...rot);
        accent2.position.addScaledVector(dir, 0.005);
        scene.add(accent2);

        // Wall panels (vertical grooves)
        for (let i = -ROOM_HALF + 2; i < ROOM_HALF; i += 3) {
            const groove = new THREE.Mesh(
                new THREE.PlaneGeometry(0.015, wallH - 0.5),
                new THREE.MeshStandardMaterial({ color: 0x1e1e30, roughness: 0.9 })
            );
            // Position groove along the wall face
            if (rot[1] === 0) { groove.position.set(i, wallH / 2, pos[2] + 0.006); groove.rotation.set(...rot); }
            else if (rot[1] === Math.PI) { groove.position.set(i, wallH / 2, pos[2] - 0.006); groove.rotation.set(...rot); }
            else if (rot[1] === Math.PI / 2) { groove.position.set(pos[0] + 0.006, wallH / 2, i); groove.rotation.set(...rot); }
            else { groove.position.set(pos[0] - 0.006, wallH / 2, i); groove.rotation.set(...rot); }
            scene.add(groove);
        }
    });

    // === CEILING ===
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(S, S),
        new THREE.MeshStandardMaterial({ color: 0x1a1a28, roughness: 1, metalness: 0 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallH;
    scene.add(ceiling);

    // Ceiling beams
    for (let x = -ROOM_HALF + 4; x <= ROOM_HALF - 4; x += 8) {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.25, S),
            new THREE.MeshStandardMaterial({ color: 0x222235, metalness: 0.5, roughness: 0.4 })
        );
        beam.position.set(x, wallH - 0.13, 0);
        scene.add(beam);
    }

    // === RUBBER MATS under equipment areas ===
    const matGeo = new THREE.BoxGeometry(4, 0.1, 4);
    [[-6, 0.05, -6], [6, 0.05, -6], [-6, 0.05, 4], [6, 0.05, 4]].forEach(pos => {
        const mat = new THREE.Mesh(matGeo, RUBBER_MAT);
        mat.position.set(...pos);
        mat.receiveShadow = true;
        scene.add(mat);
    });
}

// ============================================================
// PROPS — decorative items to fill the gym
// ============================================================
function buildProps() {
    // Water cooler
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(-12, 0, 8);
    // Body
    coolerGroup.add(makeMesh(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 12), { color: 0x555577, metalness: 0.3, roughness: 0.5 }, [0, 0.5, 0]));
    // Water jug
    coolerGroup.add(makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12), { color: 0x88bbff, transparent: true, opacity: 0.4, roughness: 0.1 }, [0, 1.2, 0]));
    // Spout
    coolerGroup.add(makeMesh(new THREE.BoxGeometry(0.06, 0.04, 0.15), { color: 0xcccccc, metalness: 0.9 }, [0, 0.6, 0.28]));
    scene.add(coolerGroup);

    // Towel rack with towels
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-12, 0, -2);
    rackGroup.add(makeMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), CHROME.clone(), [-0.3, 0.75, 0]));
    rackGroup.add(makeMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), CHROME.clone(), [0.3, 0.75, 0]));
    rackGroup.add(makeMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), CHROME.clone(), [0, 1.3, 0], [0, 0, Math.PI / 2]));
    // Towels draped
    const towelColors = [0xe94560, 0x4fc3f7, 0xffd93d];
    towelColors.forEach((c, i) => {
        const towel = makeMesh(new THREE.BoxGeometry(0.4, 0.03, 0.15),
            { color: c, roughness: 0.95 },
            [-0.15 + i * 0.15, 1.25, 0.08], [0.3, 0, 0]);
        rackGroup.add(towel);
    });
    scene.add(rackGroup);

    // Weight plates stacked on floor
    const stackGroup = new THREE.Group();
    stackGroup.position.set(8, 0, -10);
    const plateColors = [0xe94560, 0xff6b6b, 0x444466, 0xe94560, 0x333344];
    plateColors.forEach((c, i) => {
        stackGroup.add(makeMesh(
            new THREE.CylinderGeometry(0.35 - i * 0.03, 0.35 - i * 0.03, 0.05, 24),
            { color: c, metalness: 0.4, roughness: 0.5 },
            [0, 0.025 + i * 0.06, 0]
        ));
    });
    scene.add(stackGroup);

    // Kettlebells
    [-4, -3.4, -2.8].forEach((x, i) => {
        const kbGroup = new THREE.Group();
        kbGroup.position.set(x, 0, -11);
        const sizes = [0.14, 0.16, 0.18];
        const colors = [0xffd93d, 0xe94560, 0x4fc3f7];
        // Ball
        kbGroup.add(makeMesh(new THREE.SphereGeometry(sizes[i], 16, 12), { color: colors[i], metalness: 0.4, roughness: 0.5 }, [0, sizes[i], 0]));
        // Handle
        const handleCurve = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI);
        const handle = new THREE.Mesh(handleCurve, CHROME.clone());
        handle.position.set(0, sizes[i] * 2 + 0.02, 0);
        kbGroup.add(handle);
        scene.add(kbGroup);
    });

    // Motivational wall signs (back wall)
    addWallSign('PUSH YOUR LIMITS', 0, 3.8, -ROOM_HALF + 0.02, 0xe94560);
    addWallSign('NO EXCUSES', -7, 1.5, -ROOM_HALF + 0.02, 0x4fc3f7);
    addWallSign('BEAST MODE', 7, 1.5, -ROOM_HALF + 0.02, 0xffd93d);

    // Clock on left wall
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-ROOM_HALF + 0.05, 3.5, 0);
    clockGroup.rotation.y = Math.PI / 2;
    // Face
    clockGroup.add(makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32), { color: 0x222235, roughness: 0.8 }, [0, 0, 0], [Math.PI / 2, 0, 0]));
    // Rim
    clockGroup.add(makeMesh(new THREE.TorusGeometry(0.5, 0.03, 8, 32), { color: 0xcccccc, metalness: 0.9, roughness: 0.1 }, [0, 0, 0], [Math.PI / 2, 0, 0]));
    // Hour marks
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const mark = makeMesh(new THREE.BoxGeometry(0.02, 0.08, 0.01), { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 },
            [Math.sin(angle) * 0.4, Math.cos(angle) * 0.4, 0.03]);
        clockGroup.add(mark);
    }
    scene.add(clockGroup);

    // Yoga/exercise balls
    [{ pos: [10, 0.4, 8], color: 0xe94560, r: 0.4 }, { pos: [11, 0.3, 7], color: 0x4fc3f7, r: 0.3 }].forEach(({ pos, color, r }) => {
        const ball = makeMesh(new THREE.SphereGeometry(r, 24, 16), { color, roughness: 0.6, metalness: 0.05 }, pos);
        ball.castShadow = true;
        scene.add(ball);
    });

    // Foam rollers
    [11, 10.5].forEach((x, i) => {
        const roller = makeMesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16),
            { color: i === 0 ? 0x333355 : 0x4fc3f7, roughness: 0.9 },
            [x, 0.08, -3], [0, 0, Math.PI / 2]
        );
        roller.castShadow = true;
        scene.add(roller);
    });

    // Bench along back wall (simple rest bench)
    const restBench = new THREE.Group();
    restBench.position.set(-10, 0, -11);
    restBench.add(makeMesh(new THREE.BoxGeometry(2, 0.08, 0.6), { color: 0x3a2520, roughness: 0.85 }, [0, 0.48, 0]));
    [[-0.85, 0.24, -0.22], [-0.85, 0.24, 0.22], [0.85, 0.24, -0.22], [0.85, 0.24, 0.22]].forEach(p => {
        restBench.add(makeMesh(new THREE.BoxGeometry(0.06, 0.48, 0.06), DARK_METAL.clone(), p));
    });
    scene.add(restBench);

    // Resistance bands hanging on right wall
    const bandColors = [0xe94560, 0xffd93d, 0x4ade80, 0x4fc3f7, 0xc084fc];
    bandColors.forEach((c, i) => {
        const band = makeMesh(
            new THREE.TorusGeometry(0.2, 0.015, 8, 24),
            { color: c, roughness: 0.9 },
            [ROOM_HALF - 0.05, 2.2, -6 + i * 0.6], [0, Math.PI / 2, 0]
        );
        scene.add(band);
    });
}

function makeMesh(geo, matProps, pos, rot) {
    const mat = matProps instanceof THREE.Material ? matProps : new THREE.MeshStandardMaterial(matProps);
    const mesh = new THREE.Mesh(geo, mat);
    if (pos) mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    mesh.castShadow = true;
    return mesh;
}

function addWallSign(text, x, y, z, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15,15,25,0.85)';
    roundRect(ctx, 0, 0, 512, 128, 16);
    ctx.fill();
    ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 3;
    roundRect(ctx, 2, 2, 508, 124, 14);
    ctx.stroke();
    ctx.font = 'bold 44px Fredoka, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.shadowColor = `#${color.toString(16).padStart(6, '0')}`;
    ctx.shadowBlur = 20;
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

// ============================================================
// EQUIPMENT BUILDERS — detailed models
// ============================================================
function buildEquipment() {
    buildBenchPress(new THREE.Vector3(-6, 0, -6));
    buildDumbbellRack(new THREE.Vector3(7, 0, -6));
    buildTreadmill(new THREE.Vector3(-6, 0, 4));
    buildPullUpBar(new THREE.Vector3(0, 0, -10));
    buildPunchingBag(new THREE.Vector3(7, 0, 4));
    buildMirror(new THREE.Vector3(ROOM_HALF - 0.1, 0, 0));
}

function makeInteractable(mesh, contentKey) {
    mesh.userData = { contentKey };
    interactables.push(mesh);
}

function addHitbox(pos, size, contentKey) {
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(...pos);
    scene.add(hitbox);
    makeInteractable(hitbox, contentKey);
}

function buildBenchPress(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Frame — thick steel tube construction
    const tube = (r, h) => new THREE.CylinderGeometry(r, r, h, 12);

    // Four legs with cross-bracing
    const legPositions = [[-0.45, 0, -0.7], [0.45, 0, -0.7], [-0.45, 0, 0.7], [0.45, 0, 0.7]];
    legPositions.forEach(([x, , z]) => {
        g.add(makeMesh(tube(0.035, 0.5), DARK_METAL.clone(), [x, 0.25, z]));
        // Rubber foot
        g.add(makeMesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 12), RUBBER_MAT.clone(), [x, 0.015, z]));
    });

    // Horizontal frame rails
    g.add(makeMesh(tube(0.03, 1.4), DARK_METAL.clone(), [-0.45, 0.5, 0], [0, 0, 0]));
    g.add(makeMesh(tube(0.03, 1.4), DARK_METAL.clone(), [0.45, 0.5, 0], [0, 0, 0]));

    // Seat pad (inclined slightly)
    g.add(makeMesh(new THREE.BoxGeometry(0.45, 0.1, 0.45), RED_LEATHER.clone(), [0, 0.53, 0.5]));
    // Back pad
    const backPad = makeMesh(new THREE.BoxGeometry(0.45, 0.1, 1.0), RED_LEATHER.clone(), [0, 0.56, -0.15]);
    backPad.rotation.x = -0.08;
    g.add(backPad);

    // Uprights (heavier, taller)
    [-0.5, 0.5].forEach(x => {
        g.add(makeMesh(tube(0.04, 1.5), DARK_METAL.clone(), [x, 1.25, -0.7]));
        // J-hooks
        g.add(makeMesh(new THREE.BoxGeometry(0.06, 0.03, 0.12), CHROME.clone(), [x, 1.6, -0.62]));
        g.add(makeMesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), CHROME.clone(), [x, 1.62, -0.55]));
    });

    // Barbell
    g.add(makeMesh(tube(0.018, 2.2), CHROME.clone(), [0, 1.65, -0.7], [0, 0, Math.PI / 2]));

    // Collars
    [-0.55, 0.55].forEach(x => {
        g.add(makeMesh(tube(0.03, 0.04), DARK_METAL.clone(), [x, 1.65, -0.7], [0, 0, Math.PI / 2]));
    });

    // Weight plates (multiple sizes stacked)
    [-1, 1].forEach(side => {
        const plateConfigs = [
            { r: 0.22, w: 0.04, offset: 0.62, color: 0xe94560 },
            { r: 0.22, w: 0.04, offset: 0.67, color: 0xe94560 },
            { r: 0.17, w: 0.03, offset: 0.72, color: 0x333344 },
            { r: 0.13, w: 0.025, offset: 0.76, color: 0x444466 },
        ];
        plateConfigs.forEach(({ r, w, offset, color }) => {
            const plate = makeMesh(
                new THREE.CylinderGeometry(r, r, w, 24),
                { color, metalness: 0.5, roughness: 0.4 },
                [side * offset, 1.65, -0.7], [0, 0, Math.PI / 2]
            );
            g.add(plate);
        });
    });

    scene.add(g);
    addHitbox([pos.x, 1, pos.z], [1.5, 2, 2], 'benchPress');
    addLabel(g, 'Experience', 0, 2.5, 0);
}

function buildDumbbellRack(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // A-frame rack structure
    const frameMat = DARK_METAL.clone();

    // Vertical posts
    [[-1.2, 0], [-0.4, 0], [0.4, 0], [1.2, 0]].forEach(([x, z]) => {
        g.add(makeMesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 10), frameMat, [x, 0.7, z]));
    });

    // Three shelves
    const shelfGeo = new THREE.BoxGeometry(2.6, 0.04, 0.45);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.6, roughness: 0.35 });
    [0.3, 0.7, 1.1].forEach(y => {
        g.add(makeMesh(shelfGeo, shelfMat, [0, y, 0]));
    });

    // Dumbbells — proper shape with hex weights
    const dbColors = [0xe94560, 0xff6b6b, 0xffd93d, 0x4fc3f7, 0x4ade80, 0xc084fc, 0xff8a65, 0x90caf9, 0xef5350];
    let idx = 0;
    [0.4, 0.8, 1.2].forEach(y => {
        for (let x = -1.0; x <= 1.0; x += 0.5) {
            const dbColor = dbColors[idx % dbColors.length];
            const dbMat = new THREE.MeshStandardMaterial({ color: dbColor, metalness: 0.35, roughness: 0.55 });
            // Handle
            g.add(makeMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), CHROME.clone(), [x, y + 0.06, 0.02], [0, 0, Math.PI / 2]));
            // Hex weight ends
            [-0.11, 0.11].forEach(dx => {
                g.add(makeMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 6), dbMat, [x + dx, y + 0.06, 0.02], [0, 0, Math.PI / 2]));
            });
            idx++;
        }
    });

    // Brand plate on top
    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 256;
    brandCanvas.height = 64;
    const bctx = brandCanvas.getContext('2d');
    bctx.fillStyle = '#1a1a28';
    bctx.fillRect(0, 0, 256, 64);
    bctx.font = 'bold 28px Arial';
    bctx.fillStyle = '#e94560';
    bctx.textAlign = 'center';
    bctx.fillText('PRO FITNESS', 128, 40);
    const brandTex = new THREE.CanvasTexture(brandCanvas);
    const brandMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: brandTex }));
    brandMesh.position.set(0, 1.42, 0.01);
    g.add(brandMesh);

    scene.add(g);
    addHitbox([pos.x, 0.8, pos.z], [3, 1.8, 1.2], 'dumbbellRack');
    addLabel(g, 'Skills', 0, 2, 0);
}

function buildTreadmill(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Base platform
    g.add(makeMesh(new THREE.BoxGeometry(0.9, 0.08, 2.2), DARK_METAL.clone(), [0, 0.04, 0]));

    // Running deck (slightly raised)
    g.add(makeMesh(new THREE.BoxGeometry(0.7, 0.04, 1.9), MATTE_BLACK.clone(), [0, 0.1, 0.05]));

    // Belt surface with texture feel
    const beltCanvas = document.createElement('canvas');
    beltCanvas.width = 128;
    beltCanvas.height = 256;
    const bctx = beltCanvas.getContext('2d');
    bctx.fillStyle = '#1a1a22';
    bctx.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 256; i += 4) {
        bctx.fillStyle = i % 8 === 0 ? '#1d1d25' : '#171720';
        bctx.fillRect(0, i, 128, 2);
    }
    const beltTex = new THREE.CanvasTexture(beltCanvas);
    beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping;
    const belt = makeMesh(new THREE.PlaneGeometry(0.65, 1.85), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.95 }), [0, 0.13, 0.05], [-Math.PI / 2, 0, 0]);
    belt.receiveShadow = true;
    g.add(belt);
    animatedObjects.push({ mesh: belt, type: 'belt', tex: beltTex });

    // Side rails
    [-0.4, 0.4].forEach(x => {
        g.add(makeMesh(new THREE.BoxGeometry(0.08, 0.04, 2.0), new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.7, roughness: 0.3 }), [x, 0.12, 0.05]));
    });

    // Front motor cover (rounded)
    g.add(makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.65, 16), DARK_METAL.clone(), [0, 0.1, -1.0], [0, 0, Math.PI / 2]));

    // Rear roller
    g.add(makeMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 16), DARK_METAL.clone(), [0, 0.1, 1.0], [0, 0, Math.PI / 2]));

    // Upright arms
    [-0.35, 0.35].forEach(x => {
        g.add(makeMesh(new THREE.CylinderGeometry(0.025, 0.03, 1.3, 10), CHROME.clone(), [x, 0.78, -0.95]));
        // Handrail extension
        g.add(makeMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.8, 8), CHROME.clone(), [x, 0.75, -0.5], [Math.PI / 2, 0, 0]));
    });

    // Console / dashboard
    const consoleMesh = makeMesh(new THREE.BoxGeometry(0.75, 0.45, 0.1), DARK_METAL.clone(), [0, 1.35, -0.95]);
    consoleMesh.rotation.x = -0.2;
    g.add(consoleMesh);

    // Screen
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 128;
    const sctx = screenCanvas.getContext('2d');
    // Gradient background
    const grad = sctx.createLinearGradient(0, 0, 256, 128);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#0d2040');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 128);
    // Data display
    sctx.font = 'bold 22px monospace';
    sctx.fillStyle = '#4fc3f7';
    sctx.fillText('SPEED  5.2', 20, 40);
    sctx.fillStyle = '#e94560';
    sctx.fillText('DIST  2.4km', 20, 70);
    sctx.fillStyle = '#ffd93d';
    sctx.fillText('CAL   186', 20, 100);
    // Pulse animation bar
    sctx.fillStyle = '#4fc3f7';
    for (let i = 0; i < 30; i++) {
        const h = Math.sin(i * 0.5) * 20 + 25;
        sctx.fillRect(160 + i * 3, 64 - h / 2, 2, h);
    }
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.3), new THREE.MeshBasicMaterial({ map: screenTex }));
    screen.position.set(0, 1.38, -0.9);
    screen.rotation.x = -0.2;
    g.add(screen);

    // Accent LED strip under deck
    const ledStrip = makeMesh(new THREE.BoxGeometry(0.72, 0.015, 2.05), NEON_BLUE.clone(), [0, 0.01, 0.05]);
    g.add(ledStrip);

    scene.add(g);
    addHitbox([pos.x, 0.8, pos.z], [1.4, 2, 2.8], 'treadmill');
    addLabel(g, 'Projects', 0, 2.2, 0);
}

function buildPullUpBar(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Heavy-duty power rack style
    const posts = [[-1.2, 0, -0.4], [1.2, 0, -0.4], [-1.2, 0, 0.4], [1.2, 0, 0.4]];
    posts.forEach(([x, , z]) => {
        // Main post (thick square tube)
        g.add(makeMesh(new THREE.BoxGeometry(0.1, 3.2, 0.1), DARK_METAL.clone(), [x, 1.6, z]));
        // Base plate
        g.add(makeMesh(new THREE.BoxGeometry(0.25, 0.03, 0.25), DARK_METAL.clone(), [x, 0.015, z]));
    });

    // Top cross bars
    [0.4, -0.4].forEach(z => {
        g.add(makeMesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), DARK_METAL.clone(), [0, 3.15, z]));
    });
    [-1.2, 1.2].forEach(x => {
        g.add(makeMesh(new THREE.BoxGeometry(0.08, 0.08, 0.8), DARK_METAL.clone(), [x, 3.15, 0]));
    });

    // Pull-up bar (front, chrome, wider)
    g.add(makeMesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 16), CHROME.clone(), [0, 3.0, -0.4], [0, 0, Math.PI / 2]));

    // Angled grip handles
    [-0.9, 0.9].forEach(x => {
        const handleGroup = new THREE.Group();
        // Angled bar going forward and down
        handleGroup.add(makeMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), CHROME.clone(), [0, -0.1, 0.15], [0.5, 0, 0]));
        handleGroup.position.set(x, 3.0, -0.4);
        g.add(handleGroup);
    });

    // Grip wraps on bar
    for (let x = -0.8; x <= 0.8; x += 0.2) {
        g.add(makeMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 }),
            [x, 3.0, -0.4], [0, 0, Math.PI / 2]));
    }

    // Weight pegs on sides
    [-1.2, 1.2].forEach(x => {
        g.add(makeMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), CHROME.clone(), [x, 1.5, 0.6], [Math.PI / 2, 0, 0]));
        // Some plates on pegs
        for (let i = 0; i < 3; i++) {
            g.add(makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20),
                { color: 0x444466, metalness: 0.5, roughness: 0.4 },
                [x, 1.5, 0.45 + i * 0.05], [Math.PI / 2, 0, 0]));
        }
    });

    // Number plate / branding
    const numCanvas = document.createElement('canvas');
    numCanvas.width = 128;
    numCanvas.height = 64;
    const nctx = numCanvas.getContext('2d');
    nctx.fillStyle = '#1a1a28';
    nctx.fillRect(0, 0, 128, 64);
    nctx.font = 'bold 24px Arial';
    nctx.fillStyle = '#ffd93d';
    nctx.textAlign = 'center';
    nctx.fillText('STATION 1', 64, 40);
    const numTex = new THREE.CanvasTexture(numCanvas);
    const numPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: numTex }));
    numPlate.position.set(0, 2.5, -0.41);
    g.add(numPlate);

    scene.add(g);
    addHitbox([pos.x, 1.6, pos.z], [3, 3.4, 1.5], 'pullUpBar');
    addLabel(g, 'Education', 0, 3.6, 0);
}

function buildPunchingBag(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Ceiling mount bracket
    g.add(makeMesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), DARK_METAL.clone(), [0, 5.44, 0]));
    g.add(makeMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), DARK_METAL.clone(), [0, 5.35, 0]));

    // Swivel
    g.add(makeMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), CHROME.clone(), [0, 5.23, 0]));

    // Chains (4 chains converging)
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.2 });
    [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.1], [0.1, -0.1]].forEach(([x, z]) => {
        // Chain links approximated as thin cylinders
        for (let y = 4.6; y < 5.2; y += 0.08) {
            g.add(makeMesh(new THREE.TorusGeometry(0.02, 0.005, 6, 8), chainMat,
                [x * (5.2 - y) / 0.6, y, z * (5.2 - y) / 0.6],
                [Math.PI / 2, 0, 0]));
        }
    });

    // Bag — proper heavy bag shape using lathe
    const bagPoints = [];
    const bagProfile = [
        [0, 4.55], [0.15, 4.5], [0.25, 4.4], [0.3, 4.2],
        [0.32, 3.8], [0.32, 3.4], [0.3, 3.1], [0.28, 3.0],
        [0.22, 2.95], [0.1, 2.92], [0, 2.9]
    ];
    bagProfile.forEach(([r, y]) => bagPoints.push(new THREE.Vector2(r, y)));
    const bagGeo = new THREE.LatheGeometry(bagPoints, 24);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xb52030, roughness: 0.82, metalness: 0.05 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.castShadow = true;
    g.add(bag);

    // Stitching lines (vertical seams)
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const seamGeo = new THREE.CylinderGeometry(0.003, 0.003, 1.5, 4);
        const seam = new THREE.Mesh(seamGeo, new THREE.MeshBasicMaterial({ color: 0x661520 }));
        seam.position.set(Math.sin(angle) * 0.315, 3.65, Math.cos(angle) * 0.315);
        g.add(seam);
    }

    // Brand logo area
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 128;
    logoCanvas.height = 128;
    const lctx = logoCanvas.getContext('2d');
    lctx.fillStyle = '#8a1525';
    lctx.beginPath();
    lctx.arc(64, 64, 50, 0, Math.PI * 2);
    lctx.fill();
    lctx.font = 'bold 28px Arial';
    lctx.fillStyle = '#ffffff';
    lctx.textAlign = 'center';
    lctx.fillText('GYM', 64, 72);
    const logoTex = new THREE.CanvasTexture(logoCanvas);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
    logo.position.set(0, 3.7, 0.33);
    g.add(logo);

    // Animate gentle swing
    animatedObjects.push({ mesh: g, type: 'swing' });

    scene.add(g);
    addHitbox([pos.x, 3.5, pos.z], [1.2, 2.5, 1.2], 'punchingBag');
    addLabel(g, 'About Me', 0, 4.8, 0);
}

function buildMirror(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Large wall mirror with industrial frame
    const mirrorW = 5;
    const mirrorH = 3.5;

    // Outer frame (thick)
    g.add(makeMesh(new THREE.BoxGeometry(0.12, mirrorH + 0.2, mirrorW + 0.2),
        new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.7, roughness: 0.25 }),
        [0, mirrorH / 2 + 0.5, 0]));

    // Mirror surface — very reflective
    const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0xaabbcc,
        metalness: 0.98,
        roughness: 0.02,
    });
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(mirrorW, mirrorH), mirrorMat);
    mirror.position.set(-0.07, mirrorH / 2 + 0.5, 0);
    mirror.rotation.y = -Math.PI / 2;
    g.add(mirror);

    // LED strip around mirror edge (glowing frame)
    const stripW = mirrorW + 0.1;
    const stripH = mirrorH + 0.1;
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x4fc3f7, emissiveIntensity: 1.2 });
    // Top
    g.add(makeMesh(new THREE.BoxGeometry(0.03, 0.03, stripW), ledMat, [-0.06, mirrorH / 2 + 0.5 + stripH / 2, 0]));
    // Bottom
    g.add(makeMesh(new THREE.BoxGeometry(0.03, 0.03, stripW), ledMat, [-0.06, mirrorH / 2 + 0.5 - stripH / 2, 0]));
    // Left
    g.add(makeMesh(new THREE.BoxGeometry(0.03, stripH, 0.03), ledMat, [-0.06, mirrorH / 2 + 0.5, -stripW / 2]));
    // Right
    g.add(makeMesh(new THREE.BoxGeometry(0.03, stripH, 0.03), ledMat, [-0.06, mirrorH / 2 + 0.5, stripW / 2]));

    // Light from the LED strip
    const mLight = new THREE.PointLight(0x4fc3f7, 0.8, 8);
    mLight.position.set(-0.5, 2.5, 0);
    g.add(mLight);

    // "CONTACT ME" neon sign above mirror
    const neonCanvas = document.createElement('canvas');
    neonCanvas.width = 512;
    neonCanvas.height = 96;
    const nctx = neonCanvas.getContext('2d');
    nctx.font = 'bold 52px Fredoka, Arial';
    nctx.textAlign = 'center';
    nctx.textBaseline = 'middle';
    nctx.shadowColor = '#e94560';
    nctx.shadowBlur = 30;
    nctx.fillStyle = '#ff6b7a';
    nctx.fillText('CONTACT ME', 256, 48);
    nctx.shadowBlur = 15;
    nctx.fillText('CONTACT ME', 256, 48);
    const neonTex = new THREE.CanvasTexture(neonCanvas);
    const neonSign = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.5), new THREE.MeshBasicMaterial({ map: neonTex, transparent: true }));
    neonSign.position.set(-0.08, mirrorH + 0.9, 0);
    neonSign.rotation.y = -Math.PI / 2;
    g.add(neonSign);

    // Glow light from neon sign
    const neonLight = new THREE.PointLight(0xe94560, 0.6, 6);
    neonLight.position.set(-0.5, mirrorH + 0.9, 0);
    g.add(neonLight);
    animatedObjects.push({ mesh: neonSign, type: 'neonFlicker', light: neonLight });

    scene.add(g);
    addHitbox([pos.x - 0.8, 2.5, pos.z], [2, 4, 5.5], 'mirror');
    addLabel(g, 'Contact', -1, mirrorH + 1.5, 0);
}

// ============================================================
// FLOATING LABELS
// ============================================================
function addLabel(group, text, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const pw = metrics.width + 50;
    const ph = 52;
    const px = 160 - pw / 2;
    const py = 14;

    // Rounded bg
    ctx.fillStyle = 'rgba(10,10,20,0.75)';
    roundRect(ctx, px, py, pw, ph, 26);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(233,69,96,0.5)';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, pw, ph, 26);
    ctx.stroke();

    // Text with glow
    ctx.shadowColor = '#ffd93d';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffd93d';
    ctx.fillText(text, 160, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(2.5, 0.625, 1);
    group.add(sprite);

    animatedObjects.push({ mesh: sprite, type: 'float', baseY: y });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ============================================================
// EVENTS
// ============================================================
function setupEvents() {
    document.addEventListener('pointerlockchange', () => {
        isLocked = document.pointerLockElement === renderer.domElement;
        document.getElementById('crosshair').style.display = isLocked ? 'block' : 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isLocked) return;
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= (e.movementX || 0) * 0.002;
        euler.x -= (e.movementY || 0) * 0.002;
        euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
        camera.quaternion.setFromEuler(euler);
    });

    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = true; break;
            case 'KeyS': case 'ArrowDown': moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'Escape':
                if (panelOpen) { closePanel(); e.preventDefault(); }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = false; break;
            case 'KeyS': case 'ArrowDown': moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': moveRight = false; break;
        }
    });

    document.addEventListener('click', () => {
        if (!isLocked || panelOpen) return;
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        if (intersects.length > 0 && intersects[0].distance < 8) {
            openPanel(intersects[0].object.userData.contentKey);
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ============================================================
// PANEL
// ============================================================
function openPanel(contentKey) {
    const data = CONTENT[contentKey];
    if (!data) return;
    panelOpen = true;
    document.exitPointerLock();
    document.getElementById('panel-icon').textContent = data.icon;
    document.getElementById('panel-title').textContent = data.title;
    document.getElementById('panel-content').innerHTML = data.html;
    document.getElementById('info-panel').style.display = 'block';
    document.getElementById('interact-hint').style.display = 'none';
}

function closePanel() {
    panelOpen = false;
    document.getElementById('info-panel').style.display = 'none';
    setTimeout(() => renderer.domElement.requestPointerLock(), 100);
}

// ============================================================
// ANIMATION LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Player movement
    if (isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        if (moveForward || moveBackward) velocity.z -= direction.z * MOVE_SPEED * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * MOVE_SPEED * delta;

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        camera.position.addScaledVector(forward, -velocity.z * delta);
        camera.position.addScaledVector(right, -velocity.x * delta);

        const margin = 1.2;
        camera.position.x = Math.max(-ROOM_HALF + margin, Math.min(ROOM_HALF - margin, camera.position.x));
        camera.position.z = Math.max(-ROOM_HALF + margin, Math.min(ROOM_HALF - margin, camera.position.z));
        camera.position.y = PLAYER_HEIGHT;

        // Hover detection
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        const hint = document.getElementById('interact-hint');
        hint.style.display = (intersects.length > 0 && intersects[0].distance < 8) ? 'block' : 'none';
    }

    // Animate objects
    animatedObjects.forEach(obj => {
        if (obj.type === 'float') {
            obj.mesh.position.y = obj.baseY + Math.sin(elapsed * 1.5 + obj.baseY) * 0.08;
        } else if (obj.type === 'swing') {
            obj.mesh.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
            obj.mesh.rotation.x = Math.cos(elapsed * 0.6) * 0.02;
        } else if (obj.type === 'belt') {
            obj.tex.offset.y -= delta * 0.5;
        } else if (obj.type === 'neonFlicker') {
            const flicker = 0.8 + Math.sin(elapsed * 8) * 0.1 + Math.sin(elapsed * 23) * 0.1;
            obj.mesh.material.opacity = flicker;
            if (obj.light) obj.light.intensity = flicker * 0.6;
        }
    });

    renderer.render(scene, camera);
}

// ============================================================
// START
// ============================================================
init();
