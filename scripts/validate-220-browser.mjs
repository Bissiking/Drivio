import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url), puppeteer = require(process.env.DRIVIO_PUPPETEER_MODULE ?? "puppeteer"), Database = require("better-sqlite3");
const fixture = JSON.parse(await readFile("tmp/210-browser-session.json", "utf8"));
assert.ok(fixture.directory.includes("drivio-evolution-")); assert.ok(fixture.automaticToken && fixture.guestToken);
const sqlite = new Database(fixture.database), base = "http://127.0.0.1:3220", out = ".impeccable/review";
const report = { scope: "Chrome headless, isolated synthetic SQLite and encrypted sessions. Installed mode simulated via navigator.standalone; no real Kyros or device installation.", checks: [], pages: [], errors: [] };
await mkdir(out, { recursive: true });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3220"], { env: { ...process.env, DRIVIO_BUILD_DIR: "tmp/mobile-next", DATABASE_URL: `file:${fixture.database}`, SESSION_SECRET: fixture.secret, DRIVIO_DOCUMENT_DIR: `${fixture.directory}/documents`, NEXT_PUBLIC_APP_URL: base }, stdio: ["ignore", "pipe", "pipe"] });
let browser, logs = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", data => { logs += data.toString(); });
try {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(logs.slice(-3000));
    if (await fetch(`${base}/health`).then(response => response.ok).catch(() => false)) break;
    if (i === 119) throw new Error(logs.slice(-3000));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await puppeteer.launch({ headless: true, ...(process.env.DRIVIO_CHROME_PATH ? { executablePath: process.env.DRIVIO_CHROME_PATH } : {}) });
  const pageFor = async (token, installed = false) => {
    const page = await (await browser.createBrowserContext()).newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    await page.setCookie({ name: "drivio_session", value: token, url: base, httpOnly: true });
    if (installed) await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, "standalone", { get: () => true }));
    return page;
  };
  const visit = async (page, route, width = 390) => {
    await page.setViewport({ width, height: 960, deviceScaleFactor: 1 });
    const response = await page.goto(base + route, { waitUntil: "networkidle0" }); assert.equal(response.status(), 200, route);
    assert.ok(!page.url().includes("connexion"));
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); assert.ok(size.scroll <= width + 1, `Overflow ${route} at ${width}`);
    report.pages.push({ route, ...size });
  };
  const capture = async (page, name) => { await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${out}/220-${name}.png`, fullPage: !name.includes("modal") }); };
  const api = (page, path, method, body) => page.evaluate(async ({ path, method, body }) => { const response = await fetch(path, { method, headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }); return { status: response.status, body: await response.json() }; }, { path, method, body });
  const owner = await pageFor(fixture.token), installed = await pageFor(fixture.token, true);
  if (process.env.DRIVIO_220_CAPTURE_MODAL === "1") {
    await visit(owner, "/parametres");
    await api(owner, "/api/preferences/experience", "PATCH", { homePage: "auto", interfaceStyle: "horizon" });
    await visit(owner, "/carburant?vehicle=qa-cupra");
    await owner.evaluate(() => [...document.querySelectorAll("button")].find(button => button.textContent.includes("Ouvrir le formulaire en fenêtre")).click());
    await owner.waitForSelector('.entry-dialog[open]');
    await capture(owner, "fuel-modal-mobile");
  } else {
  await visit(owner, "/dashboard", 1440); assert.ok((await owner.$eval("main", element => element.innerText)).includes("Votre registre")); await capture(owner, "classic-desktop");
  await visit(owner, "/parametres", 1440);
  await owner.select('form[aria-label="Accueil et interface"] select[name="homePage"]', "add");
  await owner.select('form[aria-label="Accueil et interface"] select[name="interfaceStyle"]', "horizon");
  const preferencesSaved = owner.waitForResponse(response => response.url().endsWith("/api/preferences/experience") && response.request().method() === "PATCH");
  await owner.click('form[aria-label="Accueil et interface"] button[type="submit"]'); assert.equal((await preferencesSaved).status(), 200);
  await owner.waitForFunction(() => document.documentElement.dataset.interface === "horizon");
  await visit(owner, "/", 390); assert.equal(new URL(owner.url()).pathname, "/ajouter");
  await visit(owner, "/dashboard?vehicle=qa-cupra", 1440);
  await owner.select("#horizon-vehicle", "qa-clio"); await owner.waitForFunction(() => new URLSearchParams(location.search).get("vehicle") === "qa-clio");
  await owner.waitForFunction(() => document.querySelector(".horizon-vehicle-identity h2")?.textContent.includes("Clio"));
  await owner.waitForSelector("#horizon-vehicle:not(:disabled)");
  await owner.select("#horizon-vehicle", "qa-cupra"); await owner.waitForFunction(() => document.querySelector(".horizon-vehicle-identity h2")?.textContent.includes("Formentor"));
  await capture(owner, "horizon-desktop");
  await visit(owner, "/dashboard?vehicle=qa-cupra", 390); await capture(owner, "horizon-mobile");
  const compactDashboard = await owner.evaluate(() => {
    const navigation = document.querySelector('nav[aria-label="Navigation mobile"]').getBoundingClientRect();
    return {
      actionsVisible: [...document.querySelectorAll('.horizon-quick-actions .entry-action')].every(element => element.getBoundingClientRect().bottom <= navigation.top),
      iconsVisible: [...document.querySelectorAll('.horizon-metric > svg')].every(element => getComputedStyle(element).display !== 'none'),
    };
  }); assert.equal(compactDashboard.actionsVisible, true); assert.equal(compactDashboard.iconsVisible, true);
  const nav = await owner.$eval('nav[aria-label="Navigation mobile"]', element => [...element.children].filter(child => getComputedStyle(child).position !== "absolute").map(child => ({ label: child.innerText, x: child.getBoundingClientRect().x, y: child.getBoundingClientRect().y })));
  assert.equal(new Set(nav.map(item => Math.round(item.y))).size <= 2, true); assert.equal(nav.find(item => item.label === "Ajouter").x > nav.find(item => item.label === "Garage").x, true);
  assert.equal((await api(owner, "/api/preferences/experience", "PATCH", { homePage: "auto", interfaceStyle: "horizon" })).status, 200);
  await visit(owner, "/"); assert.equal(new URL(owner.url()).pathname, "/dashboard");
  await visit(installed, "/"); assert.equal(new URL(installed.url()).pathname, "/ajouter");
  await api(owner, "/api/preferences/experience", "PATCH", { homePage: "dashboard", interfaceStyle: "horizon" });
  await visit(installed, "/"); assert.equal(new URL(installed.url()).pathname, "/dashboard");
  await visit(owner, "/parametres"); assert.equal(new URL(owner.url()).pathname, "/parametres");
  sqlite.prepare('UPDATE "MaintenanceSchedule" SET "dueMileage" = 35000 WHERE id = ?').run("qa-schedule");
  await visit(owner, "/dashboard?vehicle=qa-cupra", 390);
  const overdueColor = await owner.$eval('.horizon-register-row[data-status="OVERDUE"] .horizon-due-detail', element => {
    const reference = document.createElement("span"); reference.style.color = "var(--danger)"; document.body.append(reference);
    const matches = getComputedStyle(element).color === getComputedStyle(reference).color; reference.remove(); return matches;
  }); assert.equal(overdueColor, true); await capture(owner, "overdue-mobile");
  sqlite.prepare('UPDATE "MaintenanceSchedule" SET "dueMileage" = 37000 WHERE id = ?').run("qa-schedule");
  report.checks.push("Functional vehicle selector, grouped Horizon navigation, overdue danger color computed in Chrome");
  report.checks.push("Account settings via UI, Classic/Horizon switching, browser and simulated installed home, explicit preference and direct-link priority");

  const visible = '.entry-dialog[open] section:not([hidden])';
  const open = async (kind, page = owner) => { await page.click('button[aria-label="Ajouter au registre"]'); await page.waitForSelector('.entry-dialog[open]'); await page.click(`.entry-dialog[open] [data-entry="${kind}"]`); await page.waitForSelector(`${visible} form`); };
  const close = async (page = owner) => { await page.keyboard.press("Escape"); await page.waitForSelector('.entry-dialog[open]', { hidden: true }); };
  const submit = async (kind, page = owner) => { const response = page.waitForResponse(response => response.url().endsWith(`/api/${kind}`) && response.request().method() === "POST"); await page.click(`${visible} button[type="submit"]`); assert.equal((await response).status(), 201); await page.waitForSelector('.entry-dialog[open]', { hidden: true }); };
  const setValue = async (selector, value, page = owner) => { await page.$eval(`${visible} ${selector}`, (element, value) => { element.value = value; element.dispatchEvent(new Event("input", { bubbles: true })); }, value); };
  await visit(owner, "/ajouter?vehicle=qa-cupra", 390);
  await open("mileage"); await setValue('input[name="mileage"]', "36050"); await setValue('textarea[name="comment"]', "Recette mobile 220"); await close();
  await open("expense"); await setValue('input[name="amount"]', "8"); await close();
  await owner.click('nav[aria-label="Navigation mobile"] a[href="/garage"]'); await owner.waitForFunction(() => location.pathname === "/garage");
  await open("mileage");
  await owner.keyboard.press("Tab"); assert.equal(await owner.evaluate(() => Boolean(document.activeElement?.closest("dialog[open]"))), true);
  assert.equal(await owner.$eval(`${visible} input[name="mileage"]`, element => element.value), "36050"); await submit("mileage");
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM "MileageReading" WHERE comment = ?').get("Recette mobile 220").n, 1);
  await open("fuel"); await setValue('input[name="mileage"]', "36100"); await setValue('input[name="liters"]', "12"); await setValue('input[name="totalPrice"]', "24"); await capture(owner, "fuel-modal-mobile"); await submit("fuel");
  const fill = sqlite.prepare('SELECT id FROM "FuelEntry" WHERE mileage = 36100').get(); assert.ok(fill);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM "Expense" WHERE fuelEntryId = ?').get(fill.id).n, 1);
  await open("expense"); assert.equal(await owner.$eval(`${visible} input[name="amount"]`, element => element.value), "8"); await owner.select(`${visible} select[name="category"]`, "PARKING"); await setValue('textarea[name="comment"]', "Dépense mobile 220"); await submit("expenses");
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM "Expense" WHERE comment = ?').get("Dépense mobile 220").n, 1);
  await visit(owner, "/ajouter?vehicle=qa-clio", 320); await capture(owner, "add-320"); await open("expense"); assert.equal(await owner.$eval(`${visible} select[name="vehicleId"]`, element => element.value), "qa-clio"); await close();
  report.checks.push("Central action chooser, separate retained drafts, Escape, all three real API saves without duplicate mirrors, selected vehicle after success, 320px layout");

  await visit(owner, "/parametres", 390);
  await api(owner, "/api/preferences/theme", "PATCH", { mode: "light", palette: "slate" });
  await visit(owner, "/parametres", 390); await capture(owner, "settings-light-mobile");
  assert.equal(await owner.$eval("html", element => element.dataset.interface), "horizon"); assert.equal(await owner.$eval("html", element => getComputedStyle(element).colorScheme), "light");
  await api(owner, "/api/preferences/theme", "PATCH", { mode: "auto", palette: "copper" });
  await owner.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]); await visit(owner, "/ajouter"); assert.equal(await owner.$eval("html", element => getComputedStyle(element).colorScheme), "light");
  await owner.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); assert.equal(await owner.$eval("html", element => getComputedStyle(element).colorScheme), "dark");
  const manifest = await (await fetch(`${base}/manifest.webmanifest`)).json(); assert.equal(manifest.start_url, "/"); assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) { const response = await fetch(base + icon.src); assert.equal(response.status, 200); assert.ok(response.headers.get("content-type").includes("image/png")); }
  await api(owner, "/api/preferences/experience", "PATCH", { homePage: "auto", interfaceStyle: "classic" });
  await visit(owner, "/dashboard"); assert.equal(await owner.$('button[aria-label="Ajouter au registre"]'), null); assert.ok((await owner.$eval("main", element => element.innerText)).includes("Votre registre"));
  await api(owner, "/api/preferences/experience", "PATCH", { homePage: "auto", interfaceStyle: "horizon" }); await visit(owner, "/parametres");
  report.checks.push("Appearance independent of interface, automatic system theme, install manifest and PNG icons");

  const invitation = await api(owner, "/api/vehicles/qa-cupra/shares", "POST", { email: "qa-guest@example.test", scope: "SIMPLE", permission: "READ" }); assert.equal(invitation.status, 201);
  const share = sqlite.prepare('SELECT id FROM "VehicleShare" WHERE email = ?').get("qa-guest@example.test");
  const guest = await pageFor(fixture.guestToken); await visit(guest, "/garage"); assert.equal((await api(guest, `/api/shares/${share.id}`, "POST")).status, 200);
  await api(guest, "/api/preferences/experience", "PATCH", { homePage: "add", interfaceStyle: "horizon" }); await visit(guest, "/ajouter");
  assert.equal(await guest.$eval('button[aria-label="Ajouter au registre"]', element => element.disabled), true); assert.equal(await guest.$('.entry-dialog[open]'), null);
  for (const path of ["/dashboard?vehicle=qa-cupra", "/ajouter?vehicle=qa-cupra"]) { await visit(guest, path); const source = await guest.content(); for (const marker of ["PRIVATE_MAINTENANCE_NOTE", "PRIVATE_VEHICLE_VIN", "PRIVATE_DOCUMENT_TITLE"]) assert.ok(!source.includes(marker)); }
  assert.equal((await api(guest, "/api/expenses", "POST", { vehicleId: "qa-cupra", amount: 99, category: "PARKING", date: "2026-11-19" })).status, 403);
  await api(owner, `/api/vehicles/qa-cupra/shares/${share.id}`, "PATCH", { scope: "SIMPLE", permission: "WRITE" }); await visit(guest, "/ajouter?vehicle=qa-cupra"); await open("expense", guest);
  await api(owner, `/api/vehicles/qa-cupra/shares/${share.id}`, "DELETE"); await setValue('input[name="amount"]', "99", guest);
  const revokedWrite = guest.waitForResponse(response => response.url().endsWith("/api/expenses") && response.request().method() === "POST"); await guest.click(`${visible} button[type="submit"]`); assert.equal((await revokedWrite).status(), 404); await close(guest);
  report.checks.push("Horizon shared read-only hides creation, Simple dossier remains private, revoked modal fails server-side");

  await api(owner, "/api/preferences", "PATCH", { autoFuelMobile: true, autoFuelDesktop: false });
  const automatic = await pageFor(fixture.automaticToken); await visit(automatic, "/ajouter"); await automatic.waitForSelector('.entry-dialog[open] section[aria-label="Enregistrer un plein"]:not([hidden])'); await close(automatic);
  await visit(automatic, "/dashboard"); assert.equal(await automatic.$('.entry-dialog[open]'), null);
  const priority = await pageFor(fixture.priorityToken); await priority.setViewport({ width: 390, height: 960 });
  let held, releaseRequest; const intercepted = new Promise(resolve => { releaseRequest = resolve; });
  await priority.setRequestInterception(true); priority.on("request", request => { if (request.url().endsWith("/api/preferences/fuel-prompt")) { held = request; releaseRequest(); } else void request.continue(); });
  await priority.goto(`${base}/ajouter`, { waitUntil: "domcontentloaded" }); await intercepted;
  await open("mileage", priority); const automaticResponse = priority.waitForResponse(response => response.url().endsWith("/api/preferences/fuel-prompt")); await held.continue(); await automaticResponse;
  assert.equal(await priority.$('.entry-dialog[open] h2').then(element => element.evaluate(element => element.textContent)), "Ajouter un kilométrage");
  await priority.keyboard.press("Escape"); await priority.waitForFunction(() => document.querySelector('.entry-dialog[open] h2')?.textContent === "Enregistrer un plein"); await close(priority);
  const manual = await pageFor(fixture.manualToken); await manual.setViewport({ width: 390, height: 960 });
  let manualRequest, releaseManual; const manualIntercepted = new Promise(resolve => { releaseManual = resolve; });
  await manual.setRequestInterception(true); manual.on("request", request => { if (request.url().endsWith("/api/preferences/fuel-prompt")) { manualRequest = request; releaseManual(); } else void request.continue(); });
  await manual.goto(`${base}/ajouter`, { waitUntil: "domcontentloaded" }); await manualIntercepted;
  await open("fuel", manual); const manualResponse = manual.waitForResponse(response => response.url().endsWith("/api/preferences/fuel-prompt")); await manualRequest.continue(); await manualResponse;
  await close(manual); await manual.waitForNetworkIdle(); assert.equal(await manual.$('.entry-dialog[open]'), null);
  report.checks.push("Manual fuel satisfies the automatic prompt without reopening");
  report.checks.push("Automatic fuel once per login and deferred behind a manual entry, with one dialog at a time");
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  await writeFile(`${out}/220-browser-report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  }
} catch (error) {
  await writeFile("tmp/220-browser-failure.log", logs); throw error;
} finally {
  sqlite.close(); if (browser) await browser.close();
  if (server.exitCode === null) { server.kill("SIGTERM"); await new Promise(resolve => server.once("exit", resolve)); }
  await rm(fixture.directory, { recursive: true, force: true }); await rm("tmp/210-browser-session.json", { force: true });
}
