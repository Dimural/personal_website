import { BAYS, VOLUMES, volumesInBay, type Bay, type Volume } from "./data";
import type { LibraryDebug } from "./debug";
import { SPREAD_COUNT } from "./pages";
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

const pad = (n: number) => String(n).padStart(2, "0");

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
      item.append(el("p", "shelf-static__deck", v.deck));
      const list = el("ul", "shelf-static__lines");
      for (const line of v.lines) list.append(el("li", undefined, line));
      item.append(list);
      const tags = el("ul", "shelf-static__tags");
      for (const tag of v.tags) tags.append(el("li", undefined, tag));
      item.append(tags);
      group.append(item);
    }
    wrap.append(group);
  }
  return wrap;
}

export function mountLibrary(section: HTMLElement): (() => LibraryDebug) | null {
  const stage = section.querySelector<HTMLElement>(".library__stage");
  const captionEl = section.querySelector<HTMLElement>(".library__caption");
  if (!stage || !captionEl) return null;
  const caption: HTMLElement = captionEl;

  if (!webglAvailable()) {
    section.classList.add("library--static");
    stage.replaceChildren(buildFallback());
    return null;
  }

  const pick = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;

  const browse = pick<HTMLElement>("browse");
  const detail = pick<HTMLElement>("detail");
  const live = pick<HTMLElement>("live");
  const counter = pick<HTMLElement>("browse-counter");
  const browseTitle = pick<HTMLElement>("browse-title");
  const browseNote = pick<HTMLElement>("browse-note");
  const markers = pick<HTMLElement>("browse-markers");
  const openButton = pick<HTMLButtonElement>("browse-open");
  const closeButton = pick<HTMLButtonElement>("detail-close");
  const pagePrev = pick<HTMLButtonElement>("page-prev");
  const pageNext = pick<HTMLButtonElement>("page-next");
  const pageLabel = pick<HTMLElement>("page-label");
  const pageCounter = pick<HTMLElement>("page-counter");
  const detailToggle = pick<HTMLButtonElement>("detail-toggle");

  const canvas = el("canvas", "library__canvas");
  canvas.setAttribute("aria-hidden", "true");
  stage.replaceChildren(canvas);

  let selected: Volume | null = null;
  let mode: Mode = "shelf";
  let bay: Bay = "experience";
  /** Where focus returns when the modal panel closes. */
  let focusReturn: HTMLElement = openButton;

  let library: Library;
  try {
    library = createLibrary({
      canvas,
      section,
      onSelect: (volume) => {
        selected = volume;
        paint(volume);
      },
      onHover: () => {},
      onMode: (next, nextBay) => reflect(next, nextBay),
    });
  } catch {
    section.classList.add("library--static");
    stage.replaceChildren(buildFallback());
    return null;
  }

  function say(message: string) {
    live.textContent = message;
  }

  function paint(volume: Volume | null) {
    if (!volume) return;
    const list = volumesInBay(volume.bay);
    const index = list.indexOf(volume);
    counter.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
    browseTitle.textContent = volume.title;
    browseNote.textContent = volume.note;

    [...markers.children].forEach((marker, i) => {
      const active = i === index;
      marker.setAttribute("aria-selected", String(active));
      marker.classList.toggle("is-active", active);
    });

    pick<HTMLElement>("detail-eyebrow").textContent =
      `Volume ${volume.roman} · ${volume.discipline}`;
    pick<HTMLElement>("detail-title").textContent = volume.title;
    pick<HTMLElement>("detail-deck").textContent = volume.deck;
    pick<HTMLElement>("detail-binding").textContent = volume.binding;
    pick<HTMLElement>("detail-format").textContent = volume.format;
    pick<HTMLElement>("detail-theme").textContent = volume.theme;
    pick<HTMLElement>("detail-place").textContent =
      `${volume.place} · ${volume.dates}`;
  }

  function buildMarkers(forBay: Bay) {
    markers.replaceChildren(
      ...volumesInBay(forBay).map((volume, index) => {
        const button = el("button", "browse__marker");
        button.type = "button";
        button.setAttribute("role", "tab");
        button.setAttribute("aria-label", volume.title);
        button.setAttribute("aria-selected", "false");
        button.append(el("span", undefined, pad(index + 1)));
        button.addEventListener("click", () => {
          focusReturn = button;
          library.select(index);
        });
        return button;
      }),
    );
  }

  function paintPages(open: boolean, spread: number) {
    detailToggle.textContent = open ? "Close book" : "Open book";
    detailToggle.setAttribute("aria-pressed", String(open));
    pagePrev.disabled = !open || spread <= 0;
    pageNext.disabled = !open || spread >= SPREAD_COUNT - 1;
    pageLabel.textContent = open ? `Spread ${pad(spread + 1)}` : "Closed";
    pageCounter.textContent = open
      ? `of ${pad(SPREAD_COUNT)}`
      : "Click the book to open it";
  }

  /**
   * Mirrors scene state into the interface. Entering `reading` makes the
   * panel modal: the browser behind it goes inert and focus moves in, so a
   * keyboard user cannot tab into controls sitting behind the dialog.
   */
  function reflect(next: Mode, nextBay: Bay) {
    const wasReading = mode === "reading";
    mode = next;
    bay = nextBay;

    const browsing = next !== "shelf";
    const reading = next === "reading" || next === "opening";

    section.classList.toggle("is-browsing", browsing);
    section.classList.toggle("is-reading", reading);

    browse.hidden = !browsing;
    browse.inert = reading;

    detail.hidden = !reading;
    detail.setAttribute("aria-hidden", String(!reading));
    detail.inert = !reading;

    for (const tab of tabs) {
      const active = browsing && tab.dataset.bay === nextBay;
      tab.setAttribute("aria-selected", String(active));
      tab.classList.toggle("is-active", active);
    }
    caption.textContent = browsing
      ? BAYS.find((b) => b.id === nextBay)!.caption
      : "Two bays, six volumes";

    const state = library.debug();
    paintPages(state.readingOpen, state.spread);

    if (next === "reading" && !wasReading) {
      requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
      say(`${selected?.title ?? "Volume"} in hand. Drag the cover to open it.`);
    } else if (wasReading && next === "browse") {
      requestAnimationFrame(() => focusReturn.focus({ preventScroll: true }));
      say(`${selected?.title ?? "Volume"} returned to the carousel.`);
    }
  }

  // ── Controls ──────────────────────────────────────────────────
  const tabs = section.querySelectorAll<HTMLButtonElement>("[data-bay]");
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      if (mode !== "shelf") return;
      focusReturn = tab;
      const target = tab.dataset.bay as Bay;
      buildMarkers(target);
      library.openBay(target);
      say(`${BAYS.find((b) => b.id === target)!.label} bay emptied onto the rail.`);
    });
  }

  pick<HTMLButtonElement>("browse-prev").addEventListener("click", () =>
    library.navigate(-1),
  );
  pick<HTMLButtonElement>("browse-next").addEventListener("click", () =>
    library.navigate(1),
  );
  openButton.addEventListener("click", () => {
    focusReturn = openButton;
    library.open();
  });
  pick<HTMLButtonElement>("browse-shelve").addEventListener("click", () =>
    library.close(),
  );
  closeButton.addEventListener("click", () => library.close());
  pick<HTMLButtonElement>("detail-reset").addEventListener("click", () =>
    library.resetView(),
  );

  detailToggle.addEventListener("click", () => {
    const open = !library.debug().readingOpen;
    library.setReadingOpen(open);
    const state = library.debug();
    paintPages(state.readingOpen, state.spread);
    say(open ? "Opened to the title page." : "Book closed.");
  });

  function turn(direction: number) {
    library.turnPage(direction);
    const state = library.debug();
    paintPages(state.readingOpen, state.spread);
    if (state.readingOpen) {
      say(`Spread ${pad(state.spread + 1)} of ${pad(SPREAD_COUNT)}.`);
    }
  }
  pagePrev.addEventListener("click", () => turn(-1));
  pageNext.addEventListener("click", () => turn(1));

  // ── Keyboard ──────────────────────────────────────────────────
  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (mode === "shelf") return;

    switch (event.key) {
      case "Escape":
        library.close();
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (mode === "reading") turn(-1);
        else library.navigate(-1);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (mode === "reading") turn(1);
        else library.navigate(1);
        break;
      case "Home":
        if (mode === "browse") library.select(0);
        break;
      case "End":
        if (mode === "browse") library.select(volumesInBay(bay).length - 1);
        break;
      case "Enter":
        if (mode === "browse") library.open();
        break;
      case " ":
        if (mode === "reading") {
          event.preventDefault();
          detailToggle.click();
        }
        break;
    }
  });

  buildMarkers("experience");
  reflect("shelf", "experience");

  return library.debug;
}

export { VOLUMES };
