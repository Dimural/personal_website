import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/library.css";
import { mountLibrary } from "./library";
import { installDebug } from "./library/debug";

const library = document.querySelector<HTMLElement>("#library");

const probe = new URLSearchParams(location.search).get("probe");
if (probe === "textures") {
  const { mountTextureProbe } = await import("./library/probe");
  mountTextureProbe(document.querySelector<HTMLElement>("#probe")!);
} else if (probe === "rig") {
  const { mountRigProbe } = await import("./library/probe");
  mountRigProbe(document.querySelector<HTMLElement>("#probe")!);
} else if (library) {
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
