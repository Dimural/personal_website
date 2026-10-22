# Content

Source: the owner's resume (local, untracked PDF). When this file and the resume disagree, ask the owner.
The data lives in code at `src/content/` (created in milestone 3). This file is the human-readable copy.

## Experience (floating colour logos)

| Company (full name) | Title | Dates | Location | Logo colours |
|---|---|---|---|---|
| CIBC (Canadian Imperial Bank of Commerce) | Software Engineer Intern | September 2026 – Present | Toronto, ON (TODO: confirm) | red `#C41F3E` |
| FinalDose (YC P26) | Software Engineer Intern | June 2026 – Present | San Francisco, CA | TODO: get from owner |
| University of Toronto | Undergraduate Research Assistant | May 2026 – Present | Toronto, ON | UofT navy `#1E3765` (verify) |
| Beau Vision AI | Software Developer Intern | March 2025 – March 2026 | Toronto, ON | TODO: get from owner |

What was done:

- **FinalDose:** AWS-deployed PostgreSQL system of record (RDS, versioned S3, ECR, Secrets Manager), all in
  Terraform, 10+ interlinked entities. A data-integrity layer every table inherits (immutable audit history,
  attribution, soft-delete), aligned to FDA standards. 20-endpoint REST API (OpenAPI, Google SSO) serving lab data to AI agents.
- **University of Toronto:** Commercializing award-winning adaptive AI research (XPrize winner, $2M+ in grants,
  500K+ people impacted): customer discovery and product-market fit. Self-learning notification engine that
  delivers personalized LLM-generated nudges at each user's best moment.
- **Beau Vision AI:** 7+ features in a React WebAR app (TypeScript, Tailwind): landing page, virtual makeup
  try-on, marketplace, for a 2,000+ user waitlist. Facial-image datasets (300+ images each) for the
  makeup-generation model. Exploratory QA on WebAR, 15+ high-severity defects found and fixed.

## Projects (themed objects)

| Project | Stack | World object (proposal) |
|---|---|---|
| Lazarus (HackPrinceton 2026 Winner) | Python, FastAPI, React, PostgreSQL, Neo4j, Redis, Docker | Floating pills and syringes |
| Ghost Protocol | Python, TypeScript, LangChain, LangGraph, FastAPI, Next.js | A drifting ghost with a padlock |
| Projectory | TypeScript, Next.js, Tailwind CSS, Azure, Supabase | A small terminal/IDE window with scaffolding blocks |

What was done:

- **Lazarus:** Autonomous clinical R&D platform that rescues failed drug programs, routing real-world data
  through a 5-agent LLM pipeline to produce executive blueprints and portfolio risk scores. 14 live agent steps
  streamed over WebSockets to a React dashboard with a Neo4j knowledge graph. iMessage alerts for drug
  confidence scores and risk levels.
- **Ghost Protocol:** Security AI agent that stress-tests fraud detection, dropping defender recall from 90% to 45%.
  LangGraph 4-node state machine that re-routes on defender feedback to generate persona-aware evasion
  strategies. 85% lower LLM cost via batched inference; 50/50 unit tests; auto-generated penetration reports.
- **Projectory:** AI "learn-by-building" platform that generates custom coding tutorials from prompt-based project
  scaffolds (Gemini) inside a Monaco browser IDE. Azure Static Web Apps with GitHub Actions CI/CD, 6+ Azure
  Functions (HTTP + Timer), Azure Communication Services for weekly re-engagement emails.

## Contact (for a later "about" spot, optional)

Email dimural722@gmail.com · linkedin.com/in/dimural · GitHub: Dimural. **No phone number on the site.**
