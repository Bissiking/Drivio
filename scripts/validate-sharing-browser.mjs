import { readFile, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url), puppeteer = require(process.env.DRIVIO_PUPPETEER_MODULE ?? "puppeteer");
const fixture = JSON.parse(await readFile("tmp/210-browser-session.json", "utf8"));
const priorNextEnv = await readFile("next-env.d.ts", "utf8");
const base = "http://127.0.0.1:3211", out = ".impeccable/review", report = { scope: "Isolated synthetic SQLite, two independent local encrypted sessions, Chrome headless; no real Kyros or production", checks: [], pages: [], errors: [] };
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3211"], { env: { ...process.env, DRIVIO_BUILD_DIR: "tmp/sharing-next", DATABASE_URL: `file:${fixture.database}`, SESSION_SECRET: fixture.secret, DRIVIO_DOCUMENT_DIR: `${fixture.directory}/documents`, NEXT_PUBLIC_APP_URL: base }, stdio: ["ignore", "pipe", "pipe"] });
let browser, logs = "", owner, guest;
for (const stream of [server.stdout, server.stderr]) stream.on("data", data => { logs += data.toString(); });
try {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(logs.slice(-3000));
    if (await fetch(`${base}/health`).then(r => r.ok).catch(() => false)) break;
    if (i === 119) throw new Error("Preview startup timed out");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await puppeteer.launch({ headless: true, ...(process.env.DRIVIO_CHROME_PATH ? { executablePath: process.env.DRIVIO_CHROME_PATH } : {}) });
  owner = await (await browser.createBrowserContext()).newPage(); guest = await (await browser.createBrowserContext()).newPage();
  for (const page of [owner, guest]) { page.on("pageerror", error => report.errors.push(error.message)); page.on("dialog", dialog => void dialog.accept()); }
  await owner.setCookie({ name: "drivio_session", value: fixture.token, url: base, httpOnly: true });
  await guest.setCookie({ name: "drivio_session", value: fixture.guestToken, url: base, httpOnly: true });
  const visit = async (page, route, width) => {
    await page.setViewport({ width, height: 960, deviceScaleFactor: 1 }); const response = await page.goto(base + route, { waitUntil: "networkidle0" }); assert.equal(response.status(), 200, route);
    assert.ok(!page.url().includes("connexion"), "Session remains local and authenticated");
    const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); assert.ok(metrics.scroll <= width + 1, `Overflow ${route} ${width}`); report.pages.push({ route, ...metrics });
    return response;
  };
  const capture = async (page, name) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${out}/sharing-${name}.png`, fullPage: true }); };
  const api = (page, path, method, data) => page.evaluate(async ({ path, method, data }) => {
    const response = await fetch(path, { method, headers: { "content-type": "application/json" }, ...(data ? { body: JSON.stringify(data) } : {}) }); return response.status;
  }, { path, method, data });

  await visit(owner, "/garage", 1440);
  await owner.focus("#vehicle-qa-cupra button"); await owner.keyboard.press("Enter"); await owner.waitForSelector("#partages-qa-cupra[open]");
  await owner.type('#partages-qa-cupra input[name="email"]', "qa-guest@example.test");
  const invitationSaved = owner.waitForResponse(r => r.url().endsWith("/api/vehicles/qa-cupra/shares") && r.request().method() === "POST");
  await owner.click('#partages-qa-cupra > div > form button[type="submit"]'); assert.equal((await invitationSaved).status(), 201);
  await owner.waitForFunction(() => document.body.innerText.includes("En attente jusqu’au"));
  await capture(owner, "owner-desktop");
  await visit(guest, "/garage", 390); await capture(guest, "invitation-mobile");
  const accepted = guest.waitForResponse(r => /\/api\/shares\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === "POST");
  await guest.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent === "Accepter le partage").click()); assert.equal((await accepted).status(), 200);
  await guest.waitForFunction(() => document.body.innerText.includes("Véhicule partagé")); report.checks.push("Owner invitation and recipient acceptance through UI, separate browser contexts");
  await visit(guest, "/dashboard?vehicle=qa-cupra", 390); await capture(guest, "simple-read-mobile");
  for (const route of ["dashboard", "garage", "carburant", "depenses", "kilometrage", "historique", "entretiens", "suivi", "documents", "previsions", "statistiques", "rapports"]) {
    const response = await visit(guest, `/${route}?vehicle=qa-cupra`, 390), source = await response.text();
    for (const marker of ["PRIVATE_MAINTENANCE_NOTE", "PRIVATE_VEHICLE_VIN", "PRIVATE_DOCUMENT_TITLE"]) assert.ok(!source.includes(marker), `Private server payload ${route}: ${marker}`);
  }
  assert.equal(await api(guest, "/api/expenses", "POST", { vehicleId: "qa-cupra", category: "PARKING", date: "2026-11-18", amount: 5 }), 403);
  assert.equal(await api(guest, "/api/documents/qa-document", "GET"), 404); report.checks.push("Simple read: private HTML/RSC omitted on every route, mutation denied, private file denied");
  await visit(guest, "/carburant?vehicle=qa-cupra", 320); assert.equal(await guest.$('#ajouter-plein input[name="liters"]'), null);

  const changeRights = async (scope, permission) => {
    await visit(owner, "/garage", 1440); await owner.$eval("#partages-qa-cupra", e => { e.open = true; });
    await owner.$eval("#partages-qa-cupra article details", e => { e.open = true; });
    await owner.select('#partages-qa-cupra article select[name="scope"]', scope); await owner.select('#partages-qa-cupra article select[name="permission"]', permission);
    const saved = owner.waitForResponse(r => /\/api\/vehicles\/qa-cupra\/shares\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === "PATCH");
    await owner.click('#partages-qa-cupra article form button[type="submit"]'); assert.equal((await saved).status(), 200);
  };
  await changeRights("SIMPLE", "WRITE");
  await visit(guest, "/carburant?vehicle=qa-cupra&edit=qa-fuel-3", 390);
  await guest.$eval('#modifier-plein input[name="liters"]', e => { e.value = "32"; }); await guest.$eval('#modifier-plein input[name="totalPrice"]', e => { e.value = "64"; });
  const edited = guest.waitForResponse(r => r.url().endsWith("/api/fuel/qa-fuel-3") && r.request().method() === "PATCH"); await guest.click('#modifier-plein button[type="submit"]'); assert.equal((await edited).status(), 200);
  assert.equal(await api(guest, "/api/maintenance", "POST", { vehicleId: "qa-cupra", title: "Refusé", type: "VIDANGE", date: "2026-11-18" }), 403); report.checks.push("Simple write: existing fuel edited through form; maintenance still denied");

  await changeRights("COMPLETE", "READ"); await visit(guest, "/suivi?vehicle=qa-cupra", 390);
  const readonlyCopy = await guest.$eval("main", e => e.innerText);
  assert.ok(!readonlyCopy.includes("effacez la longévité")); assert.ok(!readonlyCopy.includes("Réglable dans Pneumatiques"));
  await capture(guest, "complete-read-mobile");
  assert.equal(await guest.$('main input[name="type"]'), null); assert.equal(await guest.$('main form'), null);
  const maintenanceResponse = await visit(guest, "/entretiens?vehicle=qa-cupra", 390); assert.ok((await maintenanceResponse.text()).includes("PRIVATE_MAINTENANCE_NOTE"));
  await visit(guest, "/documents?vehicle=qa-cupra", 390); assert.ok((await guest.$eval("main", e => e.innerText)).includes("PRIVATE_DOCUMENT_TITLE")); assert.equal(await guest.$('main form'), null); assert.equal(await api(guest, "/api/documents/qa-document", "GET"), 200);
  assert.equal(await api(guest, "/api/documents/qa-document", "DELETE"), 403); report.checks.push("Complete read: dossier and private download allowed, edit forms absent, delete denied");
  await changeRights("COMPLETE", "WRITE"); await visit(guest, "/entretiens?vehicle=qa-cupra", 390); await guest.$eval("main details", e => { e.open = true; });
  await guest.type('main details input[name="title"]', "Intervention du compte partagé"); await guest.type('main details input[name="cost"]', "25");
  const maintained = guest.waitForResponse(r => r.url().endsWith("/api/maintenance") && r.request().method() === "POST"); await guest.click('main details form button[type="submit"]'); assert.equal((await maintained).status(), 201); report.checks.push("Complete write: maintenance created through actual form");
  await visit(owner, "/garage", 320); await owner.$eval("#partages-qa-cupra", e => { e.open = true; }); await capture(owner, "owner-320");

  // The old editor remains open in the recipient tab while the owner revokes it.
  await visit(guest, "/carburant?vehicle=qa-cupra&edit=qa-fuel-3", 390); assert.ok(await guest.$('#modifier-plein input[name="liters"]'));
  const revoked = owner.waitForResponse(r => /\/api\/vehicles\/qa-cupra\/shares\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === "DELETE");
  await owner.evaluate(() => [...document.querySelectorAll("#partages-qa-cupra button")].find(b => b.textContent === "Retirer l’accès").click()); assert.equal((await revoked).status(), 200);
  assert.equal(await api(guest, "/api/fuel/qa-fuel-3", "PATCH", { date: "2026-11-17", mileage: 36000, liters: 1, totalPrice: 2, isFull: true }), 404);
  await visit(guest, "/garage", 390); assert.ok(!(await guest.$eval("main", e => e.innerText)).includes("Formentor")); report.checks.push("Revocation denies a stale editor request and removes received vehicle");
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors)); await writeFile(`${out}/sharing-browser-report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await writeFile("tmp/sharing-browser-failure.log", logs);
  for (const [name, page] of [["owner", owner], ["guest", guest]]) if (page) await page.screenshot({ path: `tmp/sharing-${name}-failure.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close(); if (server.exitCode === null) { server.kill("SIGTERM"); await new Promise(resolve => server.once("exit", resolve)); }
  const currentTsConfig = await readFile("tsconfig.json", "utf8");
  const cleanedTsConfig = currentTsConfig.replace(/,?\n\s*"tmp\/sharing-next\/(?:dev\/)?types\/\*\*\/\*\.ts"/g, "");
  if (cleanedTsConfig !== currentTsConfig) await writeFile("tsconfig.json", cleanedTsConfig);
  if ((await readFile("next-env.d.ts", "utf8")).includes("tmp/sharing-next")) await writeFile("next-env.d.ts", priorNextEnv);
  await rm(fixture.directory, { recursive: true, force: true }); await rm("tmp/210-browser-session.json", { force: true });
}
