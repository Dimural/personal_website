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

/** Never `networkidle` — fonts come from Google and the hero animates to ~1.2s. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(3000);
}

async function debugState(page) {
  return page.evaluate(() => window.__library ?? null);
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
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
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
      await page.goto(ORIGIN, { waitUntil: "domcontentloaded" });
      await settle(page);

      const state = await debugState(page);
      check(`${viewport.name}: debug surface present`, state !== null);
      check(`${viewport.name}: scene ready`, state?.ready === true);
      await page.screenshot({ path: `${SHOTS}${viewport.name}-load.png`, fullPage: true });

      check(`${viewport.name}: console clean`, noise.length === 0, noise.slice(0, 3).join(" | "));
      await page.close();
    }

    console.log("\ntexture probe");
    const probe = await browser.newPage();
    await probe.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
    await probe.goto(`${ORIGIN}/?probe=textures`, { waitUntil: "domcontentloaded" });
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
    await detail.goto(`${ORIGIN}/?probe=textures&volume=finaldose`, { waitUntil: "domcontentloaded" });
    await settle(detail);
    const detailPainted = await detail.evaluate(() => document.querySelectorAll("#probe canvas").length);
    check("texture probe detail painted one volume", detailPainted === 23, `got ${detailPainted}`);
    await detail.screenshot({ path: `${SHOTS}textures-finaldose.png`, fullPage: true });
    await detail.close();

    console.log("\nrig probe");
    const rig = await browser.newPage();
    await rig.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
    await rig.goto(`${ORIGIN}/?probe=rig`, { waitUntil: "domcontentloaded" });
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
      await flexPage.goto(`${ORIGIN}/?probe=rig&${query}`, { waitUntil: "domcontentloaded" });
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
