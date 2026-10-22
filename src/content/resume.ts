// The resume as data. docs/content.md is the human-readable copy; keep the two in sync.

export type Job = { role: string; company: string; city: string; dates: string; icon?: string };
export type Project = { name: string; award?: string; blurb: string };

// Placeholder wording until the owner sends the final bio and project one-liners.
export const BIO = "builds data systems and AI agents — currently at FinalDose (YC P26) and the University of Toronto";

export const EXPERIENCE: Job[] = [
  { role: "Software Engineer Intern", company: "CIBC", city: "Toronto", dates: "2026 –", icon: "/icons/cibc.png" },
  { role: "Software Engineer Intern", company: "FinalDose (YC P26)", city: "San Francisco", dates: "2026 –", icon: "/icons/finaldose.png" },
  { role: "Undergraduate Research Assistant", company: "University of Toronto", city: "Toronto", dates: "2026 –", icon: "/icons/uoft.png" },
  { role: "Software Developer Intern", company: "Beau Vision AI", city: "Toronto", dates: "2025 – 26", icon: "/icons/beau.png" },
];

export const PROJECTS: Project[] = [
  { name: "Lazarus", award: "HackPrinceton winner", blurb: "AI agents that rescue failed drug programs" },
  { name: "Ghost Protocol", blurb: "An agent that red-teams fraud detection" },
  { name: "Projectory", blurb: "Learn to code by building, in a browser IDE" },
];
