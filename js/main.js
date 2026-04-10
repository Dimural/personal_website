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
let mouse = new THREE.Vector2(0, 0);
let interactables = [];
let hoveredObject = null;
let panelOpen = false;
const clock = new THREE.Clock();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

// Player settings
const PLAYER_HEIGHT = 1.7;
const MOVE_SPEED = 22;
const ROOM_HALF = 12;

// ============================================================
// INIT
// ============================================================
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 25, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, PLAYER_HEIGHT, 8);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    document.body.appendChild(renderer.domElement);

    // Lighting
    setupLighting();

    // Build gym
    buildRoom();
    buildEquipment();

    // Events
    setupEvents();

    // Hide loading, show welcome
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('welcome-overlay').style.display = 'flex';
        }, 800);
    }, 1500);

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('welcome-overlay').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        document.getElementById('controls-reminder').style.display = 'block';
        renderer.domElement.requestPointerLock();
    });

    // Close panel
    document.getElementById('close-panel').addEventListener('click', closePanel);

    // Animate
    animate();
}

// ============================================================
// LIGHTING
// ============================================================
function setupLighting() {
    // Strong ambient so nothing is ever too dark
    const ambient = new THREE.AmbientLight(0xddddf0, 1.4);
    scene.add(ambient);

    // Hemisphere light for natural fill
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.2);
    scene.add(hemi);

    // Bright white overhead point lights (gym fluorescent feel)
    const overheadPositions = [
        [-5, 4.5, -5], [5, 4.5, -5],
        [-5, 4.5, 5], [5, 4.5, 5],
        [0, 4.5, 0]
    ];
    overheadPositions.forEach(pos => {
        const light = new THREE.PointLight(0xffffff, 1.5, 30);
        light.position.set(...pos);
        light.castShadow = true;
        light.shadow.mapSize.set(512, 512);
        scene.add(light);

        // Visible light fixture
        const fixGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.06, 8);
        const fixMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 3
        });
        const fixture = new THREE.Mesh(fixGeo, fixMat);
        fixture.position.set(...pos);
        scene.add(fixture);
    });

    // Colorful accent lights (subtle, for vibe — not primary illumination)
    const accents = [
        { color: 0xe94560, pos: [-8, 2, -8] },
        { color: 0x6bc5ff, pos: [8, 2, -8] },
        { color: 0xffd93d, pos: [-8, 2, 8] },
        { color: 0x4ade80, pos: [8, 2, 8] },
    ];
    accents.forEach(({ color, pos }) => {
        const light = new THREE.PointLight(color, 0.6, 18);
        light.position.set(...pos);
        scene.add(light);
    });

    // Central spotlight for extra punch
    const spot = new THREE.SpotLight(0xffffff, 2.0, 30, Math.PI / 3, 0.4);
    spot.position.set(0, 5, 0);
    spot.castShadow = true;
    scene.add(spot);
}

// ============================================================
// ROOM
// ============================================================
function buildRoom() {
    const roomSize = ROOM_HALF * 2;

    // Floor — rubber gym floor look
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a6e,
        roughness: 0.7,
        metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor grid lines
    for (let i = -ROOM_HALF; i <= ROOM_HALF; i += 2) {
        const lineGeo = new THREE.PlaneGeometry(0.02, roomSize);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x3a3a5e, transparent: true, opacity: 0.4 });
        const lineX = new THREE.Mesh(lineGeo, lineMat);
        lineX.rotation.x = -Math.PI / 2;
        lineX.position.set(i, 0.01, 0);
        scene.add(lineX);

        const lineZ = lineX.clone();
        lineZ.rotation.z = Math.PI / 2;
        lineZ.position.set(0, 0.01, i);
        scene.add(lineZ);
    }

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x3d3d5c,
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(roomSize, 5);
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2.5, -ROOM_HALF);
    scene.add(backWall);

    // Front wall
    const frontWall = new THREE.Mesh(wallGeo, wallMat);
    frontWall.position.set(0, 2.5, ROOM_HALF);
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);

    // Left wall
    const sideWallGeo = new THREE.PlaneGeometry(roomSize, 5);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-ROOM_HALF, 2.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(ROOM_HALF, 2.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 1
    }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5;
    scene.add(ceiling);

    // Decorative wall stripe (neon accent)
    const stripGeo = new THREE.PlaneGeometry(roomSize, 0.05);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xe94560 });
    [-ROOM_HALF + 0.01, ROOM_HALF - 0.01].forEach((z, i) => {
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0, 2.5, z);
        if (i === 1) strip.rotation.y = Math.PI;
        scene.add(strip);
    });
}

