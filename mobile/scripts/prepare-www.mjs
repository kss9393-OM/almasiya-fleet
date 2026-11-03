// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
// ينسخ ملفات الواجهة من جذر المستودع إلى mobile/www ليُضمّنها Capacitor داخل التطبيق.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const www = join(here, '..', 'www');

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

// sw.js غير مطلوب داخل التطبيق الأصلي (الملفات محلية أصلاً)
const items = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
for (const item of items) {
  const src = join(root, item);
  if (!existsSync(src)) throw new Error(`الملف غير موجود: ${item}`);
  cpSync(src, join(www, item), { recursive: true });
}
console.log('✓ تم تجهيز ملفات الواجهة في', www);
