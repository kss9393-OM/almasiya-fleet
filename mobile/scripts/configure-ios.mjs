// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
// تهيئة مشروع آيفون بعد «npx cap add ios» (يعمل على macOS في GitHub Actions):
//  1) رقم الإصدار والبناء
//  2) اسم التطبيق: FLEET افتراضياً، و«أسطول» على الأجهزة بالعربية (ar.lproj)
//  3) أذونات الكاميرا والصور (لبلاغات الأعطال بالصور) وإعفاء التشفير القياسي
//  4) شاشة البداية: الشعار في المنتصف بحجمه الطبيعي دون تمدد
//  5) فريق التوقيع (إن وُجد APPLE_TEAM_ID)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const mobile = join(here, '..');
const appDir = join(mobile, 'ios', 'App');
const src = join(appDir, 'App');
const pbx = join(appDir, 'App.xcodeproj', 'project.pbxproj');
const plist = join(src, 'Info.plist');
if (!existsSync(pbx)) throw new Error('مشروع iOS غير موجود — شغّل npx cap add ios أولاً');

const VERSION = process.env.VERSION_NAME || '2.0.0';
const BUILD = process.env.VERSION_CODE || '1';
const TEAM = (process.env.APPLE_TEAM_ID || '').trim();

// ---------- 1) الإصدار والتوقيع في إعدادات المشروع ----------
let p = readFileSync(pbx, 'utf8');
p = p.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${VERSION};`)
     .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${BUILD};`);
if (TEAM) {
  p = p.replace(/DEVELOPMENT_TEAM = [^;]*;\n\s*/g, '');
  p = p.replace(/(PRODUCT_BUNDLE_IDENTIFIER = [^;]+;)/g, `$1\n\t\t\t\tDEVELOPMENT_TEAM = ${TEAM};\n\t\t\t\tCODE_SIGN_STYLE = Automatic;`);
}
writeFileSync(pbx, p);

// ---------- 2 و 3) Info.plist ----------
const pb = (cmd) => { try { execFileSync('/usr/libexec/PlistBuddy', ['-c', cmd, plist], { stdio: 'pipe' }); } catch (e) { /* المفتاح غير موجود */ } };
const setStr = (key, val) => { pb(`Delete :${key}`); pb(`Add :${key} string ${val}`); };
const setBool = (key, val) => { pb(`Delete :${key}`); pb(`Add :${key} bool ${val}`); };
setStr('CFBundleDisplayName', 'FLEET');
setStr('CFBundleName', 'FLEET');
setStr('CFBundleDevelopmentRegion', 'en');
pb('Delete :CFBundleLocalizations');
pb('Add :CFBundleLocalizations array');
pb('Add :CFBundleLocalizations:0 string en');
pb('Add :CFBundleLocalizations:1 string ar');
setStr('NSCameraUsageDescription', 'Take photos of equipment and breakdowns for field reports.');
setStr('NSPhotoLibraryUsageDescription', 'Attach photos of equipment and breakdowns to field reports.');
setStr('NSPhotoLibraryAddUsageDescription', 'Save exported reports and images.');
setBool('ITSAppUsesNonExemptEncryption', 'false');
setBool('UIFileSharingEnabled', 'false');

// النصوص المترجمة لاسم التطبيق والأذونات
const strings = {
  en: { CFBundleDisplayName: 'FLEET', CFBundleName: 'FLEET',
    NSCameraUsageDescription: 'Take photos of equipment and breakdowns for field reports.',
    NSPhotoLibraryUsageDescription: 'Attach photos of equipment and breakdowns to field reports.',
    NSPhotoLibraryAddUsageDescription: 'Save exported reports and images.' },
  ar: { CFBundleDisplayName: 'أسطول', CFBundleName: 'أسطول',
    NSCameraUsageDescription: 'لالتقاط صور المعدات والأعطال وإرفاقها بالبلاغات الميدانية.',
    NSPhotoLibraryUsageDescription: 'لإرفاق صور المعدات والأعطال بالبلاغات الميدانية.',
    NSPhotoLibraryAddUsageDescription: 'لحفظ التقارير والصور المصدّرة.' },
};
for (const [lang, kv] of Object.entries(strings)) {
  const dir = join(src, `${lang}.lproj`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'InfoPlist.strings'),
    Object.entries(kv).map(([k, v]) => `"${k}" = "${v.replace(/"/g, '\\"')}";`).join('\n') + '\n', 'utf8');
}
// إضافة InfoPlist.strings إلى مشروع Xcode كملف مترجم (Variant Group) عبر مكتبة xcodeproj
const rb = `
require 'xcodeproj'
project = Xcodeproj::Project.open(ARGV[0])
target = project.targets.find { |t| t.name == 'App' }
group = project.main_group['App']
unless group.children.any? { |c| c.display_name == 'InfoPlist.strings' }
  variant = group.new_variant_group('InfoPlist.strings')
  %w[en ar].each { |l| variant.new_file("#{l}.lproj/InfoPlist.strings").name = l }
  target.resources_build_phase.add_file_reference(variant)
end
%w[en ar].each { |l| project.root_object.known_regions << l unless project.root_object.known_regions.include?(l) }
project.root_object.development_region = 'en'
project.save
puts 'InfoPlist.strings localized (en, ar)'
`;
const rbFile = join(appDir, '.localize.rb');
writeFileSync(rbFile, rb);
execFileSync('ruby', [rbFile, join(appDir, 'App.xcodeproj')], { stdio: 'inherit' });
rmSync(rbFile);

// ---------- 4) شاشة البداية: شعار في المنتصف (200×200) على خلفية داكنة كأندرويد ----------
const splashSet = join(src, 'Assets.xcassets', 'Splash.imageset');
rmSync(splashSet, { recursive: true, force: true });
mkdirSync(splashSet, { recursive: true });
copyFileSync(join(mobile, 'assets', 'splash-logo.png'), join(splashSet, 'splash-logo.png'));
writeFileSync(join(splashSet, 'Contents.json'), JSON.stringify({
  images: [{ idiom: 'universal', filename: 'splash-logo.png' }],
  info: { version: 1, author: 'xcode' },
}, null, 2));
writeFileSync(join(src, 'Base.lproj', 'LaunchScreen.storyboard'), `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23504" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23506"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="Splash" translatesAutoresizingMaskIntoConstraints="NO" id="Spl-sh-Img">
                                <rect key="frame" x="96.5" y="326" width="200" height="200"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="200" id="Spl-W-200"/>
                                    <constraint firstAttribute="height" constant="200" id="Spl-H-200"/>
                                </constraints>
                            </imageView>
                        </subviews>
                        <color key="backgroundColor" red="0.0431" green="0.1216" blue="0.2000" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="Spl-sh-Img" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="Spl-CX"/>
                            <constraint firstItem="Spl-sh-Img" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="Spl-CY"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
        </scene>
    </scenes>
    <resources>
        <image name="Splash" width="512" height="512"/>
    </resources>
</document>
`);

console.log(`✓ iOS configured: v${VERSION} (${BUILD})${TEAM ? ' team ' + TEAM : ' (unsigned)'}`);
