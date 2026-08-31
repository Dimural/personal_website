import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/library.css";
import { mountLibrary } from "./library";
import { installDebug } from "./library/debug";

const library = document.querySelector<HTMLElement>("#library");

const probe = new URLSearchParams(location.search).get("probe");

/**
 * Wrapped rather than run at the top level: `vite build` targets browsers
 * without top-level await, so a bare `await import(...)` here typechecks but
 * fails the production build. The dev server tolerates it, which is exactly
 * why it went unnoticed.
 */
async function start() {
  if (probe === "textures" || probe === "rig") {
    const target = document.querySelector<HTMLElement>("#probe")!;
    const { mountTextureProbe, mountRigProbe } = await import("./library/probe");
    if (probe === "textures") mountTextureProbe(target);
    else mountRigProbe(target);
    return;
  }

  if (!library) return;
  const surface = mountLibrary(library);

  // No surface means the static fallback took over (no WebGL, or the scene
  // threw on construction) — the harness still needs something to read.
  installDebug(
    surface ??
      (() => ({
        mode: "static",
        bay: "experience",
        selectedIndex: 0,
        readingOpen: false,
        spread: 0,
        bookCount: 0,
        ready: true,
      })),
  );
}

void start();
