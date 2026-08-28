export type Bay = "experience" | "projects";

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
  },
];

export const BAYS: { id: Bay; label: string; caption: string }[] = [
  { id: "experience", label: "Experience", caption: "Where the work was done" },
  { id: "projects", label: "Projects", caption: "What got built on the side" },
];

export const volumesInBay = (bay: Bay) => VOLUMES.filter((v) => v.bay === bay);
