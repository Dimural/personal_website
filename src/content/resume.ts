// The resume as data. docs/content.md is the human-readable copy; keep the two in sync.

export type Job = { role: string; company: string; city: string; dates: string; icon?: string };
export type Project = { name: string; award?: string; blurb: string };

// Placeholder wording until the owner sends the final bio and project one-liners.
export const BIO = "builds data systems and AI agents — currently at FinalDose (YC P26) and the University of Toronto";

export const EXPERIENCE: Job[] = [
  { role: "Software Engineer Intern", company: "FinalDose (YC P26)", city: "San Francisco", dates: "2026 –" },
  { role: "Undergraduate Research Assistant", company: "University of Toronto", city: "Toronto", dates: "2026 –" },
  { role: "Software Developer Intern", company: "Beau Vision AI", city: "Toronto", dates: "2025 – 26" },
];

export const PROJECTS: Project[] = [
  { name: "Lazarus", award: "HackPrinceton winner", blurb: "AI agents that rescue failed drug programs" },
  { name: "Ghost Protocol", blurb: "An agent that red-teams fraud detection" },
  { name: "Projectory", blurb: "Learn to code by building, in a browser IDE" },
];
