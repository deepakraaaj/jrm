// Run with a Playwright installation: node tests/cost-handbook.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('public/jrm-cost-handbook.html')).href);
    assert.equal(await page.locator('#rTrips').innerText(), '52,000');
    const total = await page.locator('#rTotal').innerText();
    await page.locator('#weatherCache').fill('0');
    assert.notEqual(await page.locator('#rTotal').innerText(), total);
    await page.locator('#search').fill('TomTom');
    assert.ok(await page.locator('#catalog tbody tr').count() > 0);
    await page.locator('#vehicles').fill('0');
    assert.equal(await page.locator('#rVehicle').innerText(), '$0.00');
    await page.locator('#vehicles').fill('1200');
    await page.reload();
    assert.equal(await page.locator('#vehicles').inputValue(), '1200');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export scenario JSON' }).click();
    assert.equal((await download).suggestedFilename(), 'jrm_cost_scenario.json');
    await page.evaluate(() => localStorage.setItem('jrmShortlist', 'broken'));
    await page.reload();
    await page.waitForSelector('#rTotal');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS: calculator, cache savings, filter, zero fleet, persistence, export, corrupt storage, mobile');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
