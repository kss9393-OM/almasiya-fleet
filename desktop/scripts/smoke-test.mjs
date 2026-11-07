// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
// اختبار تشغيل تطبيق ويندوز بعد بنائه: النافذة، الواجهة، الخط، والاتصال بقاعدة البيانات.
import { _electron as electron } from 'playwright';
import { existsSync } from 'node:fs';

const exe = 'dist/win-unpacked/AlmasiyaFleet.exe';
if (!existsSync(exe)) { console.log('FAIL | packaged exe not found'); process.exit(1); }
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${info ? ' | ' + info : ''}`); };

const app = await electron.launch({ executablePath: exe, timeout: 60000 });
try {
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForSelector('#loginBtn', { timeout: 30000 });
  check('app window opens with login screen', true, await page.title());
  check('loaded from app:// protocol', page.url().startsWith('app://fleet/'), page.url());
  const font = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px "IBM Plex Sans Arabic"', 'أ'); });
  check('bundled Arabic font loaded', font);
  check('RTL layout', (await page.evaluate(() => document.documentElement.dir)) === 'rtl');
  const size = await page.evaluate(() => [innerWidth, innerHeight]);
  check('desktop window size (maximized)', size[0] >= 1024, size.join('x'));

  // صفحة «حول»: قائمة مساعدة ← حول (F1) تفتحها، وتعرض إصدار التطبيق الفعلي ومنصة ويندوز
  const appVersion = await app.evaluate(({ app }) => app.getVersion());
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('open-about'));
  await page.waitForSelector('#modalForm .about-hero', { timeout: 15000 });
  const about = await page.evaluate(() => document.querySelector('#modalForm').innerText);
  check('Help → About opens the About page', /عن المطور/.test(about) && /عن البرنامج/.test(about));
  check('About shows the real app version', about.includes(appVersion), `v${appVersion}`);
  check('About shows the Windows platform', /تطبيق ويندوز/.test(about));
  check('desktop bridge exposed safely', await page.evaluate(() => !!window.desktop && typeof window.desktop.getInfo === 'function' && typeof require === 'undefined'));
  await page.screenshot({ path: 'windows-about.png' });
  await page.click('.modal-head [data-action=close-modal]');

  // الاتصال بالخادم: محاولة دخول بكلمة مرور خاطئة يجب أن يرفضها الخادم (لا خطأ اتصال)
  await page.fill('input[name=username]', 'dev');
  await page.fill('input[name=password]', 'WrongPassword123');
  await page.click('#loginBtn');
  await page.waitForFunction(() => !document.getElementById('loginError').classList.contains('hidden'), null, { timeout: 30000 });
  const msg = await page.evaluate(() => document.getElementById('loginError').innerText);
  check('reaches Supabase server and rejects wrong password', /غير صحيحة/.test(msg), msg);

  // تبديل اللغة يعمل داخل التطبيق
  await page.click('.login-lang');
  await page.waitForFunction(() => document.documentElement.dir === 'ltr', null, { timeout: 15000 });
  check('language switch to English', (await page.evaluate(() => document.documentElement.dir)) === 'ltr');
  await page.screenshot({ path: 'windows-smoke.png' });
  await page.click('.login-lang');
  check('no JavaScript errors', errors.length === 0, errors.join(' | ').slice(0, 200));
} catch (e) {
  check('unexpected failure', false, String(e && e.message || e).slice(0, 300));
} finally {
  await app.close().catch(() => {});
}
const failed = results.filter((x) => !x).length;
console.log(`RESULT: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
