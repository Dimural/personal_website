import { BAYS, VOLUMES, volumesInBay, type Bay, type Volume } from "./data";
import type { LibraryDebug } from "./debug";
import { createLibrary, type Library, type Mode } from "./scene";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/** Full content in readable form — used when WebGL is unavailable. */
function buildFallback(): HTMLElement {
  const wrap = el("div", "shelf-static");
  for (const bay of BAYS) {
    const group = el("section", "shelf-static__bay");
    group.append(el("h3", "shelf-static__title", bay.label));
    for (const v of volumesInBay(bay.id)) {
      const item = el("article", "shelf-static__item");
      item.append(el("h4", "shelf-static__name", v.title));
      item.append(
        el("p", "shelf-static__meta", `${v.subtitle} · ${v.place} · ${v.dates}`),
      );
      const list = el("ul", "shelf-static__lines");
      for (const line of v.lines) list.append(el("li", undefined, line));
      item.append(list);
      group.append(item);
    }
    wrap.append(group);
  }
  return wrap;
}

/**
 * Mounts the shelf and returns a debug accessor for `installDebug`.
 *
 * The browse interface here is deliberately thin — the bay tabs, a hint line,
 * a keyboard route, and Escape. The real one (counter, markers, prev/next,
 * detail panel) is Task 10's; this is only enough to drive and verify the
 * mode machine.
 */
export function mountLibrary(section: HTMLElement): (() => LibraryDebug) | null {
  const stage = section.querySelector<HTMLElement>(".library__stage");
  const caption = section.querySelector<HTMLElement>(".library__caption");
  if (!stage || !caption) return null;
  const captionEl: HTMLElement = caption;

  if (!webglAvailable()) {
    section.classList.add("library--static");
    stage.replaceChildren(buildFallback());
    return null;
  }

  // ── Stage furniture ───────────────────────────────────────────
  const canvas = el("canvas", "library__canvas");
  canvas.setAttribute("aria-hidden", "true");

  const IDLE_HINT = "Choose a bay to empty it";
  const hint = el("p", "library__hint", IDLE_HINT);

  // Keyboard route to every volume, since a canvas offers none.
  const keys = el("div", "library__keys");
  keys.setAttribute("aria-label", "Volumes on this shelf");

  stage.replaceChildren(canvas, hint, keys);

  // ── Scene ─────────────────────────────────────────────────────
  let library: Library;
  try {
    library = createLibrary({
      canvas,
      onSelect: (volume) => {
        selectedVolume = volume;
        describe(volume);
      },
      onHover: (volume) => describe(volume ?? selectedVolume),
      onMode: (mode, bay) => reflect(mode, bay),
    });
  } catch {
    section.classList.add("library--static");
    stage.replaceChildren(buildFallback());
    return null;
  }

  let selectedVolume: Volume | null = null;

  function describe(volume: Volume | null) {
    hint.textContent = volume
      ? `${volume.title} — ${volume.subtitle}`
      : IDLE_HINT;
    hint.classList.toggle("is-named", Boolean(volume));
  }

  // ── Bay tabs ──────────────────────────────────────────────────
  const tabs = section.querySelectorAll<HTMLButtonElement>("[data-bay]");

  function reflect(mode: Mode, bay: Bay) {
    const open = mode !== "shelf";
    for (const tab of tabs) {
      const active = open && tab.dataset.bay === bay;
      tab.setAttribute("aria-selected", String(active));
      tab.classList.toggle("is-active", active);
    }
    captionEl.textContent = open
      ? BAYS.find((b) => b.id === bay)!.caption
      : "Two bays, six volumes";
    renderKeys(bay, open);
  }

  function renderKeys(bay: Bay, open: boolean) {
    keys.replaceChildren(
      ...volumesInBay(bay).map((v, index) => {
        const button = el("button", "library__key", `Show ${v.title}`);
        button.type = "button";
        button.addEventListener("click", () => {
          library.openBay(bay);
          library.select(index);
        });
        return button;
      }),
      ...(open
        ? [
            (() => {
              const button = el("button", "library__key", "Shelve these volumes");
              button.type = "button";
              button.addEventListener("click", () => library.close());
              return button;
            })(),
          ]
        : []),
    );
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => library.openBay(tab.dataset.bay as Bay));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") library.close();
    else if (event.key === "ArrowRight") library.navigate(1);
    else if (event.key === "ArrowLeft") library.navigate(-1);
  });

  reflect("shelf", "experience");

  return library.debug;
}

export { VOLUMES };
