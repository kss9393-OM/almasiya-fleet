/* =========================================================================
   طبقة البيانات — محاكاة قاعدة البيانات عبر LocalStorage
   عند ربط النظام لاحقاً بخادم (API / Supabase / Firebase) يكفي استبدال
   الدوال load / save في هذا الملف دون المساس بالواجهة.
   ========================================================================= */

const Store = (function () {
  'use strict';

  const KEY = APP_CONFIG.storageKey;
  const SESSION_KEY = KEY + '_session';

  const pad = (n) => String(n).padStart(2, '0');
  function fmtDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function off(n) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return fmtDate(d);
  }
  function isoOff(n, h = 9) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(h, 15, 0, 0);
    return d.toISOString();
  }

  /* ---------------- بيانات تجريبية (Demo Seed) ---------------- */
  function seed() {
    const users = [
      { id: 'u1', name: 'فريق التطوير', role: 'developer', username: 'dev', phone: '', active: true },
      { id: 'u2', name: 'سالم البلوشي', role: 'manager', username: 'salem', phone: '+968 9123 4501', active: true },
      { id: 'u3', name: 'أحمد الكندي', role: 'supervisor', username: 'ahmed', phone: '+968 9123 4502', active: true },
      { id: 'u4', name: 'يوسف المعمري', role: 'supervisor', username: 'yousuf', phone: '+968 9123 4503', active: true },
      { id: 'u5', name: 'راشد الشحي', role: 'driver', username: 'rashid', phone: '+968 9123 4504', active: true },
      { id: 'u6', name: 'عمران خان', role: 'driver', username: 'imran', phone: '+968 9123 4505', active: true },
      { id: 'u7', name: 'سعيد الهنائي', role: 'driver', username: 'saeed', phone: '+968 9123 4506', active: true },
      { id: 'u8', name: 'بابو راجان', role: 'driver', username: 'babu', phone: '+968 9123 4507', active: true },
      { id: 'u9', name: 'ناصر الغافري', role: 'maintenance', username: 'nasser', phone: '+968 9123 4508', active: true },
      { id: 'u10', name: 'راجيش كومار', role: 'maintenance', username: 'rajesh', phone: '+968 9123 4509', active: true },
    ];

    const projects = [
      { id: 'p1', name: 'طريق صحار الصناعي – المرحلة الثانية', client: '', kind: 'internal', location: 'صحار', supervisorId: 'u3', status: 'active', startDate: off(-90), notes: '' },
      { id: 'p2', name: 'أعمال ردم – توسعة الميناء', client: 'شركة الخليج للمقاولات', kind: 'external', location: 'ميناء صحار', supervisorId: 'u4', status: 'active', startDate: off(-60), notes: '' },
      { id: 'p3', name: 'مخطط سكني – لوى', client: 'مؤسسة البناء الحديث', kind: 'external', location: 'لوى', supervisorId: 'u3', status: 'active', startDate: off(-45), notes: '' },
    ];

    const V = (o) => Object.assign({ make: '', color: '', year: '', chassis: '', notes: '', assignment: null, lastService: '' }, o);
    const vehicles = [
      V({ id: 'v1', plateNo: '24518', plateCode: 'أ ر', plateType: 'تجاري', type: 'قلاب', make: 'مرسيدس أكتروس 4141', color: 'أبيض', year: 2021, chassis: 'WDB9340321L512846',
        licenseFrom: off(-200), licenseTo: off(165), insFrom: off(-100), insTo: off(265), insType: 'شامل (Comprehensive)',
        meterType: 'km', meter: 184200, serviceInterval: 10000, nextService: 190000, status: 'active',
        assignment: { kind: 'internal', rentalType: '', projectId: 'p1', client: '', driverId: 'u5', rate: 0, startDate: off(-40) } }),
      V({ id: 'v2', plateNo: '30871', plateCode: 'ب س', plateType: 'أشغال عامة', type: 'حفارة', make: 'كاتربيلر 320D', color: 'أصفر', year: 2019, chassis: 'CAT0320DTKGF03317',
        licenseFrom: off(-300), licenseTo: off(65), insFrom: off(-300), insTo: off(65), insType: 'شامل (Comprehensive)',
        meterType: 'hours', meter: 9840, serviceInterval: 500, nextService: 9870, status: 'active',
        assignment: { kind: 'rental', rentalType: 'daily', projectId: 'p2', client: 'شركة الخليج للمقاولات', driverId: 'u6', rate: 140, startDate: off(-25) } }),
      V({ id: 'v3', plateNo: '11092', plateCode: 'ر ع', plateType: 'أشغال عامة', type: 'شيول', make: 'كوماتسو WA380', color: 'أصفر', year: 2018, chassis: 'KMTWA380H65021',
        licenseFrom: off(-353), licenseTo: off(12), insFrom: off(-200), insTo: off(165), insType: 'طرف ثالث (Third Party)',
        meterType: 'hours', meter: 14320, serviceInterval: 500, nextService: 14500, status: 'active',
        assignment: { kind: 'rental', rentalType: 'hourly', projectId: 'p3', client: 'مؤسسة البناء الحديث', driverId: 'u7', rate: 18, startDate: off(-30) } }),
      V({ id: 'v4', plateNo: '55210', plateCode: 'م د', plateType: 'تجاري', type: 'لوري', make: 'ميتسوبيشي فوسو', color: 'أبيض', year: 2022, chassis: 'JLFFE85PHNJ004421',
        licenseFrom: off(-100), licenseTo: off(265), insFrom: off(-100), insTo: off(265), insType: 'شامل (Comprehensive)',
        meterType: 'km', meter: 76500, serviceInterval: 10000, nextService: 80000, status: 'idle', notes: 'متوقفة في الساحة الرئيسية – صحار' }),
      V({ id: 'v5', plateNo: '42007', plateCode: 'ص ط', plateType: 'تجاري', type: 'قلاب', make: 'فولفو FMX 440', color: 'أحمر', year: 2020, chassis: 'YV2XTY0A6LA851230',
        licenseFrom: off(-150), licenseTo: off(215), insFrom: off(-150), insTo: off(215), insType: 'شامل (Comprehensive)',
        meterType: 'km', meter: 231000, serviceInterval: 10000, nextService: 230500, status: 'maintenance' }),
      V({ id: 'v6', plateNo: '18663', plateCode: 'ح ك', plateType: 'أشغال عامة', type: 'حفارة', make: 'هيونداي R210', color: 'أصفر', year: 2017, chassis: 'HHKHZ612AH0002981',
        licenseFrom: off(-250), licenseTo: off(115), insFrom: off(-370), insTo: off(-5), insType: 'طرف ثالث (Third Party)',
        meterType: 'hours', meter: 17890, serviceInterval: 500, nextService: 18000, status: 'breakdown' }),
      V({ id: 'v7', plateNo: '63320', plateCode: 'أ أ', plateType: 'مؤقت', type: 'شيول', make: 'كاتربيلر 950H', color: 'أصفر', year: 2023, chassis: 'CAT0950HJXJ01762',
        licenseFrom: off(-60), licenseTo: off(305), insFrom: off(-60), insTo: off(305), insType: 'شامل (Comprehensive)',
        meterType: 'hours', meter: 2140, serviceInterval: 500, nextService: 2500, status: 'active',
        assignment: { kind: 'rental', rentalType: 'monthly', projectId: 'p2', client: 'شركة الخليج للمقاولات', driverId: 'u8', rate: 3200, startDate: off(-50) } }),
      V({ id: 'v8', plateNo: '70145', plateCode: 'ع ه', plateType: 'تجاري', type: 'لوري', make: 'إيسوزو NPR', color: 'أزرق', year: 2021, chassis: 'JAANPR75HM7100453',
        licenseFrom: off(-280), licenseTo: off(85), insFrom: off(-340), insTo: off(25), insType: 'طرف ثالث (Third Party)',
        meterType: 'km', meter: 98000, serviceInterval: 10000, nextService: 100000, status: 'idle' }),
      V({ id: 'v9', plateNo: '35590', plateCode: 'ب ب', plateType: 'خصوصي', type: 'بيك أب', make: 'تويوتا هايلكس', color: 'فضي', year: 2022, chassis: 'MR0FA3CD200587341',
        licenseFrom: off(-30), licenseTo: off(335), insFrom: off(-30), insTo: off(335), insType: 'شامل (Comprehensive)',
        meterType: 'km', meter: 42150, serviceInterval: 5000, nextService: 45000, status: 'idle' }),
      V({ id: 'v10', plateNo: '27788', plateCode: 'س ع', plateType: 'أشغال عامة', type: 'بوب كات', make: 'بوبكات S650', color: 'أبيض', year: 2020, chassis: 'B3BN11542ALB0217',
        licenseFrom: off(-120), licenseTo: off(245), insFrom: off(-120), insTo: off(245), insType: 'طرف ثالث (Third Party)',
        meterType: 'hours', meter: 3980, serviceInterval: 250, nextService: 4000, status: 'maintenance' }),
    ];

    // ساعات تشغيل لآخر 35 يوماً للمعدات العاملة (الجمعة عطلة)
    const timesheets = [];
    const active = vehicles.filter((v) => v.assignment);
    for (let i = 35; i >= 1; i--) {
      const date = off(-i);
      const dow = new Date(date + 'T12:00:00').getDay();
      if (dow === 5) continue;
      active.forEach((v, k) => {
        const hours = 7 + ((i * 3 + k * 5) % 5); // 7 – 11
        const status = i <= 2 ? 'pending' : 'approved';
        timesheets.push({
          id: 'ts' + i + '_' + v.id,
          date,
          vehicleId: v.id,
          projectId: v.assignment.projectId,
          driverId: v.assignment.driverId,
          hours,
          km: v.meterType === 'km' ? 160 + ((i * 7 + k) % 9) * 12 : 0,
          notes: '',
          status,
          createdBy: v.assignment.driverId,
          approvedBy: status === 'approved' ? 'u3' : '',
          invoiceId: '',
        });
      });
    }

    const tasks = [
      { id: 't1', title: 'صيانة دورية 230,000 كم – تغيير زيوت وفلاتر', description: 'تغيير زيت المحرك، فلاتر الزيت والديزل والهواء، فحص الفرامل.', type: 'maintenance', mkind: 'preventive', vehicleId: 'v5', projectId: '', assigneeId: 'u9', priority: 'medium', status: 'progress', dueDate: off(1), createdBy: 'u2', createdAt: isoOff(-2), source: 'schedule', reportId: '' },
      { id: 't2', title: 'بلاغ عطل: تسريب زيت هيدروليك – حفارة 18663', description: 'تسريب زيت هيدروليك من الذراع الرئيسي، تم إيقاف الحفارة في الموقع.', type: 'maintenance', mkind: 'corrective', vehicleId: 'v6', projectId: 'p2', assigneeId: 'u10', priority: 'high', status: 'new', dueDate: off(0), createdBy: 'u6', createdAt: isoOff(-1, 7), source: 'field', reportId: 'r1' },
      { id: 't3', title: 'استبدال الإطارات الأمامية', description: 'تآكل شديد في الإطارات الأمامية.', type: 'maintenance', mkind: 'corrective', vehicleId: 'v10', projectId: '', assigneeId: 'u9', priority: 'medium', status: 'review', dueDate: off(-1), createdBy: 'u2', createdAt: isoOff(-4), source: '', reportId: '' },
      { id: 't4', title: 'نقل الشيول إلى موقع مشروع لوى', description: '', type: 'operation', mkind: '', vehicleId: 'v3', projectId: 'p3', assigneeId: 'u3', priority: 'low', status: 'done', dueDate: off(-28), createdBy: 'u2', createdAt: isoOff(-31), source: '', reportId: '' },
      { id: 't5', title: 'تجديد رخصة الشيول 11092', description: 'الرخصة تنتهي خلال أسبوعين، تجهيز الفحص الفني.', type: 'general', mkind: '', vehicleId: 'v3', projectId: '', assigneeId: 'u2', priority: 'high', status: 'new', dueDate: off(10), createdBy: 'u2', createdAt: isoOff(-1), source: '', reportId: '' },
      { id: 't6', title: 'تجديد وثيقة تأمين الحفارة 18663', description: '', type: 'general', mkind: '', vehicleId: 'v6', projectId: '', assigneeId: 'u2', priority: 'high', status: 'progress', dueDate: off(-1), createdBy: 'u2', createdAt: isoOff(-8), source: '', reportId: '' },
    ];

    const reports = [
      { id: 'r1', vehicleId: 'v6', by: 'u6', at: isoOff(-1, 7), kind: 'breakdown', severity: 'high', text: 'تسريب زيت هيدروليك من الذراع الرئيسي، تم إيقاف الحفارة في الموقع.', location: 'ميناء صحار – البوابة 3', photos: [], taskId: 't2' },
      { id: 'r2', vehicleId: 'v1', by: 'u5', at: isoOff(-2, 15), kind: 'note', severity: '', text: 'صوت بسيط في الفرامل عند التحميل الكامل، يرجى الفحص في الصيانة القادمة.', location: 'طريق صحار الصناعي', photos: [], taskId: '' },
    ];

    const activity = [
      { id: 'a1', at: isoOff(-1, 7), by: 'u6', text: 'بلاغ عطل للحفارة 18663 – تحويلها إلى «خارج الخدمة» وإنشاء مهمة صيانة' },
      { id: 'a2', at: isoOff(-2, 10), by: 'u2', text: 'فتح أمر صيانة دورية للقلاب 42007' },
      { id: 'a3', at: isoOff(-3, 16), by: 'u3', text: 'اعتماد ساعات تشغيل مشروع لوى' },
    ];

    return {
      version: 1,
      settings: {},
      users, projects, vehicles, timesheets, tasks, reports,
      invoices: [],
      opReports: {},
      activity,
      seq: { invoice: 0 },
    };
  }

  /* ---------------- واجهة التخزين ---------------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (db && Array.isArray(db.vehicles)) return normalize(db);
      }
    } catch (e) { console.warn('تعذر قراءة البيانات المحفوظة', e); }
    const db = seed();
    save(db);
    return db;
  }

  function normalize(db) {
    const base = seed();
    ['users', 'projects', 'vehicles', 'timesheets', 'tasks', 'reports', 'invoices', 'activity'].forEach((k) => { if (!Array.isArray(db[k])) db[k] = []; });
    db.settings = db.settings || {};
    db.opReports = db.opReports || {};
    db.seq = Object.assign({}, base.seq, db.seq || {});
    return db;
  }

  function save(db) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      return true;
    } catch (e) {
      console.error('تعذر حفظ البيانات', e);
      return false;
    }
  }

  function reset() { const db = seed(); save(db); return db; }
  function size() { try { return (localStorage.getItem(KEY) || '').length * 2; } catch (e) { return 0; } }

  function getSession() { try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; } }
  function setSession(id) { try { localStorage.setItem(SESSION_KEY, id); } catch (e) { /* ignore */ } }
  function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } }

  return { load, save, reset, size, normalize, fmtDate, getSession, setSession, clearSession };
})();
