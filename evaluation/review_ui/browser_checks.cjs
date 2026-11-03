// Headless browser checks against a disposable copy, never the user's review file.
const path = require('node:path');
const { chromium } = require(process.env.CODEX_BUNDLED_NODE_MODULES
  ? path.join(process.env.CODEX_BUNDLED_NODE_MODULES, 'playwright') : 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');

(async () => {
  const project = path.resolve(__dirname, '../..');
  const fixture = await fs.mkdtemp(path.join(project, 'evaluation/runs/review-ui-browser-'));
  await fs.mkdir(path.join(fixture, 'ai_hint_evaluation'));
  for (const name of ['author_review.csv', 'review_mapping_keep_separate.json', 'ai_hint_evaluation/ai_hint_ratings.json']) {
    await fs.copyFile(path.join(project, 'evaluation/runs/benchmark-v2', name), path.join(fixture, name));
  }
  const server = spawn(path.join(project, '.venv/Scripts/python.exe'),
    ['-u', path.join(project, 'evaluation/review_app.py'), '--run-dir', fixture, '--port', '8766'],
    { cwd: project, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverLog = '';
  server.stdout.on('data', chunk => { serverLog += chunk; });
  server.stderr.on('data', chunk => { serverLog += chunk; });
  let browser;
  try {
    let available = false;
    for (let i = 0; i < 80; i++) {
      try { const response = await fetch('http://127.0.0.1:8766/api/data'); if (response.ok) { available = true; break; } } catch {}
      if (server.exitCode !== null) throw new Error(serverLog);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(available, 'Fixture server must start');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:8766', viewport: { width: 1512, height: 1050 } });
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.goto('http://127.0.0.1:8766/');
    await page.locator('#task').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#review-id').textContent(), 'R001');
    assert.equal(await page.locator('#response-list .response-item').count(), 90);
    assert.equal(await page.locator('#review-form input[type=radio]:checked').count(), 0);
    const data = await (await page.request.get('/api/data')).json();
    await page.getByRole('tab', { name: 'Verified reference' }).click();
    assert.equal(await page.locator('#code').textContent(), data.cases[0].reference_code);
    await page.getByRole('tab', { name: 'Submitted', exact: true }).click();
    assert.equal(await page.locator('#code').textContent(), data.cases[0].code);
    await page.getByRole('button', { name: 'Hide', exact: true }).click();
    assert.equal(await page.locator('#ai-body').isVisible(), false);
    await page.getByRole('button', { name: 'Show', exact: true }).click();
    await page.locator('#save-stay').click();
    assert.match(await page.locator('#save-message').textContent(), /Choose all four/);
    await page.locator('#use-ai').click();
    assert.equal(await page.locator('#review-form input[type=radio]:checked').count(), 4);
    const changed = (data.cases[0].ai.correctness_0_1_2 + 1) % 3;
    await page.locator(`input[name=correctness_0_1_2][value="${changed}"]`).check();
    await page.locator('#notes').fill('User review test: differs from AI. <script>not executable</script>');
    await page.locator('#save-stay').click();
    await page.waitForFunction(() => document.querySelector('#save-message').textContent.includes('saved on this computer'));
    let saved = await (await page.request.get('/api/reviews')).json();
    assert.equal(saved.reviews.R001.decision, 'adjusted_ai');
    assert.equal(saved.reviews.R001.correctness_0_1_2, changed);
    assert.equal(data.cases[0].ai.correctness_0_1_2, 0);
    await page.locator('#next').click();
    assert.equal(await page.locator('#review-id').textContent(), 'R002');
    await page.locator('#notes').fill('Draft survives navigation and reload');
    await page.locator('input[name=correctness_0_1_2][value="1"]').check();
    await page.locator('#next').click(); await page.locator('#previous').click();
    assert.equal(await page.locator('#notes').inputValue(), 'Draft survives navigation and reload');
    await page.reload(); await page.locator('#task').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#review-id').textContent(), 'R002');
    assert.equal(await page.locator('#notes').inputValue(), 'Draft survives navigation and reload');
    await page.locator('#flag').click();
    await page.waitForFunction(() => document.querySelector('#review-id').textContent === 'R003');
    assert.equal(await page.locator('#progress-label').textContent(), '1 of 90 reviewed');
    assert.equal(await page.locator('#flagged-count').textContent(), '1 flagged for another look');
    await page.locator('#filter').selectOption('flagged');
    assert.equal(await page.locator('#review-id').textContent(), 'R002');
    assert.equal(await page.locator('#response-list .response-item').count(), 1);
    await page.locator('#filter').selectOption('all');
    await page.locator('#search').fill('R001');
    assert.equal(await page.locator('#review-id').textContent(), 'R001');
    await page.locator('#search').fill('');
    // Simulate a save by another tab, then verify safe conflict recovery.
    saved = await (await page.request.get('/api/reviews')).json();
    const other = await page.request.post('/api/reviews', { data: {
      review_id: 'R003', revision: saved.revision, review: { status: 'flagged', notes: 'Other tab' },
    } });
    assert.equal(other.status(), 200);
    await page.locator('#notes').fill('My draft after another tab saved');
    await page.locator('#save-stay').click();
    await page.waitForFunction(() => document.querySelector('#save-message').textContent.includes('Another tab'));
    assert.equal(await page.locator('#notes').inputValue(), 'My draft after another tab saved');
    await page.locator('#reload-saved').click();
    await page.waitForFunction(() => document.querySelector('#save-message').textContent.includes('reloaded'));
    await page.locator('#save-stay').click();
    await page.waitForFunction(() => document.querySelector('#save-message').textContent.includes('saved on this computer'));
    const exported = await (await page.request.get('/api/export.json')).json();
    assert.equal(Object.keys(exported.reviews).length, 3);
    const csv = await page.request.get('/api/export.csv');
    assert.equal(csv.status(), 200);
    assert.match(csv.headers()['content-disposition'], /attachment/);
    assert.match(await csv.text(), /My draft after another tab saved/);
    const blocked = await page.request.post('/api/reviews', { headers: { Origin: 'https://unrelated.invalid' }, data: {} });
    assert.equal(blocked.status(), 403);
    const missing = await page.request.get('/../review_app.py'); assert.equal(missing.status(), 404);
    await page.screenshot({ path: path.join(fixture, 'desktop-review.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(fixture, 'mobile-review.png'), fullPage: true });
    const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).slice(0,8).map(el => ({ tag: el.tagName, id: el.id, class: el.className, right: el.getBoundingClientRect().right })));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile overflow: '+JSON.stringify(overflow));
    assert.deepEqual(failures, []);
    const liveReview = path.join(project, 'evaluation/runs/benchmark-v2/human_hint_reviews.json');
    try { await fs.access(liveReview); throw new Error('Browser checks must not create real user reviews'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    console.log(JSON.stringify({ passed: true, original_responses: 90, checks: [
      'one response at a time', 'reference tab', 'hide AI', 'missing ratings', 'accept and adjust',
      'save and reload', 'draft recovery', 'flag without marking reviewed', 'filters and search',
      'concurrent-tab conflict', 'JSON/CSV exports', 'origin/path restrictions', 'mobile layout', 'no page errors', 'real review file untouched',
    ], screenshotDirectory: fixture }));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
