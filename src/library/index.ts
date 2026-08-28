import { BAYS, VOLUMES, volumesInBay, type Bay, type Volume } from "./data";
import { createLibrary, type Library } from "./scene";

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

function buildDetail(v: Volume): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.append(el("p", "detail__eyebrow", v.dates));
  frag.append(el("h3", "detail__title", v.title));
  frag.append(el("p", "detail__subtitle", `${v.subtitle} · ${v.place}`));

  const rule = el("hr", "detail__rule");
  frag.append(rule);

  const list = el("ul", "detail__lines");
  for (const line of v.lines) list.append(el("li", undefined, line));
  frag.append(list);

  const tags = el("ul", "detail__tags");
  for (const tag of v.tags) tags.append(el("li", undefined, tag));
  frag.append(tags);

  return frag;
}

export function mountLibrary(section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>(".library__stage");
  const caption = section.querySelector<HTMLElement>(".library__caption");
  if (!stage || !caption) return;
  const captionEl: HTMLElement = caption;

  if (!webglAvailable()) {
    section.classList.add("library--static");
    stage.replaceChildren(buildFallback());
    return;
  }

  // ── Stage furniture ───────────────────────────────────────────
  const canvas = el("canvas", "library__canvas");
  canvas.setAttribute("aria-hidden", "true");

  const hint = el("p", "library__hint", "Select a volume to open it");

  const detail = el("aside", "detail");
  detail.setAttribute("aria-live", "polite");
  detail.hidden = true;

  const close = el("button", "detail__close");
  close.type = "button";
  close.setAttribute("aria-label", "Return the volume to the shelf");
  close.textContent = "Shelve it";

  const detailBody = el("div", "detail__body");
  detail.append(detailBody, close);

  // Keyboard route to every volume, since a canvas offers none.
  const keys = el("div", "library__keys");
  keys.setAttribute("aria-label", "Volumes on this shelf");

  stage.replaceChildren(canvas, hint, detail, keys);

  // ── Scene ─────────────────────────────────────────────────────
  let library: Library;
  try {
    library = createLibrary({
      canvas,
      onSelect: (volume) => showDetail(volume),
      onHover: (volume) => {
        hint.textContent = volume
          ? `${volume.title} — ${volume.subtitle}`
          : "Select a volume to open it";
        hint.classList.toggle("is-named", Boolean(volume));
      },
    });
  } catch {
    section.classList.add("library--static");
    stage.replaceChildren(buildFallback());
    return;
  }

  function showDetail(volume: Volume | null) {
    if (!volume) {
      detail.classList.remove("is-open");
      window.setTimeout(() => {
        if (!detail.classList.contains("is-open")) detail.hidden = true;
      }, 420);
      hint.hidden = false;
      return;
    }
    detailBody.replaceChildren(buildDetail(volume));
    detail.hidden = false;
    hint.hidden = true;
    // Let the element paint before transitioning it in.
    requestAnimationFrame(() => detail.classList.add("is-open"));
  }

  close.addEventListener("click", () => library.select(null));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") library.select(null);
  });

  // ── Bay toggle ────────────────────────────────────────────────
  const tabs = section.querySelectorAll<HTMLButtonElement>("[data-bay]");

  function renderKeys(bay: Bay) {
    keys.replaceChildren(
      ...volumesInBay(bay).map((v) => {
        const button = el("button", "library__key", `Open ${v.title}`);
        button.type = "button";
        button.addEventListener("click", () => library.select(v.id));
        return button;
      }),
    );
  }

  function activate(bay: Bay) {
    library.setBay(bay);
    captionEl.textContent = BAYS.find((b) => b.id === bay)!.caption;
    for (const tab of tabs) {
      const active = tab.dataset.bay === bay;
      tab.setAttribute("aria-selected", String(active));
      tab.classList.toggle("is-active", active);
    }
    renderKeys(bay);
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => activate(tab.dataset.bay as Bay));
  }

  activate("experience");
}

export { VOLUMES };
