// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
// يضبط مشروع أندرويد الذي يُنشئه Capacitor بعد «npx cap add android»:
//  • رقم الإصدار من رقم تشغيل GitHub Actions
//  • التوقيع بمفتاح ثابت (إن توفر) حتى تعمل التحديثات فوق النسخة المثبتة
//  • وضع الحافة للحافة (Edge-to-Edge) المطلوب في Android 15/16 — Galaxy S26 Ultra
//  • صلاحية الكاميرا لالتقاط صور الأعطال
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const android = join(here, '..', 'android');
const cfg = JSON.parse(readFileSync(join(here, '..', 'capacitor.config.json'), 'utf8'));
const pkg = cfg.appId;

const versionCode = Number(process.env.VERSION_CODE || 1);
const versionName = process.env.VERSION_NAME || `1.0.${versionCode}`;
const signing = !!process.env.KEYSTORE_PATH && existsSync(process.env.KEYSTORE_PATH);

function patch(file, fn) {
  const path = join(android, file);
  const before = readFileSync(path, 'utf8');
  const after = fn(before);
  if (after === before) console.warn('⚠ لم يتغير الملف:', file);
  writeFileSync(path, after);
}

// 1) build.gradle: الإصدار + التوقيع
patch('app/build.gradle', (s) => {
  s = s.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
       .replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  if (!s.includes('androidx.activity:activity')) {
    s = s.replace(/dependencies\s*\{/, (m) => `${m}\n    implementation "androidx.activity:activity:$androidxActivityVersion"`);
  }
  if (signing) {
    s = s.replace(/buildTypes\s*\{\s*release\s*\{/, (m) => `${m}\n            signingConfig signingConfigs.release`);
    s = s.replace(/android\s*\{/, (m) => `${m}
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }`);
  }
  return s;
});

// 2) AndroidManifest: صلاحية الكاميرا (لالتقاط صور الأعطال من حقل الصور)
patch('app/src/main/AndroidManifest.xml', (s) => s.includes('android.permission.CAMERA') ? s
  : s.replace('<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />'));

// 2ب) اسم التطبيق: FLEET افتراضياً (الإنجليزية) و«أسطول» على الهواتف بالعربية
mkdirSync(join(android, 'app/src/main/res/values-ar'), { recursive: true });
writeFileSync(join(android, 'app/src/main/res/values-ar/strings.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">أسطول</string>
    <string name="title_activity_main">أسطول</string>
</resources>
`);

// 3) شاشة البداية دون تمدد:
//    الصورة الكاملة (splash.png) تُمطّ لتملأ الشاشة، وشاشة S26 Ultra أطول من نسبة الصورة فيتمدد الشعار.
//    الحل: خلفية لونية + الشعار في المنتصف بحجمه الأصلي (layer-list)، وشاشة البداية الأصلية في Android 12+.
const res = join(android, 'app/src/main/res');
for (const dir of readdirSync(res)) {
  if (!dir.startsWith('drawable')) continue;
  for (const f of ['splash.png', 'splash.xml']) { const p = join(res, dir, f); if (existsSync(p)) rmSync(p); }
}
mkdirSync(join(res, 'drawable-nodpi'), { recursive: true });
copyFileSync(join(here, '..', 'assets', 'splash-logo.png'), join(res, 'drawable-nodpi', 'splash_logo.png'));
writeFileSync(join(res, 'drawable', 'splash.xml'), `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item><shape android:shape="rectangle"><solid android:color="#0b1f33" /></shape></item>
    <item android:gravity="center"><bitmap android:src="@drawable/splash_logo" android:gravity="center" /></item>
</layer-list>
`);
patch('app/src/main/res/values/styles.xml', (s) => s.includes('windowSplashScreenBackground') ? s : s.replace(
  '<item name="android:background">@drawable/splash</item>',
  `<item name="android:background">@drawable/splash</item>
        <item name="windowSplashScreenBackground">#0b1f33</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
        <item name="windowSplashScreenIconBackgroundColor">#0f4c81</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`));

// 4) MainActivity: تفعيل الحافة للحافة (Android 15+ يفرضه، ويمرر Capacitor المساحات الآمنة للواجهة)
const actDir = join(android, 'app/src/main/java', ...pkg.split('.'));
mkdirSync(actDir, { recursive: true });
writeFileSync(join(actDir, 'MainActivity.java'), `package ${pkg};

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
`);

console.log(`✓ أندرويد: ${pkg} • الإصدار ${versionName} (${versionCode}) • التوقيع: ${signing ? 'مفتاح الإصدار' : 'مفتاح تجريبي (debug)'}`);
