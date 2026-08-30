export type Bay = "experience" | "projects";

/** Room colours a volume brings with it when selected. */
export interface VolumePalette {
  paper: string;
  paperDeep: string;
  paperPale: string;
  ink: string;
  inkSoft: string;
  wall: string;
  shelf: string;
  shelfDark: string;
  light: string;
  fill: string;
}

export type MotifKey =
  | "brackets"
  | "paths"
  | "lattice"
  | "orbit"
  | "strata"
  | "vault";

export interface Volume {
  id: string;
  bay: Bay;
  /** Spine title — kept short; long titles crowd the stamp. */
  spine: string;
  title: string;
  subtitle: string;
  place: string;
  dates: string;
  /** Cloth and foil, drawn from the page's own palette. */
  cloth: string;
  foil: string;
  /** Thickness in world units. Varies so the shelf reads as a real one. */
  depth: number;
  tags: string[];
  lines: string[];
  /** Roman numeral stamped on cover and running heads. */
  roman: string;
  /** Two or three words under the title on the cover. */
  discipline: string;
  /** One line, shown under the title while browsing. */
  note: string;
  /** A paragraph, shown on the detail panel and an interior page. */
  deck: string;
  binding: string;
  format: string;
  /** A short phrase printed beneath the plate. */
  theme: string;
  motifKey: MotifKey;
  /** Exactly two — they head the two chapter pages. */
  chapters: [string, string];
  palette: VolumePalette;
  /** Fixed, so procedural grain is identical between reloads. */
  seed: number;
  /** Cover dimensions in world units. `depth` already exists. */
  width: number;
  height: number;
}