// ============================================================
// EQUIPMENT BUILDERS
// ============================================================
function buildEquipment() {
    buildBenchPress(new THREE.Vector3(-6, 0, -6));
    buildDumbbellRack(new THREE.Vector3(6, 0, -6));
    buildTreadmill(new THREE.Vector3(-6, 0, 3));
    buildPullUpBar(new THREE.Vector3(0, 0, -9));
    buildPunchingBag(new THREE.Vector3(6, 0, 3));
    buildMirror(new THREE.Vector3(9.9, 0, 0));
}

function makeInteractable(mesh, contentKey, glowColor = 0xe94560) {
    mesh.userData = { contentKey, glowColor, originalColor: mesh.material.color.getHex() };
    interactables.push(mesh);
}

function buildBenchPress(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Bench base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.8, roughness: 0.3 });
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.9 });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    [[-0.5, 0.225, -0.3], [0.5, 0.225, -0.3], [-0.5, 0.225, 0.3], [0.5, 0.225, 0.3]].forEach(p => {
        const leg = new THREE.Mesh(legGeo, baseMat);
        leg.position.set(...p);
        leg.castShadow = true;
        group.add(leg);
    });

    // Pad
    const padGeo = new THREE.BoxGeometry(0.5, 0.12, 1.6);
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.51, 0);
    pad.castShadow = true;
    group.add(pad);

    // Uprights
    const uprightGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    const up1 = new THREE.Mesh(uprightGeo, baseMat);
    up1.position.set(-0.4, 1.05, -0.6);
    up1.castShadow = true;
    group.add(up1);
    const up2 = up1.clone();
    up2.position.x = 0.4;
    group.add(up2);

    // Bar
    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.45, -0.6);
    bar.castShadow = true;
    group.add(bar);

    // Weight plates
    const plateGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xe94560, metalness: 0.4, roughness: 0.5 });
    [-0.6, 0.6].forEach(x => {
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.rotation.x = Math.PI / 2;
        plate.rotation.z = Math.PI / 2;
        plate.position.set(x, 1.45, -0.6);
        plate.castShadow = true;
        group.add(plate);
    });

    scene.add(group);

    // Hitbox for interaction
    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 2),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(pos.x, 0.8, pos.z);
    scene.add(hitbox);
    makeInteractable(hitbox, 'benchPress');

    // Floating label
    addLabel(group, 'Experience', 0, 2.2, 0);
}

function buildDumbbellRack(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.8, roughness: 0.3 });

    // Rack frame
    const frameGeo = new THREE.BoxGeometry(2, 1.2, 0.4);
    const frame = new THREE.Mesh(frameGeo, metalMat);
    frame.position.set(0, 0.6, 0);
    frame.castShadow = true;
    group.add(frame);

    // Shelves
    const shelfGeo = new THREE.BoxGeometry(1.8, 0.04, 0.35);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3a3a5a, metalness: 0.6, roughness: 0.4 });
    [0.35, 0.7, 1.05].forEach(y => {
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(0, y, 0);
        group.add(shelf);
    });

    // Dumbbells on shelves
    const dbColors = [0xe94560, 0xff6b6b, 0xffd93d, 0x6bc5ff, 0x4ade80, 0xc084fc];
    let ci = 0;
    [0.45, 0.8, 1.15].forEach(y => {
        for (let x = -0.6; x <= 0.6; x += 0.6) {
            const dbMat = new THREE.MeshStandardMaterial({ color: dbColors[ci % dbColors.length], metalness: 0.3, roughness: 0.6 });
            // Handle
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0xaaaacc, metalness: 0.8 }));
            handle.rotation.z = Math.PI / 2;
            handle.position.set(x, y, 0.05);
            group.add(handle);
            // Weights
            [-0.12, 0.12].forEach(dx => {
                const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.1), dbMat);
                w.position.set(x + dx, y, 0.05);
                w.castShadow = true;
                group.add(w);
            });
            ci++;
        }
    });

    scene.add(group);

    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.6, 1),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(pos.x, 0.8, pos.z);
    scene.add(hitbox);
    makeInteractable(hitbox, 'dumbbellRack', 0xffd93d);

    addLabel(group, 'Skills', 0, 1.8, 0);
}

