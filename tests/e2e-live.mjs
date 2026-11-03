// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
// اختبار حيّ: متصفحان متصلان بقاعدة البيانات الحقيقية في الوقت نفسه (بحجم شاشة Galaxy S26 Ultra)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const PW = process.env.QA_PASSWORD;
const PORT = 8790;
const URL = `http://localhost:${PORT}/index.html`;
const results = [];
const pass = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${info ? ' | ' + info : ''}`); };

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: process.cwd(), stdio: 'ignore' });
await sleep(1500);

const browser = await chromium.launch();
const device = { viewport: { width: 412, height: 891 }, deviceScaleFactor: 3.5, isMobile: true, hasTouch: true };
const errors = [];

async function login(ctx, username) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${username}: ${e.message}`));
  await page.goto(URL);
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', PW);
  await page.click('#loginBtn');
  await page.waitForSelector('#app:not(.hidden)', { timeout: 30000 });
  return page;
}
const vehStatus = (page, id) => page.evaluate((vid) => {
  const sel = document.querySelector(`select[data-change=vehicle-status][data-id=${vid}]`);
  return sel ? sel.value : null;
}, id);

try {
  // 1) تسجيل الدخول على جهازين
  const ctxA = await browser.newContext(device);
  const ctxB = await browser.newContext(device);
  const A = await login(ctxA, 'qa-manager');
  pass('login: manager (device A)', true);
  const B = await login(ctxB, 'QA-Super');   // حروف كبيرة كما في لوحة مفاتيح الجوال
  pass('login: supervisor (device B, capitalised username)', true);

  // 2) البيانات قادمة من الخادم
  await A.goto(URL + '#/fleet'); await A.waitForTimeout(800);
  const count = await A.evaluate(() => document.querySelectorAll('select[data-change=vehicle-status]').length);
  pass('data loaded from server (12 vehicles)', count === 12, `rows=${count}`);
  const sync = await A.evaluate(() => document.getElementById('syncState').className);
  pass('sync indicator shows synced', /ok/.test(sync), sync);

  // 3) خطأ كلمة المرور
  const ctxC = await browser.newContext(device);
  const C = await ctxC.newPage();
  await C.goto(URL);
  await C.fill('input[name=username]', 'qa-manager'); await C.fill('input[name=password]', 'WrongPass123');
  await C.click('#loginBtn'); await C.waitForTimeout(2500);
  const err = await C.evaluate(() => document.getElementById('loginError')?.innerText || '');
  pass('wrong password rejected', /غير صحيحة/.test(err), err);
  await ctxC.close();

  // 4) المزامنة اللحظية: A يغيّر حالة معدة ← تظهر على B دون تحديث الصفحة
  await B.goto(URL + '#/fleet'); await B.waitForTimeout(1500);
  const before = await vehStatus(B, 'v9');
  await A.selectOption('select[data-change=vehicle-status][data-id=v9]', 'maintenance');
  let seen = null;
  for (let i = 0; i < 20; i++) { await B.waitForTimeout(500); seen = await vehStatus(B, 'v9'); if (seen === 'maintenance') break; }
  pass('realtime: change on device A appears on device B', seen === 'maintenance', `before=${before} after=${seen}`);

  // 5) الحفظ الدائم: إعادة فتح الصفحة
  await A.waitForTimeout(1000);
  await A.reload(); await A.waitForSelector('#app:not(.hidden)', { timeout: 30000 }); await A.goto(URL + '#/fleet'); await A.waitForTimeout(1000);
  pass('change persisted on server after reload', (await vehStatus(A, 'v9')) === 'maintenance');
  await A.selectOption('select[data-change=vehicle-status][data-id=v9]', 'idle');
  for (let i = 0; i < 20; i++) { await B.waitForTimeout(500); if ((await vehStatus(B, 'v9')) === 'idle') break; }
  pass('realtime: revert synced', (await vehStatus(B, 'v9')) === 'idle');

  // 6) بلاغ ميداني مع صورة من جهاز المشرف (رفع للتخزين السحابي) ← يظهر عند المدير
  await B.goto(URL + '#/field'); await B.waitForTimeout(800);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64');
  writeFileSync('/tmp/qa.png', png);
  await B.setInputFiles('input[data-change=field-photos]', '/tmp/qa.png');
  await B.waitForTimeout(800);
  await B.selectOption('form[data-form=field] select[name=vehicleId]', 'v12');
  await B.fill('form[data-form=field] textarea[name=text]', 'QA-E2E اختبار آلي – يُحذف تلقائياً');
  await B.click('#fieldSubmit');
  let photoOk = false;
  for (let i = 0; i < 30; i++) {
    await B.waitForTimeout(500);
    photoOk = await B.evaluate(() => Array.from(document.querySelectorAll('img[data-photo]')).some((im) => /^https:/.test(im.src)));
    if (photoOk) break;
  }
  pass('photo uploaded to cloud storage and displayed', photoOk);
  await A.goto(URL + '#/field');
  let reportSeen = false;
  for (let i = 0; i < 20; i++) { await A.waitForTimeout(500); reportSeen = await A.evaluate(() => document.body.innerText.includes('QA-E2E')); if (reportSeen) break; }
  pass('field report visible on the other device', reportSeen);

  // 7) صلاحيات الخادم: المشرف لا يستطيع إنشاء فاتورة حتى لو تجاوز الواجهة
  const forbidden = await B.evaluate(async () => {
    const { error } = await Store.client.from('invoices').insert({ id: 'qa-hack', data: {} });
    return error ? error.message : 'INSERTED';
  });
  pass('server blocks supervisor from creating invoices', forbidden !== 'INSERTED', forbidden.slice(0, 60));

  // 8) إدارة المستخدمين عبر الخادم: إنشاء ثم حذف
  const created = await A.evaluate(async () => {
    try { const r = await Store.adminUsers({ action: 'create', username: 'qa-temp', name: 'QA Temp', role: 'driver', password: 'TempPass2026', mustChange: true }); return r.uid || 'no-uid'; }
    catch (e) { return 'ERR:' + e.message; }
  });
  pass('manager creates a user (edge function)', !/^ERR|no-uid/.test(created), created);
  const ctxD = await browser.newContext(device);
  const D = await ctxD.newPage();
  await D.goto(URL);
  await D.fill('input[name=username]', 'qa-temp'); await D.fill('input[name=password]', 'TempPass2026');
  await D.click('#loginBtn');
  const forced = await D.waitForSelector('#modalForm input[name=current]', { timeout: 30000 }).then(() => true).catch(() => false);
  pass('new user signs in and is forced to change password', forced);
  await ctxD.close();
  const createdDev = await A.evaluate(async () => {
    try { await Store.adminUsers({ action: 'create', username: 'qa-dev', name: 'x', role: 'developer', password: 'TempPass2026' }); return 'CREATED'; }
    catch (e) { return e.message; }
  });
  pass('manager cannot create a developer account', createdDev === 'FORBIDDEN', createdDev);
  const deleted = await A.evaluate(async (uid) => {
    try { await Store.adminUsers({ action: 'delete', uid }); return 'OK'; } catch (e) { return e.message; }
  }, created);
  pass('manager deletes the user', deleted === 'OK', deleted);

  // 9) واجهة الجوال تعمل بالبيانات الحقيقية
  await A.goto(URL + '#/dashboard'); await A.waitForTimeout(800);
  await A.screenshot({ path: 'e2e-dashboard.png' });
  pass('no JavaScript errors', errors.length === 0, errors.join(' || ').slice(0, 300));
} catch (e) {
  pass('unexpected failure', false, String(e && e.stack || e).slice(0, 500));
} finally {
  await browser.close();
  server.kill();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nRESULT: ${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
