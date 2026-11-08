/* =========================================================================
   © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
   الترجمة (عربي / English)
   -------------------------------------------------------------------------
   الواجهة تُكتب بالعربية، وعند اختيار English تُترجم النصوص تلقائياً
   أثناء العرض باستخدام القاموس أدناه. البيانات التي يُدخلها المستخدم
   (الأسماء، اللوحات، الملاحظات) تبقى كما هي.
   لإضافة ترجمة: أضف سطراً جديداً إلى DICT بالصيغة  'النص العربي': 'English'
   ========================================================================= */

const I18N = (function () {
  'use strict';

  const KEY = APP_CONFIG.storageKey + '_lang';
  let lang = 'ar';
  try { lang = localStorage.getItem(KEY) || APP_CONFIG.defaultLanguage || 'ar'; } catch (e) { lang = APP_CONFIG.defaultLanguage || 'ar'; }
  if (lang !== 'en') lang = 'ar';

  /* ---------------- عبارات تحتوي أرقاماً (تُطبق أولاً) ---------------- */
  const N = '([\\d,.]+)';
  const DAYS_W = '(?:يوماً|يوم)';
  const PATTERNS = [
    [new RegExp(`انتهت (رخصة المركبة|وثيقة التأمين) منذ ${N} ${DAYS_W}`, 'g'), '$1 expired $2 days ago'],
    [new RegExp(`(رخصة المركبة|وثيقة التأمين) تنتهي خلال ${N} ${DAYS_W}`, 'g'), '$1 expires in $2 days'],
    [/(رخصة المركبة|وثيقة التأمين) تنتهي اليوم/g, '$1 expires today'],
    [new RegExp(`منتهية منذ ${N} ${DAYS_W}`, 'g'), 'expired $1 days ago'],
    [new RegExp(`متبقي ${N} ${DAYS_W}`, 'g'), (m, n) => `${n} day${n === '1' ? '' : 's'} left`],
    [new RegExp(`الصيانة الدورية متأخرة بـ ${N}`, 'g'), 'Periodic maintenance overdue by $1'],
    [new RegExp(`الصيانة الدورية مستحقة بعد ${N}`, 'g'), 'Periodic maintenance due in $1'],
    [new RegExp(`متأخرة ${N}`, 'g'), 'overdue $1'],
    [/لديك (.+?) و(\d[^•]*?) بانتظار الاعتماد/g, 'you have $1 and $2 pending approval'],
    [new RegExp(`تم إيقاف المحاولات لمدة ${N} ثانية بسبب تكرار الأخطاء\\.`, 'g'), 'Login locked for $1 seconds due to repeated failed attempts.'],
    [new RegExp(`حاول بعد ${N} ثانية\\.`, 'g'), 'Try again in $1 seconds.'],
    [new RegExp(`\\(متبقي ${N} (?:محاولة|محاولات)\\)`, 'g'), '($1 attempts left)'],
    [new RegExp(`يُعرض أحدث ${N} سجل`, 'g'), 'Showing latest $1 records'],
    [new RegExp(`${N} س / ${N} يوم`, 'g'), '$1 h / $2 days'],
    [new RegExp(`${N} أحرف على الأقل`, 'g'), 'at least $1 characters'],
    [new RegExp(`كلمة المرور يجب ألا تقل عن ${N} أحرف`, 'g'), 'Password must be at least $1 characters'],
    [new RegExp(`التنبيه قبل ${N} ساعة / ${N} كم`, 'g'), 'alert $1 hours / $2 km before due'],
    [new RegExp(`مع ضريبة القيمة المضافة ${N}%`, 'g'), 'including $1% VAT'],
    [new RegExp(`ضريبة القيمة المضافة ${N}%`, 'g'), 'VAT $1%'],
    [new RegExp(`تسجيل ${N} ساعة تشغيل لـ`, 'g'), 'Logged $1 operating hours for'],
    [new RegExp(`الحد الأقصى ${N} صور`, 'g'), 'Maximum $1 photos'],
    [new RegExp(`الصور \\(حتى ${N}\\)`, 'g'), 'Photos (up to $1)'],
    [new RegExp(`${N} سجل بانتظار الاعتماد في هذا الشهر`, 'g'), '$1 records pending approval this month'],
    [/(\d[\d,.]*) (يوم|شهر|ساعة)(?![\u0621-\u064A])/g, (m, n, u) => `${n} ${{ 'يوم': 'day', 'شهر': 'month', 'ساعة': 'hour' }[u]}${n === '1' ? '' : 's'}`],
  ];

  /* ---------------- القاموس ---------------- */
  const DICT = {
    // ===== الهوية والتنقل =====
    'نظام إدارة الأسطول والمعدات': 'Fleet & Equipment Management System',
    'الماسية الدولية للمعدات ش.م.م': 'Al Masiya International Equipment LLC',
    'جميع الحقوق محفوظة لـ': 'All rights reserved —',
    'الإصدار': 'Version',
    'الرئيسية': 'Home', 'التشغيل': 'Operations', 'الصيانة والمهام': 'Maintenance & Tasks', 'الإدارة': 'Administration',
    'لوحة التحكم': 'Dashboard',
    'نظرة شاملة على حالة الأسطول والتنبيهات': 'Fleet status and alerts at a glance',
    'مركبتي ومهامي': 'My Vehicle & Tasks',
    'المعدة المسندة إليك، تسجيل الساعات والإبلاغ عن الأعطال': 'Your assigned equipment, timesheets and breakdown reports',
    'الأسطول والمعدات': 'Fleet & Equipment',
    'بطاقات تعريف المركبات والمعدات وحالتها': 'Vehicle and equipment profiles and status',
    'التشغيل والإيجار': 'Operations & Rentals',
    'ربط المعدات بالمشاريع الداخلية أو عقود الإيجار (ساعي، يومي، شهري)': 'Assign equipment to internal projects or rentals (hourly, daily, monthly)',
    'ساعات التشغيل': 'Timesheets',
    'تسجيل واعتماد ساعات التشغيل اليومية (Timesheets)': 'Log and approve daily operating hours',
    'الصيانة وأوامر العمل': 'Maintenance & Work Orders',
    'أوامر العمل وجدول الصيانة الدورية حسب الساعات والكيلومترات': 'Work orders and preventive maintenance by hours and kilometres',
    'ملاحظات الميدان': 'Field Reports',
    'ملاحظات وصور الأعطال المرفوعة من السائقين والمشغلين': 'Notes and breakdown photos submitted by drivers and operators',
    'متابعة المهام': 'Task Tracking',
    'جديدة • قيد التنفيذ • بانتظار الاعتماد • مكتملة': 'New • In progress • Pending approval • Done',
    'المشاريع والمشرفون': 'Projects & Supervisors',
    'إدارة المشاريع وتوزيعها على المشرفين': 'Manage projects and assign them to supervisors',
    'الفواتير وتقارير التشغيل': 'Invoices & Operating Reports',
    'تقارير التشغيل الشهرية وإصدار واعتماد فواتير الإيجار': 'Monthly operating reports and rental invoices',
    'المستخدمون والصلاحيات': 'Users & Permissions',
    'إضافة المستخدمين وتحديد أدوارهم': 'Add users and assign their roles',
    'إعدادات المطور': 'Developer Settings',
    'الهوية البصرية، إعدادات النظام، والنسخ الاحتياطي': 'Branding, system settings and backups',
    'القائمة': 'Menu', 'التنبيهات': 'Alerts', 'تسجيل الخروج': 'Log out', 'الشعار': 'Logo',

    // ===== الأدوار =====
    'المطور': 'Developer', 'مدير النظام': 'System Manager', 'مشرف': 'Supervisor', 'المشرفون': 'Supervisors',
    'سائق / مشغل': 'Driver / Operator', 'فريق الصيانة': 'Maintenance Team', 'أنت': 'You',

    // ===== تسجيل الدخول وكلمات المرور =====
    'تسجيل الدخول': 'Sign in',
    'أدخل اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم.': 'Enter your username and password to access the dashboard.',
    'اسم المستخدم': 'Username', 'كلمة المرور': 'Password', 'دخول': 'Sign in',
    'نسيت كلمة المرور؟ تواصل مع مدير النظام لإعادة تعيينها.': 'Forgot your password? Contact the system manager to reset it.',
    'أدخل اسم المستخدم وكلمة المرور': 'Enter your username and password',
    'اسم المستخدم أو كلمة المرور غير صحيحة': 'Incorrect username or password',
    'تم إيقاف المحاولات مؤقتاً بسبب تكرار الأخطاء.': 'Login temporarily locked due to repeated failed attempts.',
    'هذا الحساب موقوف. تواصل مع مدير النظام.': 'This account is suspended. Contact the system manager.',
    'إظهار كلمة المرور': 'Show password', 'إظهار / إخفاء': 'Show / hide', 'إظهار': 'Show',
    'تغيير كلمة المرور': 'Change password', 'تغيير كلمة المرور الأولية': 'Change your initial password',
    'لحماية حسابك، يجب تعيين كلمة مرور جديدة خاصة بك قبل المتابعة.': 'To protect your account, set your own new password before continuing.',
    'كلمة المرور الحالية': 'Current password', 'كلمة المرور الجديدة': 'New password', 'تأكيد كلمة المرور الجديدة': 'Confirm new password',
    'وتحتوي على حروف وأرقام.': 'containing letters and numbers.',
    'حفظ كلمة المرور': 'Save password', 'خروج': 'Log out',
    'كلمة المرور الحالية غير صحيحة': 'Current password is incorrect',
    'كلمة المرور يجب أن تحتوي على حروف وأرقام': 'Password must contain letters and numbers',
    'كلمتا المرور غير متطابقتين': 'Passwords do not match',
    'اختر كلمة مرور مختلفة عن الحالية': 'Choose a password different from the current one',
    'تم تغيير كلمة المرور بنجاح': 'Password changed successfully',
    'تغيير كلمة المرور –': 'Password changed —',
    'تسجيل دخول': 'Signed in:', 'تسجيل خروج': 'Signed out:',
    'كلمة المرور المؤقتة': 'Temporary password', 'كلمة مرور جديدة': 'New password', 'كلمة مرور مؤقتة': 'Temporary password',
    'اتركها فارغة دون تغيير': 'Leave blank to keep unchanged',
    'إلزامه بتغييرها عند الدخول': 'Require change at next sign-in',
    'إعادة تعيين كلمة المرور (اختياري)': 'Reset password (optional)',
    'لتغيير كلمة مرورك استخدم زر «تغيير كلمة المرور» في الشريط العلوي.': 'To change your own password, use the “Change password” button in the top bar.',
    'اسم المستخدم: 3 أحرف إنجليزية أو أرقام على الأقل، بدون مسافات': 'Username: at least 3 English letters or digits, no spaces',
    'اسم المستخدم مستخدم مسبقاً': 'Username already taken',
    'لم يدخل بعد': 'Never signed in', 'آخر دخول': 'Last sign-in',
    'مرحباً': 'Welcome',

    // ===== الحالات =====
    'في العمل': 'Active', 'شاغرة / جاهزة': 'Available', 'في الصيانة': 'In Maintenance', 'خارج الخدمة / معطلة': 'Out of Service',
    'خارج الخدمة': 'Out of service', 'معطلة': 'Broken down',
    'شاغرة / جاهزة للتشغيل': 'Available / ready to operate',
    'في العمل – مرتبطة بمشروع أو عقد إيجار': 'Active – assigned to a project or rental',
    'في الصيانة الدورية أو الإصلاح': 'In preventive maintenance or repair',
    'جديدة': 'New', 'قيد التنفيذ': 'In Progress', 'بانتظار الاعتماد': 'Pending Approval', 'مكتملة': 'Done',
    'معتمد': 'Approved', 'مرفوض': 'Rejected', 'معتمدة': 'Approved', 'مسودة': 'Draft', 'مفوتر': 'Invoiced',
    'نشط': 'Active', 'موقوف': 'Suspended',
    'متوقف مؤقتاً': 'On hold', 'منتهي': 'Completed',

    // ===== أنواع ومعطيات =====
    'صيانة': 'Maintenance', 'تشغيل': 'Operations', 'إدارية': 'Administrative',
    'صيانة دورية': 'Preventive maintenance', 'إصلاح عطل': 'Corrective repair',
    'عالية': 'High', 'متوسطة': 'Medium', 'منخفضة': 'Low',
    'شديد – توقف كامل': 'Severe – full stop', 'متوسط': 'Moderate', 'بسيط': 'Minor',
    'ساعي': 'Hourly', 'يومي': 'Daily', 'شهري': 'Monthly',
    'إيجار ساعي': 'Hourly rental', 'إيجار يومي': 'Daily rental', 'إيجار شهري': 'Monthly rental',
    'إيجار': 'Rental', 'إيجار لعميل': 'Rental to a client', 'مشروع داخلي': 'Internal project', 'مشاريع داخلية': 'Internal projects',
    'داخلي': 'Internal', 'لعميل خارجي': 'External client',
    'خصوصي': 'Private', 'تجاري': 'Commercial', 'مؤقت': 'Temporary', 'أشغال عامة': 'Public Works',
    'طرف ثالث (Third Party)': 'Third Party', 'شامل (Comprehensive)': 'Comprehensive', 'طرف ثالث': 'Third Party', 'شامل': 'Comprehensive',
    'قلاب': 'Dump Truck', 'حفارة': 'Excavator', 'شيول': 'Wheel Loader', 'جرافة': 'Bulldozer', 'رافعة': 'Crane',
    'بوب كات': 'Skid Steer (Bobcat)', 'لوري': 'Lorry', 'تريلا (رأس قاطرة)': 'Trailer (Tractor Head)', 'صهريج مياه': 'Water Tanker',
    'حافلة': 'Bus', 'صالون': 'Sedan', 'دفع رباعي': '4x4 / SUV', 'بيك أب': 'Pickup',
    'ساعات تشغيل': 'Operating hours', 'كيلومترات': 'Kilometres',
    'أبيض لؤلؤي': 'Pearl White', 'أبيض': 'White', 'أصفر': 'Yellow', 'أحمر': 'Red', 'أزرق': 'Blue', 'فضي': 'Silver', 'أسود': 'Black', 'رمادي': 'Grey',
    'ر.ع': 'OMR',
    'ساعة': 'hours', 'كم': 'km', 'يوم': 'day', 'يوماً': 'days', 'شهر': 'month', 'ثانية': 'seconds',
    'سجل': 'record', 'سجلات': 'records', 'تنبيه': 'alert', 'تنبيهات': 'alerts', 'محاولة': 'attempt', 'محاولات': 'attempts',
    'سجل ساعات': 'timesheet', 'سجلات ساعات': 'timesheets', 'معدة': 'units', 'معدات': 'units',

    // ===== التواريخ =====
    'الأحد': 'Sunday', 'الاثنين': 'Monday', 'الثلاثاء': 'Tuesday', 'الأربعاء': 'Wednesday', 'الخميس': 'Thursday', 'الجمعة': 'Friday', 'السبت': 'Saturday',
    'يناير': 'January', 'فبراير': 'February', 'مارس': 'March', 'أبريل': 'April', 'مايو': 'May', 'يونيو': 'June',
    'يوليو': 'July', 'أغسطس': 'August', 'سبتمبر': 'September', 'أكتوبر': 'October', 'نوفمبر': 'November', 'ديسمبر': 'December',
    'صباح الخير': 'Good morning', 'مساء الخير': 'Good evening',

    // ===== أزرار عامة =====
    'حفظ': 'Save', 'إلغاء': 'Cancel', 'إغلاق': 'Close', 'تعديل': 'Edit', 'حذف': 'Delete', 'عرض': 'View', 'عرض الكل': 'View all',
    'تأكيد': 'Confirm', 'تأكيد الإجراء': 'Confirm action', 'طباعة': 'Print', 'اعتماد': 'Approve', 'رفض': 'Reject', 'استعادة': 'Restore',
    'تفاصيل': 'Details', 'الكل': 'All', 'بدون': 'None', 'بحث': 'Search', 'حفظ التعديلات': 'Save changes', 'إعادة التعيين': 'Reset',
    'استيراد': 'Import', 'الحالة': 'Status', 'النوع': 'Type', 'التاريخ': 'Date', 'ملاحظات': 'Notes', 'الوصف': 'Description',
    'العنوان': 'Title', 'الأولوية': 'Priority', 'المسؤول': 'Assignee', 'الاستحقاق': 'Due', 'الإجمالي': 'Total', 'الشهر': 'Month',
    'الاسم': 'Name', 'الدور': 'Role', 'الهاتف': 'Phone', 'الموقع': 'Location', 'المشروع': 'Project', 'المشاريع': 'Projects',
    'العميل': 'Client', 'السائق': 'Driver', 'المشرف': 'Supervisor', 'المعدة': 'Equipment', 'اللوحة': 'Plate', 'لوحة': 'Plate',
    'التأمين': 'Insurance', 'السعر': 'Rate', 'منذ': 'Since', 'الفترة': 'Period', 'المبلغ': 'Amount', 'الكمية': 'Qty', 'البيان': 'Description',
    'الساعات': 'Hours', 'المسافة': 'Distance', 'اللون': 'Colour', 'موديل': 'model', 'الفواتير': 'Invoices', 'فاتورة': 'Invoice',
    'من': 'From', 'إلى': 'To',

    // ===== لوحة التحكم =====
    'من الأسطول': 'of fleet', 'نسبة التشغيل': 'Utilization', 'المعدات العاملة من الإجمالي': 'Working units out of total',
    'إجمالي الأسطول': 'Total fleet', 'مركبة ومعدة مسجلة': 'registered vehicles & equipment',
    'تنبيهات نشطة': 'Active alerts', 'حرجة': 'critical', 'قريبة': 'upcoming',
    'أوامر عمل مفتوحة': 'Open work orders', 'صيانة دورية وإصلاح أعطال': 'Preventive and corrective',
    'ساعات بانتظار الاعتماد': 'Hours pending approval', 'سجلات تشغيل يومية': 'Daily operating records',
    'مهام مفتوحة': 'Open tasks', 'رخص • تأمين • صيانة دورية': 'Licences • Insurance • Maintenance',
    'المعدات في العمل الآن': 'Equipment working now', 'إدارة التشغيل': 'Manage operations',
    'لا توجد معدات مرتبطة بمشاريع حالياً': 'No equipment is currently assigned to projects',
    'المهام المفتوحة': 'Open tasks', 'لوحة المهام': 'Task board',
    'لا توجد مهام مفتوحة': 'No open tasks', 'آخر النشاطات': 'Recent activity', 'لا يوجد نشاط بعد': 'No activity yet',
    'لا توجد تنبيهات حالياً – جميع الرخص والصيانات ضمن المدة': 'No alerts – all licences and services are up to date',

    // ===== السائق =====
    'تسجيل ساعات اليوم': "Log today's hours", 'الإبلاغ عن عطل': 'Report a breakdown', 'إرسال ملاحظة مع صور': 'Send a note with photos',
    'نوع التشغيل': 'Operation type', 'العداد': 'Meter',
    'لا توجد معدة مسندة إليك حالياً. تواصل مع مدير النظام.': 'No equipment is assigned to you. Contact the system manager.',
    'سجلات ساعاتي': 'My timesheets', 'بلاغاتي الأخيرة': 'My recent reports', 'لم ترسل أي ملاحظات بعد': "You haven't sent any reports yet",

    // ===== الأسطول =====
    'بحث برقم اللوحة، الشاصي، النوع أو الموديل…': 'Search by plate, chassis, type or model…',
    'نوع المعدة': 'Equipment type', 'كل الأنواع': 'All types', 'كل أنواع اللوحات': 'All plate types',
    'إضافة مركبة / معدة': 'Add vehicle / equipment', 'ألوان اللوحات': 'Plate colours',
    'نوع اللوحة': 'Plate type', 'التشغيل الحالي': 'Current operation', 'رخصة المركبة': 'Vehicle licence',
    'لا توجد نتائج مطابقة للبحث أو الفلاتر': 'No results match your search or filters',
    'بطاقة المعدة': 'Equipment card', 'غير مرتبطة بمشروع': 'Not assigned',
    'البيانات الأساسية للوحة': 'Plate details', 'رقم اللوحة': 'Plate number', 'رمز اللوحة': 'Plate code', 'مثال: أ ب': 'e.g. A B',
    'التصنيف': 'Classification', 'نوع المركبة / المعدة': 'Vehicle / equipment type', 'الماركة / الموديل': 'Make / model',
    'مثال: كاتربيلر 320D': 'e.g. Caterpillar 320D', 'سنة الطراز': 'Model year',
    'رقم القاعدة / الشاصي (Chassis No.)': 'Chassis No.', 'التراخيص والتأمين': 'Licences & Insurance',
    'رخصة المركبة – من': 'Licence – from', 'رخصة المركبة – إلى': 'Licence – to',
    'وثيقة التأمين – من': 'Insurance – from', 'وثيقة التأمين – إلى': 'Insurance – to', 'وثيقة التأمين': 'Insurance policy',
    'نوع التأمين': 'Insurance type', 'العداد والصيانة الدورية': 'Meter & Preventive Maintenance',
    'نوع العداد': 'Meter type', 'قراءة العداد الحالية': 'Current meter reading', 'فترة الصيانة الدورية': 'Service interval',
    'كل كم ساعة / كيلومتر': 'every N hours / km', 'موعد الصيانة القادمة (قراءة العداد)': 'Next service (meter reading)',
    'اتركه فارغاً ليُحسب تلقائياً': 'Leave blank to calculate automatically',
    'الحالة الابتدائية': 'Initial status', 'ملاحظات عامة': 'General notes',
    'تاريخ نهاية الرخصة يسبق تاريخ بدايتها': 'Licence end date is before its start date',
    'تاريخ نهاية التأمين يسبق تاريخ بدايته': 'Insurance end date is before its start date',
    'توجد مركبة مسجلة بنفس رقم ورمز اللوحة': 'A vehicle with the same plate number and code already exists',
    'تعديل بيانات': 'Edited', 'تم حفظ بيانات المعدة': 'Equipment saved',
    'إضافة معدة جديدة:': 'New equipment added:', 'تمت إضافة المعدة إلى الأسطول': 'Equipment added to the fleet',
    'بطاقة تعريف المعدة': 'Equipment Profile', 'أمر صيانة': 'Work order', 'تعديل التشغيل': 'Edit assignment', 'ربط بمشروع / إيجار': 'Assign to project / rental',
    'البيانات الأساسية': 'Basic details', 'رقم الشاصي': 'Chassis No.', 'الرخصة من': 'Licence from', 'الرخصة إلى': 'Licence to',
    'التأمين من': 'Insurance from', 'التأمين إلى': 'Insurance to', 'ساعات هذا الشهر': 'Hours this month',
    'غير مرتبطة بأي مشروع أو عقد إيجار.': 'Not assigned to any project or rental contract.',
    'الصيانة الدورية': 'Preventive maintenance', 'العداد الحالي': 'Current meter', 'الصيانة كل': 'Service every',
    'الصيانة القادمة': 'Next service', 'المتبقي': 'Remaining', 'آخر صيانة': 'Last service',
    'آخر المهام': 'Recent tasks', 'لا توجد مهام': 'No tasks', 'لا توجد ملاحظات': 'No reports',
    'عطل': 'Breakdown', 'ملاحظة': 'Note', 'حالة المعدة': 'Equipment status', 'معدة محذوفة': 'Deleted equipment',
    'هل تريد حذف': 'Permanently delete',
    'نهائياً من الأسطول؟ ستبقى سجلاتها السابقة في التقارير.': 'from the fleet? Its past records will remain in reports.',
    'تم حذف المعدة': 'Equipment deleted',
    'تغيير حالة': 'Status changed for', 'تم تغيير الحالة إلى': 'Status changed to',

    // ===== التشغيل والإيجار =====
    'إيراد إيجار شهري تقديري': 'Estimated monthly rental revenue', 'على أساس 26 يوم عمل / 9 ساعات': 'based on 26 working days / 9 hours',
    'مرتبطة': 'Assigned', 'غير مرتبطة': 'Unassigned', 'السائق / المشغل': 'Driver / Operator',
    'ربط بمشروع': 'Assign to project', 'فك الارتباط': 'Unassign', 'لا توجد معدات': 'No equipment',
    'تنبيه: المعدة حالياً': 'Note: this equipment is currently',
    'ربط المعدة بمشروع / عقد إيجار –': 'Assign equipment to project / rental –',
    'حفظ وتحويل الحالة إلى «في العمل»': 'Save and set status to “Active”',
    'نوع الإيجار': 'Rental type', 'سعر الإيجار': 'Rental rate', 'اختر المشروع': 'Select project',
    'اسم العميل': 'Client name', 'يُعبأ تلقائياً من المشروع': 'Filled automatically from the project',
    'اختر السائق': 'Select driver', 'تاريخ البدء': 'Start date', 'أدخل سعر الإيجار': 'Enter the rental rate',
    'ربط': 'Assigned', 'بـ': 'to', 'تم ربط المعدة وتحويل حالتها إلى «في العمل»': 'Equipment assigned and set to “Active”',
    'فك ارتباط': 'Unassign', 'وإرجاعها إلى «شاغرة / جاهزة»؟': 'and return it to “Available”?',
    'تم فك الارتباط': 'Equipment unassigned',

    // ===== الساعات =====
    'اعتماد الكل': 'Approve all', 'تسجيل ساعات تشغيل': 'Log operating hours',
    'تظهر لك سجلات المشاريع التي تشرف عليها': 'You see records for the projects you supervise',
    'لا توجد مشاريع مسندة': 'No assigned projects', 'إجمالي': 'Total', 'لا توجد سجلات': 'No records',
    'تسجيل ساعات تشغيل يومية': 'Log daily operating hours', 'عدد الساعات': 'Hours', 'المسافة المقطوعة (كم)': 'Distance (km)',
    'للشاحنات والمركبات ذات عداد الكيلومترات': 'For trucks and vehicles with an odometer',
    'طبيعة العمل، الموقع، أي توقفات…': 'Type of work, location, any stoppages…',
    'لا توجد معدة مسندة إليك لتسجيل ساعاتها': 'No equipment is assigned to you to log hours for',
    'لا توجد معدات مرتبطة بمشاريع': 'No equipment assigned to projects',
    'يوجد سجل لنفس المعدة في هذا التاريخ': 'A record already exists for this equipment on this date',
    'بتاريخ': 'on', 'تم إرسال السجل للمشرف للاعتماد': 'Record sent to the supervisor for approval',
    'تم اعتماد': 'Approved',
    'وتحديث عدادات المعدات': 'and updated equipment meters',
    'ساعات تشغيل دفعة واحدة؟': 'operating hours at once?',
    'رفض سجل الساعات': 'Reject timesheet', 'سبب الرفض': 'Reason for rejection',
    'مثال: عدد الساعات لا يطابق تقرير الموقع': 'e.g. hours do not match the site report',
    'رفض سجل ساعات': 'Rejected timesheet for', 'تم رفض السجل': 'Record rejected',
    'حذف سجل الساعات هذا؟': 'Delete this timesheet?', 'حذف سجل ساعات تشغيل': 'Deleted a timesheet', 'تم الحذف': 'Deleted',

    // ===== الصيانة =====
    'معدة معطلة': 'broken-down units', 'صيانة دورية مستحقة': 'Preventive due', 'متأخرة أو قريبة': 'overdue or upcoming',
    'أوامر منجزة': 'Completed orders', 'أوامر العمل': 'Work orders', 'المفتوحة': 'Open', 'المنجزة': 'Completed',
    'أمر عمل جديد': 'New work order', 'أمر العمل': 'Work order', 'من بلاغ ميداني': 'from a field report',
    'فريق الورشة': 'Workshop team', 'لا توجد أوامر عمل': 'No work orders',
    'جدول الصيانة الدورية': 'Preventive maintenance schedule', 'حسب ساعات التشغيل أو الكيلومترات –': 'by operating hours or kilometres –',
    'تحديث العداد': 'Update meter', 'فتح صيانة دورية': 'Open preventive service', 'أمر مفتوح': 'Order open',
    'حالة المهمة': 'Task status', 'أمر عمل صيانة جديد': 'New maintenance work order', 'إنشاء أمر العمل': 'Create work order',
    'اختر المعدة': 'Select equipment', 'نوع الصيانة': 'Maintenance type', 'مثال: تغيير زيت المحرك والفلاتر': 'e.g. change engine oil and filters',
    'فريق الورشة (غير محدد)': 'Workshop team (unassigned)', 'تاريخ الاستحقاق': 'Due date',
    'تحويل حالة المعدة إلى «في الصيانة»': 'Set equipment status to “In Maintenance”',
    'فتح أمر عمل': 'Opened work order', 'لـ': 'for', 'تم إنشاء أمر العمل': 'Work order created',
    'وتحديث موعد الصيانة القادمة إلى': 'and next service updated to', 'وإعادة المعدة إلى': 'and equipment returned to',
    'إغلاق المهمة يتطلب اعتماد المشرف أو مدير النظام – انقلها إلى «بانتظار الاعتماد»': 'Closing a task requires supervisor or manager approval – move it to “Pending Approval”',
    'المهمة': 'Task', 'تم نقل المهمة إلى': 'Task moved to',
    'تحديث قراءة العداد –': 'Update meter reading –', 'القراءة الحالية': 'Current reading', 'موعد الصيانة القادمة': 'Next service at',
    'تحديث عداد': 'Updated meter for', 'تم تحديث العداد': 'Meter updated',
    'صيانة دورية عند': 'Preventive service at',
    'تغيير الزيوت والفلاتر، فحص شامل حسب جدول الصيانة الدورية.': 'Change oils and filters, full inspection per the maintenance schedule.',

    // ===== الميدان =====
    'بلاغات الأعطال': 'Breakdowns', 'لا توجد ملاحظات ميدانية': 'No field reports',
    'إرسال ملاحظة / بلاغ عطل': 'Send a note / report a breakdown', 'ملاحظة عامة': 'General note',
    'تُسجل للمتابعة دون إيقاف المعدة': 'Logged for follow-up without stopping the equipment',
    'بلاغ عطل': 'Breakdown report', 'يُنشئ مهمة صيانة ويحوّل المعدة إلى «معطلة»': 'Creates a maintenance task and marks the equipment “Broken down”',
    'درجة العطل': 'Severity', 'صف العطل أو الملاحظة بدقة…': 'Describe the fault or note in detail…',
    'مثال: ميناء صحار – البوابة 3': 'e.g. Sohar Port – Gate 3',
    'اختر صوراً أو التقط بالكاميرا': 'Choose photos or take one with the camera',
    'إرسال بلاغ العطل': 'Send breakdown report', 'إرسال الملاحظة': 'Send note', 'صورة': 'Photo',
    'مهمة الصيانة:': 'Maintenance task:', 'فتح المهمة': 'Open task', 'تحويل إلى مهمة صيانة': 'Convert to maintenance task',
    'اختر المعدة واكتب الوصف': 'Select the equipment and enter a description',
    'تحويلها إلى «خارج الخدمة» وإنشاء مهمة صيانة للورشة': 'set to “Out of Service” and a workshop task created',
    'تم إرسال البلاغ: أُنشئت مهمة صيانة وتحولت المعدة إلى «معطلة»': 'Report sent: a maintenance task was created and the equipment marked “Broken down”',
    'ملاحظة ميدانية لـ': 'Field note for', 'تم إرسال الملاحظة': 'Note sent', 'تعذّرت قراءة الصورة': 'Could not read the image',
    'صورة البلاغ': 'Report photo', 'فحص ملاحظة ميدانية –': 'Inspect field note –', 'بلاغ ميداني': 'Field report',

    // ===== المهام =====
    'مهامي فقط': 'My tasks only', 'مهمة جديدة': 'New task', 'غير مسندة': 'Unassigned',
    'المرحلة السابقة': 'Previous stage', 'المرحلة التالية': 'Next stage', 'اعتماد وإغلاق': 'Approve & close', 'متأخرة': 'overdue',
    'تفاصيل المهمة': 'Task details', 'إنشاء المهمة': 'Create task', 'نوع المهمة': 'Task type',
    'إتمام «صيانة دورية» يحدّث موعد الصيانة القادمة تلقائياً': 'Completing a “Preventive maintenance” task updates the next service automatically',
    'البلاغ الميداني المرتبط': 'Linked field report', 'أنشأها': 'Created by', 'أُغلقت': 'closed',
    'تعديل المهمة': 'Edited task', 'تم حفظ المهمة': 'Task saved', 'إنشاء مهمة': 'Created task', 'تم إنشاء المهمة': 'Task created',
    'حذف هذه المهمة نهائياً؟': 'Permanently delete this task?', 'حذف المهمة': 'Deleted task', 'تم حذف المهمة': 'Task deleted',

    // ===== المشاريع =====
    'إضافة مشرف': 'Add supervisor', 'مشروع جديد': 'New project',
    'عميل:': 'Client:', 'ساعات معلقة': 'Pending hours', 'مهمة للمشرف': 'Task for supervisor',
    'لا توجد مشاريع': 'No projects', 'المشرفون وتوزيع المشاريع': 'Supervisors & project allocation',
    'المشاريع المسندة': 'Assigned projects', 'المعدات تحت الإشراف': 'Equipment supervised',
    'ساعات بانتظار اعتماده': 'Hours awaiting approval', 'مهامه المفتوحة': 'Open tasks', 'لا يوجد مشرفون': 'No supervisors',
    'تعديل المشروع': 'Edit project', 'اسم المشروع': 'Project name',
    'للمشاريع الخارجية': 'For external projects', 'المشرف المسؤول': 'Responsible supervisor', 'اختر المشرف': 'Select supervisor',
    'أدخل اسم العميل للمشروع الخارجي': 'Enter the client name for an external project',
    'إسناد مشروع': 'Assigned project', 'إلى المشرف': 'to supervisor', 'تعديل مشروع': 'Edited project',
    'إنشاء مشروع': 'Created project', 'وإسناده إلى': 'and assigned it to', 'تم حفظ المشروع': 'Project saved',
    'لا يمكن حذف مشروع مرتبطة به معدات – فك ارتباطها أولاً': 'Cannot delete a project with assigned equipment – unassign it first',
    'حذف مشروع': 'Delete project', 'تم حذف المشروع': 'Project deleted',

    // ===== الفواتير =====
    'سجل بانتظار الاعتماد في هذا الشهر': 'records pending approval this month',
    'تقرير التشغيل –': 'Operating report –', 'من الساعات المعتمدة فقط': 'approved hours only',
    'معتمد من': 'Approved by', 'اعتماد تقرير التشغيل': 'Approve operating report',
    'أيام التشغيل': 'Working days', 'إجمالي الساعات': 'Total hours', 'متوسط يومي': 'Daily average',
    'لا توجد ساعات معتمدة في هذا الشهر': 'No approved hours this month',
    'رقم الفاتورة': 'Invoice No.', 'العميل / المشروع': 'Client / Project', 'عرض وطباعة': 'View & print',
    'لم تُصدر فواتير بعد': 'No invoices issued yet', 'إصدار فاتورة إيجار': 'Issue rental invoice',
    'المشروع / العميل': 'Project / Client', 'تُحسب الفاتورة لشهر': 'The invoice is calculated for',
    'من الساعات المعتمدة غير المفوترة، حسب نوع الإيجار لكل معدة (ساعي / يومي / شهري)': 'from approved, uninvoiced hours, by each unit’s rental type (hourly / daily / monthly)',
    'إنشاء مسودة الفاتورة': 'Create draft invoice',
    'لا توجد ساعات معتمدة غير مفوترة لهذا المشروع في': 'No approved uninvoiced hours for this project in',
    'إنشاء مسودة فاتورة': 'Created draft invoice', 'للعميل': 'for client',
    'تم إنشاء مسودة الفاتورة': 'Draft invoice created',
    'فاتورة إيجار معدات': 'Equipment Rental Invoice', 'تاريخ الإصدار': 'Issue date', 'اعتمدها': 'Approved by',
    'الساعات / الأيام': 'Hours / Days',
    'المجموع قبل الضريبة': 'Subtotal', 'ضريبة القيمة المضافة': 'VAT', 'الإجمالي المستحق': 'Total due',
    'اعتماد الفاتورة': 'Approve invoice', 'بقيمة': 'for', '؟ لا يمكن تعديلها بعد الاعتماد.': '? It cannot be edited after approval.',
    'تم اعتماد الفاتورة': 'Invoice approved',
    'حذف مسودة الفاتورة؟ ستعود ساعاتها إلى «غير مفوترة».': 'Delete the draft invoice? Its hours will return to “uninvoiced”.',
    'حذف مسودة فاتورة': 'Deleted draft invoice', 'تم حذف المسودة': 'Draft deleted',
    'اعتماد تقرير التشغيل لشهر': 'Approved operating report for', 'تم اعتماد تقرير التشغيل': 'Operating report approved',

    // ===== المستخدمون =====
    'مستخدم جديد': 'New user', 'الإسناد الحالي': 'Current assignment', 'بدون معدة': 'No equipment', 'بدون مشاريع': 'No projects',
    'أمر عمل مفتوح': 'open work orders', 'تعديل مستخدم': 'Edit user', 'الاسم الكامل': 'Full name', 'رقم الهاتف': 'Phone number',
    'تعديل بيانات المستخدم': 'Edited user', 'وإعادة تعيين كلمة المرور': 'and reset password',
    'إضافة': 'Added', 'تم حفظ المستخدم وكلمة المرور': 'User and password saved', 'تم حفظ المستخدم': 'User saved',
    'حذف المستخدم': 'Delete user', '؟ يُفضّل إيقافه بدلاً من حذفه للحفاظ على السجلات.': '? Suspending is recommended instead, to keep records.',
    'تم حذف المستخدم': 'User deleted',

    // ===== الإعدادات =====
    'اسم النظام': 'System name', 'اسم النظام (إنجليزي)': 'System name (English)',
    'اسم الشركة (عربي)': 'Company name (Arabic)', 'اسم الشركة (إنجليزي)': 'Company name (English)',
    'شعار الشركة': 'Company logo', 'رفع شعار جديد': 'Upload new logo', 'استعادة الشعار الافتراضي': 'Restore default logo',
    'PNG أو SVG بخلفية شفافة، يُفضل مربع الأبعاد': 'PNG or SVG with transparent background, preferably square',
    'اللون الأساسي': 'Primary colour', 'اللون المساعد': 'Accent colour', 'لون القائمة الجانبية': 'Sidebar colour',
    'قوالب ألوان جاهزة': 'Colour presets', 'الافتراضي': 'Default', 'أخضر صناعي': 'Industrial green', 'عنابي': 'Burgundy',
    'رمادي فولاذي': 'Steel grey', 'أزرق بترولي': 'Petrol blue',
    'إعدادات التنبيهات': 'Alert settings', 'التنبيه قبل انتهاء الرخصة/التأمين (يوم)': 'Alert before licence/insurance expiry (days)',
    'تنبيه الصيانة قبل (ساعة تشغيل)': 'Maintenance alert before (operating hours)', 'تنبيه الصيانة قبل (كم)': 'Maintenance alert before (km)',
    'قاعدة البيانات والنسخ الاحتياطي': 'Database & Backup', 'المساحة المستخدمة في المتصفح:': 'Browser storage used:',
    'من حوالي': 'of about', 'مستخدم': 'users', 'مهمة': 'tasks', 'بلاغ': 'reports',
    'تصدير نسخة احتياطية': 'Export backup', 'استيراد نسخة': 'Import backup', 'إعادة البيانات التجريبية': 'Reset demo data',
    'القيم الافتراضية في الكود': 'Defaults in code',
    'التغييرات هنا تُحفظ في هذا المتصفح فقط. لتثبيتها لجميع المستخدمين عدّل الملف': 'Changes here are saved in this browser only. To apply them for all users, edit',
    'في المستودع:': 'in the repository:', 'حفظ الإعدادات': 'Save settings', 'استعادة الإعدادات الافتراضية': 'Restore default settings',
    'اضغط «حفظ الإعدادات» لتطبيق الشعار': 'Click “Save settings” to apply the logo',
    'تحديث إعدادات النظام والهوية البصرية': 'Updated system settings and branding', 'تم حفظ الإعدادات': 'Settings saved',
    'استعادة اسم النظام والشعار والألوان والتنبيهات إلى القيم الموجودة في ملف config.js؟': 'Restore the system name, logo, colours and alerts to the values in config.js?',
    'تمت الاستعادة': 'Restored',
    'تم تنزيل النسخة الاحتياطية': 'Backup downloaded',
    'سيتم حذف جميع البيانات الحالية واستبدالها بالبيانات التجريبية. هل أنت متأكد؟': 'All current data will be deleted and replaced with demo data. Are you sure?',
    'تمت إعادة البيانات التجريبية – كلمات المرور عادت إلى القيمة الأولية': 'Demo data restored – passwords reset to the initial value',
    'استيراد النسخة': 'Import backup', 'مستخدم) واستبدال البيانات الحالية؟': 'users) and replace current data?',
    'استيراد نسخة احتياطية': 'Imported backup', 'تم استيراد البيانات': 'Data imported',
    'الملف غير صالح – يجب أن يكون نسخة احتياطية من هذا النظام': 'Invalid file – it must be a backup from this system',
    'تعذّر الحفظ: مساحة التخزين في المتصفح ممتلئة. احذف بعض الصور أو صدّر نسخة احتياطية.': 'Could not save: browser storage is full. Delete some photos or export a backup.',
    'اللغة': 'Language',
    'مشاركة التطبيق': 'Share the app', 'تم نسخ رابط التحميل': 'Download link copied',
    'تحديث جديد متاح': 'Update available', 'تنزيل التحديث': 'Download update', 'المثبّت لديك': 'you have',
    'متاح، والمثبّت لديك': 'is available; you have',
    'نزّل الملف ثم افتحه واضغط «تحديث». يُثبَّت فوق النسخة الحالية، وتبقى بياناتك وحسابك كما هي.': 'Download the file, open it and tap “Update”. It installs over the current version; your data and account stay as they are.',
    'لديك أحدث إصدار': 'You have the latest version', 'تعذّر العثور على إصدارات التطبيق': 'Could not find app releases',
    'تعذّر البحث عن تحديثات — تحقق من اتصال الإنترنت': 'Could not check for updates — check your internet connection',
    'حول': 'About', 'حول البرنامج': 'About', 'حول البرنامج والمطور': 'About the software & developer', 'المساعدة': 'Help',
    'معلومات البرنامج والإصدار والمطور': 'Software, version and developer information',
    'عن البرنامج': 'About the software', 'عن المطور': 'About the developer', 'المزايا': 'Features',
    'المنصة': 'Platform', 'المنصات المتاحة': 'Available platforms', 'الموقع • أندرويد • آيفون • ويندوز': 'Web • Android • iPhone • Windows',
    'البيانات': 'Data', 'قاعدة بيانات مركزية متزامنة لحظياً': 'Central database, synced in real time',
    'تطبيق ويندوز': 'Windows app', 'تطبيق أندرويد': 'Android app', 'تطبيق آيفون': 'iPhone app', 'الموقع (المتصفح)': 'Web (browser)',
    'البحث عن تحديثات': 'Check for updates', 'تعديل هذه الصفحة': 'Edit this page', 'معاينة': 'Preview',
    'واتساب': 'WhatsApp', 'البريد الإلكتروني': 'Email', 'الموقع الإلكتروني': 'Website', 'العنوان': 'Address',
    'لم تُضف بيانات التواصل بعد — أضفها من «تعديل هذه الصفحة».': 'No contact details yet — add them via “Edit this page”.',
    'للدعم الفني تواصل مع مدير النظام.': 'For technical support, contact the system manager.',
    'يُمنع نسخ البرنامج أو إعادة توزيعه أو استخدامه تجارياً دون إذن كتابي من المالك.': 'Copying, redistributing or commercial use of this software without written permission from the owner is prohibited.',
    'صفحة «حول البرنامج والمطور»': '“About” page (software & developer)',
    'يظهر هذا المحتوى لجميع المستخدمين في الموقع وتطبيقات أندرويد وآيفون وويندوز (قائمة مساعدة ← حول، أو F1). الحقول الفارغة لا تُعرض.': 'This content is shown to all users on the website and the Android, iPhone and Windows apps (Help → About, or F1). Empty fields are hidden.',
    'وصف البرنامج (عربي)': 'Software description (Arabic)', 'وصف البرنامج (إنجليزي)': 'Software description (English)',
    'المزايا (عربي) — ميزة في كل سطر': 'Features (Arabic) — one per line', 'المزايا (إنجليزي) — ميزة في كل سطر': 'Features (English) — one per line',
    'اسم المطور (عربي)': 'Developer name (Arabic)', 'اسم المطور (إنجليزي)': 'Developer name (English)',
    'نبذة عن المطور (عربي)': 'About the developer (Arabic)', 'نبذة عن المطور (إنجليزي)': 'About the developer (English)',
    'شعار المطور': 'Developer logo', 'رفع شعار': 'Upload logo', 'إزالة الشعار': 'Remove logo', 'بيانات التواصل': 'Contact details',
    'العنوان (عربي)': 'Address (Arabic)', 'العنوان (إنجليزي)': 'Address (English)',
    'حفظ صفحة «حول»': 'Save “About” page', 'استعادة النص الافتراضي': 'Restore default text',
    'البريد الإلكتروني غير صحيح': 'Invalid email address',
    'تم حفظ صفحة «حول» — تظهر الآن لجميع المستخدمين': '“About” page saved — now visible to all users',
    'تحديث صفحة «حول البرنامج والمطور»': 'Updated the “About” page', 'استعادة صفحة «حول» الافتراضية': 'Restored the default “About” page',
    'استعادة نص صفحة «حول» الافتراضي؟ ستُحذف بيانات التواصل التي أضفتها.': 'Restore the default “About” text? Contact details you added will be removed.',
    'اضغط «حفظ صفحة حول» لتطبيق الشعار': 'Click “Save About page” to apply the logo',
    'التغييرات هنا تُحفظ في قاعدة البيانات وتظهر لجميع المستخدمين. أما القيم التي تُستعاد عند «استعادة الإعدادات الافتراضية» فموجودة في الملف': 'Changes here are saved to the database and shown to all users. The values restored by “Restore default settings” live in',
    'طريقة التشغيل': 'Operation mode', 'بدون سائق': 'Without driver', 'مع سائق': 'With driver', 'مع سائق من الشركة': 'With company driver',
    'بدون سائق – يشغّلها العميل': 'Without driver – operated by the client', 'بدون سائق (يشغّلها العميل)': 'Without driver (operated by the client)',
    'مشغّل العميل:': 'Client operator:', 'اسم مشغّل العميل': 'Client operator name',
    'اختياري – من يشغّل المعدة لدى العميل': 'Optional – who operates the equipment at the client', 'اختر السائق / المشغل': 'Select the driver / operator',
    'متزامن': 'Synced', 'جارٍ الحفظ…': 'Saving…', 'غير متصل': 'Offline', 'خطأ في الحفظ': 'Save error',
    'جارٍ الدخول…': 'Signing in…', 'جارٍ تحميل البيانات…': 'Loading data…', 'جارٍ رفع الصور…': 'Uploading photos…', 'إعادة المحاولة': 'Retry',
    'تعذّر الاتصال بالخادم — تحقق من اتصال الإنترنت': 'Cannot reach the server — check your internet connection',
    'تعذّر تحميل البيانات من الخادم — حاول مرة أخرى': 'Could not load data from the server — please try again',
    'هذا الحساب غير مسجل في النظام. تواصل مع مدير النظام.': 'This account is not registered in the system. Contact the system manager.',
    'أنت غير متصل — تُعرض آخر بيانات محفوظة، وستُرسل تعديلاتك عند عودة الاتصال': 'You are offline — showing the last saved data; your changes will be sent when you reconnect',
    'لا يوجد اتصال بالإنترنت — سيُحفظ التعديل تلقائياً عند عودة الاتصال': 'No internet connection — the change will be saved automatically when you reconnect',
    'لا تملك صلاحية هذا الإجراء — تم التراجع عنه': 'You do not have permission for this action — it was reverted',
    'تعذّر الحفظ على الخادم:': 'Could not save to the server:', 'تعذّر تغيير كلمة المرور:': 'Could not change the password:',
    'لا تملك صلاحية هذا الإجراء': 'You do not have permission for this action', 'لا يوجد اتصال بالإنترنت': 'No internet connection',
    'لا يمكنك حذف حسابك': 'You cannot delete your own account', 'تعذّر تنفيذ العملية:': 'Operation failed:',
    'كلمة المرور يجب أن تحتوي على حروف إنجليزية وأرقام': 'Password must contain English letters and numbers',
    'لا يمكن تغيير اسم المستخدم بعد الإنشاء': 'The username cannot be changed after creation',
    'تعذّر رفع الصور — تحقق من الاتصال ثم أعد المحاولة': 'Could not upload photos — check your connection and try again',
    'تعذّر تحميل الصورة': 'Could not load the image',
    'البيانات محفوظة في قاعدة بيانات مركزية (Supabase) ومتزامنة لحظياً بين الموقع وتطبيقات أندرويد وآيفون وويندوز وجميع الأجهزة. تُؤخذ نسخ احتياطية من الخادم، ويمكنك أيضاً تصدير نسخة بنفسك.': 'Data is stored in a central database (Supabase) and synced in real time across the website, the Android, iPhone and Windows apps and all devices. You can also export your own backup.',
    'استيراد': 'Import', 'سجلاً من النسخة إلى قاعدة البيانات المركزية؟ تُحدَّث السجلات الموجودة بنفس الرقم وتُضاف الجديدة، ولا يُحذف شيء. حسابات المستخدمين لا تُستورد.': 'records from the backup into the central database? Existing records with the same ID are updated and new ones are added; nothing is deleted. User accounts are not imported.',
    'لوحة المفاتيح على اللغة العربية — بدّلها إلى الإنجليزية ثم أعد كتابة اسم المستخدم وكلمة المرور': 'Your keyboard is set to Arabic — switch it to English and retype your username and password',
    'المزيد': 'More', 'مركبتي': 'My vehicle', 'الساعات': 'Hours', 'الصيانة': 'Maintenance', 'الميدان': 'Field', 'المهام': 'Tasks', 'الأسطول': 'Fleet',
    'التنقل السريع': 'Quick navigation', 'القائمة الرئيسية': 'Main menu', 'تعذّر حفظ الملف': 'Could not save the file',
    'الهوية البصرية': 'Branding', 'الحقوق ورقم الإصدار': 'Copyright & version', 'رقم إصدار البرنامج': 'Software version',
    'صاحب الحقوق (عربي)': 'Copyright holder (Arabic)', 'صاحب الحقوق (إنجليزي)': 'Copyright holder (English)',
    'نص حماية الحقوق (عربي)': 'Rights notice (Arabic)', 'نص حماية الحقوق (إنجليزي)': 'Rights notice (English)',
    'رقم البناء المثبّت': 'Installed build',
    'تظهر فوراً لجميع المستخدمين في الموقع وتطبيقات أندرويد وآيفون وويندوز، وفي شاشة الدخول وصفحة «حول».': 'Shown instantly to all users on the website and the Android, iPhone and Windows apps, on the sign-in screen and the About page.', 'إضافة إلى الأسطول': 'Add to fleet', 'إضافة مركبة / معدة جديدة': 'Add new vehicle / equipment',
    'لوحة تحكم مركزية لمتابعة حالة الشاحنات والمعدات، التراخيص والتأمين، الصيانة، عقود التشغيل والإيجار، والمهام اليومية.': 'A central dashboard to track trucks and equipment, licences and insurance, maintenance, operating and rental contracts, and daily tasks.',
  };

  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const AR = '\\u0621-\\u065F\\u066E-\\u06D3\\u06FA-\\u06FF';
  const keys = Object.keys(DICT).sort((a, b) => b.length - a.length);
  const DICT_RE = new RegExp(`(?<![${AR}])(?:${keys.map(escRe).join('|')})(?![${AR}])`, 'g');
  const HAS_AR = /[؀-ۿ]/;

  /** ترجمة نص واحد */
  function tr(s) {
    if (lang !== 'en' || !s || !HAS_AR.test(s)) return s;
    let out = s;
    for (const [re, rep] of PATTERNS) out = out.replace(re, rep);
    out = out.replace(DICT_RE, (m) => DICT[m]);
    return out.replace(/،\s?/g, ', ').replace(/؛/g, ';').replace(/؟/g, '?').replace(/«/g, '“').replace(/»/g, '”');
  }

  const SKIP = 'textarea,script,style,[data-raw]';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-label'];

  /** ترجمة عنصر وكل ما بداخله */
  function translate(root) {
    if (lang !== 'en' || !root) return;
    if (root.nodeType === 3) {
      const p = root.parentElement;
      if (p && !p.closest(SKIP) && HAS_AR.test(root.data)) { const t = tr(root.data); if (t !== root.data) root.data = t; }
      return;
    }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (HAS_AR.test(n.data) && !(n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => { const t = tr(n.data); if (t !== n.data) n.data = t; });
    [root, ...root.querySelectorAll('[placeholder],[title],[aria-label],[alt],[data-label]')].forEach((el) => {
      if (el.closest('[data-raw]')) return;
      ATTRS.forEach((a) => { const v = el.getAttribute(a); if (v && HAS_AR.test(v)) el.setAttribute(a, tr(v)); });
    });
  }

  function apply() {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'en' ? 'ltr' : 'rtl';
    if (lang !== 'en') return;
    translate(document.body);
    new MutationObserver((records) => {
      records.forEach((r) => r.addedNodes.forEach((n) => translate(n)));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function set(l) {
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    location.reload();
  }

  return { get lang() { return lang; }, tr, translate, apply, set, toggle: () => set(lang === 'en' ? 'ar' : 'en') };
})();
