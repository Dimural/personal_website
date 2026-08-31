import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import process from "node:process";

const PUPPETEER = process.env.PUPPETEER_PATH
  ?? "/private/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = process.env.CHROME_PATH
  ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 5178;
const ORIGIN = `http://localhost:${PORT}`;
const SHOTS = new URL("../shots/", import.meta.url).pathname;

const VIEWPORTS = [
  { name: "wide", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

const failures = [];
function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  const server = spawn(
    "npx",
    ["vite", "--port", String(PORT), "--strictPort"],
    { cwd: new URL("..", import.meta.url).pathname, stdio: ["ignore", "pipe", "pipe"] },
  );
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("vite did not start")), 30000);
      server.stdout.on("data", (chunk) => {
        if (String(chunk).includes("ready in")) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.on("error", reject);
    });
  } catch (error) {
    // Readiness never arrived (timeout) or the child errored before it could
    // — kill the spawned process ourselves, since the caller never got a
    // handle on it to do so.
    server.kill();
    throw error;
  }
  return server;
}

/**
 * Every `page.goto` below passes an explicit 60s `timeout` rather than
 * Puppeteer's 30s default. Measured directly (isolated `goto` timing,
 * against both this codebase and an unmodified HEAD checkout): the initial
 * module graph — six books' worth of canvas-painted textures, evaluated
 * synchronously before `domcontentloaded` can fire — took 35-45s on a
 * loaded dev machine, comfortably clearing 30s but not by much. Same
 * swiftshader-under-load story as `waitForMode`'s 90s budget below; this is
 * the same headroom applied one step earlier, at first navigation.
 */

/** Never `networkidle` — fonts come from Google and the hero animates to ~1.2s. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(3000);
}

async function debugState(page) {
  return page.evaluate(() => window.__library ?? null);
}

/**
 * The scene pauses when the canvas leaves the viewport (IntersectionObserver
 * in `scene.ts`), so anything that has to *animate* must be scrolled into
 * view first or it will simply never advance.
 */
async function revealLibrary(page) {
  await page.evaluate(() =>
    document.querySelector("#library").scrollIntoView({ block: "center" }),
  );
  await sleep(600);
}

async function shootViewport(page, path) {
  await page.screenshot({ path });
}

async function shootStage(page, path) {
  const stage = await page.$(".library__stage");
  await stage.screenshot({ path });
}

/**
 * Headless Chrome produces frames only on demand, so a `requestAnimationFrame`
 * loop stalls between screenshots and a time-driven transition never advances
 * — it lurches forward only when something forces a composite. A screencast
 * keeps BeginFrames coming for as long as it runs, which is what lets the
 * carousel case measure motion over real time. Returns a stop function.
 */
async function startFramePump(page) {
  const client = await page.createCDPSession();
  client.on("Page.screencastFrame", ({ sessionId }) => {
    client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.enable");
  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 10,
    maxWidth: 120,
    maxHeight: 120,
    everyNthFrame: 1,
  });
  return async () => {
    await client.send("Page.stopScreencast").catch(() => {});
    await client.detach().catch(() => {});
  };
}

/**
 * Polls the debug surface; resolves false if the mode never arrives.
 *
 * The default timeout is generous. In this headless + swiftshader setup,
 * `requestAnimationFrame` itself — not `renderer.render()`, which is
 * consistently a few milliseconds — gets paced by the browser at roughly
 * 1 Hz once a bay tab is clicked and the scene starts actively animating
 * (confirmed with an independent rAF counter unrelated to Three.js: it
 * throttles identically). `dt` is clamped to 0.05s per frame by design (a
 * production safeguard against huge jumps if a real tab was backgrounded),
 * so at ~1 frame/second the 0.92s SPREAD_DURATION transition needs on the
 * order of twenty real seconds to accumulate here, even though it renders
 * in under a second in a normal browser. Measured completion in this
 * environment: 25-40s per transition, and regrouping runs slower than
 * spreading the further into an animated session it starts, so the budget
 * below leaves real headroom rather than chasing the measured minimum.
 */
