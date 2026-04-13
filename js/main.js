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
    },
    // Fun fact objects scattered around the gym
    soccerBall: {
        icon: '⚽',
        title: 'Fun Fact',
        html: `
            <h3>Soccer is my passion</h3>
            <p>I'm a huge soccer fan — Real Madrid is my favorite team. ¡Hala Madrid!</p>
            <p>There's nothing like watching a Champions League night at the Bernabéu.</p>
        `
    },
    trophy: {
        icon: '🏆',
        title: 'Fun Fact',
        html: `
            <h3>Bench Press Record Holder</h3>
            <p>I hold my high school's all-time bench press record.</p>
            <p>Lots of early mornings in the weight room paid off.</p>
        `
    },
    guitar: {
        icon: '🎸',
        title: 'Fun Fact',
        html: `
            <h3>I play the guitar</h3>
            <p>Picking up a guitar is one of my favorite ways to unwind. Whether it's jamming to a favorite song or just messing around with chords, it always clears my head.</p>
        `
    },
    movies: {
        icon: '🎬',
        title: 'Fun Fact',
        html: `
            <h3>Movie Enthusiast</h3>
            <p>I love watching movies — from classic thrillers to the latest blockbusters. Ask me for a recommendation any time.</p>
        `
    },
    boardGames: {
        icon: '🎲',
        title: 'Fun Fact',
        html: `
            <h3>Board Game Night</h3>
            <p>I love a good board game night. Strategy games, party games, anything that gets people around a table — I'm in.</p>
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
const MOVE_SPEED = 70;
const ROOM_HALF = 11; // smaller, cozier room (was 14)

// Shared materials — cool calm palette
const CHROME = new THREE.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.95, roughness: 0.08 });
const DARK_METAL = new THREE.MeshStandardMaterial({ color: 0x4a5260, metalness: 0.8, roughness: 0.25 });
const MATTE_SLATE = new THREE.MeshStandardMaterial({ color: 0x3a4150, roughness: 0.9, metalness: 0.08 });
const SEAT_LEATHER = new THREE.MeshStandardMaterial({ color: 0x7aa8c2, roughness: 0.75, metalness: 0.05 });
const RUBBER_MAT = new THREE.MeshStandardMaterial({ color: 0x5a5f6a, roughness: 0.98, metalness: 0 });
const SOFT_BLUE = new THREE.MeshStandardMaterial({ color: 0x7aa8c2, emissive: 0x7aa8c2, emissiveIntensity: 0.9 });
const SAGE = new THREE.MeshStandardMaterial({ color: 0x9bc1a6, emissive: 0x9bc1a6, emissiveIntensity: 0.9 });
const CREAM_GLOW = new THREE.MeshStandardMaterial({ color: 0xf5ecd3, emissive: 0xe3cfa0, emissiveIntensity: 0.8 });
// Backwards-compat aliases for legacy variable names used lower in this file
const MATTE_BLACK = MATTE_SLATE;
const RED_LEATHER = SEAT_LEATHER;
const NEON_PINK = SOFT_BLUE;
const NEON_BLUE = SAGE;
const NEON_YELLOW = CREAM_GLOW;

// ============================================================
// INIT
// ============================================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2ead7);
    scene.fog = new THREE.FogExp2(0xf2ead7, 0.018);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, PLAYER_HEIGHT, ROOM_HALF - 1.5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
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
    }, 2300);

    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('welcome-overlay').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        document.getElementById('controls-reminder').style.display = 'block';
        document.getElementById('gym-menu-btn').style.display = 'flex';
        renderer.domElement.requestPointerLock();
    });

    document.getElementById('close-panel').addEventListener('click', closePanel);
    setupPauseMenu();
    animate();
}

// ============================================================
// PAUSE MENU
// ============================================================
let pauseOpen = false;

function openPauseMenu() {
    if (pauseOpen || panelOpen) return;
    pauseOpen = true;
    document.exitPointerLock();
    const pm = document.getElementById('pause-menu');
    pm.classList.remove('fade-out');
    pm.style.display = 'flex';
    const card = pm.querySelector('.pause-card');
    if (card) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
    }
}

function closePauseMenu() {
    if (!pauseOpen) return;
    pauseOpen = false;
    const pm = document.getElementById('pause-menu');
    pm.classList.add('fade-out');
    setTimeout(() => {
        pm.style.display = 'none';
        pm.classList.remove('fade-out');
        if (renderer && renderer.domElement) {
            renderer.domElement.requestPointerLock();
        }
    }, 280);
}

function exitGymToLanding() {
    // Simplest, most reliable path: reload. Landing page is the default entry.
    window.location.reload();
}

function setupPauseMenu() {
    document.getElementById('gym-menu-btn').addEventListener('click', openPauseMenu);
    document.getElementById('pause-resume').addEventListener('click', closePauseMenu);
    document.getElementById('pause-exit').addEventListener('click', exitGymToLanding);
}

// ============================================================
// LIGHTING — dramatic gym atmosphere
// ============================================================
function setupLighting() {
    // Soft cool ambient
    scene.add(new THREE.AmbientLight(0xf5f0e0, 1.8));

    // Hemisphere — cream sky, soft beige floor bounce
    scene.add(new THREE.HemisphereLight(0xfaf4e3, 0xc7b896, 1.2));

    // Key fill from front
    const fillDir = new THREE.DirectionalLight(0xfffaea, 0.9);
    fillDir.position.set(2, 9, 8);
    fillDir.castShadow = true;
    fillDir.shadow.mapSize.set(1024, 1024);
    fillDir.shadow.camera.left = -14;
    fillDir.shadow.camera.right = 14;
    fillDir.shadow.camera.top = 14;
    fillDir.shadow.camera.bottom = -14;
    scene.add(fillDir);

    // Overhead pendant lights — soft cream
    const fixturePositions = [
        [-4.5, 4.1, -4.5], [4.5, 4.1, -4.5],
        [-4.5, 4.1, 4.5], [4.5, 4.1, 4.5],
        [0, 4.1, 0]
    ];
    fixturePositions.forEach(pos => {
        const pl = new THREE.PointLight(0xfff2d8, 2.2, 18, 1.4);
        pl.position.set(pos[0], pos[1] - 0.25, pos[2]);
        scene.add(pl);

        // Pendant cord
        const cord = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.8, 6),
            new THREE.MeshStandardMaterial({ color: 0x3a4150 })
        );
        cord.position.set(pos[0], pos[1] + 0.4, pos[2]);
        scene.add(cord);

        // Shade — inverted cone, brass/cream
        const shade = new THREE.Mesh(
            new THREE.ConeGeometry(0.28, 0.35, 18, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xe3cfa0, metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide })
        );
        shade.position.set(pos[0], pos[1] - 0.05, pos[2]);
        scene.add(shade);

        // Glowing bulb
        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 12, 10),
            new THREE.MeshStandardMaterial({ color: 0xfff6df, emissive: 0xfff6df, emissiveIntensity: 2.8 })
        );
        bulb.position.set(pos[0], pos[1] - 0.24, pos[2]);
        scene.add(bulb);
    });

    // Accent uplights at the four corners — alternating blue / sage / cream
    const cornerLights = [
        { pos: [-ROOM_HALF + 0.6, 0.15, -ROOM_HALF + 0.6], color: 0x7aa8c2 },
        { pos: [ROOM_HALF - 0.6, 0.15, -ROOM_HALF + 0.6], color: 0x9bc1a6 },
        { pos: [-ROOM_HALF + 0.6, 0.15, ROOM_HALF - 0.6], color: 0xe3cfa0 },
        { pos: [ROOM_HALF - 0.6, 0.15, ROOM_HALF - 0.6], color: 0x7aa8c2 }
    ];
    cornerLights.forEach(({ pos, color }) => {
        const up = new THREE.PointLight(color, 1.4, 6, 1.5);
        up.position.set(...pos);
        scene.add(up);

        // Small floor puck fixture
        const puck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.14, 0.1, 14),
            new THREE.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.6, roughness: 0.3 })
        );
        puck.position.set(pos[0], 0.05, pos[2]);
        scene.add(puck);

        const glow = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2 })
        );
        glow.position.set(pos[0], 0.12, pos[2]);
        scene.add(glow);
    });

    // Soft key spotlights on equipment — pastel tones
    const spotTargets = [
        { pos: [-5.5, 4.2, -5.5], target: [-5.5, 0, -5.5], color: 0xd8ecf5 },
        { pos: [5.5, 4.2, -5.5],  target: [5.5, 0, -5.5],  color: 0xe3f0d8 },
        { pos: [-5.5, 4.2, 3.5],  target: [-5.5, 0, 3.5],  color: 0xfaf0d8 },
        { pos: [5.5, 4.2, 3.5],   target: [5.5, 0, 3.5],   color: 0xd8ecf5 },
        { pos: [0, 4.2, -7.5],    target: [0, 0, -7.5],    color: 0xe3f0d8 }
    ];
    spotTargets.forEach(({ pos, target, color }) => {
        const spot = new THREE.SpotLight(color, 2.6, 14, Math.PI / 4, 0.5, 1.0);
        spot.position.set(...pos);
        spot.target.position.set(...target);
        spot.castShadow = true;
        spot.shadow.mapSize.set(512, 512);
        scene.add(spot);
        scene.add(spot.target);
    });
}

// ============================================================
// ROOM — detailed gym interior
// ============================================================
function buildRoom() {
    const S = ROOM_HALF * 2;

    // === FLOOR: light birch / oak plank ===
    const plankW = 0.85;
    const plankColors = [0xe8d9b8, 0xd9c8a0, 0xefe1c0, 0xd3c19a, 0xe1d1a8, 0xe7d7b2];
    const plankGeo = new THREE.BoxGeometry(plankW - 0.015, 0.07, ROOM_HALF * 2 - 0.1);
    let plankIdx = 0;
    for (let x = -ROOM_HALF + plankW / 2; x < ROOM_HALF; x += plankW) {
        const col = plankColors[plankIdx % plankColors.length];
        plankIdx++;
        const plank = new THREE.Mesh(plankGeo, new THREE.MeshStandardMaterial({
            color: col, roughness: 0.55, metalness: 0.04
        }));
        plank.position.set(x, 0.035, 0);
        plank.receiveShadow = true;
        scene.add(plank);
    }

    // Sub-floor
    const subFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(S + 2, S + 2),
        new THREE.MeshStandardMaterial({ color: 0xbfa776, roughness: 1 })
    );
    subFloor.rotation.x = -Math.PI / 2;
    subFloor.position.y = -0.01;
    subFloor.receiveShadow = true;
    scene.add(subFloor);

    // Area rug in the center — soft sage
    const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 5.2),
        new THREE.MeshStandardMaterial({ color: 0x9bc1a6, roughness: 0.95 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.08, 0);
    rug.receiveShadow = true;
    scene.add(rug);
    // Rug border
    const rugBorder = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 5.5),
        new THREE.MeshStandardMaterial({ color: 0x7a9a87, roughness: 0.95 })
    );
    rugBorder.rotation.x = -Math.PI / 2;
    rugBorder.position.set(0, 0.075, 0);
    scene.add(rugBorder);

    // === WALLS: off-white plaster with warm beige baseboard ===
    const wallH = 4.5;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3ead4, roughness: 0.85, metalness: 0.02 });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xcdb98a, roughness: 0.75, metalness: 0.05 });
    const accentStripMat = new THREE.MeshStandardMaterial({ color: 0x7aa8c2, emissive: 0x7aa8c2, emissiveIntensity: 0.35 });

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

        // Upper accent — soft sage
        const accent2 = new THREE.Mesh(new THREE.PlaneGeometry(size[0], 0.015),
            new THREE.MeshStandardMaterial({ color: 0x9bc1a6, emissive: 0x9bc1a6, emissiveIntensity: 0.25 }));
        accent2.position.set(pos[0], 4.3, pos[2]);
        accent2.rotation.set(...rot);
        accent2.position.addScaledVector(dir, 0.005);
        scene.add(accent2);

        // Wall panels (vertical grooves) — soft beige
        for (let i = -ROOM_HALF + 2; i < ROOM_HALF; i += 3) {
            const groove = new THREE.Mesh(
                new THREE.PlaneGeometry(0.012, wallH - 0.5),
                new THREE.MeshStandardMaterial({ color: 0xcdb98a, roughness: 0.9 })
            );
            // Position groove along the wall face
            if (rot[1] === 0) { groove.position.set(i, wallH / 2, pos[2] + 0.006); groove.rotation.set(...rot); }
            else if (rot[1] === Math.PI) { groove.position.set(i, wallH / 2, pos[2] - 0.006); groove.rotation.set(...rot); }
            else if (rot[1] === Math.PI / 2) { groove.position.set(pos[0] + 0.006, wallH / 2, i); groove.rotation.set(...rot); }
            else { groove.position.set(pos[0] - 0.006, wallH / 2, i); groove.rotation.set(...rot); }
            scene.add(groove);
        }
    });

    // === CEILING — cream plaster ===
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(S, S),
        new THREE.MeshStandardMaterial({ color: 0xf5ecd3, roughness: 1, metalness: 0 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallH;
    scene.add(ceiling);

    // Exposed wood ceiling beams for character
    for (let x = -ROOM_HALF + 3; x <= ROOM_HALF - 3; x += 3) {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.22, S),
            new THREE.MeshStandardMaterial({ color: 0xc0a676, roughness: 0.75, metalness: 0.05 })
        );
        beam.position.set(x, wallH - 0.13, 0);
        beam.castShadow = true;
        scene.add(beam);
    }

    // === RUBBER MATS under equipment areas (smaller room = tighter layout) ===
    const matGeo = new THREE.BoxGeometry(3.2, 0.08, 3.2);
    [[-5.5, 0.05, -5.5], [5.5, 0.05, -5.5], [-5.5, 0.05, 3.5], [5.5, 0.05, 3.5]].forEach(pos => {
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
    const towelColors = [0x7aa8c2, 0x9bc1a6, 0xe3cfa0];
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
    const plateColors = [0x7aa8c2, 0x9bc1a6, 0x444466, 0x7aa8c2, 0x333344];
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
        const colors = [0xe3cfa0, 0x7aa8c2, 0x9bc1a6];
        // Ball
        kbGroup.add(makeMesh(new THREE.SphereGeometry(sizes[i], 16, 12), { color: colors[i], metalness: 0.4, roughness: 0.5 }, [0, sizes[i], 0]));
        // Handle
        const handleCurve = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI);
        const handle = new THREE.Mesh(handleCurve, CHROME.clone());
        handle.position.set(0, sizes[i] * 2 + 0.02, 0);
        kbGroup.add(handle);
        scene.add(kbGroup);
    });

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
    [{ pos: [10, 0.4, 8], color: 0x7aa8c2, r: 0.4 }, { pos: [11, 0.3, 7], color: 0x9bc1a6, r: 0.3 }].forEach(({ pos, color, r }) => {
        const ball = makeMesh(new THREE.SphereGeometry(r, 24, 16), { color, roughness: 0.6, metalness: 0.05 }, pos);
        ball.castShadow = true;
        scene.add(ball);
    });

    // Foam rollers
    [11, 10.5].forEach((x, i) => {
        const roller = makeMesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16),
            { color: i === 0 ? 0x333355 : 0x9bc1a6, roughness: 0.9 },
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
    const bandColors = [0x7aa8c2, 0xe3cfa0, 0x9bc1a6, 0x9bc1a6, 0xaec2d8];
    bandColors.forEach((c, i) => {
        const band = makeMesh(
            new THREE.TorusGeometry(0.2, 0.015, 8, 24),
            { color: c, roughness: 0.9 },
            [ROOM_HALF - 0.05, 2.2, -6 + i * 0.6], [0, Math.PI / 2, 0]
        );
        scene.add(band);
    });

    // === FUN FACT OBJECTS (clickable) ===
    buildSoccerBall(new THREE.Vector3(2, 0, 9));
    buildTrophy(new THREE.Vector3(-11, 0, -8));
    buildGuitar(new THREE.Vector3(-11.5, 0, 4));
    buildMovieReel(new THREE.Vector3(11, 0, 9));
    buildBoardGameDice(new THREE.Vector3(-2, 0, 11));
}

// ============================================================
// FUN FACT OBJECTS
// ============================================================
function buildSoccerBall(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // White ball base
    const ball = makeMesh(new THREE.SphereGeometry(0.18, 32, 24),
        { color: 0xffffff, roughness: 0.55, metalness: 0.05 },
        [0, 0.18, 0]);
    g.add(ball);

    // Black pentagon patches using small spheres for simple dappled look
    const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    const patchPositions = [
        [0, 0.18, 0.18], [0, 0.18, -0.18], [0.18, 0.18, 0], [-0.18, 0.18, 0],
        [0, 0.36, 0], [0.13, 0.29, 0.13], [-0.13, 0.29, -0.13],
        [0.13, 0.07, -0.13], [-0.13, 0.07, 0.13]
    ];
    patchPositions.forEach(p => {
        const patch = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), black);
        patch.position.set(...p);
        g.add(patch);
    });

    // Small Real Madrid style pennant on a stick next to ball
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    g.add(makeMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 8), stickMat, [0.35, 0.35, 0]));
    // Flag
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 128;
    flagCanvas.height = 80;
    const fctx = flagCanvas.getContext('2d');
    fctx.fillStyle = '#ffffff';
    fctx.fillRect(0, 0, 128, 80);
    fctx.fillStyle = '#febe10';
    fctx.fillRect(0, 0, 128, 12);
    fctx.fillRect(0, 68, 128, 12);
    fctx.font = 'bold 26px Arial';
    fctx.fillStyle = '#00529f';
    fctx.textAlign = 'center';
    fctx.fillText('RMA', 64, 52);
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.22),
        new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide }));
    flag.position.set(0.52, 0.58, 0);
    g.add(flag);

    scene.add(g);
    addHitbox([pos.x + 0.2, 0.4, pos.z], [1.0, 0.9, 0.6], 'soccerBall');
}

function buildTrophy(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Wooden base
    g.add(makeMesh(new THREE.BoxGeometry(0.45, 0.08, 0.45),
        { color: 0x5a3220, roughness: 0.6, metalness: 0.1 }, [0, 0.04, 0]));
    g.add(makeMesh(new THREE.BoxGeometry(0.55, 0.05, 0.55),
        { color: 0x3e2214, roughness: 0.7, metalness: 0.1 }, [0, 0.09, 0]));

    // Gold stem
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc940, metalness: 0.9, roughness: 0.15, emissive: 0xffc940, emissiveIntensity: 0.1 });
    g.add(makeMesh(new THREE.CylinderGeometry(0.04, 0.06, 0.12, 12), goldMat, [0, 0.17, 0]));

    // Cup body
    g.add(makeMesh(new THREE.CylinderGeometry(0.14, 0.08, 0.22, 16), goldMat, [0, 0.34, 0]));
    // Cup rim
    g.add(makeMesh(new THREE.TorusGeometry(0.14, 0.015, 8, 20), goldMat, [0, 0.45, 0], [Math.PI / 2, 0, 0]));

    // Handles
    [-1, 1].forEach(side => {
        const handle = makeMesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI),
            goldMat, [side * 0.16, 0.35, 0], [0, 0, -side * Math.PI / 2]);
        g.add(handle);
    });

    // Plaque on base with text
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 256;
    plaqueCanvas.height = 64;
    const pctx = plaqueCanvas.getContext('2d');
    pctx.fillStyle = '#d4a838';
    pctx.fillRect(0, 0, 256, 64);
    pctx.font = 'bold 18px serif';
    pctx.fillStyle = '#2a1a0a';
    pctx.textAlign = 'center';
    pctx.fillText('BENCH PRESS', 128, 28);
    pctx.fillText('RECORD', 128, 48);
    const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1),
        new THREE.MeshBasicMaterial({ map: plaqueTex }));
    plaque.position.set(0, 0.09, 0.28);
    g.add(plaque);

    scene.add(g);
    addHitbox([pos.x, 0.35, pos.z], [0.9, 0.8, 0.9], 'trophy');
}

function buildGuitar(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);
    // Lean against the wall
    g.rotation.z = 0.15;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b3a1a, roughness: 0.4, metalness: 0.2 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3a1a08, roughness: 0.5 });

    // Guitar body (lathe for dreadnought shape)
    const bodyPoints = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.18, 0.02),
        new THREE.Vector2(0.26, 0.1),
        new THREE.Vector2(0.28, 0.22),
        new THREE.Vector2(0.22, 0.32),
        new THREE.Vector2(0.18, 0.38),
        new THREE.Vector2(0.26, 0.48),
        new THREE.Vector2(0.28, 0.6),
        new THREE.Vector2(0.2, 0.72),
        new THREE.Vector2(0.0, 0.75)
    ];
    const bodyGeo = new THREE.LatheGeometry(bodyPoints, 24);
    const body = new THREE.Mesh(bodyGeo, woodMat);
    body.scale.z = 0.3; // flatten to guitar body shape
    body.position.set(0, 0.4, 0);
    g.add(body);

    // Sound hole (dark circle)
    g.add(makeMesh(new THREE.CircleGeometry(0.06, 20), darkWood,
        [0, 0.55, 0.086], [0, 0, 0]));

    // Neck
    g.add(makeMesh(new THREE.BoxGeometry(0.06, 0.8, 0.04), darkWood, [0, 1.25, 0.05]));

    // Headstock
    g.add(makeMesh(new THREE.BoxGeometry(0.1, 0.15, 0.04), darkWood, [0, 1.73, 0.05]));

    // Tuning pegs
    for (let i = 0; i < 3; i++) {
        [-0.05, 0.05].forEach(x => {
            g.add(makeMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8),
                CHROME.clone(), [x, 1.68 + i * 0.03, 0.07], [Math.PI / 2, 0, 0]));
        });
    }

    // Strings (6)
    for (let i = 0; i < 6; i++) {
        const s = makeMesh(new THREE.CylinderGeometry(0.002, 0.002, 1.25, 4),
            { color: 0xdddddd, metalness: 0.8 },
            [-0.025 + i * 0.01, 1.15, 0.09]);
        g.add(s);
    }

    scene.add(g);
    addHitbox([pos.x + 0.1, 0.9, pos.z], [0.9, 2.0, 0.5], 'guitar');
}

function buildMovieReel(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    const reelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 });
    const filmMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.3, roughness: 0.5 });

    // Two reels stacked at angle
    for (let r = 0; r < 2; r++) {
        const reel = new THREE.Group();
        // Outer ring
        reel.add(makeMesh(new THREE.TorusGeometry(0.22, 0.02, 8, 32), reelMat, [0, 0, 0]));
        // Film coil
        reel.add(makeMesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 32), filmMat, [0, 0, 0]));
        // Inner hub
        reel.add(makeMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), reelMat, [0, 0, 0]));
        // Spokes
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const spoke = makeMesh(new THREE.BoxGeometry(0.16, 0.01, 0.008), reelMat,
                [Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08]);
            spoke.rotation.y = -angle;
            reel.add(spoke);
        }
        reel.rotation.x = Math.PI / 2;
        reel.position.set(r * 0.1 - 0.05, 0.3 + r * 0.3, 0);
        reel.rotation.z = r * 0.2;
        g.add(reel);
    }

    // Clapperboard leaning next to reels
    const clapGroup = new THREE.Group();
    clapGroup.position.set(0.35, 0.25, 0);
    clapGroup.rotation.z = -0.15;
    // Board
    clapGroup.add(makeMesh(new THREE.BoxGeometry(0.4, 0.3, 0.025),
        { color: 0x1a1a1a, roughness: 0.4 }, [0, 0, 0]));
    // Top stripe with B/W pattern
    const stripeCanvas = document.createElement('canvas');
    stripeCanvas.width = 256;
    stripeCanvas.height = 32;
    const scctx = stripeCanvas.getContext('2d');
    for (let i = 0; i < 8; i++) {
        scctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
        scctx.fillRect(i * 32, 0, 32, 32);
    }
    const stripeTex = new THREE.CanvasTexture(stripeCanvas);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.06),
        new THREE.MeshBasicMaterial({ map: stripeTex }));
    stripe.position.set(0, 0.17, 0.014);
    clapGroup.add(stripe);
    g.add(clapGroup);

    scene.add(g);
    addHitbox([pos.x, 0.4, pos.z], [1.2, 1.0, 0.8], 'movies');
}

function buildBoardGameDice(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Stack of 4 dice in different colors with pips
    const diceColors = [0x7aa8c2, 0xffffff, 0x9bc1a6, 0xe3cfa0];
    const pipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });

    diceColors.forEach((c, i) => {
        const die = new THREE.Group();
        const size = 0.16;
        die.add(makeMesh(new THREE.BoxGeometry(size, size, size),
            { color: c, roughness: 0.55, metalness: 0.1 }, [0, 0, 0]));

        // Pips on top face (showing random number per die)
        const nPips = i + 2;
        const pipSize = 0.012;
        const offset = size / 2 + 0.001;
        for (let p = 0; p < nPips; p++) {
            const px = (p % 2 === 0 ? -0.04 : 0.04);
            const pz = (Math.floor(p / 2) === 0 ? -0.04 : 0.04);
            die.add(makeMesh(new THREE.SphereGeometry(pipSize, 8, 6), pipMat, [px, offset, pz]));
        }

        die.position.set((i % 2) * 0.18 - 0.09, size / 2 + Math.floor(i / 2) * size, (i % 2) * 0.05);
        die.rotation.y = i * 0.15;
        g.add(die);
    });

    // A board game box underneath them
    g.add(makeMesh(new THREE.BoxGeometry(0.7, 0.08, 0.5),
        { color: 0x2a4a7a, roughness: 0.6 }, [0.05, 0.04, -0.05]));
    // Box label
    const boxCanvas = document.createElement('canvas');
    boxCanvas.width = 256;
    boxCanvas.height = 180;
    const bxctx = boxCanvas.getContext('2d');
    bxctx.fillStyle = '#2a4a7a';
    bxctx.fillRect(0, 0, 256, 180);
    bxctx.strokeStyle = '#ffd93d';
    bxctx.lineWidth = 4;
    bxctx.strokeRect(10, 10, 236, 160);
    bxctx.font = 'bold 32px serif';
    bxctx.fillStyle = '#ffd93d';
    bxctx.textAlign = 'center';
    bxctx.fillText('BOARD', 128, 80);
    bxctx.fillText('GAMES', 128, 125);
    const boxTex = new THREE.CanvasTexture(boxCanvas);
    const boxLid = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.46),
        new THREE.MeshBasicMaterial({ map: boxTex }));
    boxLid.rotation.x = -Math.PI / 2;
    boxLid.position.set(0.05, 0.081, -0.05);
    g.add(boxLid);

    scene.add(g);
    addHitbox([pos.x, 0.3, pos.z], [1.0, 0.8, 0.9], 'boardGames');
}

function makeMesh(geo, matProps, pos, rot) {
    const mat = matProps instanceof THREE.Material ? matProps : new THREE.MeshStandardMaterial(matProps);
    const mesh = new THREE.Mesh(geo, mat);
    if (pos) mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    mesh.castShadow = true;
    return mesh;
}

// ============================================================
// EQUIPMENT BUILDERS — detailed models
// ============================================================
function buildEquipment() {
    buildBenchPress(new THREE.Vector3(-5.5, 0, -5.5));
    buildDumbbellRack(new THREE.Vector3(5.5, 0, -5.5));
    buildTreadmill(new THREE.Vector3(-5.5, 0, 3.5));
    buildPullUpBar(new THREE.Vector3(0, 0, -8));
    buildPunchingBag(new THREE.Vector3(5.5, 0, 3.5));
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
            { r: 0.22, w: 0.04, offset: 0.62, color: 0x7aa8c2 },
            { r: 0.22, w: 0.04, offset: 0.67, color: 0x7aa8c2 },
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
    const dbColors = [0x7aa8c2, 0x9bc1a6, 0xe3cfa0, 0x9bc1a6, 0x9bc1a6, 0xaec2d8, 0xcdb98a, 0xaec8d8, 0x7a9db8];
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
}

function buildPunchingBag(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);

    // Ceiling mount bracket (lowered to look like proper bag mount, not chandelier)
    const MOUNT_Y = 3.4;
    g.add(makeMesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), DARK_METAL.clone(), [0, MOUNT_Y + 0.04, 0]));
    g.add(makeMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), DARK_METAL.clone(), [0, MOUNT_Y - 0.05, 0]));

    // Swivel
    g.add(makeMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), CHROME.clone(), [0, MOUNT_Y - 0.17, 0]));

    // Chains (4 chains converging)
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.2 });
    [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.1], [0.1, -0.1]].forEach(([x, z]) => {
        for (let y = 2.8; y < 3.2; y += 0.08) {
            g.add(makeMesh(new THREE.TorusGeometry(0.02, 0.005, 6, 8), chainMat,
                [x * (3.2 - y) / 0.4, y, z * (3.2 - y) / 0.4],
                [Math.PI / 2, 0, 0]));
        }
    });

    // Bag — bottom at ~0.8m, top at ~2.75m (standard heavy bag height)
    const bagPoints = [];
    const bagProfile = [
        [0, 2.75], [0.15, 2.70], [0.25, 2.60], [0.3, 2.40],
        [0.32, 2.00], [0.32, 1.55], [0.3, 1.20], [0.28, 1.05],
        [0.22, 0.95], [0.1, 0.92], [0, 0.9]
    ];
    bagProfile.forEach(([r, y]) => bagPoints.push(new THREE.Vector2(r, y)));
    const bagGeo = new THREE.LatheGeometry(bagPoints, 24);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x7aa8c2, roughness: 0.82, metalness: 0.05 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.castShadow = true;
    g.add(bag);

    // Stitching lines (vertical seams)
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const seamGeo = new THREE.CylinderGeometry(0.003, 0.003, 1.5, 4);
        const seam = new THREE.Mesh(seamGeo, new THREE.MeshBasicMaterial({ color: 0x486b84 }));
        seam.position.set(Math.sin(angle) * 0.315, 1.82, Math.cos(angle) * 0.315);
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
    logo.position.set(0, 1.9, 0.33);
    g.add(logo);

    // Animate gentle swing
    animatedObjects.push({ mesh: g, type: 'swing' });

    scene.add(g);
    addHitbox([pos.x, 1.8, pos.z], [1.2, 2.2, 1.2], 'punchingBag');
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
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x9bc1a6, emissive: 0x9bc1a6, emissiveIntensity: 1.2 });
    // Top
    g.add(makeMesh(new THREE.BoxGeometry(0.03, 0.03, stripW), ledMat, [-0.06, mirrorH / 2 + 0.5 + stripH / 2, 0]));
    // Bottom
    g.add(makeMesh(new THREE.BoxGeometry(0.03, 0.03, stripW), ledMat, [-0.06, mirrorH / 2 + 0.5 - stripH / 2, 0]));
    // Left
    g.add(makeMesh(new THREE.BoxGeometry(0.03, stripH, 0.03), ledMat, [-0.06, mirrorH / 2 + 0.5, -stripW / 2]));
    // Right
    g.add(makeMesh(new THREE.BoxGeometry(0.03, stripH, 0.03), ledMat, [-0.06, mirrorH / 2 + 0.5, stripW / 2]));

    // Light from the LED strip
    const mLight = new THREE.PointLight(0x9bc1a6, 0.8, 8);
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
    const neonLight = new THREE.PointLight(0x7aa8c2, 0.6, 6);
    neonLight.position.set(-0.5, mirrorH + 0.9, 0);
    g.add(neonLight);
    animatedObjects.push({ mesh: neonSign, type: 'neonFlicker', light: neonLight });

    scene.add(g);
    addHitbox([pos.x - 0.8, 2.5, pos.z], [2, 4, 5.5], 'mirror');
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
        if (pauseOpen) {
            if (e.code === 'KeyM' || e.code === 'Escape') {
                closePauseMenu();
                e.preventDefault();
            }
            return;
        }
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = true; break;
            case 'KeyS': case 'ArrowDown': moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'KeyM':
                if (!panelOpen) { openPauseMenu(); e.preventDefault(); }
                break;
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
    const panelEl = document.getElementById('info-panel');
    panelEl.style.display = 'flex';
    // Restart entrance animations each open
    const card = panelEl.querySelector('.panel-card');
    if (card) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
    }
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
        if (intersects.length > 0 && intersects[0].distance < 8) {
            const key = intersects[0].object.userData.contentKey;
            const data = CONTENT[key];
            if (data) {
                hint.querySelector('.hint-title').textContent = data.title.toUpperCase();
                hint.style.display = 'flex';
            }
        } else {
            hint.style.display = 'none';
        }
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
// START — triggered from landing page via window.__initGym
// ============================================================
let __gymStarted = false;
window.__initGym = function () {
    if (__gymStarted) return;
    __gymStarted = true;
    init();
};