function buildTreadmill(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.7, roughness: 0.3 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.95 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xe94560, emissive: 0xe94560, emissiveIntensity: 0.3 });

    // Base/belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 2), beltMat);
    belt.position.set(0, 0.15, 0);
    belt.castShadow = true;
    group.add(belt);

    // Side rails
    [-0.45, 0.45].forEach(x => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 2), metalMat);
        rail.position.set(x, 0.22, 0);
        group.add(rail);
    });

    // Uprights for console
    [-0.35, 0.35].forEach(x => {
        const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), metalMat);
        upright.position.set(x, 0.9, -0.85);
        upright.castShadow = true;
        group.add(upright);
    });

    // Console
    const console = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.08), metalMat);
    console.position.set(0, 1.35, -0.85);
    console.castShadow = true;
    group.add(console);

    // Screen on console
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25),
        new THREE.MeshBasicMaterial({ color: 0x6bc5ff })
    );
    screen.position.set(0, 1.38, -0.81);
    group.add(screen);

    // Accent strip on belt sides
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.02, 2.02), accentMat);
    strip.position.set(0, 0.23, 0);
    group.add(strip);

    scene.add(group);

    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.8, 2.5),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(pos.x, 0.9, pos.z);
    scene.add(hitbox);
    makeInteractable(hitbox, 'treadmill', 0x6bc5ff);

    addLabel(group, 'Projects', 0, 2, 0);
}

function buildPullUpBar(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.8, roughness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.5, roughness: 0.4 });

    // Two tall uprights
    [-1, 1].forEach(x => {
        const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), metalMat);
        upright.position.set(x, 1.4, 0);
        upright.castShadow = true;
        group.add(upright);
    });

    // Top bar
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2, 12), accentMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.8, 0);
    bar.castShadow = true;
    group.add(bar);

    // Cross braces
    [-0.5, 0.5].forEach(y => {
        const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), metalMat);
        brace.rotation.z = Math.PI / 2;
        brace.position.set(0, y + 0.5, 0);
        group.add(brace);
    });

    // Grip tape indicators
    [-0.6, -0.2, 0.2, 0.6].forEach(x => {
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 1 }));
        grip.rotation.z = Math.PI / 2;
        grip.position.set(x, 2.8, 0);
        group.add(grip);
    });

    scene.add(group);

    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 3, 1),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(pos.x, 1.5, pos.z);
    scene.add(hitbox);
    makeInteractable(hitbox, 'pullUpBar', 0xffd93d);

    addLabel(group, 'Education', 0, 3.3, 0);
}

function buildPunchingBag(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.8, roughness: 0.3 });

    // Ceiling mount
    const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), metalMat);
    mount.position.set(0, 4.92, 0);
    group.add(mount);

    // Chain
    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6);
    const chain = new THREE.Mesh(chainGeo, metalMat);
    chain.position.set(0, 4.25, 0);
    group.add(chain);

    // Bag
    const bagGeo = new THREE.CylinderGeometry(0.3, 0.25, 1.2, 16);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xe94560, roughness: 0.85, metalness: 0.1 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(0, 3.0, 0);
    bag.castShadow = true;
    group.add(bag);

    // Bottom cap
    const capGeo = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, bagMat);
    cap.position.set(0, 2.4, 0);
    group.add(cap);

    // Animate swing
    group.userData.swingTime = Math.random() * Math.PI * 2;

    scene.add(group);

    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(pos.x, 3, pos.z);
    scene.add(hitbox);
    makeInteractable(hitbox, 'punchingBag', 0xff6b6b);

    addLabel(group, 'About Me', 0, 3.9, 0);
}