/** Polls the debug surface until `predicate` holds, or gives up. */
async function waitUntil(page, predicate, timeout = 90000) {
  const started = Date.now();
  let state = null;
  while (Date.now() - started < timeout) {
    state = await debugState(page);
    if (predicate(state)) return { ok: true, state };
    await sleep(250);
  }
  return { ok: false, state };
}

async function waitForMode(page, target, timeout = 90000) {
  const deadline = Date.now() + timeout;
  let last = null;
  while (Date.now() < deadline) {
    const state = await debugState(page);
    last = state?.mode ?? null;
    if (last === target) return { ok: true, mode: last };
    await sleep(80);
  }
  return { ok: false, mode: last };
}

async function main() {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });

  let server = null;
  let browser = null;

  try {
    server = await startServer();
    const { default: puppeteer } = await import(PUPPETEER);
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        // Without these a background tab's rAF loop is throttled to a stop,
        // and a transition driven by the frame clock never advances between
        // screenshots. See `bringToFront` below as well.
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    for (const viewport of VIEWPORTS) {
      console.log(`\n${viewport.name} ${viewport.width}x${viewport.height}`);
      const page = await browser.newPage();
      const noise = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          noise.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => noise.push(`pageerror: ${error.message}`));
      await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
      await page.goto(ORIGIN, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page);

      const state = await debugState(page);
      check(`${viewport.name}: debug surface present`, state !== null);
      check(`${viewport.name}: scene ready`, state?.ready === true);
      await page.screenshot({ path: `${SHOTS}${viewport.name}-load.png`, fullPage: true });

      check(`${viewport.name}: console clean`, noise.length === 0, noise.slice(0, 3).join(" | "));
      await page.close();
    }

    // ── The fly-out, the carousel, and the gather back up ──────────
    console.log("\ncarousel");
    const carousel = await browser.newPage();
    const carouselNoise = [];
    carousel.on("console", (message) => {
      if (message.type() === "error") carouselNoise.push(message.text());
    });
    carousel.on("pageerror", (error) => carouselNoise.push(error.message));
    await carousel.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    // A backgrounded tab produces no frames, so the mode machine would sit at
    // `spreading` forever and only lurch forward when a screenshot forced a
    // composite. This test is about motion over time; it needs a live clock.
    await carousel.bringToFront();
    await carousel.goto(ORIGIN, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(carousel);
    await revealLibrary(carousel);
    const stopPump = await startFramePump(carousel);

    const shelfState = await debugState(carousel);
    check("carousel: starts in shelf mode", shelfState?.mode === "shelf", `got ${shelfState?.mode}`);
    check("carousel: six books on the shelf", shelfState?.bookCount === 6, `got ${shelfState?.bookCount}`);
    await shootStage(carousel, `${SHOTS}wide-shelf.png`);

    await carousel.evaluate(() =>
      document.querySelector('[data-bay="experience"]').click(),
    );

    // Mid-flight: read the state first, then shoot, so the assertion is not
    // pushed past the transition by the screenshot's own latency.
    await sleep(300);
    const midState = await debugState(carousel);
    await shootStage(carousel, `${SHOTS}wide-spreading.png`);
    check("carousel: caught mid-flight", midState?.mode === "spreading", `got ${midState?.mode}`);

    const reachedBrowse = await waitForMode(carousel, "browse");
    check("carousel: reaches browse", reachedBrowse.ok, `mode stuck at ${reachedBrowse.mode}`);
    await sleep(700);
    await shootStage(carousel, `${SHOTS}wide-browse.png`);

    const beforeWheel = (await debugState(carousel))?.selectedIndex;
    await carousel.evaluate(() => {
      const canvas = document.querySelector(".library__canvas");
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < 2; i++) {
        canvas.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: 400,
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        );
      }
    });
    // Same rAF throttling as `waitForMode` above applies here too — `position`
    // only damps toward `targetPosition` on real animation frames, so give it
    // the same generous, poll-until-changed budget rather than a fixed sleep.
    const wheelDeadline = Date.now() + 60000;
    let afterWheel = await debugState(carousel);
    while (Date.now() < wheelDeadline && afterWheel?.selectedIndex === beforeWheel) {
      await sleep(200);
      afterWheel = await debugState(carousel);
    }
    check(
      "carousel: wheel advances the selection",
      afterWheel?.selectedIndex !== beforeWheel,
      `${beforeWheel} -> ${afterWheel?.selectedIndex}`,
    );
    check("carousel: still browsing after the wheel", afterWheel?.mode === "browse", `got ${afterWheel?.mode}`);
    await shootStage(carousel, `${SHOTS}wide-browse-turned.png`);

    // ── Picking a volume up: fly to camera, hold it, put it back ──────
    console.log("\nopening a book");
    const beforeOpen = await debugState(carousel);
    await carousel.keyboard.press("Enter");
    const reachedReading = await waitForMode(carousel, "reading");
    check("carousel: Enter opens the centred book", reachedReading.ok, `mode stuck at ${reachedReading.mode}`);
    await sleep(600);
    const readingState = await debugState(carousel);
    check(
      "carousel: book arrives closed",
      readingState?.readingOpen === false,
      `got ${readingState?.readingOpen}`,
    );
    check("carousel: spread starts at 0", readingState?.spread === 0, `got ${readingState?.spread}`);
    await shootStage(carousel, `${SHOTS}wide-reading.png`);
    await shootViewport(carousel, `${SHOTS}wide-reading-full.png`);

    // Space swings the cover; the arrows then turn spreads. Both are the
    // keyboard route to what dragging the cover and pages does by pointer.
    await carousel.keyboard.press(" ");
    const opened = await waitUntil(carousel, (s) => s?.readingOpen === true);
    check("carousel: Space opens the cover", opened.ok, `readingOpen ${opened.state?.readingOpen}`);
    await sleep(900);
    await shootStage(carousel, `${SHOTS}wide-reading-open.png`);
    await shootViewport(carousel, `${SHOTS}wide-reading-open-full.png`);

    await carousel.keyboard.press("ArrowRight");
    await carousel.keyboard.press("ArrowRight");
    const turned = await waitUntil(carousel, (s) => s?.spread === 2);
    check("carousel: arrows turn two spreads", turned.ok, `spread ${turned.state?.spread}`);
    await sleep(900);
    await shootStage(carousel, `${SHOTS}wide-reading-spread.png`);
    await shootViewport(carousel, `${SHOTS}wide-reading-spread-full.png`);

    const panelText = await carousel.evaluate(() => ({
      title: document.getElementById("detail-title")?.textContent ?? "",
      binding: document.getElementById("detail-binding")?.textContent ?? "",
      folio: document.getElementById("page-label")?.textContent ?? "",
      live: document.getElementById("live")?.textContent ?? "",
    }));
    check(
      "carousel: detail panel carries the volume",
      panelText.title.length > 0 && panelText.binding.length > 0,
      JSON.stringify(panelText),
    );
    check(
      "carousel: folio tracks the spread",
      panelText.folio === "Spread 03",
      `got "${panelText.folio}"`,
    );
    check(
      "carousel: live region announces",
      panelText.live.length > 0,
      `got "${panelText.live}"`,
    );


    // Light ink on a light ground is invisible but passes every structural
    // check — the volume palettes pair a dark `paper` with a light `ink`, so
    // a panel that mixes pairs loses its own type. Measure it.
    const contrast = await carousel.evaluate(() => {
      const luminance = (color) => {
        const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(Number);
        const channel = (v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const panel = document.getElementById("detail");
      const bg = luminance(getComputedStyle(panel).backgroundColor);
      const read = (id) => {
        const fg = luminance(getComputedStyle(document.getElementById(id)).color);
        const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
        return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
      };
      return {
        title: read("detail-title"),
        binding: read("detail-binding"),
        folio: read("page-label"),
      };
    });
    for (const [name, ratio] of Object.entries(contrast)) {
      check(
        `carousel: detail ${name} is legible on the panel`,
        ratio >= 4.5,
        `contrast ${ratio}:1`,
      );
    }
    await carousel.keyboard.press("ArrowLeft");
    const turnedBack = await waitUntil(carousel, (s) => s?.spread === 1);
    check("carousel: arrows turn back", turnedBack.ok, `spread ${turnedBack.state?.spread}`);

    await carousel.keyboard.press("Escape");
    const backToBrowse = await waitForMode(carousel, "browse");
    check("carousel: Escape closes the held book", backToBrowse.ok, `mode stuck at ${backToBrowse.mode}`);
    await sleep(500);
    const afterClose = await debugState(carousel);
    check(
      "carousel: selection unchanged, book back in its slot",
      afterClose?.selectedIndex === beforeOpen?.selectedIndex,
      `${beforeOpen?.selectedIndex} -> ${afterClose?.selectedIndex}`,
    );
    await shootStage(carousel, `${SHOTS}wide-reading-closed.png`);

    await carousel.keyboard.press("Escape");
    const reachedShelf = await waitForMode(carousel, "shelf");
    check("carousel: Escape reshelves", reachedShelf.ok, `mode stuck at ${reachedShelf.mode}`);
    await sleep(500);
    await shootStage(carousel, `${SHOTS}wide-reshelved.png`);

    check(
      "carousel: console clean",
      carouselNoise.length === 0,
      carouselNoise.slice(0, 3).join(" | "),
    );
    await stopPump();
    await carousel.close();

    console.log("\ntexture probe");
    const probe = await browser.newPage();
    await probe.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
    await probe.goto(`${ORIGIN}/?probe=textures`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(probe);
    const painted = await probe.evaluate(() => document.querySelectorAll("#probe canvas").length);
    check("texture probe painted every canvas", painted >= 6 * 12, `got ${painted}`);
    await probe.screenshot({ path: `${SHOTS}textures.png`, fullPage: true });
    await probe.close();

    // The overview above downscales every canvas to a 320px thumbnail (see
    // the comment on `snapshot` in probe.ts) — enough to spot a missing
    // painter, not enough to judge micro-text or page margins. Shoot one
    // representative volume at full resolution so a legible artifact is
    // always in the evidence trail, without slowing the harness down by
    // shooting all six.
    console.log("\ntexture probe (detail)");
    const detail = await browser.newPage();
    await detail.setViewport({ width: 3400, height: 1000, deviceScaleFactor: 1 });
    await detail.goto(`${ORIGIN}/?probe=textures&volume=finaldose`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(detail);
    const detailPainted = await detail.evaluate(() => document.querySelectorAll("#probe canvas").length);
    check("texture probe detail painted one volume", detailPainted === 23, `got ${detailPainted}`);
    await detail.screenshot({ path: `${SHOTS}textures-finaldose.png`, fullPage: true });
    await detail.close();

    console.log("\nrig probe");
    const rig = await browser.newPage();
    await rig.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
    await rig.goto(`${ORIGIN}/?probe=rig`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(rig);
    const rigState = await debugState(rig);
    check("rig probe: debug surface present", rigState !== null);
    check("rig probe: scene ready", rigState?.ready === true);
    check("rig probe: bookCount", rigState?.bookCount === 1, `got ${rigState?.bookCount}`);
    check("rig probe: rigPivots === 6", rigState?.rigPivots === 6, `got ${rigState?.rigPivots}`);
    await rig.screenshot({ path: `${SHOTS}rig.png` });
    await rig.close();

    // Page physics (Task 5) — the rig probe's own settle loop (~1.5s of
    // simulated frames, see `mountRigProbe`) runs before its one render, so
    // no extra `settle()` wait is needed for the springs themselves; the
    // page load's usual settle still covers fonts/scene readiness.
    console.log("\nrig probe (page physics)");
    const flexCases = [
      { name: "rig-open-0", query: "open=0" },
      { name: "rig-open-0.5", query: "open=0.5" },
      { name: "rig-open-1", query: "open=1" },
      { name: "rig-open-1-spread-2", query: "open=1&spread=2" },
    ];
    for (const { name, query } of flexCases) {
      const flexPage = await browser.newPage();
      await flexPage.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
      await flexPage.goto(`${ORIGIN}/?probe=rig&${query}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(flexPage);
      const flexState = await debugState(flexPage);
      check(`${name}: debug surface present`, flexState !== null);
      check(`${name}: scene ready`, flexState?.ready === true);
      if (query.includes("spread=2")) {
        check(`${name}: spread === 2`, flexState?.spread === 2, `got ${flexState?.spread}`);
      }
      await flexPage.screenshot({ path: `${SHOTS}${name}.png` });
      await flexPage.close();
    }

    // ── Reduced motion ────────────────────────────────────────────
    // Every transition should collapse to a single-frame settle, so the
    // whole flow stays reachable without any of it animating.
    console.log("\nreduced motion");
    const reduced = await browser.newPage();
    const reducedNoise = [];
    reduced.on("console", (m) => {
      if (m.type() === "error") reducedNoise.push(m.text());
    });
    reduced.on("pageerror", (e) => reducedNoise.push(e.message));
    await reduced.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await reduced.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await reduced.goto(ORIGIN, { waitUntil: "domcontentloaded" });
    await settle(reduced);
    await reduced.evaluate(() => document.querySelector("#library").scrollIntoView());
    await sleep(400);
    await reduced.click('[data-bay="experience"]');
    const rBrowse = await waitUntil(reduced, (st) => st?.mode === "browse", 15000);
    check("reduced motion: reaches browse without animating", rBrowse.ok, `mode ${rBrowse.state?.mode}`);
    await reduced.keyboard.press("Enter");
    const rRead = await waitUntil(reduced, (st) => st?.mode === "reading", 15000);
    check("reduced motion: opens a book", rRead.ok, `mode ${rRead.state?.mode}`);
    await reduced.keyboard.press("Escape");
    await reduced.keyboard.press("Escape");
    const rShelf = await waitUntil(reduced, (st) => st?.mode === "shelf", 15000);
    check("reduced motion: returns to the shelf", rShelf.ok, `mode ${rShelf.state?.mode}`);
    await shootViewport(reduced, `${SHOTS}reduced-motion.png`);
    check("reduced motion: console clean", reducedNoise.length === 0, reducedNoise.slice(0, 2).join(" | "));
    await reduced.close();

    // ── No WebGL ──────────────────────────────────────────────────
    // The outer guard: the full catalogue must stay readable as HTML.
    console.log("\nno webgl");
    const noGl = await browser.newPage();
    await noGl.evaluateOnNewDocument(() => {
      // Deny every WebGL context so the fallback path is the only one left.
      const deny = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (String(type).includes("webgl")) return null;
        return deny.call(this, type, ...rest);
      };
    });
    await noGl.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await noGl.goto(ORIGIN, { waitUntil: "domcontentloaded" });
    await settle(noGl);
    const fallback = await noGl.evaluate(() => ({
      present: Boolean(document.querySelector(".shelf-static")),
      items: document.querySelectorAll(".shelf-static__item").length,
      lines: document.querySelectorAll(".shelf-static__lines li").length,
    }));
    check("no webgl: static catalogue renders", fallback.present, JSON.stringify(fallback));
    check("no webgl: all six volumes listed", fallback.items === 6, `got ${fallback.items}`);
    check("no webgl: every bullet present", fallback.lines >= 15, `got ${fallback.lines}`);
    await shootViewport(noGl, `${SHOTS}no-webgl.png`);
    await noGl.close();
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }

  console.log("");
  if (failures.length) {
    console.log(`${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log("all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
