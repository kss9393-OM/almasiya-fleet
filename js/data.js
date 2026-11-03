/* =========================================================================
   © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
   طبقة البيانات — محاكاة قاعدة البيانات عبر LocalStorage
   عند ربط النظام لاحقاً بخادم (API / Supabase / Firebase) يكفي استبدال
   الدوال load / save في هذا الملف دون المساس بالواجهة.
   ========================================================================= */

const Store = (function () {
  'use strict';

  const KEY = APP_CONFIG.storageKey;
  const SESSION_KEY = KEY + '_session';

  /* ---------------- تشفير كلمات المرور (SHA-256) ----------------
     تُخزَّن كلمات المرور كبصمة مشفرة مع ملح (Salt) عشوائي لكل مستخدم،
     ولا تُحفظ كلمة المرور نفسها أبداً. */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const ror = (x, n) => (x >>> n) | (x << (32 - n));
  function sha256(str) {
    const bytes = new TextEncoder().encode(String(str));
    const total = Math.ceil((bytes.length + 9) / 64) * 64;
    const m = new Uint8Array(total);
    m.set(bytes);
    m[bytes.length] = 0x80;
    const dv = new DataView(m.buffer);
    const bits = bytes.length * 8;
    dv.setUint32(total - 8, Math.floor(bits / 0x100000000));
    dv.setUint32(total - 4, bits >>> 0);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Uint32Array(64);
    for (let i = 0; i < total; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const x = W[t - 15], y = W[t - 2];
        W[t] = (W[t - 16] + (ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)) + W[t - 7] + (ror(y, 17) ^ ror(y, 19) ^ (y >>> 10))) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) >>> 0;
        const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, k) => { H[k] = (H[k] + v) >>> 0; });
    }
    return H.map((x) => x.toString(16).padStart(8, '0')).join('');
  }
  function newSalt() {
    const a = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  function hashPassword(password, salt) {
    let h = sha256(salt + ':' + password);
    for (let i = 0; i < 2000; i++) h = sha256(salt + h);
    return h;
  }
  /** يضبط كلمة مرور المستخدم (بصمة + ملح جديد) */
  function setPassword(user, password, mustChange) {
    user.salt = newSalt();
    user.passwordHash = hashPassword(password, user.salt);
    user.mustChange = !!mustChange;
    user.passwordChangedAt = new Date().toISOString();
  }
  function verifyPassword(user, password) {
    if (!user || !user.salt || !user.passwordHash) return false;
    return hashPassword(password, user.salt) === user.passwordHash;
  }

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
    users.forEach((u) => setPassword(u, APP_CONFIG.initialPassword, true));

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
      V({ id: 'v11', plateNo: '81204', plateCode: 'ك ه', plateType: 'خصوصي', type: 'صالون', make: 'تويوتا كامري', color: 'أبيض لؤلؤي', year: 2024, chassis: '4T1B11HK5RU093317',
        licenseFrom: off(-90), licenseTo: off(275), insFrom: off(-90), insTo: off(275), insType: 'شامل (Comprehensive)',
        meterType: 'km', meter: 18350, serviceInterval: 10000, nextService: 20000, status: 'idle', notes: 'سيارة الإدارة' }),
      V({ id: 'v12', plateNo: '46751', plateCode: 'د ر', plateType: 'خصوصي', type: 'دفع رباعي', make: 'تويوتا لاندكروزر', color: 'أبيض', year: 2023, chassis: 'JTMHV05J804218876',
        licenseFrom: off(-170), licenseTo: off(195), insFrom: off(-170), insTo: off(195), insType: 'شامل (Comprehensive)',
        meterType: 'km', meter: 61200, serviceInterval: 10000, nextService: 70000, status: 'idle', notes: 'مخصصة لزيارات المشرفين للمواقع' }),
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
    ['users', 'projects', 'vehicles', 'timesheets', 'tasks', 'reports', 'invoices', 'activity'].forEach((k) => { if (!Array.isArray(db[k])) db[k] = []; });
    // ترحيل البيانات القديمة: أي مستخدم بلا كلمة مرور يحصل على كلمة المرور الأولية مع إلزامه بتغييرها
    db.users.forEach((u) => { if (!u.passwordHash) setPassword(u, APP_CONFIG.initialPassword, true); });
    db.settings = db.settings || {};
    db.opReports = db.opReports || {};
    db.seq = Object.assign({ invoice: 0 }, db.seq || {});
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

  return { load, save, reset, size, normalize, fmtDate, getSession, setSession, clearSession, sha256, setPassword, verifyPassword };
})();
