/**
 * A read-only window onto scene state, for the headless verification harness.
 * Attached in dev only; `scripts/verify.mjs` is its sole consumer.
 */
export interface LibraryDebug {
  mode: string;
  bay: string;
  selectedIndex: number;
  readingOpen: boolean;
  spread: number;
  bookCount: number;
  ready: boolean;
}

declare global {
  interface Window {
    __library?: LibraryDebug;
  }
}

/**
 * `installDebug` defines `window.__library` as a getter with no setter.
 * Always call `installDebug(...)` to (re)install the surface — assigning
 * to `window.__library` directly will throw (or silently no-op in
 * non-strict contexts) since there is no setter.
 */
export function installDebug(surface: () => LibraryDebug) {
  if (!import.meta.env.DEV) return;
  Object.defineProperty(window, "__library", {
    configurable: true,
    get: surface,
  });
}
