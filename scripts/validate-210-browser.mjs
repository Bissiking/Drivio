import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.DRIVIO_PUPPETEER_MODULE ?? "puppeteer");
const fixture = JSON.parse(await readFile("tmp/210-browser-session.json", "utf8"));
const base = "http://127.0.0.1:3210", output = ".impeccable/review";
const report = { scope: "Local Chrome headless, synthetic SQLite and encrypted session; no real Kyros or LUMA", checks: [], pages: [], errors: [] };
let browser;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3210"], { env: { ...process.env, DATABASE_URL: `file:${fixture.database}`, SESSION_SECRET: fixture.secret, NEXT_PUBLIC_APP_URL: base }, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", data => { serverLog += data.toString(); });
try {
  await mkdir(output, { recursive: true });
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null) throw new Error(`Preview exited: ${serverLog.slice(-2000)}`);
    if (await fetch(`${base}/health`).then(r => r.ok).catch(() => false)) break;
    if (i === 119) throw new Error(`Preview unavailable: ${serverLog.slice(-2000)}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await puppeteer.launch({ headless: true, ...(process.env.DRIVIO_CHROME_PATH ? { executablePath: process.env.DRIVIO_CHROME_PATH } : {}) });
  const page = await browser.newPage();
  page.on("pageerror", e => report.errors.push(e.message));
  await page.setCookie({ name: "drivio_session", value: fixture.token, url: base, httpOnly: true });
  const visit = async (route, width = 1440) => {
    await page.setViewport({ width, height: 960, deviceScaleFactor: 1 });
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle0" }); assert.equal(response.status(), 200, route);
    assert.ok(!page.url().includes("connexion"), "Synthetic session retained");
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.width + 1, `Global overflow ${route} ${width}: ${JSON.stringify(dimensions)}`);
    report.pages.push({ route, width, ...dimensions });
  };
  const capture = async name => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${output}/210-${name}.png`, fullPage: true }); };
  if (process.argv.includes("--capture-fuel")) {
    await visit("/carburant?vehicle=qa-cupra&edit=qa-fuel-3", 390);
    await page.waitForFunction(() => {
      const charts = [...document.querySelectorAll(".recharts-responsive-container")];
      return charts.length >= 2 && charts.every(container => {
        const surface = container.querySelector("svg.recharts-surface");
        return surface && container.clientWidth > 250 && Math.abs(surface.getBoundingClientRect().width - container.clientWidth) < 2;
      });
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await capture("fuel-edit-mobile");
    console.log("Fuel capture confirmed after responsive charts reached stable full width.");
  } else {
  await visit("/dashboard"); await capture("dashboard-dark-desktop");
  const estimatedDate = await page.evaluate(() => {
    const hero = document.querySelector("main section").innerText.match(/Estimation : ([^\n]+)/)?.[1];
    const gauge = document.querySelector('a[href$="#gauge-schedule-qa-schedule"]').innerText.match(/≈ ([^\n]+)/)?.[1];
    if (!hero || hero !== gauge) throw new Error(`Inconsistent dashboard estimates: ${hero} / ${gauge}`);
    return hero;
  });
  assert.ok((await page.$eval("main", e => e.innerText)).includes("rythme annualisé estimé depuis l’achat"));
  assert.ok(await page.$('a[aria-current="page"][href="/dashboard?vehicle=qa-cupra"]'));
  await visit("/dashboard?vehicle=qa-clio"); assert.ok((await page.$eval("main", e => e.innerText)).includes("Aucun entretien planifié")); report.checks.push("Vehicle switching and empty dashboard");
  await visit("/dashboard?vehicle=qa-private"); assert.ok((await page.$eval("main", e => e.innerText)).includes("Véhicule introuvable")); report.checks.push("Cross-user dashboard denied");
  for (const width of [390, 320]) { await visit("/dashboard", width); await capture(`dashboard-dark-${width}`); }
  await page.click('button[aria-controls="mobile-more-navigation"]'); assert.equal(await page.$eval('button[aria-controls="mobile-more-navigation"]', e => e.getAttribute("aria-expanded")), "true"); await page.keyboard.press("Escape"); assert.equal(await page.$eval('button[aria-controls="mobile-more-navigation"]', e => e.getAttribute("aria-expanded")), "false"); report.checks.push("Mobile menu Escape");

  await visit("/entretiens?vehicle=qa-cupra", 390);
  assert.ok((await page.$eval("#entretien-qa-schedule", e => e.innerText)).includes(`≈ ${estimatedDate}`));
  report.checks.push("Consistent estimate across dashboard, gauge and maintenance; annualized rate explicitly named");
  await page.$eval("details", e => { e.open = true; });
  const title = 'details form input[name="title"]'; await page.type(title, "Remplacement plaquettes avant");
  await page.waitForFunction(() => document.body.innerText.includes("Suggestion : Freinage"));
  await page.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent === "Utiliser cette suggestion").click());
  assert.equal(await page.$eval('details form select[name="type"]', e => e.value), "PLAQUETTES");
  await page.select('details form select[name="type"]', "DISQUES"); assert.equal(await page.$eval('details form select[name="type"]', e => e.value), "DISQUES");
  await capture("maintenance-mobile");
  const savedMaintenance = page.waitForResponse(r => r.url().endsWith("/api/maintenance") && r.request().method() === "POST");
  await page.click('details form button[type="submit"]'); assert.equal((await savedMaintenance).status(), 201);
  await page.waitForFunction(() => document.querySelector('details form input[name="title"]').value === "");
  report.checks.push("Keyword suggestion accepted, manually corrected, saved and form reset");

  await visit("/carburant?vehicle=qa-cupra&edit=qa-fuel-3", 390);
  await capture("fuel-edit-mobile");
  await page.$eval('#modifier-plein input[name="liters"]', e => { e.value = "32"; });
  await page.$eval('#modifier-plein input[name="totalPrice"]', e => { e.value = "64"; });
  const fuelSaved = page.waitForResponse(r => r.url().endsWith("/api/fuel/qa-fuel-3") && r.request().method() === "PATCH");
  await page.click('#modifier-plein button[type="submit"]'); assert.equal((await fuelSaved).status(), 200); report.checks.push("Fuel form PATCH, no duplicate create");
  await visit("/depenses?edit=qa-expense", 390); await capture("expense-edit-mobile");
  await page.$eval('#modifier-depense input[name="amount"]', e => { e.value = "18"; });
  await page.select('#modifier-depense select[name="subcategory"]', "ABONNEMENT");
  const expenseSaved = page.waitForResponse(r => r.url().endsWith("/api/expenses/qa-expense") && r.request().method() === "PATCH");
  await page.click('#modifier-depense button[type="submit"]'); assert.equal((await expenseSaved).status(), 200); report.checks.push("Expense form PATCH with subtype");

  await visit("/parametres", 1440);
  const apiResult = await page.evaluate(async () => {
    const created = await fetch("/api/preferences/hub", { method: "POST" }); const payload = await created.json(); if (!created.ok) throw new Error(`Hub issue ${created.status}: ${JSON.stringify(payload)}`); const { token } = payload;
    const headers = { authorization: `Bearer ${token}` };
    const list = await (await fetch("/api/hub/v1/vehicles", { headers })).json();
    const denied = (await fetch("/api/hub/v1/summary?vehicle=qa-private", { headers })).status;
    const summary = await (await fetch("/api/hub/v1/summary?vehicle=qa-cupra", { headers })).json();
    const cookieOnly = (await fetch("/api/hub/v1/vehicles")).status;
    const readOnly = (await fetch("/api/hub/v1/vehicles", { headers, method: "POST" })).status;
    await fetch("/api/preferences/hub", { method: "DELETE" });
    const revoked = (await fetch("/api/hub/v1/vehicles", { headers })).status;
    return { ids: list.vehicles.map(v => v.id).sort(), denied, cookieOnly, readOnly, revoked, fuelEntries: summary.fuel.entriesInSample, expenseTotal: summary.expenses.month.total };
  });
  assert.deepEqual(apiResult.ids, ["qa-clio", "qa-cupra"]); assert.equal(apiResult.denied, 404); assert.equal(apiResult.cookieOnly, 401); assert.equal(apiResult.readOnly, 405); assert.equal(apiResult.revoked, 401); assert.equal(apiResult.fuelEntries, 3); assert.equal(apiResult.expenseTotal, 238); report.api = apiResult;
  report.checks.push("Real local HTTP Hub contract, isolation, read-only methods and revocation");
  const hubIssued = page.waitForResponse(r => r.url().endsWith("/api/preferences/hub") && r.request().method() === "POST");
  await page.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent === "Créer un jeton LUMA").click()); assert.equal((await hubIssued).status(), 200);
  await page.waitForFunction(() => document.querySelector('input[readonly]')?.value.startsWith("drv_hub_"));
  const hubRevoked = page.waitForResponse(r => r.url().endsWith("/api/preferences/hub") && r.request().method() === "DELETE");
  await page.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent === "Révoquer l’accès").click()); assert.equal((await hubRevoked).status(), 200);
  report.checks.push("Hub token management through actual settings controls");
  const appearance = await page.$('form[aria-label="Apparence"] select');
  const appearanceForm = await appearance.evaluateHandle(e => e.closest("form"));
  const selects = await appearanceForm.$$("select"); await selects[0].select("light"); await selects[1].select("slate");
  const themeSaved = page.waitForResponse(r => r.url().endsWith("/api/preferences/theme")); await (await appearanceForm.$('button[type="submit"]')).click(); assert.equal((await themeSaved).status(), 200);
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await visit("/dashboard"); assert.equal(await page.$eval("html", e => e.dataset.theme), "light"); await capture("dashboard-light-desktop");
  await visit("/parametres", 390); await capture("settings-light-mobile"); report.checks.push("Appearance saved through form and rendered on reload");
  await page.evaluate(async () => { await fetch("/api/preferences/theme", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "auto", palette: "copper" }) }); });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]); await visit("/dashboard", 390);
  assert.equal(await page.$eval("html", e => getComputedStyle(e).colorScheme), "light");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); assert.equal(await page.$eval("html", e => getComputedStyle(e).colorScheme), "dark"); report.checks.push("Automatic theme follows live OS preference changes");
  await visit("/carburant?vehicle=qa-cupra", 320); await page.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent.includes("Ouvrir le formulaire en fenêtre")).click()); await page.waitForSelector("dialog[open]"); await page.keyboard.press("Escape"); assert.equal(await page.$("dialog[open]"), null); report.checks.push("Fuel dialog keyboard close at 320 px");
  // Persisted data verification uses HTTP summary, not screenshot inference.
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  await writeFile(`${output}/210-browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  }
} catch (error) {
  await writeFile("tmp/210-browser-failure.log", serverLog);
  if (browser) await browser.pages().then(pages => pages.at(-1)?.screenshot({ path: "tmp/210-browser-failure.png", fullPage: true })).catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) { server.kill("SIGTERM"); await new Promise(resolve => server.once("exit", resolve)); }
  if (process.env.DRIVIO_KEEP_QA_DB !== "1") { await rm(fixture.directory, { recursive: true, force: true }); await rm("tmp/210-browser-session.json", { force: true }); }
}
