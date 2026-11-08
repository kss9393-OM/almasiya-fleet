/* =========================================================================
   © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
   ملف الإعدادات العامة — Developer Configuration
   -------------------------------------------------------------------------
   هذا هو المكان الوحيد الذي يحتاج المطور لتعديله لتغيير:
   - اسم النظام واسم الشركة
   - شعار الشركة (مسار صورة داخل المشروع أو رابط خارجي)
   - الألوان الأساسية للهوية البصرية
   - مدة التنبيه قبل انتهاء الرخص/التأمين وحدود تنبيه الصيانة
   ملاحظة: يمكن أيضاً تعديل الاسم والشعار والألوان من داخل اللوحة
   (حساب المطور ← إعدادات المطور) وتُحفظ في قاعدة البيانات لجميع المستخدمين فوق هذه القيم.
   ========================================================================= */

const APP_CONFIG = {
  // ---------- الهوية ----------
  systemName: 'نظام إدارة الأسطول والمعدات',
  systemNameEn: 'Fleet & Equipment Management System',
  companyName: 'الماسية الدولية للمعدات ش.م.م',
  companyNameEn: 'Al Masiya International Equipment LLC',
  logo: 'assets/logo.svg',

  // ---------- الألوان (Theme) ----------
  theme: {
    primary: '#0f4c81',   // اللون الأساسي (الأزرار، الروابط، العناصر النشطة)
    accent: '#f2a900',    // اللون المساعد (لون المعدات الثقيلة)
    sidebar: '#0b1f33',   // خلفية القائمة الجانبية
  },

  // ---------- التنبيهات ----------
  alertDays: 30,                                  // التنبيه قبل انتهاء الرخصة/التأمين بعدد أيام
  maintenanceThreshold: { hours: 50, km: 1000 },  // التنبيه قبل موعد الصيانة الدورية

  // ---------- القوائم ----------
  currency: 'ر.ع',
  vatRate: 0.05, // ضريبة القيمة المضافة في سلطنة عُمان 5%
  plateTypes: ['خصوصي', 'تجاري', 'مؤقت', 'أشغال عامة'],
  // ألوان اللوحات حسب نوعها: bg لون الخلفية، fg لون الأرقام والحروف
  plateColors: {
    'خصوصي':     { bg: '#facc15', fg: '#111111' },  // أصفر
    'تجاري':     { bg: '#dc2626', fg: '#ffffff' },  // أحمر
    'مؤقت':      { bg: '#111111', fg: '#ffffff' },  // أسود
    'أشغال عامة': { bg: '#ffffff', fg: '#111111' },  // أبيض
  },
  vehicleTypes: [
    // معدات ثقيلة
    'قلاب', 'حفارة', 'شيول', 'جرافة', 'رافعة', 'بوب كات',
    // شاحنات ونقل
    'لوري', 'تريلا (رأس قاطرة)', 'صهريج مياه', 'حافلة',
    // مركبات خفيفة
    'صالون', 'دفع رباعي', 'بيك أب',
  ],
  insuranceTypes: ['طرف ثالث (Third Party)', 'شامل (Comprehensive)'],

  // ---------- الحقوق ----------
  copyrightHolder: 'مربع الخدمات ش.م.م',
  copyrightHolderEn: 'Services Square LLC',   // الاسم الإنجليزي لصاحب الحقوق (يظهر في الواجهة الإنجليزية)

  // ---------- صفحة «حول البرنامج والمطور» (القيم الافتراضية) ----------
  // يعدّلها المطور من داخل التطبيق: إعدادات المطور ← صفحة «حول»، وتُحفظ في قاعدة البيانات لجميع المستخدمين.
  about: {
    descriptionAr: 'نظام متكامل لإدارة أسطول الشاحنات والمعدات الثقيلة: متابعة الحالة التشغيلية، التراخيص والتأمين، الصيانة الدورية، عقود التشغيل والإيجار، ساعات التشغيل، البلاغات الميدانية والفواتير — متزامن لحظياً بين الموقع وتطبيقي أندرويد وويندوز.',
    descriptionEn: 'An integrated system for managing trucks and heavy equipment: operating status, licences and insurance, preventive maintenance, operating and rental contracts, timesheets, field reports and invoicing — synced in real time across the website and the Android and Windows apps.',
    featuresAr: 'مزامنة لحظية بين جميع الأجهزة\nصلاحيات حسب الدور: المطور، مدير النظام، المشرف، السائق، فريق الصيانة\nتنبيهات تلقائية للرخص والتأمين والصيانة الدورية\nتأجير ساعي ويومي وشهري، مع سائق أو بدون سائق\nبلاغات أعطال بالصور تتحول تلقائياً إلى مهام صيانة\nفواتير إيجار وتقارير تشغيل شهرية\nواجهة عربية وإنجليزية، وتعمل دون اتصال',
    featuresEn: 'Real-time sync across all devices\nRole-based permissions: developer, system manager, supervisor, driver, maintenance team\nAutomatic alerts for licences, insurance and preventive maintenance\nHourly, daily and monthly rentals, with or without a driver\nPhoto breakdown reports that become maintenance tasks automatically\nRental invoices and monthly operating reports\nArabic and English interface, works offline',
    developerNameAr: 'مربع الخدمات ش.م.م',
    developerNameEn: 'Services Square LLC',
    developerBioAr: '',
    developerBioEn: '',
    developerLogo: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    addressAr: '',
    addressEn: '',
  },

  // ---------- تحديثات تطبيق أندرويد ----------
  // يفحص التطبيق إصدارات GitHub (الوسوم android-v*) ويعرض تنزيل النسخة الأحدث
  updates: {
    repo: 'kss9393-OM/almasiya-fleet',
    apkUrl: 'https://github.com/kss9393-OM/almasiya-fleet/releases/latest/download/almasiya-fleet.apk',
    checkEveryHours: 6,
  },

  // ---------- اللغة ----------
  defaultLanguage: 'ar',   // 'ar' أو 'en' — اللغة عند أول زيارة، ويمكن للمستخدم تبديلها من الزر

  // ---------- الأمان وتسجيل الدخول ----------
  // كلمة المرور الأولية لجميع الحسابات التجريبية؛ يُطلب تغييرها إجبارياً عند أول دخول
  initialPassword: 'Almasiya@2026',
  minPasswordLength: 8,
  maxLoginAttempts: 5,       // عدد المحاولات الخاطئة قبل القفل المؤقت
  lockoutSeconds: 60,        // مدة القفل بالثواني

  // ---------- قاعدة البيانات المركزية (Supabase) ----------
  // المفتاح العام (publishable) مخصص للتطبيقات وآمن للنشر؛ الحماية الفعلية بصلاحيات الخادم (RLS)
  supabase: {
    url: 'https://hpyfzkdxknkqcdovktwq.supabase.co',
    key: 'sb_publishable_tQij7f-6j_Lu7wR1ZLr4NA_StHsJpCo',
    emailDomain: 'almasiya-fleet.local',   // أسماء المستخدمين تُحوَّل داخلياً إلى user@domain
    photosBucket: 'report-photos',
  },

  // ---------- التخزين ----------
  storageKey: 'almasiya_fleet_v1',
  version: '2.0.0',
};