export const VOLUMES: Volume[] = [
  // ── Experience ────────────────────────────────────────────────
  {
    id: "finaldose",
    bay: "experience",
    spine: "FinalDose",
    title: "FinalDose",
    subtitle: "Software Engineer Intern",
    place: "San Francisco, CA",
    dates: "June 2026 — Present",
    cloth: "#2f4468",
    foil: "#c2a274",
    depth: 0.46,
    tags: ["AWS", "PostgreSQL", "Terraform", "OpenAPI"],
    lines: [
      "Architected an AWS-deployed PostgreSQL system of record — RDS, versioned S3, ECR, Secrets Manager — provisioned entirely through Terraform, modeling 10+ interlinked entities.",
      "Engineered a reusable data-integrity spine inherited by every table: immutable audit history, attribution, soft-delete. Aligns the platform to FDA standards at the schema level.",
      "Shipped a 20-endpoint REST API with OpenAPI and Google SSO, serving lab data to AI agents.",
    ],
    roman: "I",
    discipline: "Systems of record",
    note: "The unglamorous layer everything else stands on.",
    deck: "An AWS-deployed system of record for clinical lab data — ten interlinked entities, provisioned in Terraform, with data integrity built into the schema rather than bolted onto it.",
    binding: "Ultramarine cloth · copper foil",
    format: "148 × 216 mm",
    theme: "Integrity at the schema level",
    motifKey: "vault",
    chapters: ["The spine", "The interface"],
    palette: {
      paper: "#1b2740", paperDeep: "#121a2c", paperPale: "#eee7db",
      ink: "#f2ece2", inkSoft: "#b4b3ae", wall: "#1b2740",
      shelf: "#3a2a1d", shelfDark: "#1d130c",
      light: "#f2d9bb", fill: "#9fb3c9",
    },
    seed: 11, width: 1.02, height: 1.58,
  },
  {
    id: "uoft-research",
    bay: "experience",
    spine: "U of T Research",
    title: "University of Toronto",
    subtitle: "Undergraduate Research Assistant",
    place: "Toronto, ON",
    dates: "May 2026 — Present",
    cloth: "#2c5150",
    foil: "#c2a274",
    depth: 0.38,
    tags: ["Adaptive AI", "LLM", "Product"],
    lines: [
      "Commercializing award-winning adaptive AI research — an XPrize winner with $2M+ in grants and 500K+ people impacted — into a product, running customer discovery and product-market fit validation.",
      "Architected a self-learning notification engine that adapts per user, delivering personalized LLM-generated nudges at individually optimal moments.",
    ],
    roman: "II",
    discipline: "Adaptive systems",
    note: "Award-winning research, turned into a product.",
    deck: "Commercializing adaptive AI research — an XPrize winner with $2M+ in grants — through customer discovery, and a notification engine that learns each user's moment.",
    binding: "Pine cloth · copper foil",
    format: "156 × 228 mm",
    theme: "Research into product",
    motifKey: "orbit",
    chapters: ["Discovery", "The engine"],
    palette: {
      paper: "#1d322f", paperDeep: "#132220", paperPale: "#ece8dc",
      ink: "#eeeae0", inkSoft: "#aeb3ac", wall: "#1d322f",
      shelf: "#35291b", shelfDark: "#1a120a",
      light: "#f0dcb6", fill: "#a6c0b6",
    },
    seed: 23, width: 0.98, height: 1.52,
  },
  {
    id: "beau-vision",
    bay: "experience",
    spine: "Beau Vision AI",
    title: "Beau Vision AI",
    subtitle: "Software Developer Intern",
    place: "Toronto, ON",
    dates: "March 2025 — March 2026",
    cloth: "#9d6a4e",
    foil: "#f0e6d4",
    depth: 0.42,
    tags: ["React", "WebAR", "TypeScript"],
    lines: [
      "Developed 7+ key features in a React WebAR application (TypeScript, Tailwind) — a landing page, a virtual makeup try-on, and a marketplace — across a 2,000+ user waitlist.",
      "Built and curated facial-image datasets of 300+ images each for the makeup-generation model.",
      "Led exploratory QA on WebAR environments, identifying and resolving 15+ high-severity defects.",
    ],
    roman: "III",
    discipline: "Applied interfaces",
    note: "Seven features, two thousand people waiting.",
    deck: "React WebAR in production — a landing page, a virtual makeup try-on and a marketplace, plus the datasets and the exploratory QA that kept them standing up.",
    binding: "Sienna cloth · bone foil",
    format: "140 × 210 mm",
    theme: "Interface as the product",
    motifKey: "lattice",
    chapters: ["Surfaces", "Defects"],
    palette: {
      paper: "#4a2a1c", paperDeep: "#301a10", paperPale: "#f2e8d8",
      ink: "#f4ebdd", inkSoft: "#c3b4a3", wall: "#4a2a1c",
      shelf: "#42301f", shelfDark: "#22160d",
      light: "#f6dcb4", fill: "#d0b39a",
    },
    seed: 37, width: 1.06, height: 1.61,
  },

  // ── Projects ──────────────────────────────────────────────────
  {
    id: "lazarus",
    bay: "projects",
    spine: "Lazarus",
    title: "Lazarus",
    subtitle: "HackPrinceton 2026 — Winner",
    place: "Princeton, NJ",
    dates: "2026",
    cloth: "#46586a",
    foil: "#c2a274",
    depth: 0.44,
    tags: ["FastAPI", "Neo4j", "Redis", "Docker"],
    lines: [
      "An autonomous clinical R&D platform that rescues failed drug programs, routing real-world data through a 5-agent LLM reasoning pipeline to generate executive blueprints and portfolio risk scores.",
      "Streamed 14 live agent steps over WebSockets to a React dashboard backed by a Neo4j knowledge graph.",
      "Pushed automated iMessage alerts carrying drug confidence scores and risk levels.",
    ],
    roman: "IV",
    discipline: "Autonomous reasoning",
    note: "Rescuing drug programs that were written off.",
    deck: "An autonomous clinical R&D platform routing real-world data through a five-agent reasoning pipeline, streaming fourteen live steps over WebSockets onto a knowledge graph.",
    binding: "Slate cloth · copper foil",
    format: "152 × 224 mm",
    theme: "Evidence into a blueprint",
    motifKey: "paths",
    chapters: ["The pipeline", "The graph"],
    palette: {
      paper: "#26313c", paperDeep: "#182129", paperPale: "#ebe7de",
      ink: "#eeeae2", inkSoft: "#afb4b8", wall: "#26313c",
      shelf: "#38291d", shelfDark: "#1c130c",
      light: "#eedcc0", fill: "#a8bdc9",
    },
    seed: 41, width: 1.0, height: 1.66,
  },
  {
    id: "ghost-protocol",
    bay: "projects",
    spine: "Ghost Protocol",
    title: "Ghost Protocol",
    subtitle: "Security agent for fraud systems",
    place: "Toronto, ON",
    dates: "2026",
    cloth: "#3b4a42",
    foil: "#c2a274",
    depth: 0.36,
    tags: ["LangGraph", "LangChain", "FastAPI"],
    lines: [
      "A security AI agent that stress-tests fraud detection systems, dropping defender recall from 90% to 45%.",
      "Orchestrated attack adaptation through a LangGraph 4-node state machine that re-routes on defender feedback to autonomously generate persona-aware evasion strategies.",
      "Cut LLM costs 85% with batched inference; 50/50 unit tests passing, with auto-generated penetration reports.",
    ],
    roman: "V",
    discipline: "Adversarial security",
    note: "Ninety percent recall, dropped to forty-five.",
    deck: "A security agent that stress-tests fraud detection, adapting its attack through a four-node state machine that re-routes on the defender's own feedback.",
    binding: "Moss cloth · copper foil",
    format: "144 × 212 mm",
    theme: "Attack as a form of proof",
    motifKey: "brackets",
    chapters: ["The state machine", "The report"],
    palette: {
      paper: "#232d26", paperDeep: "#161e19", paperPale: "#e9e7da",
      ink: "#ece9de", inkSoft: "#a9b0a6", wall: "#232d26",
      shelf: "#33271a", shelfDark: "#191009",
      light: "#eedcb8", fill: "#a9bda6",
    },
    seed: 53, width: 0.95, height: 1.49,
  },
  {
    id: "projectory",
    bay: "projects",
    spine: "Projectory",
    title: "Projectory",
    subtitle: "Learn-by-building platform",
    place: "Toronto, ON",
    dates: "2025",
    cloth: "#8a7448",
    foil: "#f0e6d4",
    depth: 0.4,
    tags: ["Next.js", "Azure", "Supabase", "Gemini"],
    lines: [
      "An AI-powered learn-by-building platform generating custom dynamic coding tutorials from prompt-based project scaffolds (Gemini) inside a Monaco-powered browser IDE.",
      "Deployed on Azure Static Web Apps with GitHub Actions CI/CD, 6+ Azure Functions on HTTP and timer triggers, and Azure Communication Services for weekly re-engagement email.",
    ],
    roman: "VI",
    discipline: "Learning tools",
    note: "Tutorials that write themselves around your project.",
    deck: "A learn-by-building platform generating dynamic coding tutorials from prompt-based scaffolds inside a browser IDE, on a scheduled Azure back end.",
    binding: "Ochre cloth · bone foil",
    format: "150 × 220 mm",
    theme: "Build in order to learn",
    motifKey: "strata",
    chapters: ["Scaffolds", "The loop"],
    palette: {
      paper: "#453619", paperDeep: "#2c220f", paperPale: "#f1ead6",
      ink: "#f3ecda", inkSoft: "#c2b795", wall: "#453619",
      shelf: "#3e2e1c", shelfDark: "#1f160b",
      light: "#f6e0b0", fill: "#cbc196",
    },
    seed: 67, width: 1.04, height: 1.55,
  },
];

export const BAYS: { id: Bay; label: string; caption: string }[] = [
  { id: "experience", label: "Experience", caption: "Where the work was done" },
  { id: "projects", label: "Projects", caption: "What got built on the side" },
];

export const volumesInBay = (bay: Bay) => VOLUMES.filter((v) => v.bay === bay);