function buildMirror(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.6, roughness: 0.3 });
    const frameGeo = new THREE.BoxGeometry(0.1, 2.8, 3.5);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 1.8, 0);
    frame.castShadow = true;
    group.add(frame);

    // Mirror surface
    const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0x8888cc,
        metalness: 0.95,
        roughness: 0.05,
        envMapIntensity: 1.5
    });
    const mirrorGeo = new THREE.PlaneGeometry(2.5, 3.2);
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(-0.06, 1.8, 0);
    mirror.rotation.y = -Math.PI / 2;
    group.add(mirror);

    // "CONTACT" text placeholder — neon sign effect
    const textGeo = new THREE.PlaneGeometry(1.5, 0.3);
    const textMat = new THREE.MeshBasicMaterial({ color: 0xe94560, transparent: true, opacity: 0.8 });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(-0.08, 3.2, 0);
    textMesh.rotation.y = -Math.PI / 2;
    group.add(textMesh);

    scene.add(group);

    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3, 3.5),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(pos.x - 0.5, 1.8, pos.z);
    scene.add(hitbox);
    makeInteractable(hitbox, 'mirror', 0x8888cc);

    addLabel(group, 'Contact', -0.5, 3.6, 0);
}

// Floating label above equipment
function addLabel(group, text, x, y, z) {
    // We'll use a sprite with a canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 32px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Background pill
    const metrics = ctx.measureText(text);
    const pw = metrics.width + 40;
    const ph = 44;
    const px = 128 - pw / 2;
    const py = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, px, py, pw, ph, 22);
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffd93d';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(2, 0.5, 1);
    group.add(sprite);
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
    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
        isLocked = document.pointerLockElement === renderer.domElement;
        document.getElementById('crosshair').style.display = isLocked ? 'block' : 'none';
        if (!isLocked && !panelOpen) {
            // Show a subtle hint
        }
    });

    // Mouse move for camera
    document.addEventListener('mousemove', (e) => {
        if (!isLocked) return;
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= movementX * 0.002;
        euler.x -= movementY * 0.002;
        euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
        camera.quaternion.setFromEuler(euler);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = true; break;
            case 'KeyS': case 'ArrowDown': moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'Escape':
                if (panelOpen) {
                    closePanel();
                    e.preventDefault();
                }
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

    // Click for interaction
    document.addEventListener('click', () => {
        if (!isLocked) return;
        if (panelOpen) return;

        // Raycast from center of screen
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        if (intersects.length > 0 && intersects[0].distance < 8) {
            openPanel(intersects[0].object.userData.contentKey);
        }
    });

    // Resize
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
    // Re-lock pointer
    setTimeout(() => {
        renderer.domElement.requestPointerLock();
    }, 100);
}

// ============================================================
// ANIMATION LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Player movement
    if (isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * MOVE_SPEED * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * MOVE_SPEED * delta;

        // Move in camera direction
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        camera.position.addScaledVector(forward, -velocity.z * delta);
        camera.position.addScaledVector(right, -velocity.x * delta);

        // Clamp to room bounds
        const margin = 1;
        camera.position.x = Math.max(-ROOM_HALF + margin, Math.min(ROOM_HALF - margin, camera.position.x));
        camera.position.z = Math.max(-ROOM_HALF + margin, Math.min(ROOM_HALF - margin, camera.position.z));
        camera.position.y = PLAYER_HEIGHT;

        // Hover detection for interaction hint
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(interactables);
        const hint = document.getElementById('interact-hint');
        if (intersects.length > 0 && intersects[0].distance < 8) {
            hint.style.display = 'block';
        } else {
            hint.style.display = 'none';
        }
    }

    renderer.render(scene, camera);
}

// ============================================================
// START
// ============================================================
init();
