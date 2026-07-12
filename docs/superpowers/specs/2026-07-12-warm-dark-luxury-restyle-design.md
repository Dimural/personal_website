# Warm Dark Luxury Restyle — Design

**Date:** 2026-07-12
**Status:** Approved by Dimural (conversation, 2026-07-12)

## Problem

The site's structure and animations are good, but the color scheme and vibe read
"techy": green-tinted dark neutrals, a neon luminous-green accent, uppercase
Geist Mono terminal-style labels, and a green/teal WebGL aurora. Goal: classy,
sleek, calm — without touching layout or motion.

## Approved direction: Warm dark luxury

### 1. Palette (`src/index.css` tokens)

Shift every OKLCH hue from green (~165) to warm amber (~55–90), preserving the
existing lightness/chroma relationships so contrast and hierarchy are unchanged:

- Backgrounds: deep espresso-charcoal (warm undertone)
- Text: warm cream / parchment tones
- Accent: muted champagne gold (less saturated than the current green — glows
  quietly). Inherited by selection, underlines, and the work-row hover sweep.
- Borders: warm-tinted to match
- `theme-color` meta in `index.html` updated to the new deep background

### 2. Aurora (`src/components/LandingPage.tsx`)

Motion identical; only the three color stops change from green/teal/blue to
bronze → amber → rosewood, at similar luminance to the current stops.

### 3. Typography

- Clash Display stays for display type.
- All Geist Mono uppercase labels (hero topline, contact kicker, project
  numbers/tags) become letterspaced uppercase **Geist** — same sizes and
  tracking, humanist instead of monospaced. Geist Mono is then unused on this
  page and can be dropped from the font load.
- Italic accent words (`.section-title em`) switch to **Gambetta italic**
  (Fontshare, added to the existing Fontshare link) in the gold accent.
  Instrument Serif was considered but `.impeccable.md` documents it as
  deliberately avoided.

### 4. Out of scope / untouched

Layout, spacing, Framer Motion reveals, marquee, hover behaviors, responsive
rules, and the separate gym page (`gym.html` + `css/` + `js/`).

## Verification

Run the Vite dev server and take headless screenshots (per the documented
WebGL/inView workflow) of the hero, about, work rows, and contact sections;
confirm the new palette renders and nothing regressed structurally.
