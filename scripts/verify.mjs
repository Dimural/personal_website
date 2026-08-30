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
