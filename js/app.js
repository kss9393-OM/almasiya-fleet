/* =========================================================================
   © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
   نظام إدارة الأسطول والمعدات — منطق الواجهة (Vanilla JavaScript)
   الأقسام: أدوات مساعدة • الصلاحيات • التوجيه • الأقسام (Views) • الإجراءات
   ========================================================================= */
(function () {
  'use strict';

  /* =======================================================================
     1) أدوات مساعدة
     ======================================================================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const today = () => Store.fmtDate(new Date());
  const pad = (n) => String(n).padStart(2, '0');
  const parseDate = (s) => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const daysUntil = (s) => { const d = parseDate(s); if (!d || isNaN(d)) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d - t) / 86400000); };
  const fmtDate = (s) => { const d = parseDate(s); if (!d || isNaN(d)) return '—'; return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const fmtDateTime = (iso) => { const d = new Date(iso); if (isNaN(d)) return '—'; return `${fmtDate(Store.fmtDate(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const num = (n, dp = 0) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const money = (n) => `${num(n, 3)} ${APP_CONFIG.currency}`;
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const fmtMonth = (ym) => { const [y, m] = String(ym).split('-').map(Number); return `${MONTHS[m - 1] || ''} ${y}`; };
  const initials = (name) => String(name || '؟').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(' ');
  const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;

  /* =======================================================================
     2) الثوابت
     ======================================================================= */
  const STATUS = {
    active: { label: 'في العمل', en: 'Active' },
    idle: { label: 'شاغرة / جاهزة', en: 'Available' },
    maintenance: { label: 'في الصيانة', en: 'Maintenance' },
    breakdown: { label: 'خارج الخدمة / معطلة', en: 'Breakdown' },
  };
  const STATUS_ORDER = ['active', 'idle', 'maintenance', 'breakdown'];
  const TASK_STATUS = { new: 'جديدة', progress: 'قيد التنفيذ', review: 'بانتظار الاعتماد', done: 'مكتملة' };
  const TASK_ORDER = ['new', 'progress', 'review', 'done'];
  const TASK_TYPES = { maintenance: 'صيانة', operation: 'تشغيل', general: 'إدارية' };
  const MKIND = { preventive: 'صيانة دورية', corrective: 'إصلاح عطل' };
  const PRIORITY = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
  const ROLES = { developer: 'المطور', manager: 'مدير النظام', supervisor: 'مشرف', driver: 'سائق / مشغل', maintenance: 'فريق الصيانة' };
  const ROLE_ORDER = ['developer', 'manager', 'supervisor', 'driver', 'maintenance'];
  const RENTAL = { hourly: 'ساعي', daily: 'يومي', monthly: 'شهري' };
  const RENTAL_UNIT = { hourly: 'ساعة', daily: 'يوم', monthly: 'شهر' };
  const TS_STATUS = { pending: 'بانتظار الاعتماد', approved: 'معتمد', rejected: 'مرفوض' };
  const PROJECT_STATUS = { active: 'قيد التنفيذ', onhold: 'متوقف مؤقتاً', done: 'منتهي' };
  const SEVERITY = { high: 'شديد – توقف كامل', medium: 'متوسط', low: 'بسيط' };

  /* =======================================================================
     3) الأيقونات (SVG خطية)
     ======================================================================= */
  const ICON = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    truck: '<path d="M1 5h13v11H1z"/><path d="M14 9h4l4 4v3h-8z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    unlink: '<path d="M18.8 13.8l1.7-1.7a5 5 0 0 0-7-7L11.8 6.8M5.2 10.2L3.5 11.9a5 5 0 0 0 7 7l1.7-1.7M8 2v3M2 8h3M16 22v-3M22 16h-3"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>',
    chevR: '<path d="M9 18l6-6-6-6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    gauge: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.6 5.6 0 0 0 22 10c0-4.4-4.5-8-10-8z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
    code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    eyeOff: '<path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M1 1l22 22"/>',
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

  /* =======================================================================
     4) الحالة العامة
     ======================================================================= */
  let db = null;          // يُحمَّل من الخادم بعد تسجيل الدخول (Store.load)
  let me = null;
  let offlineMode = false;
  const ui = {
    route: '',
    fleet: { q: '', status: '', type: '', plateType: '' },
    ops: 'all',
    ts: 'pending',
    tasks: { mine: false, type: '' },
    field: '',
    maint: 'open',
    invMonth: (() => { const d = new Date(); if (d.getDate() <= 10) d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; })(),
    pendingPhotos: [],
    pendingLogo: null,
  };

  /* ---------- الوصول للبيانات ---------- */
  const userById = (id) => db.users.find((u) => u.id === id);
  const vehById = (id) => db.vehicles.find((v) => v.id === id);
  const projById = (id) => db.projects.find((p) => p.id === id);
  const uName = (id) => userById(id)?.name || '—';
  const pName = (id) => projById(id)?.name || '—';
  const vShort = (v) => (v ? `${v.type} ${v.plateNo}` : 'معدة محذوفة');
  const vLabel = (v) => (v ? `${v.type} • ${v.plateNo} ${v.plateCode || ''}` : 'معدة محذوفة');
  const usersByRole = (role) => db.users.filter((u) => u.role === role && u.active !== false);
  const countStatus = (list) => STATUS_ORDER.reduce((o, s) => { o[s] = list.filter((v) => v.status === s).length; return o; }, {});

  /* ---------- الإعدادات والهوية ---------- */
  function S() {
    const s = (db && db.settings) || {};
    return {
      systemName: I18N.lang === 'en' ? (s.systemNameEn || APP_CONFIG.systemNameEn || s.systemName || APP_CONFIG.systemName) : (s.systemName || APP_CONFIG.systemName),
      systemNameAr: s.systemName || APP_CONFIG.systemName,
      systemNameEn: s.systemNameEn || APP_CONFIG.systemNameEn || '',
      companyName: s.companyName || APP_CONFIG.companyName,
      companyNameEn: s.companyNameEn || APP_CONFIG.companyNameEn,
      logo: s.logo || APP_CONFIG.logo,
      theme: Object.assign({}, APP_CONFIG.theme, s.theme || {}),
      alertDays: Number(s.alertDays ?? APP_CONFIG.alertDays),
      maintenanceThreshold: Object.assign({}, APP_CONFIG.maintenanceThreshold, s.maintenanceThreshold || {}),
    };
  }
  function applyTheme(theme) {
    const r = document.documentElement.style;
    r.setProperty('--primary', theme.primary);
    r.setProperty('--accent', theme.accent);
    r.setProperty('--sidebar', theme.sidebar);
  }
  function applyBranding() {
    const s = S();
    applyTheme(s.theme);
    document.title = I18N.tr(`${s.systemName} | ${I18N.lang === 'en' && s.companyNameEn ? s.companyNameEn : s.companyName}`);
    $('#brandSystem').textContent = s.systemName;
    $('#brandCompany').textContent = I18N.lang === 'en' && s.companyNameEn ? s.companyNameEn : s.companyName;
    $('#brandLogo').src = s.logo;
    $('#favicon').href = s.logo;
    $('#appVersion').textContent = `الإصدار ${APP_CONFIG.version}`;
    $('#copyrightLine').textContent = copyrightText();
    $('#langBtn').innerHTML = langBtnLabel();
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = s.theme.sidebar;
  }

  /* =======================================================================
     5) الصلاحيات
     ======================================================================= */
  const PERMS = {
    'vehicle.edit': ['developer', 'manager'],
    'vehicle.status': ['developer', 'manager', 'maintenance'],
    'assign': ['developer', 'manager'],
    'timesheet.add': ['developer', 'manager', 'supervisor', 'driver'],
    'timesheet.approve': ['developer', 'manager', 'supervisor'],
    'task.create': ['developer', 'manager', 'supervisor', 'maintenance'],
    'task.approve': ['developer', 'manager', 'supervisor'],
    'project.edit': ['developer', 'manager'],
    'user.edit': ['developer', 'manager'],
    'invoice': ['developer', 'manager'],
    'settings': ['developer'],
  };
  const can = (p) => !!me && (PERMS[p] || []).includes(me.role);

  function tsInScope(t) {
    if (!me) return false;
    if (me.role === 'driver') return t.driverId === me.id || t.createdBy === me.id;
    if (me.role === 'supervisor') { const p = projById(t.projectId); return (p && p.supervisorId === me.id) || t.createdBy === me.id; }
    return true;
  }
  function canApproveTs(t) {
    if (!can('timesheet.approve') || t.status !== 'pending') return false;
    if (me.role === 'supervisor') { const p = projById(t.projectId); return !!p && p.supervisorId === me.id; }
    return true;
  }

  /* =======================================================================
     6) التنبيهات والصيانة
     ======================================================================= */
  function maintState(v) {
    const unit = v.meterType === 'km' ? 'كم' : 'ساعة';
    const remaining = Number(v.nextService || 0) - Number(v.meter || 0);
    const th = Number(S().maintenanceThreshold[v.meterType === 'km' ? 'km' : 'hours'] || 0);
    const state = !v.nextService ? 'ok' : remaining <= 0 ? 'overdue' : remaining <= th ? 'soon' : 'ok';
    const interval = Number(v.serviceInterval || 0);
    const pct = interval ? Math.min(100, Math.max(0, 100 - (remaining / interval) * 100)) : 0;
    return { unit, remaining, state, pct };
  }

  function getAlerts() {
    const s = S();
    const out = [];
    db.vehicles.forEach((v) => {
      [['licenseTo', 'رخصة المركبة', 'license'], ['insTo', 'وثيقة التأمين', 'insurance']].forEach(([f, label, kind]) => {
        const d = daysUntil(v[f]);
        if (d === null) return;
        if (d < 0) out.push({ level: 'danger', kind, vId: v.id, text: `انتهت ${label} منذ ${plural(-d, 'يوم', 'يوماً')}`, sort: d });
        else if (d <= s.alertDays) out.push({ level: 'warning', kind, vId: v.id, text: d === 0 ? `${label} تنتهي اليوم` : `${label} تنتهي خلال ${plural(d, 'يوم', 'يوماً')} (${fmtDate(v[f])})`, sort: d });
      });
      const m = maintState(v);
      if (m.state === 'overdue') out.push({ level: 'danger', kind: 'maintenance', vId: v.id, text: `الصيانة الدورية متأخرة بـ ${num(-m.remaining)} ${m.unit}`, sort: -500 });
      else if (m.state === 'soon') out.push({ level: 'warning', kind: 'maintenance', vId: v.id, text: `الصيانة الدورية مستحقة بعد ${num(m.remaining)} ${m.unit}`, sort: 5 });
    });
    return out.sort((a, b) => (a.level === b.level ? a.sort - b.sort : a.level === 'danger' ? -1 : 1));
  }

  /* =======================================================================
     7) الحفظ وسجل النشاط والإشعارات
     ======================================================================= */
  function log(text) {
    db.activity.unshift({ id: uid('a'), at: new Date().toISOString(), by: me ? me.id : '', text });
  }
  /** حفظ التعديلات: تُعرض فوراً، وتُرسل للخادم في الخلفية */
  function commit(msg) {
    if (msg) log(msg);
    render();
    return Store.save().then((r) => {
      if (r.ok) return r;
      if (r.error === 'NETWORK') toast('لا يوجد اتصال بالإنترنت — سيُحفظ التعديل تلقائياً عند عودة الاتصال', 'warn');
      else if (r.error === 'PERMISSION') toast('لا تملك صلاحية هذا الإجراء — تم التراجع عنه', 'error');
      else toast('تعذّر الحفظ على الخادم: ' + r.error, 'error');
      return r;
    });
  }
  function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    $('#toast-root').appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 3600);
  }

  /* =======================================================================
     8) عناصر واجهة مشتركة
     ======================================================================= */
  const statusBadge = (s) => `<span class="badge st-${s}"><i class="dot"></i>${STATUS[s]?.label || s}</span>`;
  // لون اللوحة حسب نوعها (من APP_CONFIG.plateColors): خصوصي أصفر • تجاري أحمر • مؤقت أسود
  const plateStyle = (type) => { const c = (APP_CONFIG.plateColors || {})[type] || { bg: '#ffffff', fg: '#111111' }; return `--pbg:${c.bg};--pfg:${c.fg}`; };
  const plate = (v, size = '') => v ? `<span class="plate ${size}" data-raw style="${plateStyle(v.plateType)}" title="لوحة ${esc(v.plateType)}"><span class="p-no">${esc(v.plateNo)}</span>${v.plateCode ? `<span class="p-code">${esc(v.plateCode)}</span>` : ''}</span>` : '<span class="muted">—</span>';
  const avatar = (u, extra = '') => `<span class="avatar r-${u ? u.role : ''} ${extra}" data-raw title="${esc(u ? u.name : '')}">${esc(initials(u ? u.name : '؟'))}</span>`;
  const ibtn = (ic, action, id, title, cls = '') => `<button class="ibtn ${cls}" data-action="${action}" data-id="${esc(id)}" title="${esc(title)}" aria-label="${esc(title)}">${icon(ic)}</button>`;
  const empty = (msg, ic = 'search') => `<div class="empty">${icon(ic)}<div>${msg}</div></div>`;
  const field = (label, input, cls = '') => `<label class="field ${cls}"><span>${label}</span>${input}</label>`;
  const opts = (list, sel, emptyLabel) => (emptyLabel !== undefined ? `<option value="">${esc(emptyLabel)}</option>` : '') +
    list.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(sel ?? '') ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
  const optsArr = (arr) => arr.map((x) => ({ value: x, label: x }));
  const optsMap = (map) => Object.keys(map).map((k) => ({ value: k, label: map[k] }));
  const vehicleOpts = (list = db.vehicles) => list.map((v) => ({ value: v.id, label: `${v.type} – ${v.plateNo} ${v.plateCode || ''}` }));
  const userOpts = (list) => list.map((u) => ({ value: u.id, label: u.name }));

  function validity(date) {
    const d = daysUntil(date);
    if (d === null) return '<span class="muted">—</span>';
    const cls = d < 0 ? 'bad' : d <= S().alertDays ? 'warn' : 'ok';
    const txt = d < 0 ? `منتهية منذ ${plural(-d, 'يوم', 'يوماً')}` : d === 0 ? 'تنتهي اليوم' : `متبقي ${plural(d, 'يوم', 'يوماً')}`;
    return `<span class="validity ${cls}">${fmtDate(date)}<small>${txt}</small></span>`;
  }

  /** هل التشغيل بسائق من الشركة؟ (الإيجار قد يكون بدون سائق: يشغّلها العميل) */
  const hasDriver = (a) => !!a && (a.kind === 'internal' || a.withDriver !== false);
  function driverText(a) {
    if (!a) return '—';
    if (!hasDriver(a)) return 'بدون سائق' + (a.operatorName ? ` – مشغّل العميل: ${a.operatorName}` : '');
    return uName(a.driverId);
  }
  const noDriverBadge = (a) => (a && !hasDriver(a) ? ' <span class="badge b-neutral">بدون سائق</span>' : '');

  function assignText(v, compact) {
    const a = v.assignment;
    if (!a) return '<span class="muted">غير مرتبطة بمشروع</span>';
    const kind = (a.kind === 'internal' ? '<span class="badge b-primary">مشروع داخلي</span>' : `<span class="badge b-accent">إيجار ${RENTAL[a.rentalType] || ''}</span>`) + noDriverBadge(a);
    const who = a.kind === 'internal' ? pName(a.projectId) : (a.client || projById(a.projectId)?.client || pName(a.projectId));
    if (compact) return `${kind} <span class="cell-sub">${esc(who)}</span>`;
    return `<div>${kind}</div><div class="cell-title" style="margin-top:4px">${esc(who)}</div><div class="cell-sub">${a.kind === 'internal' ? '' : esc(pName(a.projectId)) + ' • '}${hasDriver(a) ? 'السائق: ' : ''}${esc(driverText(a))}</div>`;
  }

  const statusSelect = (v) => `<select class="status-select st-${v.status}" data-change="vehicle-status" data-id="${v.id}" aria-label="حالة المعدة">${STATUS_ORDER.map((s) => `<option value="${s}" ${s === v.status ? 'selected' : ''}>${STATUS[s].label}</option>`).join('')}</select>`;

  function alertList(alerts) {
    if (!alerts.length) return empty('لا توجد تنبيهات حالياً – جميع الرخص والصيانات ضمن المدة', 'check');
    const ic = { license: 'file', insurance: 'shield', maintenance: 'wrench' };
    return `<ul class="list">${alerts.map((a) => {
      const v = vehById(a.vId);
      return `<li><span class="alert-ic ${a.level}">${icon(ic[a.kind] || 'alert')}</span>
        <div class="grow"><div class="title">${esc(a.text)}</div><div class="meta">${esc(vLabel(v))}</div></div>
        <button class="btn btn-ghost btn-sm" data-action="view-vehicle" data-id="${a.vId}">عرض</button></li>`;
    }).join('')}</ul>`;
  }

  /* =======================================================================
     9) النوافذ المنبثقة (Modals)
     ======================================================================= */
  let modalCb = null;
  let modalLocked = false; // نافذة إلزامية لا تُغلق إلا بإتمام الإجراء (مثل تغيير كلمة المرور الأولية)
  function openModal({ title, body, submit = 'حفظ', onSubmit = null, size = '', footer = '', danger = false, printable = false, locked = false }) {
    $('#modal-root').innerHTML = `
      <div class="modal-backdrop" data-action="modal-bg">
        <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <form id="modalForm">
            <header class="modal-head"><h3>${title}</h3>${locked ? '' : `<button type="button" class="icon-btn" data-action="close-modal" aria-label="إغلاق">${icon('x')}</button>`}</header>
            <div class="modal-body ${printable ? 'print-area' : ''}">${body}</div>
            <footer class="modal-foot">
              ${onSubmit ? `<button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-primary'}">${submit}</button>` : ''}
              ${locked ? '' : `<button type="button" class="btn btn-ghost" data-action="close-modal">${onSubmit ? 'إلغاء' : 'إغلاق'}</button>`}
              ${footer ? `<span class="spacer"></span>${footer}` : ''}
            </footer>
          </form>
        </div>
      </div>`;
    modalCb = onSubmit;
    modalLocked = locked;
    document.body.classList.add('modal-open');
    const first = $('#modal-root .modal-body input:not([type=hidden]):not([type=file]), #modal-root .modal-body select, #modal-root .modal-body textarea');
    if (first && onSubmit) setTimeout(() => first.focus(), 30);
  }
  function closeModal() {
    $('#modal-root').innerHTML = '';
    modalCb = null;
    modalLocked = false;
    document.body.classList.remove('modal-open');
  }
  function confirmBox(msg, onYes, yes = 'تأكيد', danger = true) {
    openModal({ title: 'تأكيد الإجراء', body: `<p class="confirm-msg">${msg}</p>`, submit: yes, danger, onSubmit: () => { onYes(); } });
  }
  const formData = (form) => {
    const o = {};
    new FormData(form).forEach((val, key) => { o[key] = typeof val === 'string' ? val.trim() : val; });
    return o;
  };

  function readImage(file, max = 900) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const sc = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * sc);
          c.height = Math.round(img.height * sc);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(file.type === 'image/png' && max <= 300 ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject;
        img.src = fr.result;
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  /* =======================================================================
     10) التوجيه (Routing) والهيكل
     ======================================================================= */
  const ALL = ['developer', 'manager', 'supervisor', 'driver', 'maintenance'];
  const PAGES = {
    dashboard: { short: 'الرئيسية', title: 'لوحة التحكم', sub: 'نظرة شاملة على حالة الأسطول والتنبيهات', icon: 'grid', roles: ['developer', 'manager', 'supervisor', 'maintenance'], view: viewDashboard },
    mywork: { short: 'مركبتي', title: 'مركبتي ومهامي', sub: 'المعدة المسندة إليك، تسجيل الساعات والإبلاغ عن الأعطال', icon: 'truck', roles: ['driver'], view: viewMyWork },
    fleet: { short: 'الأسطول', title: 'الأسطول والمعدات', sub: 'بطاقات تعريف المركبات والمعدات وحالتها', icon: 'truck', roles: ['developer', 'manager', 'supervisor', 'maintenance'], view: viewFleet },
    operations: { title: 'التشغيل والإيجار', sub: 'ربط المعدات بالمشاريع الداخلية أو عقود الإيجار (ساعي، يومي، شهري)', icon: 'briefcase', roles: ['developer', 'manager'], view: viewOperations },
    timesheets: { short: 'الساعات', title: 'ساعات التشغيل', sub: 'تسجيل واعتماد ساعات التشغيل اليومية (Timesheets)', icon: 'clock', roles: ['developer', 'manager', 'supervisor', 'driver'], view: viewTimesheets },
    maintenance: { short: 'الصيانة', title: 'الصيانة وأوامر العمل', sub: 'أوامر العمل وجدول الصيانة الدورية حسب الساعات والكيلومترات', icon: 'wrench', roles: ['developer', 'manager', 'maintenance'], view: viewMaintenance },
    field: { short: 'الميدان', title: 'ملاحظات الميدان', sub: 'ملاحظات وصور الأعطال المرفوعة من السائقين والمشغلين', icon: 'camera', roles: ALL, view: viewField },
    tasks: { short: 'المهام', title: 'متابعة المهام', sub: 'جديدة • قيد التنفيذ • بانتظار الاعتماد • مكتملة', icon: 'check', roles: ['developer', 'manager', 'supervisor', 'maintenance'], view: viewTasks },
    projects: { title: 'المشاريع والمشرفون', sub: 'إدارة المشاريع وتوزيعها على المشرفين', icon: 'folder', roles: ['developer', 'manager'], view: viewProjects },
    invoices: { title: 'الفواتير وتقارير التشغيل', sub: 'تقارير التشغيل الشهرية وإصدار واعتماد فواتير الإيجار', icon: 'file', roles: ['developer', 'manager'], view: viewInvoices },
    users: { title: 'المستخدمون والصلاحيات', sub: 'إضافة المستخدمين وتحديد أدوارهم', icon: 'users', roles: ['developer', 'manager'], view: viewUsers },
    settings: { title: 'إعدادات المطور', sub: 'الهوية البصرية، إعدادات النظام، والنسخ الاحتياطي', icon: 'settings', roles: ['developer'], view: viewSettings },
    about: { short: 'حول', title: 'حول البرنامج', sub: 'معلومات البرنامج والإصدار والمطور', icon: 'info', roles: ALL, view: viewAbout },
  };
  const NAV_GROUPS = [
    ['الرئيسية', ['dashboard', 'mywork']],
    ['التشغيل', ['fleet', 'operations', 'timesheets', 'field']],
    ['الصيانة والمهام', ['maintenance', 'tasks']],
    ['الإدارة', ['projects', 'invoices', 'users', 'settings']],
    ['المساعدة', ['about']],
  ];

  const currentRoute = () => (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  function go(r) { if (currentRoute() === r) render(); else location.hash = '#/' + r; }

  function navBadge(r) {
    if (r === 'timesheets' && can('timesheet.approve')) return db.timesheets.filter((t) => canApproveTs(t)).length;
    if (r === 'maintenance') return db.tasks.filter((t) => t.type === 'maintenance' && t.status === 'new').length;
    if (r === 'tasks') return db.tasks.filter((t) => t.status === 'review').length;
    return 0;
  }

  function renderShell(route) {
    const nav = NAV_GROUPS.map(([label, keys]) => {
      const items = keys.filter((k) => PAGES[k].roles.includes(me.role));
      if (!items.length) return '';
      return `<div class="nav-label">${label}</div>` + items.map((k) => {
        const n = navBadge(k);
        return `<a href="#/${k}" class="${k === route ? 'on' : ''}" data-action="nav">${icon(PAGES[k].icon)}<span>${PAGES[k].title}</span>${n ? `<span class="count">${n}</span>` : ''}</a>`;
      }).join('');
    }).join('');
    $('#nav').innerHTML = nav;
    $('#pageTitle').textContent = PAGES[route].title;
    $('#pageSub').textContent = PAGES[route].sub;
    const d = new Date();
    $('#todayLabel').textContent = `${DAYS[d.getDay()]} ${fmtDate(today())}`;
    const alertsN = getAlerts().length;
    $('#alertsBtn').innerHTML = icon('bell') + (alertsN ? `<span class="pill">${alertsN}</span>` : '');
    $('#userChip').innerHTML = `<div class="who"><b>${esc(me.name)}</b><small>${ROLES[me.role]}</small></div>${avatar(me)}`;
    $('#logoutBtn').innerHTML = icon('logout');
    renderSync();
    $('#pwBtn').innerHTML = icon('key');
    $('.menu-btn').innerHTML = icon('menu');

    // شريط التنقل السفلي (للجوال) — أهم الأقسام لكل دور + «المزيد» لفتح القائمة الكاملة
    const allowed = Object.keys(PAGES).filter((k) => PAGES[k].roles.includes(me.role));
    const primary = (BOTTOM_NAV[me.role] || allowed).filter((k) => allowed.includes(k)).slice(0, 4);
    const more = true; // «المزيد» يفتح القائمة الكاملة وبطاقة الحساب (اللغة، كلمة المرور، الخروج)
    $('#bottomNav').innerHTML = primary.map((k) => {
      const n = navBadge(k);
      return `<a href="#/${k}" class="${k === route ? 'on' : ''}" data-action="nav">${icon(PAGES[k].icon)}<span>${PAGES[k].short || PAGES[k].title}</span>${n ? `<i class="nb">${n}</i>` : ''}</a>`;
    }).join('') + (more ? `<button type="button" class="${primary.includes(route) ? '' : 'on'}" data-action="open-sidebar">${icon('menu')}<span>المزيد</span></button>` : '');

    // بطاقة الحساب داخل القائمة الجانبية (تظهر في الجوال)
    $('#sidebarAccount').innerHTML = `
      <div class="acc-user">${avatar(me)}<div><b>${esc(me.name)}</b><small>${ROLES[me.role]}</small></div></div>
      <div class="acc-actions">
        <button type="button" data-action="lang-toggle">${icon('globe')}<span>${I18N.lang === 'en' ? 'عربي' : 'English'}</span></button>
        <button type="button" data-action="change-password">${icon('key')}<span>كلمة المرور</span></button>
        <button type="button" data-action="logout" class="danger">${icon('logout')}<span>خروج</span></button>
      </div>`;
  }

  /* شريط التنقل السفلي في الجوال: الأقسام الأكثر استخداماً لكل دور */
  const BOTTOM_NAV = {
    developer: ['dashboard', 'fleet', 'tasks', 'timesheets'],
    manager: ['dashboard', 'fleet', 'tasks', 'timesheets'],
    supervisor: ['dashboard', 'timesheets', 'tasks', 'field'],
    driver: ['mywork', 'timesheets', 'field'],
    maintenance: ['dashboard', 'maintenance', 'tasks', 'field'],
  };

  function render() {
    applyBranding();
    if (db && db.about) cacheAbout(db.about);
    if (!me || !db) { setBars('DARK'); showLogin(); return; }
    setBars('LIGHT');
    $('#login-screen').classList.add('hidden');
    $('#app').classList.remove('hidden');
    const allowed = Object.keys(PAGES).filter((k) => PAGES[k].roles.includes(me.role));
    let r = currentRoute();
    if (!allowed.includes(r)) { r = allowed[0]; history.replaceState(null, '', '#/' + r); }
    if (ui.route !== r) { ui.route = r; window.scrollTo(0, 0); }
    renderShell(r);
    $('#view').innerHTML = PAGES[r].view();
    closeSidebar();
  }

  function openSidebar() { $('#sidebar').classList.add('open'); $('#backdrop').classList.add('on'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('on'); }

  /* =======================================================================
     11) شاشة الدخول
     ======================================================================= */
  function showLogin() {
    const s = S();
    $('#app').classList.add('hidden');
    const el = $('#login-screen');
    el.classList.remove('hidden');
    setTimeout(() => { const f = $(ui.loginUser ? '#login-screen input[name=password]' : '#login-screen input[name=username]'); if (f) f.focus(); }, 30);
    el.innerHTML = `
      <section class="login-side">
        <div class="brand-big"><img src="${esc(s.logo)}" alt="الشعار"><div><strong style="font-size:18px">${esc(I18N.lang === 'en' ? s.companyNameEn || s.companyName : s.companyName)}</strong>${I18N.lang === 'en' ? '' : `<div style="color:rgba(255,255,255,.65);font-size:13px">${esc(s.companyNameEn)}</div>`}</div></div>
        <div>
          <h1>${esc(s.systemName)}</h1>
          <p>لوحة تحكم مركزية لمتابعة حالة الشاحنات والمعدات، التراخيص والتأمين، الصيانة، عقود التشغيل والإيجار، والمهام اليومية.</p>
          <ul>
            <li><i class="dot" style="background:var(--st-active)"></i>في العمل – مرتبطة بمشروع أو عقد إيجار</li>
            <li><i class="dot" style="background:var(--st-idle)"></i>شاغرة / جاهزة للتشغيل</li>
            <li><i class="dot" style="background:var(--st-maintenance)"></i>في الصيانة الدورية أو الإصلاح</li>
            <li><i class="dot" style="background:var(--st-breakdown)"></i>خارج الخدمة / معطلة</li>
          </ul>
        </div>
        <small style="color:rgba(255,255,255,.5);position:relative;z-index:1">${esc(s.companyName)}</small>
      </section>
      <section class="login-main">
        <form class="login-card" data-form="login" autocomplete="on" novalidate>
          <h2>تسجيل الدخول</h2>
          <p class="muted">أدخل اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم.</p>
          <div class="login-error ${ui.loginError ? '' : 'hidden'}" id="loginError" role="alert">${icon('alert')}<span>${esc(ui.loginError || '')}</span></div>
          <label class="field"><span>اسم المستخدم</span>
            <div class="input-ic">${icon('users')}<input name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required dir="ltr" value="${esc(ui.loginUser || '')}" placeholder="username"></div>
          </label>
          <label class="field"><span>كلمة المرور</span>
            <div class="input-ic">${icon('lock')}<input name="password" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required dir="ltr" placeholder="••••••••">
              <button type="button" class="pw-toggle" data-action="pw-toggle" aria-label="إظهار كلمة المرور" title="إظهار / إخفاء">${icon('eye')}</button></div>
          </label>
          <button type="submit" class="btn btn-primary btn-block" id="loginBtn">${icon('logout', 'flip')} دخول</button>
          <p class="muted login-help">نسيت كلمة المرور؟ تواصل مع مدير النظام لإعادة تعيينها.</p>
          <button type="button" class="btn-link login-about" data-action="about-open">${icon('info')} حول البرنامج والمطور</button>
        </form>
        <footer class="login-copy">${esc(copyrightText())}</footer>
        <button type="button" class="lang-btn login-lang" data-action="lang-toggle">${langBtnLabel()}</button>
      </section>`;
  }

  /* ---------- منصة أندرويد (Capacitor) ---------- */
  const NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  const NP = NATIVE ? (window.Capacitor.Plugins || {}) : {};
  if (NATIVE) document.documentElement.classList.add('native');
  let barStyle = '';
  function setBars(style) {
    if (!NATIVE || !NP.SystemBars || barStyle === style) return;
    barStyle = style;
    NP.SystemBars.setStyle({ style }).catch(() => {});
  }

  /** حفظ ملف: في التطبيق يُشارك عبر قائمة المشاركة في أندرويد، وفي المتصفح يُنزَّل مباشرة */
  async function saveFile(name, text, mime) {
    if (NATIVE && NP.Filesystem && NP.Share) {
      try {
        const r = await NP.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
        await NP.Share.share({ title: name, url: r.uri, dialogTitle: name });
        return true;
      } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast('تعذّر حفظ الملف', 'error'); return false; }
    }
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return true;
  }

  /** يضيف عنوان كل عمود لخلاياه (data-label) لتُعرض الجداول كبطاقات على شاشة الجوال */
  function labelTables(root) {
    if (!root || root.nodeType !== 1) return;
    const tables = root.matches && root.matches('table.table') ? [root] : root.querySelectorAll('table.table');
    tables.forEach((t) => {
      const heads = Array.from(t.querySelectorAll('thead th')).map((th) => th.textContent.trim());
      t.querySelectorAll('tbody tr, tfoot tr').forEach((tr) => {
        let i = 0;
        Array.from(tr.children).forEach((td) => {
          const span = Number(td.getAttribute('colspan') || 1);
          if (!td.hasAttribute('data-label')) td.setAttribute('data-label', heads[i] || '');
          i += span;
        });
      });
    });
  }
  new MutationObserver((recs) => recs.forEach((r) => r.addedNodes.forEach(labelTables))).observe(document.body, { childList: true, subtree: true });

  /* ---------- اللغة والحقوق ---------- */
  function copyrightText() {
    const y = new Date().getFullYear();
    return I18N.lang === 'en'
      ? `© ${y} All rights reserved — ${APP_CONFIG.copyrightHolderEn || APP_CONFIG.copyrightHolder}`
      : `© ${y} جميع الحقوق محفوظة لـ ${APP_CONFIG.copyrightHolder}`;
  }
  const langBtnLabel = () => `${icon('globe')}<span>${I18N.lang === 'en' ? 'عربي' : 'English'}</span>`;

  /* ---------- تسجيل الدخول وكلمات المرور ---------- */
  const LOCK_KEY = APP_CONFIG.storageKey + '_lock';
  function getLocks() { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || '{}'); } catch (e) { return {}; } }
  function setLocks(l) { try { localStorage.setItem(LOCK_KEY, JSON.stringify(l)); } catch (e) { /* ignore */ } }

  function loginFail(msg, username) {
    ui.loginError = msg;
    ui.loginUser = username;
    const box = $('#loginError');
    if (box) { box.classList.remove('hidden'); box.querySelector('span').textContent = msg; }
    const pw = $('#login-screen input[name=password]');
    if (pw) { pw.value = ''; pw.focus(); }
  }

  async function doLogin(form) {
    const d = formData(form);
    d.username = Store.normalizeCred(d.username);
    const uname = d.username.toLowerCase();
    if (!uname || !d.password) { loginFail('أدخل اسم المستخدم وكلمة المرور', d.username); return; }
    // لوحة المفاتيح على العربية: أسماء المستخدمين وكلمات المرور بالأحرف الإنجليزية
    if (/[\u0621-\u064A]/.test(d.username) || /[\u0621-\u064A]/.test(d.password)) {
      loginFail('لوحة المفاتيح على اللغة العربية — بدّلها إلى الإنجليزية ثم أعد كتابة اسم المستخدم وكلمة المرور', d.username);
      return;
    }
    const locks = getLocks();
    const lk = locks[uname] || { count: 0, until: 0 };
    if (lk.until > Date.now()) {
      loginFail(`تم إيقاف المحاولات مؤقتاً بسبب تكرار الأخطاء. حاول بعد ${Math.ceil((lk.until - Date.now()) / 1000)} ثانية.`, d.username);
      return;
    }
    const btn = $('#loginBtn');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span> جارٍ الدخول…'; }
    const restore = () => { const b = $('#loginBtn'); if (b) { b.disabled = false; if (b.dataset.label) b.innerHTML = b.dataset.label; } };
    try {
      await Store.signIn(uname, d.password);
    } catch (e) {
      restore();
      const m = String(e && e.message || '');
      if (/fetch|network/i.test(m)) { loginFail('تعذّر الاتصال بالخادم — تحقق من اتصال الإنترنت', d.username); return; }
      lk.count = (lk.count || 0) + 1;
      if (lk.count >= APP_CONFIG.maxLoginAttempts) { lk.until = Date.now() + APP_CONFIG.lockoutSeconds * 1000; lk.count = 0; }
      locks[uname] = lk;
      setLocks(locks);
      const left = APP_CONFIG.maxLoginAttempts - lk.count;
      loginFail(lk.until > Date.now()
        ? `تم إيقاف المحاولات لمدة ${APP_CONFIG.lockoutSeconds} ثانية بسبب تكرار الأخطاء.`
        : `اسم المستخدم أو كلمة المرور غير صحيحة${left <= 2 ? ` (متبقي ${left} ${left === 1 ? 'محاولة' : 'محاولات'})` : ''}`, d.username);
      return;
    }
    delete locks[uname];
    setLocks(locks);
    const ok = await startSession(true);
    restore();
    if (!ok) return;
    ui.loginError = '';
    ui.loginUser = '';
    if (me.mustChange) openChangePassword(true);
    else toast(`مرحباً ${me.name}`, 'info');
  }

  /** بعد تسجيل الدخول أو عند فتح التطبيق بجلسة محفوظة: تحميل البيانات وتحديد المستخدم */
  async function startSession(fresh) {
    let res;
    try {
      res = await Store.load();
    } catch (e) {
      await Store.signOut();
      loginFail('تعذّر تحميل البيانات من الخادم — حاول مرة أخرى', ui.loginUser || '');
      showLogin();
      return false;
    }
    db = res.db;
    offlineMode = res.offline;
    const session = await Store.getSession();
    const u = session && db.users.find((x) => x.authId === session.user.id);
    if (!u || u.active === false) {
      await Store.signOut();
      db = null; me = null;
      ui.loginError = u ? 'هذا الحساب موقوف. تواصل مع مدير النظام.' : 'هذا الحساب غير مسجل في النظام. تواصل مع مدير النظام.';
      render();
      return false;
    }
    me = u;
    if (fresh) {
      ui.route = '';
      history.replaceState(null, '', location.pathname + location.search);
      Store.touchLogin().catch(() => {});
      log(`تسجيل دخول ${u.name}`);
      Store.save();
    }
    Store.subscribe();
    render();
    if (offlineMode) toast('أنت غير متصل — تُعرض آخر بيانات محفوظة، وستُرسل تعديلاتك عند عودة الاتصال', 'warn');
    return true;
  }

  function passwordProblem(pw) {
    const min = APP_CONFIG.minPasswordLength;
    if (!pw || pw.length < min) return `كلمة المرور يجب ألا تقل عن ${min} أحرف`;
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'كلمة المرور يجب أن تحتوي على حروف إنجليزية وأرقام';
    return '';
  }
  const pwInput = (name, label, auto = 'new-password', extra = '') => field(label,
    `<div class="input-ic">${icon('lock')}<input name="${name}" type="password" autocomplete="${auto}" autocapitalize="none" autocorrect="off" spellcheck="false" dir="ltr" ${extra}><button type="button" class="pw-toggle" data-action="pw-toggle" aria-label="إظهار">${icon('eye')}</button></div>`);

  function openChangePassword(forced) {
    openModal({
      title: forced ? 'تغيير كلمة المرور الأولية' : 'تغيير كلمة المرور',
      submit: 'حفظ كلمة المرور',
      locked: forced,
      footer: forced ? `<button type="button" class="btn btn-ghost" data-action="logout">${icon('logout')} خروج</button>` : '',
      body: `${forced ? `<div class="notice">${icon('shield')}<span>لحماية حسابك، يجب تعيين كلمة مرور جديدة خاصة بك قبل المتابعة.</span></div>` : ''}
        <div class="form-grid" style="grid-template-columns:1fr">
          ${pwInput('current', 'كلمة المرور الحالية', 'current-password', 'required')}
          ${pwInput('next', 'كلمة المرور الجديدة', 'new-password', 'required')}
          ${pwInput('confirm', 'تأكيد كلمة المرور الجديدة', 'new-password', 'required')}
          <p class="cell-sub">${APP_CONFIG.minPasswordLength} أحرف على الأقل، وتحتوي على حروف وأرقام.</p>
        </div>`,
      onSubmit: async (d) => {
        ['current', 'next', 'confirm'].forEach((k) => { d[k] = Store.normalizeCred(d[k]); });
        const p = passwordProblem(d.next);
        if (p) { toast(p, 'error'); return false; }
        if (d.next !== d.confirm) { toast('كلمتا المرور غير متطابقتين', 'error'); return false; }
        if (d.next === d.current) { toast('اختر كلمة مرور مختلفة عن الحالية', 'error'); return false; }
        if (!(await Store.verifyPassword(me.username, d.current))) { toast('كلمة المرور الحالية غير صحيحة', 'error'); return false; }
        try {
          await Store.changeOwnPassword(d.next);
        } catch (e) { toast('تعذّر تغيير كلمة المرور: ' + (e.message || ''), 'error'); return false; }
        me.mustChange = false;
        commit(`تغيير كلمة المرور – ${me.name}`);
        toast('تم تغيير كلمة المرور بنجاح');
      },
    });
  }

  /* =======================================================================
     12) لوحة التحكم الرئيسية
     ======================================================================= */
  function viewDashboard() {
    const vs = db.vehicles;
    const total = vs.length || 1;
    const c = countStatus(vs);
    const alerts = getAlerts();
    const danger = alerts.filter((a) => a.level === 'danger').length;
    const pendingTs = db.timesheets.filter((t) => t.status === 'pending' && tsInScope(t)).length;
    const openTasks = db.tasks.filter((t) => t.status !== 'done').length;
    const util = Math.round(((c.active || 0) / total) * 100);
    const deployed = vs.filter((v) => v.status === 'active' && v.assignment && (me.role !== 'supervisor' || projById(v.assignment.projectId)?.supervisorId === me.id));
    const recentTasks = [...db.tasks].filter((t) => t.status !== 'done').sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'صباح الخير' : 'مساء الخير';

    return `
      <section class="welcome">
        <div style="position:relative;z-index:1">
          <h2>${greet}، ${esc(me.name)}</h2>
          <p>${ROLES[me.role]} • لديك ${plural(alerts.length, 'تنبيه', 'تنبيهات')} و${plural(pendingTs, 'سجل ساعات', 'سجلات ساعات')} بانتظار الاعتماد</p>
        </div>
        <div class="fleet-bar">
          <div class="bar">${STATUS_ORDER.map((s) => `<i style="width:${(c[s] / total) * 100}%;background:var(--st-${s})" title="${STATUS[s].label}: ${c[s]}"></i>`).join('')}</div>
          <div class="legend">${STATUS_ORDER.map((s) => `<span><i class="dot" style="background:var(--st-${s})"></i>${STATUS[s].label} (${c[s]})</span>`).join('')}</div>
        </div>
      </section>

      <section class="stat-grid">
        ${STATUS_ORDER.map((s) => `
          <button class="stat stat-${s}" data-action="goto-fleet" data-status="${s}">
            ${statusBadge(s)}
            <div class="stat-num">${c[s]}</div>
            <div class="stat-foot">${Math.round((c[s] / total) * 100)}% من الأسطول${I18N.lang === 'en' ? '' : ' • ' + STATUS[s].en}</div>
            <div class="stat-bar"><i style="width:${(c[s] / total) * 100}%"></i></div>
          </button>`).join('')}
      </section>

      <section class="kpi-row">
        <div class="kpi"><div class="k-label">${icon('gauge')} نسبة التشغيل</div><div class="k-val">${util}%</div><div class="k-sub">المعدات العاملة من الإجمالي</div></div>
        <div class="kpi"><div class="k-label">${icon('truck')} إجمالي الأسطول</div><div class="k-val">${vs.length}</div><div class="k-sub">مركبة ومعدة مسجلة</div></div>
        <button class="kpi ${danger ? 'danger' : alerts.length ? 'warn' : ''}" data-action="show-alerts"><div class="k-label">${icon('alert')} تنبيهات نشطة</div><div class="k-val">${alerts.length}</div><div class="k-sub">${danger} حرجة • ${alerts.length - danger} قريبة</div></button>
        ${me.role === 'maintenance'
          ? `<button class="kpi" data-action="goto" data-route="maintenance"><div class="k-label">${icon('wrench')} أوامر عمل مفتوحة</div><div class="k-val">${db.tasks.filter((t) => t.type === 'maintenance' && t.status !== 'done').length}</div><div class="k-sub">صيانة دورية وإصلاح أعطال</div></button>`
          : `<button class="kpi ${pendingTs ? 'warn' : ''}" data-action="goto" data-route="timesheets"><div class="k-label">${icon('clock')} ساعات بانتظار الاعتماد</div><div class="k-val">${pendingTs}</div><div class="k-sub">سجلات تشغيل يومية</div></button>`}
        <button class="kpi" data-action="goto" data-route="tasks"><div class="k-label">${icon('check')} مهام مفتوحة</div><div class="k-val">${openTasks}</div><div class="k-sub">${db.tasks.filter((t) => t.status === 'review').length} بانتظار الاعتماد</div></button>
      </section>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>${icon('bell')} التنبيهات <span class="sub">رخص • تأمين • صيانة دورية</span></h3>${alerts.length > 6 ? '<button class="btn-link" data-action="show-alerts">عرض الكل</button>' : ''}</div>
          ${alertList(alerts.slice(0, 6))}
        </div>
        <div class="card p0">
          <div class="card-head"><h3>${icon('briefcase')} المعدات في العمل الآن <span class="sub">${deployed.length} معدة</span></h3>${can('assign') ? '<button class="btn-link" data-action="goto" data-route="operations">إدارة التشغيل</button>' : ''}</div>
          ${deployed.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>المعدة</th><th>التشغيل</th><th>المشروع / العميل</th><th>السائق</th></tr></thead><tbody>
            ${deployed.map((v) => `<tr class="clickable" data-action="view-vehicle" data-id="${v.id}">
              <td>${plate(v, 'sm')}<div class="cell-sub">${esc(v.type)}</div></td>
              <td>${v.assignment.kind === 'internal' ? '<span class="badge b-primary">داخلي</span>' : `<span class="badge b-accent">${RENTAL[v.assignment.rentalType]}</span>`}</td>
              <td><div class="cell-title">${esc(v.assignment.kind === 'internal' ? pName(v.assignment.projectId) : (v.assignment.client || pName(v.assignment.projectId)))}</div></td>
              <td>${hasDriver(v.assignment) ? esc(uName(v.assignment.driverId)) : '<span class="badge b-neutral">بدون سائق</span>'}</td></tr>`).join('')}
          </tbody></table></div>` : empty('لا توجد معدات مرتبطة بمشاريع حالياً', 'briefcase')}
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>${icon('check')} المهام المفتوحة</h3><button class="btn-link" data-action="goto" data-route="tasks">لوحة المهام</button></div>
          ${recentTasks.length ? `<ul class="list">${recentTasks.map((t) => `
            <li><span class="badge ${t.status === 'review' ? 'b-warn' : t.status === 'progress' ? 'b-info' : 'b-neutral'}">${TASK_STATUS[t.status]}</span>
              <div class="grow"><div class="title" data-raw>${esc(t.title)}</div><div class="meta">${esc(TASK_TYPES[t.type])} • ${esc(uName(t.assigneeId))}${t.dueDate ? ' • الاستحقاق ' + fmtDate(t.dueDate) : ''}</div></div>
              ${ibtn('edit', 'task-edit', t.id, 'فتح المهمة')}</li>`).join('')}</ul>` : empty('لا توجد مهام مفتوحة', 'check')}
        </div>
        <div class="card">
          <div class="card-head"><h3>${icon('activity')} آخر النشاطات</h3></div>
          ${activityList(8)}
        </div>
      </div>`;
  }

  function activityList(n) {
    const list = db.activity.slice(0, n);
    if (!list.length) return empty('لا يوجد نشاط بعد', 'activity');
    return `<ul class="list activity">${list.map((a) => `<li>${avatar(userById(a.by))}<div class="grow"><div class="title" style="font-weight:500">${esc(a.text)}</div><div class="meta">${esc(uName(a.by))} • ${fmtDateTime(a.at)}</div></div></li>`).join('')}</ul>`;
  }

  /* =======================================================================
     13) واجهة السائق
     ======================================================================= */
  function viewMyWork() {
    const mine = db.vehicles.filter((v) => v.assignment && v.assignment.driverId === me.id);
    const myTs = db.timesheets.filter((t) => t.driverId === me.id || t.createdBy === me.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const myReports = db.reports.filter((r) => r.by === me.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
    return `
      <div class="toolbar">
        <button class="btn btn-primary" data-action="ts-new">${icon('clock')} تسجيل ساعات اليوم</button>
        <button class="btn btn-danger" data-action="goto-field" data-kind="breakdown">${icon('alert')} الإبلاغ عن عطل</button>
        <button class="btn btn-ghost" data-action="goto-field" data-kind="note">${icon('camera')} إرسال ملاحظة مع صور</button>
      </div>
      ${mine.length ? `<div class="grid-2">${mine.map((v) => `
        <div class="vcard">
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">${plate(v, 'lg')}<div style="flex:1"><div class="cell-title" style="font-size:16px">${esc(v.type)} – ${esc(v.make)}</div><div class="cell-sub">${esc(v.color)} • ${esc(v.year)}</div></div>${statusBadge(v.status)}</div>
          <dl class="kv">
            <dt>المشروع</dt><dd>${esc(pName(v.assignment.projectId))}</dd>
            <dt>نوع التشغيل</dt><dd>${v.assignment.kind === 'internal' ? 'مشروع داخلي' : 'إيجار ' + RENTAL[v.assignment.rentalType] + ' – ' + esc(v.assignment.client)}</dd>
            <dt>المشرف</dt><dd>${esc(uName(projById(v.assignment.projectId)?.supervisorId))}</dd>
            <dt>العداد</dt><dd class="num">${num(v.meter)} ${v.meterType === 'km' ? 'كم' : 'ساعة'}</dd>
            <dt>رخصة المركبة</dt><dd>${validity(v.licenseTo)}</dd>
            <dt>التأمين</dt><dd>${validity(v.insTo)}</dd>
          </dl>
        </div>`).join('')}</div>` : `<div class="card section-gap">${empty('لا توجد معدة مسندة إليك حالياً. تواصل مع مدير النظام.', 'truck')}</div>`}
      <div class="grid-2">
        <div class="card p0"><div class="card-head"><h3>${icon('clock')} سجلات ساعاتي</h3><button class="btn-link" data-action="goto" data-route="timesheets">عرض الكل</button></div>${tsTable(myTs, true)}</div>
        <div class="card"><div class="card-head"><h3>${icon('camera')} بلاغاتي الأخيرة</h3><button class="btn-link" data-action="goto" data-route="field">عرض الكل</button></div>
          ${myReports.length ? `<div class="reports">${myReports.map(reportCard).join('')}</div>` : empty('لم ترسل أي ملاحظات بعد', 'camera')}</div>
      </div>`;
  }

  /* =======================================================================
     14) الأسطول والمعدات
     ======================================================================= */
  function viewFleet() {
    const f = ui.fleet;
    const c = countStatus(db.vehicles);
    const chips = [['', 'الكل', db.vehicles.length]].concat(STATUS_ORDER.map((s) => [s, STATUS[s].label, c[s]]));
    return `
      <div class="toolbar">
        <div class="search">${icon('search')}<input type="search" placeholder="بحث برقم اللوحة، الشاصي، النوع أو الموديل…" value="${esc(f.q)}" data-input="fleet-q" aria-label="بحث"></div>
        <select data-change="fleet-filter" data-key="type" aria-label="نوع المعدة">${opts(optsArr(APP_CONFIG.vehicleTypes), f.type, 'كل الأنواع')}</select>
        <select data-change="fleet-filter" data-key="plateType" aria-label="نوع اللوحة">${opts(optsArr(APP_CONFIG.plateTypes), f.plateType, 'كل أنواع اللوحات')}</select>
        <span class="spacer"></span>
        ${can('vehicle.edit') ? `<button class="btn btn-primary" data-action="vehicle-new">${icon('plus')} إضافة مركبة / معدة</button>` : ''}
      </div>
      <div class="chips">${chips.map(([k, l, n]) => `<button class="chip ${f.status === k ? 'on' : ''} ${k ? 'chip-' + k : ''}" data-action="fleet-status" data-status="${k}">${k ? '<i class="dot"></i>' : ''}${l}<b>${n}</b></button>`).join('')}</div>
      <div class="plate-legend section-gap">ألوان اللوحات: ${APP_CONFIG.plateTypes.map((t) => { const c = (APP_CONFIG.plateColors || {})[t] || { bg: '#fff' }; return `<span><i style="background:${c.bg}"></i>${esc(t)}</span>`; }).join('')}</div>
      <div class="card p0" id="fleetTable">${fleetTable()}</div>`;
  }

  function fleetTable() {
    const f = ui.fleet;
    const q = f.q.trim().toLowerCase();
    const list = db.vehicles.filter((v) => (!f.status || v.status === f.status) && (!f.type || v.type === f.type) && (!f.plateType || v.plateType === f.plateType) &&
      (!q || [v.plateNo, v.plateCode, v.type, v.make, v.chassis, v.color, v.year].join(' ').toLowerCase().includes(q)));
    if (!list.length) return empty('لا توجد نتائج مطابقة للبحث أو الفلاتر');
    return `<div class="table-wrap"><table class="table"><thead><tr>
        <th>اللوحة</th><th>المعدة</th><th>نوع اللوحة</th><th>الحالة</th><th>التشغيل الحالي</th><th>رخصة المركبة</th><th>التأمين</th><th></th></tr></thead><tbody>
      ${list.map((v) => `<tr>
        <td>${plate(v, 'sm')}</td>
        <td><div class="cell-title">${esc(v.type)}</div><div class="cell-sub">${esc(v.make || '—')} • ${esc(v.year || '')}</div></td>
        <td>${esc(v.plateType)}</td>
        <td>${can('vehicle.status') ? statusSelect(v) : statusBadge(v.status)}</td>
        <td>${assignText(v, true)}</td>
        <td>${validity(v.licenseTo)}</td>
        <td>${validity(v.insTo)}<div class="cell-sub">${esc((v.insType || '').split(' (')[0])}</div></td>
        <td><div class="actions">${ibtn('eye', 'view-vehicle', v.id, 'بطاقة المعدة')}${can('vehicle.edit') ? ibtn('edit', 'vehicle-edit', v.id, 'تعديل') + ibtn('trash', 'vehicle-delete', v.id, 'حذف', 'danger') : ''}</div></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function vehicleForm(v = {}) {
    const isNew = !v.id;
    return `<div class="form-grid">
      <h4 class="form-sec">البيانات الأساسية للوحة</h4>
      ${field('رقم اللوحة *', `<input name="plateNo" required value="${esc(v.plateNo || '')}" inputmode="numeric" placeholder="12345">`)}
      ${field('رمز اللوحة', `<input name="plateCode" value="${esc(v.plateCode || '')}" placeholder="مثال: أ ب">`)}
      ${field('نوع اللوحة', `<select name="plateType">${opts(optsArr(APP_CONFIG.plateTypes), v.plateType || 'تجاري')}</select>`)}
      <h4 class="form-sec">التصنيف</h4>
      ${field('نوع المركبة / المعدة *', `<select name="type" required>${opts(optsArr(APP_CONFIG.vehicleTypes), v.type)}</select>`)}
      ${field('الماركة / الموديل', `<input name="make" value="${esc(v.make || '')}" placeholder="مثال: كاتربيلر 320D">`)}
      ${field('اللون', `<input name="color" value="${esc(v.color || '')}">`)}
      ${field('سنة الطراز', `<input name="year" type="number" min="1970" max="${new Date().getFullYear() + 1}" value="${esc(v.year || '')}">`)}
      ${field('رقم القاعدة / الشاصي (Chassis No.)', `<input name="chassis" value="${esc(v.chassis || '')}" dir="ltr" style="text-align:right">`, 'span2')}
      <h4 class="form-sec">التراخيص والتأمين</h4>
      ${field('رخصة المركبة – من', `<input name="licenseFrom" type="date" value="${esc(v.licenseFrom || '')}">`)}
      ${field('رخصة المركبة – إلى *', `<input name="licenseTo" type="date" required value="${esc(v.licenseTo || '')}">`)}
      <span></span>
      ${field('وثيقة التأمين – من', `<input name="insFrom" type="date" value="${esc(v.insFrom || '')}">`)}
      ${field('وثيقة التأمين – إلى *', `<input name="insTo" type="date" required value="${esc(v.insTo || '')}">`)}
      ${field('نوع التأمين', `<select name="insType">${opts(optsArr(APP_CONFIG.insuranceTypes), v.insType)}</select>`)}
      <h4 class="form-sec">العداد والصيانة الدورية</h4>
      ${field('نوع العداد', `<select name="meterType">${opts([{ value: 'hours', label: 'ساعات تشغيل' }, { value: 'km', label: 'كيلومترات' }], v.meterType || 'hours')}</select>`)}
      ${field('قراءة العداد الحالية', `<input name="meter" type="number" min="0" value="${esc(v.meter ?? 0)}">`)}
      ${field('فترة الصيانة الدورية', `<input name="serviceInterval" type="number" min="0" value="${esc(v.serviceInterval ?? 500)}"><span class="hint">كل كم ساعة / كيلومتر</span>`)}
      ${field('موعد الصيانة القادمة (قراءة العداد)', `<input name="nextService" type="number" min="0" value="${esc(v.nextService ?? '')}"><span class="hint">اتركه فارغاً ليُحسب تلقائياً</span>`)}
      ${isNew ? field('الحالة الابتدائية', `<select name="status">${opts(STATUS_ORDER.filter((s) => s !== 'active').map((s) => ({ value: s, label: STATUS[s].label })), 'idle')}</select>`) : ''}
      ${field('ملاحظات عامة', `<textarea name="notes" rows="3">${esc(v.notes || '')}</textarea>`, 'full')}
    </div>`;
  }

  function saveVehicle(d, id) {
    if (d.licenseFrom && d.licenseTo && d.licenseFrom > d.licenseTo) { toast('تاريخ نهاية الرخصة يسبق تاريخ بدايتها', 'error'); return false; }
    if (d.insFrom && d.insTo && d.insFrom > d.insTo) { toast('تاريخ نهاية التأمين يسبق تاريخ بدايته', 'error'); return false; }
    const dup = db.vehicles.find((x) => x.id !== id && x.plateNo === d.plateNo && (x.plateCode || '') === (d.plateCode || ''));
    if (dup) { toast('توجد مركبة مسجلة بنفس رقم ورمز اللوحة', 'error'); return false; }
    ['year', 'meter', 'serviceInterval', 'nextService'].forEach((k) => { d[k] = d[k] === '' || d[k] === undefined ? '' : Number(d[k]); });
    if (d.nextService === '' && d.serviceInterval) d.nextService = Number(d.meter || 0) + Number(d.serviceInterval);
    if (id) {
      const v = vehById(id);
      Object.assign(v, d);
      commit(`تعديل بيانات ${vLabel(v)}`);
      toast('تم حفظ بيانات المعدة');
    } else {
      const v = Object.assign({ id: uid('v'), assignment: null, status: 'idle', lastService: '' }, d);
      db.vehicles.push(v);
      commit(`إضافة معدة جديدة: ${vLabel(v)}`);
      toast('تمت إضافة المعدة إلى الأسطول');
    }
  }

  function viewVehicle(id) {
    const v = vehById(id);
    if (!v) return;
    const m = maintState(v);
    const tasks = db.tasks.filter((t) => t.vehicleId === id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);
    const reports = db.reports.filter((r) => r.vehicleId === id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
    const monthKey = today().slice(0, 7);
    const monthHours = db.timesheets.filter((t) => t.vehicleId === id && t.status === 'approved' && t.date.startsWith(monthKey)).reduce((s, t) => s + Number(t.hours || 0), 0);
    const a = v.assignment;
    const footer = [
      can('vehicle.edit') ? `<button type="button" class="btn btn-ghost" data-action="vehicle-edit" data-id="${v.id}">${icon('edit')} تعديل</button>` : '',
      can('assign') ? `<button type="button" class="btn btn-ghost" data-action="assign" data-id="${v.id}">${icon('link')} ${a ? 'تعديل التشغيل' : 'ربط بمشروع / إيجار'}</button>` : '',
      can('task.create') ? `<button type="button" class="btn btn-ghost" data-action="wo-new" data-id="${v.id}">${icon('wrench')} أمر صيانة</button>` : '',
    ].join('');
    openModal({
      title: 'بطاقة تعريف المعدة', size: 'lg', footer,
      body: `
        <div class="vp-head">
          ${plate(v, 'lg')}
          <div class="grow"><h2>${esc(v.type)} – ${esc(v.make || '')}</h2><div class="muted">${esc(v.plateType)} • ${esc(v.color || '—')} • موديل ${esc(v.year || '—')}</div></div>
          ${can('vehicle.status') ? statusSelect(v) : statusBadge(v.status)}
        </div>
        <div class="vp-grid">
          <div class="info-box"><h4>${icon('truck')} البيانات الأساسية</h4><dl class="kv">
            <dt>رقم اللوحة</dt><dd>${esc(v.plateNo)} ${esc(v.plateCode)}</dd>
            <dt>نوع اللوحة</dt><dd>${esc(v.plateType)}</dd>
            <dt>النوع</dt><dd>${esc(v.type)}</dd>
            <dt>اللون</dt><dd>${esc(v.color || '—')}</dd>
            <dt>سنة الطراز</dt><dd>${esc(v.year || '—')}</dd>
            <dt>رقم الشاصي</dt><dd class="num">${esc(v.chassis || '—')}</dd>
          </dl></div>
          <div class="info-box"><h4>${icon('shield')} التراخيص والتأمين</h4><dl class="kv">
            <dt>الرخصة من</dt><dd>${fmtDate(v.licenseFrom)}</dd>
            <dt>الرخصة إلى</dt><dd>${validity(v.licenseTo)}</dd>
            <dt>التأمين من</dt><dd>${fmtDate(v.insFrom)}</dd>
            <dt>التأمين إلى</dt><dd>${validity(v.insTo)}</dd>
            <dt>نوع التأمين</dt><dd>${esc(v.insType || '—')}</dd>
          </dl></div>
          <div class="info-box"><h4>${icon('briefcase')} التشغيل الحالي</h4>
            ${a ? `<dl class="kv">
              <dt>النوع</dt><dd>${a.kind === 'internal' ? 'مشروع داخلي' : 'إيجار ' + RENTAL[a.rentalType]}</dd>
              <dt>المشروع</dt><dd>${esc(pName(a.projectId))}</dd>
              ${a.kind !== 'internal' ? `<dt>العميل</dt><dd>${esc(a.client || '—')}</dd><dt>السعر</dt><dd>${money(a.rate)} / ${RENTAL_UNIT[a.rentalType]}</dd>` : ''}
              <dt>السائق</dt><dd>${esc(driverText(a))}</dd>
              <dt>منذ</dt><dd>${fmtDate(a.startDate)}</dd>
              <dt>ساعات هذا الشهر</dt><dd class="num">${num(monthHours)} ساعة</dd>
            </dl>` : '<p class="muted">غير مرتبطة بأي مشروع أو عقد إيجار.</p>'}
          </div>
          <div class="info-box"><h4>${icon('wrench')} الصيانة الدورية</h4><dl class="kv">
            <dt>العداد الحالي</dt><dd class="num">${num(v.meter)} ${m.unit}</dd>
            <dt>الصيانة كل</dt><dd class="num">${num(v.serviceInterval)} ${m.unit}</dd>
            <dt>الصيانة القادمة</dt><dd class="num">${num(v.nextService)} ${m.unit}</dd>
            <dt>المتبقي</dt><dd><span class="badge ${m.state === 'overdue' ? 'b-bad' : m.state === 'soon' ? 'b-warn' : 'b-ok'}">${m.remaining <= 0 ? 'متأخرة ' + num(-m.remaining) : num(m.remaining)} ${m.unit}</span></dd>
            <dt>آخر صيانة</dt><dd>${fmtDate(v.lastService)}</dd>
          </dl><div class="progress ${m.state}" style="margin-top:10px"><i style="width:${m.pct}%"></i></div></div>
        </div>
        ${v.notes ? `<div class="info-box" style="margin-top:14px"><h4>ملاحظات عامة</h4><p data-raw>${esc(v.notes)}</p></div>` : ''}
        <div class="vp-grid" style="margin-top:14px">
          <div class="info-box"><h4>${icon('check')} آخر المهام</h4>${tasks.length ? `<ul class="list">${tasks.map((t) => `<li><span class="badge ${t.status === 'done' ? 'b-ok' : 'b-neutral'}">${TASK_STATUS[t.status]}</span><div class="grow"><div class="title" data-raw>${esc(t.title)}</div><div class="meta">${esc(uName(t.assigneeId))}</div></div></li>`).join('')}</ul>` : '<p class="muted">لا توجد مهام</p>'}</div>
          <div class="info-box"><h4>${icon('camera')} ملاحظات الميدان</h4>${reports.length ? `<ul class="list">${reports.map((r) => `<li><span class="badge ${r.kind === 'breakdown' ? 'b-bad' : 'b-info'}">${r.kind === 'breakdown' ? 'عطل' : 'ملاحظة'}</span><div class="grow"><div class="title" style="font-weight:500" data-raw>${esc(r.text)}</div><div class="meta">${esc(uName(r.by))} • ${fmtDateTime(r.at)}</div></div></li>`).join('')}</ul>` : '<p class="muted">لا توجد ملاحظات</p>'}</div>
        </div>`,
    });
  }

  function setVehicleStatus(v, s) {
    if (!STATUS[s] || v.status === s) return;
    const old = v.status;
    v.status = s;
    commit(`تغيير حالة ${vLabel(v)} من «${STATUS[old].label}» إلى «${STATUS[s].label}»`);
    toast(`تم تغيير الحالة إلى «${STATUS[s].label}»`);
  }

  /* =======================================================================
     15) التشغيل والإيجار
     ======================================================================= */
  function viewOperations() {
    const vs = db.vehicles;
    const assigned = vs.filter((v) => v.assignment);
    const count = (fn) => assigned.filter(fn).length;
    const list = ui.ops === 'assigned' ? assigned : ui.ops === 'free' ? vs.filter((v) => !v.assignment) : vs;
    const monthlyRevenue = assigned.filter((v) => v.assignment.kind === 'rental').reduce((s, v) => {
      const a = v.assignment;
      return s + (a.rentalType === 'monthly' ? a.rate : a.rentalType === 'daily' ? a.rate * 26 : a.rate * 26 * 9);
    }, 0);
    return `
      <section class="kpi-row">
        <div class="kpi"><div class="k-label">مشاريع داخلية</div><div class="k-val">${count((v) => v.assignment.kind === 'internal')}</div><div class="k-sub">معدة</div></div>
        <div class="kpi"><div class="k-label">إيجار ساعي</div><div class="k-val">${count((v) => v.assignment.rentalType === 'hourly')}</div><div class="k-sub">معدة</div></div>
        <div class="kpi"><div class="k-label">إيجار يومي</div><div class="k-val">${count((v) => v.assignment.rentalType === 'daily')}</div><div class="k-sub">معدة</div></div>
        <div class="kpi"><div class="k-label">إيجار شهري</div><div class="k-val">${count((v) => v.assignment.rentalType === 'monthly')}</div><div class="k-sub">معدة</div></div>
        <div class="kpi"><div class="k-label">إيراد إيجار شهري تقديري</div><div class="k-val" style="font-size:19px">${money(monthlyRevenue)}</div><div class="k-sub">على أساس 26 يوم عمل / 9 ساعات</div></div>
      </section>
      <div class="toolbar">
        <div class="seg">${[['all', 'الكل', vs.length], ['assigned', 'مرتبطة', assigned.length], ['free', 'غير مرتبطة', vs.length - assigned.length]].map(([k, l, n]) => `<button class="${ui.ops === k ? 'on' : ''}" data-action="ops-filter" data-k="${k}">${l}<b>${n}</b></button>`).join('')}</div>
      </div>
      <div class="card p0">${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>المعدة</th><th>الحالة</th><th>نوع التشغيل</th><th>المشروع</th><th>العميل</th><th>السائق / المشغل</th><th>السعر</th><th>منذ</th><th></th></tr></thead><tbody>
        ${list.map((v) => { const a = v.assignment; return `<tr>
          <td>${plate(v, 'sm')}<div class="cell-sub">${esc(v.type)} – ${esc(v.make)}</div></td>
          <td>${statusBadge(v.status)}</td>
          <td>${a ? (a.kind === 'internal' ? '<span class="badge b-primary">مشروع داخلي</span>' : `<span class="badge b-accent">إيجار ${RENTAL[a.rentalType]}</span>`) : '<span class="muted">—</span>'}</td>
          <td>${a ? esc(pName(a.projectId)) : '<span class="muted">—</span>'}</td>
          <td>${a && a.kind !== 'internal' ? esc(a.client) : '<span class="muted">—</span>'}</td>
          <td>${a ? (hasDriver(a) ? esc(uName(a.driverId)) : `<span class="badge b-neutral">بدون سائق</span>${a.operatorName ? `<div class="cell-sub">مشغّل العميل: ${esc(a.operatorName)}</div>` : ''}`) : '<span class="muted">—</span>'}</td>
          <td class="num">${a && a.kind !== 'internal' ? `${money(a.rate)}<div class="cell-sub">/ ${RENTAL_UNIT[a.rentalType]}</div>` : '<span class="muted">—</span>'}</td>
          <td>${a ? fmtDate(a.startDate) : '<span class="muted">—</span>'}</td>
          <td><div class="actions">${ibtn('link', 'assign', v.id, a ? 'تعديل التشغيل' : 'ربط بمشروع')}${a ? ibtn('unlink', 'release', v.id, 'فك الارتباط', 'danger') : ''}</div></td>
        </tr>`; }).join('')}</tbody></table></div>` : empty('لا توجد معدات')}</div>`;
  }

  function openAssign(id) {
    const v = vehById(id);
    if (!v) return;
    if (v.status === 'maintenance' || v.status === 'breakdown') toast('تنبيه: المعدة حالياً ' + STATUS[v.status].label, 'warn');
    const a = v.assignment || { kind: 'rental', rentalType: 'daily', projectId: '', client: '', driverId: '', withDriver: true, operatorName: '', rate: '', startDate: today() };
    const projs = db.projects.filter((p) => p.status !== 'done');
    openModal({
      title: `ربط المعدة بمشروع / عقد إيجار – ${vShort(v)}`, size: 'lg', submit: 'حفظ وتحويل الحالة إلى «في العمل»',
      body: `<div class="form-grid">
        ${field('نوع التشغيل', `<select name="kind" data-change="assign-kind">${opts([{ value: 'internal', label: 'مشروع داخلي' }, { value: 'rental', label: 'إيجار لعميل' }], a.kind)}</select>`)}
        ${field('نوع الإيجار', `<select name="rentalType">${opts(optsMap(RENTAL), a.rentalType || 'daily')}</select>`, 'rental-only')}
        ${field('سعر الإيجار (' + APP_CONFIG.currency + ')', `<input name="rate" type="number" min="0" step="0.001" value="${esc(a.rate)}">`, 'rental-only')}
        ${field('المشروع *', `<select name="projectId" required data-change="assign-project">${opts(projs.map((p) => ({ value: p.id, label: p.name + (p.client ? ' – ' + p.client : '') })), a.projectId, 'اختر المشروع')}</select>`, 'span2')}
        ${field('اسم العميل', `<input name="client" value="${esc(a.client)}" placeholder="يُعبأ تلقائياً من المشروع">`, 'rental-only')}
        ${field('طريقة التشغيل', `<select name="withDriver" data-change="assign-kind">${opts([{ value: 'yes', label: 'مع سائق من الشركة' }, { value: 'no', label: 'بدون سائق – يشغّلها العميل' }], hasDriver(a) ? 'yes' : 'no')}</select>`, 'rental-only')}
        ${field('السائق / المشغل *', `<select name="driverId">${opts(userOpts(usersByRole('driver')), a.driverId, 'اختر السائق')}</select>`, 'driver-only')}
        ${field('اسم مشغّل العميل', `<input name="operatorName" value="${esc(a.operatorName || '')}" placeholder="اختياري – من يشغّل المعدة لدى العميل">`, 'nodriver-only')}
        ${field('تاريخ البدء', `<input name="startDate" type="date" value="${esc(a.startDate || today())}">`)}
      </div>`,
      onSubmit: (d) => {
        if (d.kind === 'rental' && !(Number(d.rate) > 0)) { toast('أدخل سعر الإيجار', 'error'); return false; }
        const withDriver = d.kind === 'internal' || d.withDriver !== 'no';
        if (withDriver && !d.driverId) { toast('اختر السائق / المشغل', 'error'); return false; }
        const p = projById(d.projectId);
        v.assignment = {
          kind: d.kind,
          rentalType: d.kind === 'rental' ? d.rentalType : '',
          projectId: d.projectId,
          client: d.kind === 'rental' ? (d.client || p?.client || '') : '',
          driverId: withDriver ? d.driverId : '',
          withDriver,
          operatorName: withDriver ? '' : (d.operatorName || ''),
          rate: d.kind === 'rental' ? Number(d.rate) : 0,
          startDate: d.startDate || today(),
        };
        v.status = 'active';
        commit(`ربط ${vLabel(v)} بـ «${p ? p.name : ''}» – ${d.kind === 'internal' ? 'مشروع داخلي' : 'إيجار ' + RENTAL[d.rentalType] + (withDriver ? '' : ' بدون سائق')}`);
        toast('تم ربط المعدة وتحويل حالتها إلى «في العمل»');
      },
    });
    toggleRentalFields();
  }
  function toggleRentalFields() {
    const kind = $('#modalForm select[name=kind]');
    if (!kind) return;
    const rental = kind.value === 'rental';
    const wd = $('#modalForm select[name=withDriver]');
    const noDriver = rental && wd && wd.value === 'no';
    $$('#modalForm .rental-only').forEach((el) => { el.style.display = rental ? '' : 'none'; });
    $$('#modalForm .driver-only').forEach((el) => { el.style.display = noDriver ? 'none' : ''; });
    $$('#modalForm .nodriver-only').forEach((el) => { el.style.display = noDriver ? '' : 'none'; });
  }

  /* =======================================================================
     16) ساعات التشغيل
     ======================================================================= */
  function viewTimesheets() {
    const scope = db.timesheets.filter(tsInScope);
    const counts = { pending: 0, approved: 0, rejected: 0 };
    scope.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    const list = scope.filter((t) => ui.ts === 'all' || t.status === ui.ts).sort((a, b) => b.date.localeCompare(a.date) || (vehById(a.vehicleId)?.plateNo || '').localeCompare(vehById(b.vehicleId)?.plateNo || ''));
    const approvable = list.filter(canApproveTs);
    const shown = list.slice(0, 150);
    const totalH = list.reduce((s, t) => s + Number(t.hours || 0), 0);
    return `
      <div class="toolbar">
        <div class="seg">${[['pending', TS_STATUS.pending], ['approved', TS_STATUS.approved], ['rejected', TS_STATUS.rejected], ['all', 'الكل']].map(([k, l]) => `<button class="${ui.ts === k ? 'on' : ''}" data-action="ts-filter" data-k="${k}">${l}<b>${k === 'all' ? scope.length : counts[k] || 0}</b></button>`).join('')}</div>
        <span class="spacer"></span>
        ${approvable.length > 1 ? `<button class="btn btn-ok" data-action="ts-approve-all">${icon('check')} اعتماد الكل (${approvable.length})</button>` : ''}
        ${can('timesheet.add') ? `<button class="btn btn-primary" data-action="ts-new">${icon('plus')} تسجيل ساعات تشغيل</button>` : ''}
      </div>
      ${me.role === 'supervisor' ? `<p class="muted section-gap">تظهر لك سجلات المشاريع التي تشرف عليها: ${db.projects.filter((p) => p.supervisorId === me.id).map((p) => esc(p.name)).join('، ') || 'لا توجد مشاريع مسندة'}.</p>` : ''}
      <div class="card p0">
        <div class="card-head"><h3>${list.length} سجل <span class="sub">إجمالي ${num(totalH)} ساعة</span></h3>${list.length > shown.length ? `<span class="sub muted">يُعرض أحدث ${shown.length} سجل</span>` : ''}</div>
        <div style="margin-top:12px">${tsTable(shown)}</div>
      </div>`;
  }

  function tsTable(list, compact) {
    if (!list.length) return empty('لا توجد سجلات', 'clock');
    return `<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>المعدة</th>${compact ? '' : '<th>المشروع</th><th>السائق</th>'}<th>الساعات</th>${compact ? '' : '<th>المسافة</th><th>ملاحظات</th>'}<th>الحالة</th>${compact ? '' : '<th></th>'}</tr></thead><tbody>
      ${list.map((t) => { const v = vehById(t.vehicleId); return `<tr>
        <td class="num" style="white-space:nowrap">${fmtDate(t.date)}<div class="cell-sub">${DAYS[parseDate(t.date).getDay()]}</div></td>
        <td>${v ? plate(v, 'sm') : '—'}${compact ? '' : `<div class="cell-sub">${esc(v ? v.type : '')}</div>`}</td>
        ${compact ? '' : `<td>${esc(pName(t.projectId))}</td><td>${t.driverId ? esc(uName(t.driverId)) : '<span class="muted">بدون سائق</span>'}</td>`}
        <td class="num"><b>${num(t.hours, Number(t.hours) % 1 ? 1 : 0)}</b></td>
        ${compact ? '' : `<td class="num">${t.km ? num(t.km) + ' كم' : '—'}</td><td class="cell-sub" style="max-width:220px">${esc(t.notes || '')}</td>`}
        <td><span class="badge ${t.status === 'approved' ? 'b-ok' : t.status === 'rejected' ? 'b-bad' : 'b-warn'}">${TS_STATUS[t.status]}</span>${t.invoiceId ? '<div class="cell-sub">مفوتر</div>' : ''}</td>
        ${compact ? '' : `<td><div class="actions">${canApproveTs(t) ? ibtn('check', 'ts-approve', t.id, 'اعتماد', 'ok') + ibtn('x', 'ts-reject', t.id, 'رفض', 'danger') : ''}${t.status === 'pending' && (t.createdBy === me.id || can('timesheet.approve')) ? ibtn('trash', 'ts-delete', t.id, 'حذف', 'danger') : ''}</div></td>`}
      </tr>`; }).join('')}</tbody></table></div>`;
  }

  function openTimesheet() {
    const isDriver = me.role === 'driver';
    const myV = db.vehicles.find((v) => v.assignment && v.assignment.driverId === me.id);
    let vList = db.vehicles.filter((v) => v.assignment);
    if (me.role === 'supervisor') vList = vList.filter((v) => projById(v.assignment.projectId)?.supervisorId === me.id);
    if (isDriver) vList = db.vehicles.filter((v) => v.assignment && v.assignment.driverId === me.id);
    if (!vList.length) { toast(isDriver ? 'لا توجد معدة مسندة إليك لتسجيل ساعاتها' : 'لا توجد معدات مرتبطة بمشاريع', 'warn'); return; }
    const def = myV || vList[0];
    openModal({
      title: 'تسجيل ساعات تشغيل يومية',
      body: `<div class="form-grid two">
        ${field('التاريخ *', `<input name="date" type="date" required max="${today()}" value="${today()}">`)}
        ${field('المعدة *', `<select name="vehicleId" required data-change="ts-vehicle">${opts(vehicleOpts(vList), def.id)}</select>`)}
        ${field('عدد الساعات *', `<input name="hours" type="number" required min="0.5" max="24" step="0.5" value="8">`)}
        ${field('المسافة المقطوعة (كم)', `<input name="km" type="number" min="0" value=""><span class="hint">للشاحنات والمركبات ذات عداد الكيلومترات</span>`)}
        ${isDriver ? '' : field('السائق / المشغل', `<select name="driverId">${opts(userOpts(usersByRole('driver')), hasDriver(def.assignment) ? def.assignment?.driverId : '', 'بدون سائق (يشغّلها العميل)')}</select>`)}
        ${field('ملاحظات', `<textarea name="notes" rows="2" placeholder="طبيعة العمل، الموقع، أي توقفات…"></textarea>`, 'full')}
      </div>`,
      onSubmit: (d) => {
        const v = vehById(d.vehicleId);
        const dup = db.timesheets.find((t) => t.vehicleId === d.vehicleId && t.date === d.date && t.status !== 'rejected');
        if (dup) { toast('يوجد سجل لنفس المعدة في هذا التاريخ', 'error'); return false; }
        db.timesheets.push({
          id: uid('ts'), date: d.date, vehicleId: d.vehicleId, projectId: v.assignment?.projectId || '',
          driverId: isDriver ? me.id : (d.driverId || ''),
          hours: Number(d.hours), km: Number(d.km || 0), notes: d.notes || '', status: 'pending',
          createdBy: me.id, approvedBy: '', invoiceId: '',
        });
        commit(`تسجيل ${d.hours} ساعة تشغيل لـ ${vLabel(v)} بتاريخ ${fmtDate(d.date)}`);
        toast('تم إرسال السجل للمشرف للاعتماد');
      },
    });
  }

  function approveTimesheets(ids) {
    let n = 0;
    ids.forEach((id) => {
      const t = db.timesheets.find((x) => x.id === id);
      if (!t || !canApproveTs(t)) return;
      t.status = 'approved';
      t.approvedBy = me.id;
      t.approvedAt = new Date().toISOString();
      const v = vehById(t.vehicleId);
      if (v) {
        if (v.meterType === 'km') { if (t.km) v.meter = Number(v.meter || 0) + Number(t.km); }
        else v.meter = Number(v.meter || 0) + Number(t.hours || 0);
      }
      n++;
    });
    if (n) { commit(`اعتماد ${plural(n, 'سجل', 'سجلات')} ساعات تشغيل`); toast(`تم اعتماد ${plural(n, 'سجل', 'سجلات')} وتحديث عدادات المعدات`); }
  }

  /* =======================================================================
     17) الصيانة
     ======================================================================= */
  function viewMaintenance() {
    const wo = db.tasks.filter((t) => t.type === 'maintenance');
    const open = wo.filter((t) => t.status !== 'done');
    const c = countStatus(db.vehicles);
    const due = db.vehicles.filter((v) => maintState(v).state !== 'ok');
    const list = (ui.maint === 'open' ? open : wo.filter((t) => t.status === 'done')).sort((a, b) => TASK_ORDER.indexOf(a.status) - TASK_ORDER.indexOf(b.status) || (a.priority === 'high' ? -1 : 1));
    const sched = [...db.vehicles].sort((a, b) => maintState(a).remaining / (a.serviceInterval || 1) - maintState(b).remaining / (b.serviceInterval || 1));
    return `
      <section class="kpi-row">
        <button class="kpi" data-action="goto-fleet" data-status="maintenance"><div class="k-label"><i class="dot" style="background:var(--st-maintenance)"></i> في الصيانة</div><div class="k-val">${c.maintenance}</div><div class="k-sub">معدة</div></button>
        <button class="kpi ${c.breakdown ? 'danger' : ''}" data-action="goto-fleet" data-status="breakdown"><div class="k-label"><i class="dot" style="background:var(--st-breakdown)"></i> خارج الخدمة</div><div class="k-val">${c.breakdown}</div><div class="k-sub">معدة معطلة</div></button>
        <div class="kpi"><div class="k-label">${icon('wrench')} أوامر عمل مفتوحة</div><div class="k-val">${open.length}</div><div class="k-sub">${open.filter((t) => t.status === 'new').length} جديدة</div></div>
        <div class="kpi ${due.some((v) => maintState(v).state === 'overdue') ? 'danger' : due.length ? 'warn' : ''}"><div class="k-label">${icon('gauge')} صيانة دورية مستحقة</div><div class="k-val">${due.length}</div><div class="k-sub">متأخرة أو قريبة</div></div>
        <div class="kpi"><div class="k-label">${icon('check')} أوامر منجزة</div><div class="k-val">${wo.filter((t) => t.status === 'done').length}</div><div class="k-sub">إجمالي</div></div>
      </section>

      <div class="card p0 section-gap">
        <div class="card-head"><h3>${icon('wrench')} أوامر العمل</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <div class="seg"><button class="${ui.maint === 'open' ? 'on' : ''}" data-action="maint-filter" data-k="open">المفتوحة<b>${open.length}</b></button><button class="${ui.maint === 'done' ? 'on' : ''}" data-action="maint-filter" data-k="done">المنجزة<b>${wo.length - open.length}</b></button></div>
            ${can('task.create') ? `<button class="btn btn-primary btn-sm" data-action="wo-new">${icon('plus')} أمر عمل جديد</button>` : ''}
          </div>
        </div>
        <div style="margin-top:12px">${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>أمر العمل</th><th>المعدة</th><th>النوع</th><th>الأولوية</th><th>المسؤول</th><th>الاستحقاق</th><th>الحالة</th><th></th></tr></thead><tbody>
          ${list.map((t) => { const v = vehById(t.vehicleId); const dd = daysUntil(t.dueDate); return `<tr>
            <td><div class="cell-title" data-raw>${esc(t.title)}</div>${t.source === 'field' ? '<div class="cell-sub">📷 من بلاغ ميداني</div>' : ''}</td>
            <td>${v ? plate(v, 'sm') : '—'}<div class="cell-sub">${v ? statusBadge(v.status) : ''}</div></td>
            <td>${esc(MKIND[t.mkind] || 'صيانة')}</td>
            <td><span class="badge ${t.priority === 'high' ? 'b-bad' : t.priority === 'medium' ? 'b-warn' : 'b-neutral'}">${PRIORITY[t.priority]}</span></td>
            <td>${esc(uName(t.assigneeId) === '—' ? 'فريق الورشة' : uName(t.assigneeId))}</td>
            <td class="num ${t.status !== 'done' && dd !== null && dd < 0 ? 'overdue-txt' : ''}">${fmtDate(t.dueDate)}</td>
            <td>${taskStatusSelect(t)}</td>
            <td><div class="actions">${ibtn('edit', 'task-edit', t.id, 'تفاصيل')}</div></td>
          </tr>`; }).join('')}</tbody></table></div>` : empty('لا توجد أوامر عمل', 'wrench')}</div>
      </div>

      <div class="card p0">
        <div class="card-head"><h3>${icon('calendar')} جدول الصيانة الدورية <span class="sub">حسب ساعات التشغيل أو الكيلومترات – التنبيه قبل ${num(S().maintenanceThreshold.hours)} ساعة / ${num(S().maintenanceThreshold.km)} كم</span></h3></div>
        <div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>المعدة</th><th>الحالة</th><th>العداد الحالي</th><th>الصيانة كل</th><th>الصيانة القادمة</th><th style="min-width:160px">المتبقي</th><th>آخر صيانة</th><th></th></tr></thead><tbody>
          ${sched.map((v) => { const m = maintState(v); const hasOpen = db.tasks.some((t) => t.vehicleId === v.id && t.type === 'maintenance' && t.mkind === 'preventive' && t.status !== 'done'); return `<tr>
            <td>${plate(v, 'sm')}<div class="cell-sub">${esc(v.type)}</div></td>
            <td>${can('vehicle.status') ? statusSelect(v) : statusBadge(v.status)}</td>
            <td class="num">${num(v.meter)} ${m.unit}</td>
            <td class="num">${num(v.serviceInterval)}</td>
            <td class="num">${num(v.nextService)}</td>
            <td><div style="display:flex;align-items:center;gap:8px"><div class="progress ${m.state}" style="flex:1"><i style="width:${m.pct}%"></i></div><span class="badge ${m.state === 'overdue' ? 'b-bad' : m.state === 'soon' ? 'b-warn' : 'b-ok'}">${m.remaining <= 0 ? 'متأخرة ' + num(-m.remaining) : num(m.remaining)}</span></div></td>
            <td>${fmtDate(v.lastService)}</td>
            <td><div class="actions">${ibtn('gauge', 'meter-update', v.id, 'تحديث العداد')}${can('task.create') && !hasOpen ? `<button class="btn btn-ghost btn-sm" data-action="pm-open" data-id="${v.id}">فتح صيانة دورية</button>` : hasOpen ? '<span class="badge b-info">أمر مفتوح</span>' : ''}</div></td>
          </tr>`; }).join('')}
        </tbody></table></div>
      </div>`;
  }

  const taskStatusSelect = (t) => `<select class="status-select" style="background-color:${t.status === 'done' ? 'var(--ok-bg)' : t.status === 'review' ? 'var(--warn-bg)' : t.status === 'progress' ? 'var(--info-bg)' : '#eef1f5'}" data-change="task-status" data-id="${t.id}" aria-label="حالة المهمة">${TASK_ORDER.map((s) => `<option value="${s}" ${s === t.status ? 'selected' : ''} ${s === 'done' && !can('task.approve') && t.status !== 'done' ? 'disabled' : ''}>${TASK_STATUS[s]}</option>`).join('')}</select>`;

  function openWorkOrder(vehicleId, preset = {}) {
    openModal({
      title: 'أمر عمل صيانة جديد', size: 'lg', submit: 'إنشاء أمر العمل',
      body: `<div class="form-grid">
        ${field('المعدة *', `<select name="vehicleId" required>${opts(vehicleOpts(), vehicleId || '', 'اختر المعدة')}</select>`, 'span2')}
        ${field('نوع الصيانة', `<select name="mkind">${opts(optsMap(MKIND), preset.mkind || 'corrective')}</select>`)}
        ${field('العنوان *', `<input name="title" required value="${esc(preset.title || '')}" placeholder="مثال: تغيير زيت المحرك والفلاتر">`, 'full')}
        ${field('الوصف', `<textarea name="description" rows="3">${esc(preset.description || '')}</textarea>`, 'full')}
        ${field('الأولوية', `<select name="priority">${opts(optsMap(PRIORITY), preset.priority || 'medium')}</select>`)}
        ${field('المسؤول', `<select name="assigneeId">${opts(userOpts(usersByRole('maintenance')), '', 'فريق الورشة (غير محدد)')}</select>`)}
        ${field('تاريخ الاستحقاق', `<input name="dueDate" type="date" value="${esc(preset.dueDate || today())}">`)}
        <label class="check field full"><input type="checkbox" name="setStatus" value="1" checked> تحويل حالة المعدة إلى «في الصيانة»</label>
      </div>`,
      onSubmit: (d) => {
        const v = vehById(d.vehicleId);
        const t = { id: uid('t'), title: d.title, description: d.description, type: 'maintenance', mkind: d.mkind, vehicleId: d.vehicleId, projectId: v.assignment?.projectId || '', assigneeId: d.assigneeId, priority: d.priority, status: 'new', dueDate: d.dueDate, createdBy: me.id, createdAt: new Date().toISOString(), source: preset.source || '', reportId: '' };
        db.tasks.push(t);
        if (d.setStatus && v.status !== 'breakdown') v.status = 'maintenance';
        commit(`فتح أمر عمل «${t.title}» لـ ${vLabel(v)}`);
        toast('تم إنشاء أمر العمل');
      },
    });
  }

  function onTaskDone(t) {
    if (t.type !== 'maintenance' || !t.vehicleId) return '';
    const v = vehById(t.vehicleId);
    if (!v) return '';
    let msg = '';
    if (t.mkind === 'preventive') {
      v.nextService = Number(v.meter || 0) + Number(v.serviceInterval || 0);
      v.lastService = today();
      msg = ` وتحديث موعد الصيانة القادمة إلى ${num(v.nextService)}`;
    } else v.lastService = today();
    const stillOpen = db.tasks.some((x) => x.id !== t.id && x.vehicleId === v.id && x.type === 'maintenance' && x.status !== 'done');
    if (!stillOpen && (v.status === 'maintenance' || v.status === 'breakdown')) {
      v.status = v.assignment ? 'active' : 'idle';
      msg += ` وإعادة المعدة إلى «${STATUS[v.status].label}»`;
    }
    return msg;
  }

  function setTaskStatus(t, s) {
    if (t.status === s) return;
    if (s === 'done' && !can('task.approve')) { toast('إغلاق المهمة يتطلب اعتماد المشرف أو مدير النظام – انقلها إلى «بانتظار الاعتماد»', 'warn'); render(); return; }
    const old = t.status;
    t.status = s;
    let extra = '';
    if (s === 'done') { t.doneAt = new Date().toISOString(); t.approvedBy = me.id; extra = onTaskDone(t); }
    if (old === 'done' && s !== 'done') t.doneAt = '';
    commit(`المهمة «${t.title}»: ${TASK_STATUS[old]} ← ${TASK_STATUS[s]}`);
    toast(`تم نقل المهمة إلى «${TASK_STATUS[s]}»${extra}`);
  }

  function openMeter(id) {
    const v = vehById(id);
    openModal({
      title: `تحديث قراءة العداد – ${vShort(v)}`,
      body: `<div class="form-grid two">
        ${field(`القراءة الحالية (${v.meterType === 'km' ? 'كم' : 'ساعة'})`, `<input name="meter" type="number" min="0" required value="${esc(v.meter)}">`)}
        ${field('موعد الصيانة القادمة', `<input name="nextService" type="number" min="0" value="${esc(v.nextService)}">`)}
      </div>`,
      onSubmit: (d) => {
        v.meter = Number(d.meter);
        if (d.nextService !== '') v.nextService = Number(d.nextService);
        commit(`تحديث عداد ${vLabel(v)} إلى ${num(v.meter)}`);
        toast('تم تحديث العداد');
      },
    });
  }

  /* =======================================================================
     18) ملاحظات الميدان
     ======================================================================= */
  function viewField() {
    const isDriver = me.role === 'driver';
    let list = db.reports.slice().sort((a, b) => b.at.localeCompare(a.at));
    if (isDriver) list = list.filter((r) => r.by === me.id);
    if (ui.field) list = list.filter((r) => r.kind === ui.field);
    const myV = db.vehicles.find((v) => v.assignment && v.assignment.driverId === me.id);
    const kind = ui.fieldKind || 'note';
    return `<div class="grid-2-1">
      <div class="stack">
        <div class="toolbar" style="margin:0">
          <div class="seg">${[['', 'الكل'], ['breakdown', 'بلاغات الأعطال'], ['note', 'ملاحظات']].map(([k, l]) => `<button class="${ui.field === k ? 'on' : ''}" data-action="field-filter" data-k="${k}">${l}</button>`).join('')}</div>
        </div>
        ${list.length ? `<div class="reports">${list.map(reportCard).join('')}</div>` : `<div class="card">${empty('لا توجد ملاحظات ميدانية', 'camera')}</div>`}
      </div>
      <div class="card" style="align-self:start">
        <div class="card-head"><h3>${icon('camera')} إرسال ملاحظة / بلاغ عطل</h3></div>
        <form id="fieldForm" data-form="field">
          <div class="form-grid" style="grid-template-columns:1fr">
            <div class="radio-cards">
              <label class="radio-card"><input type="radio" name="kind" value="note" ${kind === 'note' ? 'checked' : ''} data-change="field-kind"><span><b>ملاحظة عامة</b><small>تُسجل للمتابعة دون إيقاف المعدة</small></span></label>
              <label class="radio-card danger"><input type="radio" name="kind" value="breakdown" ${kind === 'breakdown' ? 'checked' : ''} data-change="field-kind"><span><b>بلاغ عطل</b><small>يُنشئ مهمة صيانة ويحوّل المعدة إلى «معطلة»</small></span></label>
            </div>
            ${field('المعدة *', `<select name="vehicleId" required>${opts(vehicleOpts(), myV ? myV.id : '', 'اختر المعدة')}</select>`)}
            <div class="field" id="sevField" style="${kind === 'breakdown' ? '' : 'display:none'}"><span>درجة العطل</span><select name="severity">${opts(optsMap(SEVERITY), 'high')}</select></div>
            ${field('الوصف *', `<textarea name="text" required rows="4" placeholder="صف العطل أو الملاحظة بدقة…"></textarea>`)}
            ${field('الموقع', `<input name="location" placeholder="مثال: ميناء صحار – البوابة 3">`)}
            <div class="field"><span>الصور (حتى 3)</span>
              <label class="upload-zone">${icon('image')} اختر صوراً أو التقط بالكاميرا<input type="file" accept="image/*" multiple capture="environment" data-change="field-photos"></label>
              <div class="thumbs" id="photoPreview" style="margin-top:8px">${photoPreview()}</div>
            </div>
            <button type="submit" class="btn ${kind === 'breakdown' ? 'btn-danger' : 'btn-primary'}" id="fieldSubmit">${kind === 'breakdown' ? icon('alert') + ' إرسال بلاغ العطل' : icon('upload') + ' إرسال الملاحظة'}</button>
          </div>
        </form>
      </div>
    </div>`;
  }
  /** صورة بلاغ: إما مسار في التخزين السحابي (يُحمَّل برابط مؤقت) أو صورة قديمة مضمّنة */
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  function photoImg(p, alt, rid, i) {
    const inline = /^data:/.test(p);
    const src = inline ? p : (Store.cachedPhotoUrl(p) || BLANK);
    return `<img src="${src}" ${inline ? '' : `data-photo="${esc(p)}"`} alt="${esc(alt)}" data-action="photo-view" data-r="${esc(rid)}" data-i="${i}" loading="lazy">`;
  }
  function resolvePhotos(root) {
    if (!root || root.nodeType !== 1) return;
    const imgs = Array.from(root.querySelectorAll('img[data-photo]')).filter((im) => im.src === BLANK || im.src.endsWith(BLANK.slice(-10)));
    if (!imgs.length) return;
    const paths = Array.from(new Set(imgs.map((im) => im.dataset.photo)));
    Store.photoUrls(paths).then((urls) => {
      const map = new Map(paths.map((p, k) => [p, urls[k]]));
      imgs.forEach((im) => { const u = map.get(im.dataset.photo); if (u) im.src = u; });
    }).catch(() => {});
  }
  new MutationObserver((recs) => recs.forEach((r) => r.addedNodes.forEach(resolvePhotos))).observe(document.body, { childList: true, subtree: true });

  const photoPreview = () => ui.pendingPhotos.map((p, i) => `<span class="rm"><img src="${p}" alt="صورة ${i + 1}"><button type="button" data-action="photo-remove" data-i="${i}" aria-label="حذف">×</button></span>`).join('');

  function reportCard(r) {
    const v = vehById(r.vehicleId);
    const t = r.taskId ? db.tasks.find((x) => x.id === r.taskId) : null;
    return `<div class="report ${r.kind === 'breakdown' ? 'is-breakdown' : ''}">
      <div class="r-head">${avatar(userById(r.by))}<div style="flex:1;min-width:0"><b>${esc(uName(r.by))}</b><div class="cell-sub">${fmtDateTime(r.at)}${r.location ? ' • ' + esc(r.location) : ''}</div></div>
        ${r.kind === 'breakdown' ? `<span class="badge b-bad">${icon('alert')} بلاغ عطل – ${esc(SEVERITY[r.severity] || '')}</span>` : '<span class="badge b-info">ملاحظة</span>'}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${plate(v, 'sm')}<span class="cell-sub">${esc(v ? v.type + ' – ' + v.make : '')}</span>${v ? statusBadge(v.status) : ''}</div>
      <div class="r-text" data-raw>${esc(r.text)}</div>
      ${r.photos && r.photos.length ? `<div class="thumbs">${r.photos.map((p, i) => photoImg(p, `صورة ${i + 1}`, r.id, i)).join('')}</div>` : ''}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${t ? `<span class="cell-sub">مهمة الصيانة:</span> <span class="badge ${t.status === 'done' ? 'b-ok' : 'b-warn'}">${TASK_STATUS[t.status]}</span>${me.role !== 'driver' ? `<button class="btn-link" data-action="task-edit" data-id="${t.id}">فتح المهمة</button>` : ''}`
          : (r.kind === 'note' && can('task.create') ? `<button class="btn btn-ghost btn-sm" data-action="report-to-task" data-id="${r.id}">${icon('wrench')} تحويل إلى مهمة صيانة</button>` : '')}
      </div>
    </div>`;
  }

  async function submitField(form) {
    const d = formData(form);
    if (!d.vehicleId || !d.text) { toast('اختر المعدة واكتب الوصف', 'error'); return; }
    const v = vehById(d.vehicleId);
    const rid = uid('r');
    // رفع الصور إلى التخزين السحابي أولاً (تُحفظ مساراتها في البلاغ)
    let photos = [];
    if (ui.pendingPhotos.length) {
      const btn = $('#fieldSubmit');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جارٍ رفع الصور…'; }
      try {
        photos = await Promise.all(ui.pendingPhotos.map((p, i) => Store.uploadPhoto(`${rid}/${i + 1}-${Date.now().toString(36)}.jpg`, p)));
      } catch (e) {
        if (btn) { btn.disabled = false; btn.innerHTML = icon('upload') + ' إعادة المحاولة'; }
        toast('تعذّر رفع الصور — تحقق من الاتصال ثم أعد المحاولة', 'error');
        return;
      }
    }
    const r = { id: rid, vehicleId: d.vehicleId, by: me.id, at: new Date().toISOString(), kind: d.kind, severity: d.kind === 'breakdown' ? d.severity : '', text: d.text, location: d.location || '', photos, taskId: '' };
    db.reports.push(r);
    if (d.kind === 'breakdown') {
      const t = { id: uid('t'), title: `بلاغ عطل: ${d.text.slice(0, 50)}${d.text.length > 50 ? '…' : ''} – ${vShort(v)}`, description: d.text, type: 'maintenance', mkind: 'corrective', vehicleId: v.id, projectId: v.assignment?.projectId || '', assigneeId: '', priority: d.severity === 'low' ? 'low' : d.severity === 'medium' ? 'medium' : 'high', status: 'new', dueDate: today(), createdBy: me.id, createdAt: r.at, source: 'field', reportId: r.id };
      db.tasks.push(t);
      r.taskId = t.id;
      v.status = 'breakdown';
      ui.pendingPhotos = [];
      commit(`بلاغ عطل لـ ${vLabel(v)} – تحويلها إلى «خارج الخدمة» وإنشاء مهمة صيانة للورشة`);
      toast('تم إرسال البلاغ: أُنشئت مهمة صيانة وتحولت المعدة إلى «معطلة»', 'warn');
    } else {
      ui.pendingPhotos = [];
      commit(`ملاحظة ميدانية لـ ${vLabel(v)}`);
      toast('تم إرسال الملاحظة');
    }
  }

  /* =======================================================================
     19) المهام
     ======================================================================= */
  function viewTasks() {
    let list = db.tasks.slice();
    if (ui.tasks.mine) list = list.filter((t) => t.assigneeId === me.id || t.createdBy === me.id);
    if (ui.tasks.type) list = list.filter((t) => t.type === ui.tasks.type);
    const prio = { high: 0, medium: 1, low: 2 };
    return `
      <div class="toolbar">
        <div class="seg">${[['', 'كل الأنواع'], ...Object.entries(TASK_TYPES)].map(([k, l]) => `<button class="${ui.tasks.type === k ? 'on' : ''}" data-action="task-type" data-k="${k}">${l}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" data-change="task-mine" ${ui.tasks.mine ? 'checked' : ''}> مهامي فقط</label>
        <span class="spacer"></span>
        ${can('task.create') ? `<button class="btn btn-primary" data-action="task-new">${icon('plus')} مهمة جديدة</button>` : ''}
      </div>
      <div class="kanban">
        ${TASK_ORDER.map((s) => {
          const col = list.filter((t) => t.status === s).sort((a, b) => prio[a.priority] - prio[b.priority] || (a.dueDate || '').localeCompare(b.dueDate || ''));
          const shown = s === 'done' ? col.slice(0, 12) : col;
          return `<div class="kcol c-${s}"><div class="kcol-head"><span>${TASK_STATUS[s]}</span><span class="n">${col.length}</span></div>
            ${shown.map(taskCard).join('') || '<div class="muted" style="text-align:center;font-size:13px;padding:20px 0">لا توجد مهام</div>'}</div>`;
        }).join('')}
      </div>`;
  }

  function taskCard(t) {
    const v = vehById(t.vehicleId);
    const dd = daysUntil(t.dueDate);
    const i = TASK_ORDER.indexOf(t.status);
    const assignee = userById(t.assigneeId);
    return `<div class="kcard p-${t.priority}">
      <div class="k-title" data-action="task-edit" data-id="${t.id}"><span data-raw>${esc(t.title)}</span></div>
      <div class="k-meta">
        <span class="badge ${t.type === 'maintenance' ? 'b-warn' : t.type === 'operation' ? 'b-primary' : 'b-neutral'}">${TASK_TYPES[t.type]}</span>
        ${t.source === 'field' ? '<span class="badge b-bad">بلاغ ميداني</span>' : ''}
        ${v ? `<span>${esc(vShort(v))}</span>` : ''}
      </div>
      ${t.dueDate ? `<div class="k-meta ${t.status !== 'done' && dd < 0 ? 'overdue-txt' : ''}">${icon('calendar')} ${fmtDate(t.dueDate)}${t.status !== 'done' && dd < 0 ? ' – متأخرة' : ''}</div>` : ''}
      <div class="k-foot">
        <span class="who">${assignee ? avatar(assignee) + esc(assignee.name) : '<span class="muted">' + (t.type === 'maintenance' ? 'فريق الورشة' : 'غير مسندة') + '</span>'}</span>
        <span class="actions">
          ${i > 0 ? `<button class="ibtn" data-action="task-move" data-id="${t.id}" data-dir="-1" title="المرحلة السابقة">${icon('chevR')}</button>` : ''}
          ${i < 3 ? `<button class="ibtn" data-action="task-move" data-id="${t.id}" data-dir="1" title="${i === 2 ? 'اعتماد وإغلاق' : 'المرحلة التالية'}">${icon(i === 2 ? 'check' : 'chevL')}</button>` : ''}
        </span>
      </div>
    </div>`;
  }

  function openTask(id, preset = {}) {
    const t = id ? db.tasks.find((x) => x.id === id) : Object.assign({ type: 'general', priority: 'medium', status: 'new', dueDate: today() }, preset);
    if (!t) return;
    const report = t.reportId ? db.reports.find((r) => r.id === t.reportId) : null;
    const canEdit = can('task.create');
    const assignees = db.users.filter((u) => u.active !== false && u.role !== 'driver');
    openModal({
      title: id ? 'تفاصيل المهمة' : 'مهمة جديدة', size: 'lg', submit: id ? 'حفظ التعديلات' : 'إنشاء المهمة',
      footer: id && can('task.approve') ? `<button type="button" class="btn btn-ghost" data-action="task-delete" data-id="${t.id}" style="color:var(--bad)">${icon('trash')} حذف</button>` : '',
      body: `<div class="form-grid">
        ${field('العنوان *', `<input name="title" required value="${esc(t.title || '')}" ${canEdit ? '' : 'readonly'}>`, 'full')}
        ${field('الوصف', `<textarea name="description" rows="3" ${canEdit ? '' : 'readonly'}>${esc(t.description || '')}</textarea>`, 'full')}
        ${field('نوع المهمة', `<select name="type">${opts(optsMap(TASK_TYPES), t.type)}</select>`)}
        ${field('المعدة', `<select name="vehicleId">${opts(vehicleOpts(), t.vehicleId, 'بدون')}</select>`)}
        ${field('المشروع', `<select name="projectId">${opts(db.projects.map((p) => ({ value: p.id, label: p.name })), t.projectId, 'بدون')}</select>`)}
        ${field('المسؤول', `<select name="assigneeId">${opts(userOpts(assignees), t.assigneeId, 'غير مسندة')}</select>`)}
        ${field('الأولوية', `<select name="priority">${opts(optsMap(PRIORITY), t.priority)}</select>`)}
        ${field('تاريخ الاستحقاق', `<input name="dueDate" type="date" value="${esc(t.dueDate || '')}">`)}
        ${field('الحالة', `<select name="status">${TASK_ORDER.map((s) => `<option value="${s}" ${s === t.status ? 'selected' : ''} ${s === 'done' && !can('task.approve') && t.status !== 'done' ? 'disabled' : ''}>${TASK_STATUS[s]}</option>`).join('')}</select>`)}
        ${t.type === 'maintenance' || !id ? field('نوع الصيانة', `<select name="mkind">${opts(optsMap(MKIND), t.mkind || 'corrective', '—')}</select><span class="hint">إتمام «صيانة دورية» يحدّث موعد الصيانة القادمة تلقائياً</span>`) : ''}
      </div>
      ${report ? `<div class="info-box" style="margin-top:14px"><h4>${icon('camera')} البلاغ الميداني المرتبط</h4><p data-raw>${esc(report.text)}</p><div class="cell-sub" style="margin:6px 0">${esc(uName(report.by))} • ${fmtDateTime(report.at)}${report.location ? ' • ' + esc(report.location) : ''}</div>
        ${report.photos?.length ? `<div class="thumbs">${report.photos.map((p, i) => photoImg(p, 'صورة', report.id, i)).join('')}</div>` : ''}</div>` : ''}
      ${id ? `<p class="cell-sub" style="margin-top:12px">أنشأها ${esc(uName(t.createdBy))} • ${fmtDateTime(t.createdAt)}${t.doneAt ? ' • أُغلقت ' + fmtDateTime(t.doneAt) : ''}</p>` : ''}`,
      onSubmit: (d) => {
        if (id) {
          const statusChanged = d.status !== t.status;
          const newStatus = d.status;
          Object.assign(t, { title: d.title, description: d.description, type: d.type, vehicleId: d.vehicleId, projectId: d.projectId, assigneeId: d.assigneeId, priority: d.priority, dueDate: d.dueDate, mkind: d.type === 'maintenance' ? (d.mkind || 'corrective') : '' });
          if (statusChanged) { setTaskStatus(t, newStatus); } else { commit(`تعديل المهمة «${t.title}»`); toast('تم حفظ المهمة'); }
        } else {
          const nt = { id: uid('t'), title: d.title, description: d.description, type: d.type, mkind: d.type === 'maintenance' ? (d.mkind || 'corrective') : '', vehicleId: d.vehicleId, projectId: d.projectId, assigneeId: d.assigneeId, priority: d.priority, status: d.status === 'done' && !can('task.approve') ? 'new' : d.status, dueDate: d.dueDate, createdBy: me.id, createdAt: new Date().toISOString(), source: preset.source || '', reportId: preset.reportId || '' };
          db.tasks.push(nt);
          if (preset.reportId) { const r = db.reports.find((x) => x.id === preset.reportId); if (r) r.taskId = nt.id; }
          commit(`إنشاء مهمة «${nt.title}»`);
          toast('تم إنشاء المهمة');
        }
      },
    });
  }

  /* =======================================================================
     20) المشاريع والمشرفون
     ======================================================================= */
  function viewProjects() {
    const sups = usersByRole('supervisor');
    return `
      <div class="toolbar"><span class="spacer"></span>
        <button class="btn btn-ghost" data-action="user-new" data-role="supervisor">${icon('users')} إضافة مشرف</button>
        <button class="btn btn-primary" data-action="project-new">${icon('plus')} مشروع جديد</button>
      </div>
      <div class="grid-3">${db.projects.map((p) => {
        const vs = db.vehicles.filter((v) => v.assignment && v.assignment.projectId === p.id);
        const pend = db.timesheets.filter((t) => t.projectId === p.id && t.status === 'pending').length;
        const open = db.tasks.filter((t) => t.projectId === p.id && t.status !== 'done').length;
        return `<div class="card pcard">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div><h3 style="font-size:15.5px">${esc(p.name)}</h3><div class="cell-sub">${icon('pin')} ${esc(p.location || '—')}</div></div>
            <span class="badge ${p.status === 'active' ? 'b-ok' : p.status === 'onhold' ? 'b-warn' : 'b-neutral'}">${PROJECT_STATUS[p.status]}</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${p.kind === 'internal' ? '<span class="badge b-primary">مشروع داخلي</span>' : `<span class="badge b-accent">عميل: ${esc(p.client)}</span>`}</div>
          <div style="display:flex;align-items:center;gap:8px">${avatar(userById(p.supervisorId))}<div><div class="cell-sub">المشرف</div><b>${esc(uName(p.supervisorId))}</b></div></div>
          <div class="p-stats"><div><b>${vs.length}</b><small>معدات</small></div><div><b>${pend}</b><small>ساعات معلقة</small></div><div><b>${open}</b><small>مهام مفتوحة</small></div></div>
          ${vs.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${vs.map((v) => `<span data-action="view-vehicle" data-id="${v.id}" style="cursor:pointer">${plate(v, 'sm')}</span>`).join('')}</div>` : ''}
          <div style="display:flex;gap:8px;margin-top:auto"><button class="btn btn-ghost btn-sm" data-action="project-edit" data-id="${p.id}">${icon('edit')} تعديل</button><button class="btn btn-ghost btn-sm" data-action="task-new" data-project="${p.id}">${icon('plus')} مهمة للمشرف</button></div>
        </div>`;
      }).join('') || `<div class="card">${empty('لا توجد مشاريع', 'folder')}</div>`}</div>

      <div class="card p0">
        <div class="card-head"><h3>${icon('users')} المشرفون وتوزيع المشاريع</h3></div>
        <div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>المشرف</th><th>الهاتف</th><th>المشاريع المسندة</th><th>المعدات تحت الإشراف</th><th>ساعات بانتظار اعتماده</th><th>مهامه المفتوحة</th></tr></thead><tbody>
          ${sups.map((u) => {
            const ps = db.projects.filter((p) => p.supervisorId === u.id);
            const vc = db.vehicles.filter((v) => v.assignment && ps.some((p) => p.id === v.assignment.projectId)).length;
            const pend = db.timesheets.filter((t) => t.status === 'pending' && ps.some((p) => p.id === t.projectId)).length;
            return `<tr><td><div style="display:flex;align-items:center;gap:8px">${avatar(u)}<b>${esc(u.name)}</b></div></td><td class="num">${esc(u.phone || '—')}</td>
              <td>${ps.map((p) => `<span class="badge b-neutral" style="margin:2px">${esc(p.name)}</span>`).join('') || '<span class="muted">—</span>'}</td>
              <td class="num">${vc}</td><td class="num">${pend ? `<span class="badge b-warn">${pend}</span>` : '0'}</td><td class="num">${db.tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done').length}</td></tr>`;
          }).join('') || `<tr><td colspan="6">${empty('لا يوجد مشرفون')}</td></tr>`}
        </tbody></table></div>
      </div>`;
  }

  function openProject(id) {
    const p = id ? projById(id) : { kind: 'external', status: 'active', startDate: today() };
    openModal({
      title: id ? 'تعديل المشروع' : 'مشروع جديد', size: 'lg',
      footer: id ? `<button type="button" class="btn btn-ghost" data-action="project-delete" data-id="${id}" style="color:var(--bad)">${icon('trash')} حذف</button>` : '',
      body: `<div class="form-grid">
        ${field('اسم المشروع *', `<input name="name" required value="${esc(p.name || '')}">`, 'span2')}
        ${field('النوع', `<select name="kind">${opts([{ value: 'internal', label: 'مشروع داخلي' }, { value: 'external', label: 'لعميل خارجي' }], p.kind)}</select>`)}
        ${field('اسم العميل', `<input name="client" value="${esc(p.client || '')}" placeholder="للمشاريع الخارجية">`, 'span2')}
        ${field('الموقع', `<input name="location" value="${esc(p.location || '')}">`)}
        ${field('المشرف المسؤول *', `<select name="supervisorId" required>${opts(userOpts(usersByRole('supervisor')), p.supervisorId, 'اختر المشرف')}</select>`)}
        ${field('تاريخ البدء', `<input name="startDate" type="date" value="${esc(p.startDate || '')}">`)}
        ${field('الحالة', `<select name="status">${opts(optsMap(PROJECT_STATUS), p.status)}</select>`)}
        ${field('ملاحظات', `<textarea name="notes" rows="2">${esc(p.notes || '')}</textarea>`, 'full')}
      </div>`,
      onSubmit: (d) => {
        if (d.kind === 'external' && !d.client) { toast('أدخل اسم العميل للمشروع الخارجي', 'error'); return false; }
        if (d.kind === 'internal') d.client = '';
        if (id) {
          const old = p.supervisorId;
          Object.assign(p, d);
          commit(old !== d.supervisorId ? `إسناد مشروع «${p.name}» إلى المشرف ${uName(d.supervisorId)}` : `تعديل مشروع «${p.name}»`);
        } else {
          db.projects.push(Object.assign({ id: uid('p') }, d));
          commit(`إنشاء مشروع «${d.name}» وإسناده إلى ${uName(d.supervisorId)}`);
        }
        toast('تم حفظ المشروع');
      },
    });
  }

  /* =======================================================================
     21) الفواتير وتقارير التشغيل
     ======================================================================= */
  function viewInvoices() {
    const m = ui.invMonth;
    const ts = db.timesheets.filter((t) => t.date.startsWith(m));
    const approved = ts.filter((t) => t.status === 'approved');
    const pending = ts.filter((t) => t.status === 'pending').length;
    const byV = {};
    approved.forEach((t) => {
      const r = byV[t.vehicleId] || (byV[t.vehicleId] = { hours: 0, km: 0, days: new Set(), projects: new Set() });
      r.hours += Number(t.hours || 0); r.km += Number(t.km || 0); r.days.add(t.date); r.projects.add(t.projectId);
    });
    const rows = Object.keys(byV).map((id) => ({ v: vehById(id), ...byV[id] })).sort((a, b) => b.hours - a.hours);
    const totH = rows.reduce((s, r) => s + r.hours, 0);
    const opr = db.opReports[m];
    const extProjects = db.projects.filter((p) => p.kind === 'external');
    const invs = db.invoices.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return `
      <div class="toolbar">
        <label class="field" style="flex-direction:row;align-items:center;gap:10px"><span>الشهر</span><input type="month" value="${m}" data-change="inv-month" style="width:auto"></label>
        <span class="spacer"></span>
        ${pending ? `<span class="badge b-warn">${pending} سجل بانتظار الاعتماد في هذا الشهر</span>` : ''}
      </div>
      <div class="card p0 section-gap">
        <div class="card-head"><h3>${icon('activity')} تقرير التشغيل – ${fmtMonth(m)} <span class="sub">من الساعات المعتمدة فقط</span></h3>
          ${opr ? `<span class="badge b-ok">${icon('check')} معتمد من ${esc(uName(opr.by))} • ${fmtDate(opr.at)}</span>` : rows.length ? `<button class="btn btn-ok btn-sm" data-action="opreport-approve">${icon('check')} اعتماد تقرير التشغيل</button>` : ''}</div>
        <div style="margin-top:12px">${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>المعدة</th><th>النوع</th><th>المشاريع</th><th>أيام التشغيل</th><th>إجمالي الساعات</th><th>متوسط يومي</th><th>المسافة</th></tr></thead><tbody>
          ${rows.map((r) => `<tr><td>${plate(r.v, 'sm')}</td><td>${esc(r.v ? r.v.type : '')}</td><td>${[...r.projects].map((p) => esc(pName(p))).join('، ')}</td><td class="num">${r.days.size}</td><td class="num"><b>${num(r.hours)}</b></td><td class="num">${num(r.hours / r.days.size, 1)}</td><td class="num">${r.km ? num(r.km) + ' كم' : '—'}</td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="4">الإجمالي</td><td class="num">${num(totH)} ساعة</td><td></td><td class="num">${num(rows.reduce((s, r) => s + r.km, 0))} كم</td></tr></tfoot></table></div>` : empty('لا توجد ساعات معتمدة في هذا الشهر', 'clock')}</div>
      </div>

      <div class="grid-2-1">
        <div class="card p0">
          <div class="card-head"><h3>${icon('file')} الفواتير</h3></div>
          <div style="margin-top:12px">${invs.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>رقم الفاتورة</th><th>العميل / المشروع</th><th>الفترة</th><th>الإجمالي</th><th>الحالة</th><th></th></tr></thead><tbody>
            ${invs.map((i) => `<tr><td class="num"><b>${esc(i.no)}</b></td><td><div class="cell-title">${esc(i.client)}</div><div class="cell-sub">${esc(pName(i.projectId))}</div></td><td>${fmtMonth(i.month)}</td><td class="num"><b>${money(i.total)}</b></td>
              <td><span class="badge ${i.status === 'approved' ? 'b-ok' : 'b-warn'}">${i.status === 'approved' ? 'معتمدة' : 'مسودة'}</span></td>
              <td><div class="actions">${ibtn('eye', 'invoice-view', i.id, 'عرض وطباعة')}${i.status === 'draft' ? ibtn('check', 'invoice-approve', i.id, 'اعتماد', 'ok') + ibtn('trash', 'invoice-delete', i.id, 'حذف', 'danger') : ''}</div></td></tr>`).join('')}
          </tbody></table></div>` : empty('لم تُصدر فواتير بعد', 'file')}</div>
        </div>
        <div class="card" style="align-self:start">
          <div class="card-head"><h3>${icon('plus')} إصدار فاتورة إيجار</h3></div>
          <form data-form="invoice"><div class="form-grid" style="grid-template-columns:1fr">
            ${field('المشروع / العميل', `<select name="projectId" required>${opts(extProjects.map((p) => ({ value: p.id, label: `${p.client} – ${p.name}` })), '', 'اختر المشروع')}</select>`)}
            <p class="cell-sub">تُحسب الفاتورة لشهر <b>${fmtMonth(m)}</b> من الساعات المعتمدة غير المفوترة، حسب نوع الإيجار لكل معدة (ساعي / يومي / شهري) مع ضريبة القيمة المضافة ${APP_CONFIG.vatRate * 100}%.</p>
            <button class="btn btn-primary" type="submit">${icon('file')} إنشاء مسودة الفاتورة</button>
          </div></form>
        </div>
      </div>`;
  }

  function generateInvoice(projectId) {
    const m = ui.invMonth;
    const p = projById(projectId);
    if (!p) return;
    const ts = db.timesheets.filter((t) => t.projectId === projectId && t.status === 'approved' && !t.invoiceId && t.date.startsWith(m));
    if (!ts.length) { toast(`لا توجد ساعات معتمدة غير مفوترة لهذا المشروع في ${fmtMonth(m)}`, 'warn'); return; }
    const groups = {};
    ts.forEach((t) => { (groups[t.vehicleId] = groups[t.vehicleId] || []).push(t); });
    const lines = Object.keys(groups).map((vid) => {
      const v = vehById(vid);
      const list = groups[vid];
      const a = v && v.assignment && v.assignment.projectId === projectId ? v.assignment : { rentalType: 'hourly', rate: 0 };
      const hours = list.reduce((s, t) => s + Number(t.hours || 0), 0);
      const days = new Set(list.map((t) => t.date)).size;
      const rt = a.rentalType || 'hourly';
      const qty = rt === 'hourly' ? hours : rt === 'daily' ? days : 1;
      return { vehicleId: vid, desc: `${v ? v.type + ' ' + v.make + ' – لوحة ' + v.plateNo + ' ' + v.plateCode : 'معدة'}${hasDriver(a) ? ' – مع سائق' : ' – بدون سائق'}`, rentalType: rt, hours, days, qty, rate: Number(a.rate || 0), amount: qty * Number(a.rate || 0) };
    });
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const vat = subtotal * APP_CONFIG.vatRate;
    db.seq.invoice = (db.seq.invoice || 0) + 1;
    const inv = { id: uid('inv'), no: `INV-${m.replace('-', '')}-${pad(db.seq.invoice)}`, projectId, client: p.client, month: m, lines, subtotal, vat, total: subtotal + vat, status: 'draft', createdBy: me.id, createdAt: new Date().toISOString() };
    db.invoices.push(inv);
    ts.forEach((t) => { t.invoiceId = inv.id; });
    commit(`إنشاء مسودة فاتورة ${inv.no} للعميل ${p.client}`);
    toast('تم إنشاء مسودة الفاتورة');
    viewInvoice(inv.id);
  }

  function viewInvoice(id) {
    const i = db.invoices.find((x) => x.id === id);
    if (!i) return;
    const s = S();
    openModal({
      title: `فاتورة ${i.no}`, size: 'lg', printable: true,
      footer: `<button type="button" class="btn btn-ghost" data-action="print">${icon('printer')} طباعة</button>${i.status === 'draft' && can('invoice') ? `<button type="button" class="btn btn-ok" data-action="invoice-approve" data-id="${i.id}">${icon('check')} اعتماد الفاتورة</button>` : ''}`,
      body: `<div class="invoice">
        <div class="inv-head">
          <div class="inv-brand"><img src="${esc(s.logo)}" alt=""><div><b style="font-size:16px">${esc(I18N.lang === 'en' ? s.companyNameEn || s.companyName : s.companyName)}</b>${I18N.lang === 'en' ? '' : `<div class="cell-sub">${esc(s.companyNameEn)}</div>`}</div></div>
          <div style="text-align:end"><b style="font-size:18px;color:var(--primary)">فاتورة إيجار معدات</b><div class="num">${esc(i.no)}</div><span class="badge ${i.status === 'approved' ? 'b-ok' : 'b-warn'}">${i.status === 'approved' ? 'معتمدة' : 'مسودة'}</span></div>
        </div>
        <div class="inv-meta">
          <div class="info-box"><dl class="kv"><dt>العميل</dt><dd>${esc(i.client)}</dd><dt>المشروع</dt><dd>${esc(pName(i.projectId))}</dd></dl></div>
          <div class="info-box"><dl class="kv"><dt>الفترة</dt><dd>${fmtMonth(i.month)}</dd><dt>تاريخ الإصدار</dt><dd>${fmtDate(i.createdAt.slice(0, 10))}</dd>${i.approvedBy ? `<dt>اعتمدها</dt><dd>${esc(uName(i.approvedBy))}</dd>` : ''}</dl></div>
        </div>
        <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>البيان</th><th>نوع الإيجار</th><th>الساعات / الأيام</th><th>الكمية</th><th>السعر</th><th>المبلغ</th></tr></thead><tbody>
          ${i.lines.map((l, k) => `<tr><td>${k + 1}</td><td>${esc(l.desc)}</td><td>${RENTAL[l.rentalType]}</td><td class="num">${num(l.hours)} س / ${l.days} يوم</td><td class="num">${num(l.qty, l.qty % 1 ? 1 : 0)} ${RENTAL_UNIT[l.rentalType]}</td><td class="num">${money(l.rate)}</td><td class="num"><b>${money(l.amount)}</b></td></tr>`).join('')}
        </tbody></table></div>
        <div class="inv-total">
          <div><span>المجموع قبل الضريبة</span><b class="num">${money(i.subtotal)}</b></div>
          <div><span>ضريبة القيمة المضافة ${APP_CONFIG.vatRate * 100}%</span><b class="num">${money(i.vat)}</b></div>
          <div class="grand"><span>الإجمالي المستحق</span><span class="num">${money(i.total)}</span></div>
        </div>
      </div>`,
    });
  }

  /* =======================================================================
     22) المستخدمون
     ======================================================================= */
  function viewUsers() {
    const list = db.users.slice().sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
    const counts = ROLE_ORDER.map((r) => [r, db.users.filter((u) => u.role === r).length]);
    return `
      <section class="kpi-row">${counts.map(([r, n]) => `<div class="kpi"><div class="k-label">${avatar({ role: r, name: ROLES[r] })} ${ROLES[r]}</div><div class="k-val">${n}</div></div>`).join('')}</section>
      <div class="toolbar"><span class="spacer"></span><button class="btn btn-primary" data-action="user-new">${icon('plus')} مستخدم جديد</button></div>
      <div class="card p0"><div class="table-wrap"><table class="table"><thead><tr><th>الاسم</th><th>الدور</th><th>اسم المستخدم</th><th>الهاتف</th><th>الإسناد الحالي</th><th>آخر دخول</th><th>الحالة</th><th></th></tr></thead><tbody>
        ${list.map((u) => {
          let assigned = '—';
          if (u.role === 'driver') { const v = db.vehicles.find((x) => x.assignment && x.assignment.driverId === u.id); assigned = v ? plate(v, 'sm') : '<span class="muted">بدون معدة</span>'; }
          if (u.role === 'supervisor') assigned = db.projects.filter((p) => p.supervisorId === u.id).map((p) => esc(p.name)).join('، ') || '<span class="muted">بدون مشاريع</span>';
          if (u.role === 'maintenance') assigned = `${db.tasks.filter((t) => t.assigneeId === u.id && t.status !== 'done').length} أمر عمل مفتوح`;
          const editable = can('user.edit') && !(me.role === 'manager' && u.role === 'developer');
          return `<tr><td><div style="display:flex;align-items:center;gap:10px">${avatar(u)}<b>${esc(u.name)}</b>${u.id === me.id ? '<span class="badge b-info">أنت</span>' : ''}</div></td>
            <td><span class="badge ${u.role === 'developer' ? 'b-dev' : u.role === 'manager' ? 'b-primary' : 'b-neutral'}">${ROLES[u.role]}</span></td>
            <td class="num">${esc(u.username || '—')}</td><td class="num">${esc(u.phone || '—')}</td><td>${assigned}</td>
            <td class="cell-sub">${u.lastLogin ? fmtDateTime(u.lastLogin) : 'لم يدخل بعد'}${u.mustChange ? '<div><span class="badge b-warn">كلمة مرور مؤقتة</span></div>' : ''}</td>
            <td><span class="badge ${u.active !== false ? 'b-ok' : 'b-bad'}">${u.active !== false ? 'نشط' : 'موقوف'}</span></td>
            <td><div class="actions">${editable ? ibtn('edit', 'user-edit', u.id, 'تعديل') + (u.id !== me.id ? ibtn('trash', 'user-delete', u.id, 'حذف', 'danger') : '') : ''}</div></td></tr>`;
        }).join('')}
      </tbody></table></div></div>`;
  }

  function openUser(id, role) {
    const u = id ? userById(id) : { role: role || 'driver', active: true };
    const roles = ROLE_ORDER.filter((r) => me.role === 'developer' || r !== 'developer');
    openModal({
      title: id ? 'تعديل مستخدم' : 'مستخدم جديد',
      body: `<div class="form-grid two">
        ${field('الاسم الكامل *', `<input name="name" required value="${esc(u.name || '')}">`, 'full')}
        ${field('الدور *', `<select name="role" ${id === me.id ? 'disabled' : ''}>${opts(roles.map((r) => ({ value: r, label: ROLES[r] })), u.role)}</select>`)}
        ${field('اسم المستخدم *', `<input name="username" required value="${esc(u.username || '')}" dir="ltr" style="text-align:right" autocapitalize="none" autocorrect="off" spellcheck="false" ${id ? 'readonly' : ''}>${id ? '<span class="hint">لا يمكن تغيير اسم المستخدم بعد الإنشاء</span>' : ''}`)}
        ${field('رقم الهاتف', `<input name="phone" value="${esc(u.phone || '')}" dir="ltr" style="text-align:right" placeholder="+968">`)}
        ${field('الحالة', `<select name="active" ${id === me.id ? 'disabled' : ''}>${opts([{ value: '1', label: 'نشط' }, { value: '0', label: 'موقوف' }], u.active !== false ? '1' : '0')}</select>`)}
        <h4 class="form-sec">${id ? 'إعادة تعيين كلمة المرور (اختياري)' : 'كلمة المرور'}</h4>
        ${id === me.id ? '<p class="cell-sub field full">لتغيير كلمة مرورك استخدم زر «تغيير كلمة المرور» في الشريط العلوي.</p>' : `
        ${pwInput('password', id ? 'كلمة مرور جديدة' : 'كلمة المرور المؤقتة *', 'new-password', id ? 'placeholder="اتركها فارغة دون تغيير"' : 'required')}
        <label class="check field" style="align-self:end;padding-bottom:10px"><input type="checkbox" name="mustChange" value="1" checked> إلزامه بتغييرها عند الدخول</label>`}
      </div>`,
      onSubmit: async (d) => {
        d.username = Store.normalizeCred(d.username).toLowerCase();
        if (d.password) d.password = Store.normalizeCred(d.password);
        if (!id) {
          const dup = db.users.find((x) => (x.username || '').toLowerCase() === d.username);
          if (dup) { toast('اسم المستخدم مستخدم مسبقاً', 'error'); return false; }
          if (!/^[a-z0-9._-]{3,30}$/.test(d.username)) { toast('اسم المستخدم: 3 أحرف إنجليزية أو أرقام على الأقل، بدون مسافات', 'error'); return false; }
        }
        if (d.password) { const p = passwordProblem(d.password); if (p) { toast(p, 'error'); return false; } }
        const fields = { name: d.name, phone: d.phone || '' };
        if (id !== me.id) { fields.role = d.role; fields.active = d.active !== '0'; }
        try {
          if (id) {
            const nu = await Store.updateProfile(id, fields);
            Object.assign(u, nu);
            if (d.password && id !== me.id) await Store.adminUsers({ action: 'set_password', uid: id, password: d.password, mustChange: !!d.mustChange });
            commit(d.password ? `تعديل بيانات المستخدم ${u.name} وإعادة تعيين كلمة المرور` : `تعديل بيانات المستخدم ${u.name}`);
          } else {
            await Store.adminUsers(Object.assign({ action: 'create', username: d.username, password: d.password, mustChange: !!d.mustChange }, fields));
            await Store.loadAll();
            commit(`إضافة ${ROLES[fields.role]}: ${fields.name}`);
          }
        } catch (e) {
          toast(userErrorText(e.message), 'error');
          return false;
        }
        toast(d.password ? 'تم حفظ المستخدم وكلمة المرور' : 'تم حفظ المستخدم');
      },
    });
  }

  function userErrorText(code) {
    return ({
      USERNAME_TAKEN: 'اسم المستخدم مستخدم مسبقاً',
      BAD_USERNAME: 'اسم المستخدم: 3 أحرف إنجليزية أو أرقام على الأقل، بدون مسافات',
      PASSWORD_TOO_SHORT: `كلمة المرور يجب ألا تقل عن ${APP_CONFIG.minPasswordLength} أحرف`,
      PASSWORD_WEAK: 'كلمة المرور يجب أن تحتوي على حروف إنجليزية وأرقام',
      FORBIDDEN: 'لا تملك صلاحية هذا الإجراء',
      NO_PERMISSION: 'لا تملك صلاحية هذا الإجراء',
      NETWORK: 'لا يوجد اتصال بالإنترنت',
      CANNOT_DELETE_SELF: 'لا يمكنك حذف حسابك',
    })[code] || ('تعذّر تنفيذ العملية: ' + code);
  }

  /* =======================================================================
     22-ب) حول البرنامج والمطور
     -----------------------------------------------------------------------
     المحتوى في قاعدة البيانات (app_settings / about) ويعدّله المطور فقط،
     والقيم الافتراضية في APP_CONFIG.about داخل js/config.js.
     ======================================================================= */
  const ABOUT_CACHE = APP_CONFIG.storageKey + '_about';
  function cacheAbout(a) { try { localStorage.setItem(ABOUT_CACHE, JSON.stringify(a)); } catch (e) { /* ignore */ } }
  function cachedAbout() { try { return JSON.parse(localStorage.getItem(ABOUT_CACHE) || '{}') || {}; } catch (e) { return {}; } }

  /** المحتوى الفعلي: ما حفظه المطور، وإلا القيم الافتراضية */
  function aboutData() {
    const saved = (db && db.about) || cachedAbout();
    const base = APP_CONFIG.about || {};
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = saved[k] !== undefined && saved[k] !== null ? String(saved[k]) : String(base[k] ?? ''); });
    return out;
  }
  /** النص حسب لغة الواجهة، مع الرجوع للعربية إن لم يُكتب الإنجليزي */
  const aboutText = (a, key) => (I18N.lang === 'en' ? (a[key + 'En'] || a[key + 'Ar']) : (a[key + 'Ar'] || a[key + 'En'])) || '';

  /* معلومات المنصة والإصدار (ويندوز من التطبيق نفسه، أندرويد من Capacitor) */
  const platform = { kind: window.desktop ? 'windows' : NATIVE ? 'android' : 'web', version: APP_CONFIG.version, extra: '' };
  async function loadPlatformInfo() {
    try {
      if (window.desktop && window.desktop.getInfo) {
        const i = await window.desktop.getInfo();
        platform.version = i.version || platform.version;
        platform.extra = `${i.os || ''} • ${i.arch || ''} • Electron ${i.electron || ''}`;
      } else if (NATIVE && NP.App && NP.App.getInfo) {
        const i = await NP.App.getInfo();
        platform.version = i.version || platform.version;
        const os = (navigator.userAgent.match(/Android\s([\d.]+)/) || [])[1];
        platform.extra = `${os ? 'Android ' + os + ' • ' : ''}Build ${i.build || ''}`;
      }
    } catch (e) { /* ignore */ }
    if (me && db && currentRoute() === 'about') render();
  }
  const PLATFORM_LABEL = { windows: 'تطبيق ويندوز', android: 'تطبيق أندرويد', web: 'الموقع (المتصفح)' };
  const PLATFORM_ICON = { windows: 'monitor', android: 'phone', web: 'globe' };

  const safeUrl = (u) => { const v = String(u || '').trim(); if (!v) return ''; return /^https?:\/\//i.test(v) ? v : 'https://' + v; };
  const telUrl = (n) => 'tel:' + String(n || '').replace(/[^\d+]/g, '');
  const waUrl = (n) => 'https://wa.me/' + String(n || '').replace(/\D/g, '');

  /** محتوى «حول» (يُستخدم في الصفحة وفي النافذة قبل تسجيل الدخول) */
  function aboutBody(inModal) {
    const s = S();
    const a = aboutData();
    const year = new Date().getFullYear();
    const features = aboutText(a, 'features').split(/\n+/).map((x) => x.trim()).filter(Boolean);
    const devName = aboutText(a, 'developerName');
    const bio = aboutText(a, 'developerBio');
    const address = aboutText(a, 'address');
    const contacts = [
      a.phone && `<a class="contact" href="${esc(telUrl(a.phone))}">${icon('phone')}<span><small>الهاتف</small><b class="num" dir="ltr">${esc(a.phone)}</b></span></a>`,
      a.whatsapp && `<a class="contact" href="${esc(waUrl(a.whatsapp))}" target="_blank" rel="noopener">${icon('chat')}<span><small>واتساب</small><b class="num" dir="ltr">${esc(a.whatsapp)}</b></span></a>`,
      a.email && `<a class="contact" href="mailto:${esc(a.email)}">${icon('mail')}<span><small>البريد الإلكتروني</small><b dir="ltr">${esc(a.email)}</b></span></a>`,
      a.website && `<a class="contact" href="${esc(safeUrl(a.website))}" target="_blank" rel="noopener">${icon('globe')}<span><small>الموقع الإلكتروني</small><b dir="ltr">${esc(a.website.replace(/^https?:\/\//i, ''))}</b></span></a>`,
      address && `<div class="contact">${icon('pin')}<span><small>العنوان</small><b data-raw>${esc(address)}</b></span></div>`,
    ].filter(Boolean);
    const isDev = !!me && me.role === 'developer';
    return `
      <section class="about-hero">
        <img src="${esc(s.logo)}" alt="">
        <div class="grow">
          <h2>${esc(s.systemName)}</h2>
          <p>${esc(I18N.lang === 'en' && s.companyNameEn ? s.companyNameEn : s.companyName)}</p>
          <div class="about-tags">
            <span class="badge b-primary">${icon(PLATFORM_ICON[platform.kind])} ${PLATFORM_LABEL[platform.kind]}</span>
            <span class="badge b-accent">الإصدار <b class="num">${esc(platform.version)}</b></span>
          </div>
        </div>
        ${!inModal && isDev ? `<button class="btn btn-ghost btn-sm about-edit" data-action="about-edit">${icon('edit')} تعديل هذه الصفحة</button>` : ''}
      </section>
      <div class="${inModal ? 'stack' : 'grid-2'}">
        <div class="card">
          <div class="card-head"><h3>${icon('truck')} عن البرنامج</h3></div>
          ${aboutText(a, 'description') ? `<p class="about-desc" data-raw>${esc(aboutText(a, 'description'))}</p>` : ''}
          ${features.length ? `<h4 class="about-sub">المزايا</h4><ul class="about-features" data-raw>${features.map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
          <dl class="kv about-kv">
            <dt>الإصدار</dt><dd class="num">${esc(platform.version)}</dd>
            <dt>المنصة</dt><dd>${PLATFORM_LABEL[platform.kind]}${platform.extra ? `<div class="cell-sub num" data-raw><bdi>${esc(platform.extra)}</bdi></div>` : ''}</dd>
            <dt>المنصات المتاحة</dt><dd>الموقع • أندرويد • ويندوز</dd>
            <dt>البيانات</dt><dd>قاعدة بيانات مركزية متزامنة لحظياً</dd>
          </dl>
          ${platform.kind !== 'web' ? `<div class="about-actions">
            <button class="btn btn-ghost btn-sm" data-action="about-updates">${icon('refresh')} البحث عن تحديثات</button>
            ${platform.kind === 'android' ? `<button class="btn btn-ghost btn-sm" data-action="about-share">${icon('upload')} مشاركة التطبيق</button>` : ''}
          </div>` : ''}
        </div>
        <div class="card">
          <div class="card-head"><h3>${icon('code')} عن المطور</h3></div>
          <div class="about-dev">
            ${a.developerLogo ? `<img class="dev-logo" src="${esc(a.developerLogo)}" alt="">` : `<span class="dev-logo dev-logo-ph">${icon('code')}</span>`}
            <div><b class="dev-name" data-raw>${esc(devName)}</b>${bio ? `<p class="about-desc" data-raw>${esc(bio)}</p>` : ''}</div>
          </div>
          ${contacts.length ? `<div class="contacts">${contacts.join('')}</div>`
            : `<p class="muted about-empty">${isDev ? 'لم تُضف بيانات التواصل بعد — أضفها من «تعديل هذه الصفحة».' : 'للدعم الفني تواصل مع مدير النظام.'}</p>`}
        </div>
      </div>
      <p class="about-copy">© ${year} ${I18N.lang === 'en' ? `All rights reserved — ${esc(APP_CONFIG.copyrightHolderEn || APP_CONFIG.copyrightHolder)}` : `جميع الحقوق محفوظة لـ ${esc(APP_CONFIG.copyrightHolder)}`}<br><span>يُمنع نسخ البرنامج أو إعادة توزيعه أو استخدامه تجارياً دون إذن كتابي من المالك.</span></p>`;
  }

  function viewAbout() { return `<div class="about">${aboutBody(false)}</div>`; }

  /** يُستدعى من قائمة ويندوز (مساعدة ← حول) ومن شاشة الدخول */
  let platformReady = Promise.resolve();
  async function openAbout() {
    await platformReady.catch(() => {});
    if (me && db) { go('about'); return; }
    openModal({ title: 'حول البرنامج والمطور', size: 'lg', body: `<div class="about">${aboutBody(true)}</div>` });
  }

  /* ---------- تحديثات أندرويد ----------
     يقرأ إصدارات GitHub (android-v*) ويختار الأعلى رقماً من المنشورة، ويقارنه بإصدار التطبيق المثبّت. */
  const verParts = (v) => String(v || '').replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
  function isNewer(a, b) {
    const x = verParts(a), y = verParts(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
    return false;
  }
  const UPD_KEY = APP_CONFIG.storageKey + '_updcheck';
  let updChecking = false;
  async function androidCheckUpdate(manual) {
    if (updChecking) return;
    if (!manual) {
      let last = 0;
      try { last = Number(localStorage.getItem(UPD_KEY) || 0); } catch (e) { /* ignore */ }
      if (Date.now() - last < (APP_CONFIG.updates.checkEveryHours || 6) * 3600000) return;
    }
    updChecking = true;
    try {
      await platformReady.catch(() => {});
      const res = await fetch(`https://api.github.com/repos/${APP_CONFIG.updates.repo}/releases?per_page=20`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const list = await res.json();
      const rels = (Array.isArray(list) ? list : [])
        .filter((r) => r && !r.draft && !r.prerelease && /^android-v/.test(r.tag_name || ''))
        .map((r) => ({ v: r.tag_name.replace(/^android-v/, ''), r }))
        .sort((a, b) => (isNewer(a.v, b.v) ? -1 : isNewer(b.v, a.v) ? 1 : 0));
      try { localStorage.setItem(UPD_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      const best = rels[0];
      if (!best) { if (manual) toast('تعذّر العثور على إصدارات التطبيق', 'warn'); return; }
      if (!isNewer(best.v, platform.version)) {
        if (manual) toast(`لديك أحدث إصدار (${platform.version})`, 'success');
        return;
      }
      const asset = (best.r.assets || []).find((a) => /\.apk$/i.test(a.name));
      const url = (asset && asset.browser_download_url) || APP_CONFIG.updates.apkUrl;
      if (!manual && ($('#modal-root').innerHTML || modalLocked)) return;   // لا نقاطع نافذة مفتوحة
      openModal({
        title: 'تحديث جديد متاح',
        body: `<div class="update-box">
            <div class="update-ic">${icon('download')}</div>
            <div>
              <p class="confirm-msg">الإصدار <b class="num">${esc(best.v)}</b> متاح، والمثبّت لديك <b class="num">${esc(platform.version)}</b>.</p>
              <p class="cell-sub" style="margin-top:6px">نزّل الملف ثم افتحه واضغط «تحديث». يُثبَّت فوق النسخة الحالية، وتبقى بياناتك وحسابك كما هي.</p>
            </div>
          </div>`,
        footer: `<a class="btn btn-primary" href="${esc(url)}" rel="noopener" data-action="apk-download">${icon('download')} تنزيل التحديث</a>`,
      });
    } catch (e) {
      if (manual) toast('تعذّر البحث عن تحديثات — تحقق من اتصال الإنترنت', 'error');
    } finally { updChecking = false; }
  }

  /* محرر صفحة «حول» في إعدادات المطور */
  function aboutEditor() {
    const a = aboutData();
    const logo = ui.pendingDevLogo !== undefined && ui.pendingDevLogo !== null ? ui.pendingDevLogo : a.developerLogo;
    const ta = (name, label, rows = 3, ltr = false) => field(label, `<textarea name="${name}" rows="${rows}" ${ltr ? 'dir="ltr"' : ''}>${esc(a[name])}</textarea>`);
    const inp = (name, label, ltr = false, type = 'text', ph = '') => field(label, `<input name="${name}" type="${type}" value="${esc(a[name])}" ${ltr ? 'dir="ltr"' : ''} ${ph ? `placeholder="${esc(ph)}"` : ''}>`);
    return `<form class="card section-gap" data-form="about" id="aboutEditor">
      <div class="card-head"><h3>${icon('info')} صفحة «حول البرنامج والمطور»</h3><button type="button" class="btn-link" data-action="goto" data-route="about">${icon('eye')} معاينة</button></div>
      <p class="cell-sub" style="margin-bottom:12px">يظهر هذا المحتوى لجميع المستخدمين في الموقع وتطبيقي أندرويد وويندوز (قائمة مساعدة ← حول، أو F1). الحقول الفارغة لا تُعرض.</p>
      <div class="form-grid two">
        <h4 class="form-sec">عن البرنامج</h4>
        ${ta('descriptionAr', 'وصف البرنامج (عربي)', 4)}
        ${ta('descriptionEn', 'وصف البرنامج (إنجليزي)', 4, true)}
        ${ta('featuresAr', 'المزايا (عربي) — ميزة في كل سطر', 6)}
        ${ta('featuresEn', 'المزايا (إنجليزي) — ميزة في كل سطر', 6, true)}
        <h4 class="form-sec">عن المطور</h4>
        ${inp('developerNameAr', 'اسم المطور (عربي)')}
        ${inp('developerNameEn', 'اسم المطور (إنجليزي)', true)}
        ${ta('developerBioAr', 'نبذة عن المطور (عربي)')}
        ${ta('developerBioEn', 'نبذة عن المطور (إنجليزي)', 3, true)}
        <div class="field full"><span>شعار المطور</span>
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
            ${logo ? `<img class="logo-preview" id="devLogoPreview" src="${esc(logo)}" alt="">` : `<span class="logo-preview dev-logo-ph" id="devLogoPreview">${icon('code')}</span>`}
            <div style="display:flex;flex-direction:column;gap:8px">
              <label class="btn btn-ghost btn-sm" style="cursor:pointer">${icon('upload')} رفع شعار<input type="file" accept="image/*" data-change="dev-logo-file" hidden></label>
              ${logo ? `<button type="button" class="btn-link" data-action="dev-logo-remove">إزالة الشعار</button>` : ''}
            </div>
          </div>
        </div>
        <h4 class="form-sec">بيانات التواصل</h4>
        ${inp('phone', 'الهاتف', true, 'tel', '+968 ')}
        ${inp('whatsapp', 'واتساب', true, 'tel', '+968 ')}
        ${inp('email', 'البريد الإلكتروني', true, 'email', 'name@example.com')}
        ${inp('website', 'الموقع الإلكتروني', true, 'text', 'www.example.com')}
        ${inp('addressAr', 'العنوان (عربي)')}
        ${inp('addressEn', 'العنوان (إنجليزي)', true)}
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        <button type="submit" class="btn btn-primary">${icon('check')} حفظ صفحة «حول»</button>
        <button type="button" class="btn btn-ghost" data-action="about-defaults">استعادة النص الافتراضي</button>
      </div>
    </form>`;
  }

  function saveAbout(form) {
    const d = formData(form);
    const keys = Object.keys(APP_CONFIG.about || {}).filter((k) => k !== 'developerLogo');
    const next = {};
    keys.forEach((k) => { next[k] = String(d[k] ?? '').trim(); });
    if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) { toast('البريد الإلكتروني غير صحيح', 'error'); return; }
    const prev = aboutData();
    next.developerLogo = ui.pendingDevLogo !== undefined && ui.pendingDevLogo !== null ? ui.pendingDevLogo : prev.developerLogo;
    ui.pendingDevLogo = null;
    db.about = next;
    commit('تحديث صفحة «حول البرنامج والمطور»').then((r) => { if (r && r.ok) toast('تم حفظ صفحة «حول» — تظهر الآن لجميع المستخدمين'); });
  }

  /* =======================================================================
     23) إعدادات المطور
     ======================================================================= */
  const PRESETS = [
    { name: 'الافتراضي', primary: '#0f4c81', accent: '#f2a900', sidebar: '#0b1f33' },
    { name: 'أخضر صناعي', primary: '#166534', accent: '#facc15', sidebar: '#0c1f14' },
    { name: 'عنابي', primary: '#9f1239', accent: '#f59e0b', sidebar: '#1f0a12' },
    { name: 'رمادي فولاذي', primary: '#334155', accent: '#f97316', sidebar: '#0f172a' },
    { name: 'أزرق بترولي', primary: '#0e7490', accent: '#eab308', sidebar: '#082f35' },
  ];

  function viewSettings() {
    const s = S();
    const logo = ui.pendingLogo || s.logo;
    return `<form data-form="settings">
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>${icon('palette')} الهوية البصرية</h3></div>
          <div class="form-grid two">
            ${field('اسم النظام', `<input name="systemName" value="${esc(s.systemNameAr)}" required>`)}
            ${field('اسم النظام (إنجليزي)', `<input name="systemNameEn" value="${esc(s.systemNameEn)}" dir="ltr">`)}
            ${field('اسم الشركة (عربي)', `<input name="companyName" value="${esc(s.companyName)}" required>`)}
            ${field('اسم الشركة (إنجليزي)', `<input name="companyNameEn" value="${esc(s.companyNameEn)}" dir="ltr">`)}
            <div class="field full"><span>شعار الشركة</span>
              <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
                <img class="logo-preview" id="logoPreview" src="${esc(logo)}" alt="الشعار">
                <div style="display:flex;flex-direction:column;gap:8px">
                  <label class="btn btn-ghost btn-sm" style="cursor:pointer">${icon('upload')} رفع شعار جديد<input type="file" accept="image/*" data-change="logo-file" hidden></label>
                  <button type="button" class="btn-link" data-action="logo-reset">استعادة الشعار الافتراضي</button>
                  <span class="hint muted" style="font-size:11.5px">PNG أو SVG بخلفية شفافة، يُفضل مربع الأبعاد</span>
                </div>
              </div>
            </div>
            ${['primary', 'accent', 'sidebar'].map((k) => field({ primary: 'اللون الأساسي', accent: 'اللون المساعد', sidebar: 'لون القائمة الجانبية' }[k],
              `<div class="color-row"><input type="color" name="${k}" value="${esc(s.theme[k])}" data-input="theme-color" data-k="${k}"><input type="text" value="${esc(s.theme[k])}" data-input="theme-hex" data-k="${k}" maxlength="7"></div>`)).join('')}
            <div class="field full"><span>قوالب ألوان جاهزة</span><div class="swatches">${PRESETS.map((p, i) => `<button type="button" class="swatch" title="${p.name}" data-action="preset" data-i="${i}" style="background:linear-gradient(135deg,${p.sidebar} 0 33%,${p.primary} 33% 66%,${p.accent} 66%)"></button>`).join('')}</div></div>
          </div>
        </div>
        <div class="stack">
          <div class="card">
            <div class="card-head"><h3>${icon('bell')} إعدادات التنبيهات</h3></div>
            <div class="form-grid two">
              ${field('التنبيه قبل انتهاء الرخصة/التأمين (يوم)', `<input name="alertDays" type="number" min="1" max="180" value="${s.alertDays}">`, 'full')}
              ${field('تنبيه الصيانة قبل (ساعة تشغيل)', `<input name="thHours" type="number" min="0" value="${s.maintenanceThreshold.hours}">`)}
              ${field('تنبيه الصيانة قبل (كم)', `<input name="thKm" type="number" min="0" value="${s.maintenanceThreshold.km}">`)}
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>${icon('database')} قاعدة البيانات والنسخ الاحتياطي</h3></div>
            <div class="notice" style="margin-bottom:12px">${icon('database')}<span>البيانات محفوظة في قاعدة بيانات مركزية (Supabase) ومتزامنة لحظياً بين الموقع وتطبيق أندرويد وجميع الأجهزة. تُؤخذ نسخ احتياطية من الخادم، ويمكنك أيضاً تصدير نسخة بنفسك.</span></div>
            <div class="cell-sub" style="margin-bottom:12px">${db.vehicles.length} معدة • ${db.users.length} مستخدم • ${db.timesheets.length} سجل ساعات • ${db.tasks.length} مهمة • ${db.reports.length} بلاغ • ${db.invoices.length} فاتورة</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn btn-ghost" data-action="backup-export">${icon('download')} تصدير نسخة احتياطية</button>
              <label class="btn btn-ghost" style="cursor:pointer">${icon('upload')} استيراد نسخة<input type="file" accept="application/json,.json" data-change="backup-import" hidden></label>
            </div>
          </div>
        </div>
      </div>
      <div class="card section-gap">
        <div class="card-head"><h3>${icon('settings')} القيم الافتراضية في الكود</h3></div>
        <p class="cell-sub" style="margin-bottom:10px">التغييرات هنا تُحفظ في قاعدة البيانات وتظهر لجميع المستخدمين. أما القيم التي تُستعاد عند «استعادة الإعدادات الافتراضية» فموجودة في الملف <b class="num">js/config.js</b> في المستودع:</p>
        <div class="code-note" data-raw>const APP_CONFIG = {
  systemName: '${esc(s.systemNameAr)}',
  companyName: '${esc(s.companyName)}',
  logo: 'assets/logo.svg',
  theme: { primary: '${esc(s.theme.primary)}', accent: '${esc(s.theme.accent)}', sidebar: '${esc(s.theme.sidebar)}' },
  alertDays: ${s.alertDays},
  ...
};</div>
      </div>
      <div style="display:flex;gap:10px">
        <button type="submit" class="btn btn-primary">${icon('check')} حفظ الإعدادات</button>
        <button type="button" class="btn btn-ghost" data-action="settings-defaults">استعادة الإعدادات الافتراضية</button>
      </div>
    </form>
    ${aboutEditor()}`;
  }

  function saveSettings(form) {
    const d = formData(form);
    db.settings = Object.assign({}, db.settings, {
      systemName: d.systemName, systemNameEn: d.systemNameEn, companyName: d.companyName, companyNameEn: d.companyNameEn,
      theme: { primary: d.primary, accent: d.accent, sidebar: d.sidebar },
      alertDays: Number(d.alertDays) || APP_CONFIG.alertDays,
      maintenanceThreshold: { hours: Number(d.thHours) || 0, km: Number(d.thKm) || 0 },
    });
    if (ui.pendingLogo !== null) { db.settings.logo = ui.pendingLogo; ui.pendingLogo = null; }
    commit('تحديث إعدادات النظام والهوية البصرية');
    toast('تم حفظ الإعدادات');
  }

  /* =======================================================================
     24) معالجات الأحداث
     ======================================================================= */
  const ACTIONS = {
    'logout': async () => {
      if (me && db) { log(`تسجيل خروج ${me.name}`); await Store.save(); }
      closeModal();
      await Store.signOut();
      me = null; db = null; ui.loginError = ''; ui.loginUser = '';
      render();
    },
    'change-password': () => openChangePassword(false),
    'lang-toggle': () => I18N.toggle(),
    'pw-toggle': (d, el) => {
      const inp = el.parentElement.querySelector('input');
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      el.innerHTML = icon(show ? 'eyeOff' : 'eye');
    },
    'nav': () => closeSidebar(),
    'open-sidebar': openSidebar,
    'close-sidebar': closeSidebar,
    'close-modal': closeModal,
    'modal-bg': (d, el, e) => { if (e.target === el && !modalLocked) closeModal(); },
    'goto': (d) => go(d.route),
    'goto-fleet': (d) => { ui.fleet.status = d.status || ''; go('fleet'); },
    'goto-field': (d) => { ui.fieldKind = d.kind; go('field'); },
    'show-alerts': () => {
      const a = getAlerts();
      openModal({ title: `التنبيهات (${a.length})`, size: 'lg', body: alertList(a) });
    },
    'print': () => window.print(),

    // الأسطول
    'fleet-status': (d) => { ui.fleet.status = d.status; render(); },
    'view-vehicle': (d) => viewVehicle(d.id),
    'vehicle-new': () => openModal({ title: 'إضافة مركبة / معدة جديدة', size: 'xl', body: vehicleForm(), submit: 'إضافة إلى الأسطول', onSubmit: (data) => saveVehicle(data) }),
    'vehicle-edit': (d) => { const v = vehById(d.id); openModal({ title: `تعديل بيانات ${vShort(v)}`, size: 'xl', body: vehicleForm(v), onSubmit: (data) => saveVehicle(data, v.id) }); },
    'vehicle-delete': (d) => {
      const v = vehById(d.id);
      confirmBox(`هل تريد حذف <b>${esc(vLabel(v))}</b> نهائياً من الأسطول؟ ستبقى سجلاتها السابقة في التقارير.`, () => {
        db.vehicles = db.vehicles.filter((x) => x.id !== v.id);
        commit(`حذف ${vLabel(v)} من الأسطول`);
        toast('تم حذف المعدة', 'info');
      }, 'حذف');
    },

    // التشغيل
    'ops-filter': (d) => { ui.ops = d.k; render(); },
    'assign': (d) => openAssign(d.id),
    'release': (d) => {
      const v = vehById(d.id);
      confirmBox(`فك ارتباط <b>${esc(vLabel(v))}</b> من «${esc(pName(v.assignment?.projectId))}» وإرجاعها إلى «شاغرة / جاهزة»؟`, () => {
        const p = pName(v.assignment?.projectId);
        v.assignment = null;
        if (v.status === 'active') v.status = 'idle';
        commit(`فك ارتباط ${vLabel(v)} من «${p}»`);
        toast('تم فك الارتباط');
      }, 'فك الارتباط', false);
    },

    // الساعات
    'ts-filter': (d) => { ui.ts = d.k; render(); },
    'ts-new': openTimesheet,
    'ts-approve': (d) => approveTimesheets([d.id]),
    'ts-approve-all': () => {
      const ids = db.timesheets.filter((t) => tsInScope(t) && canApproveTs(t) && (ui.ts === 'all' || ui.ts === 'pending')).map((t) => t.id);
      confirmBox(`اعتماد ${plural(ids.length, 'سجل', 'سجلات')} ساعات تشغيل دفعة واحدة؟`, () => approveTimesheets(ids), 'اعتماد الكل', false);
    },
    'ts-reject': (d) => {
      const t = db.timesheets.find((x) => x.id === d.id);
      openModal({ title: 'رفض سجل الساعات', submit: 'رفض', danger: true, body: field('سبب الرفض', '<textarea name="reason" rows="3" required placeholder="مثال: عدد الساعات لا يطابق تقرير الموقع"></textarea>'),
        onSubmit: (data) => { t.status = 'rejected'; t.approvedBy = me.id; t.notes = (t.notes ? t.notes + ' • ' : '') + 'سبب الرفض: ' + data.reason; commit(`رفض سجل ساعات ${vShort(vehById(t.vehicleId))} بتاريخ ${fmtDate(t.date)}`); toast('تم رفض السجل', 'info'); } });
    },
    'ts-delete': (d) => confirmBox('حذف سجل الساعات هذا؟', () => { db.timesheets = db.timesheets.filter((t) => t.id !== d.id); commit('حذف سجل ساعات تشغيل'); toast('تم الحذف', 'info'); }, 'حذف'),

    // الصيانة
    'maint-filter': (d) => { ui.maint = d.k; render(); },
    'wo-new': (d) => openWorkOrder(d.id),
    'pm-open': (d) => {
      const v = vehById(d.id);
      openWorkOrder(v.id, { mkind: 'preventive', title: `صيانة دورية عند ${num(v.nextService)} ${v.meterType === 'km' ? 'كم' : 'ساعة'}`, description: 'تغيير الزيوت والفلاتر، فحص شامل حسب جدول الصيانة الدورية.', priority: maintState(v).state === 'overdue' ? 'high' : 'medium', source: 'schedule' });
    },
    'meter-update': (d) => openMeter(d.id),

    // الميدان
    'field-filter': (d) => { ui.field = d.k; render(); },
    'photo-remove': (d) => { ui.pendingPhotos.splice(Number(d.i), 1); $('#photoPreview').innerHTML = photoPreview(); },
    'photo-view': async (d) => {
      const r = db.reports.find((x) => x.id === d.r);
      if (!r) return;
      const p = r.photos[Number(d.i)];
      const src = /^data:/.test(p) ? p : (await Store.photoUrls([p]))[0];
      if (src) openModal({ title: 'صورة البلاغ', size: 'lg', body: `<img class="img-full" src="${esc(src)}" alt="صورة">` });
      else toast('تعذّر تحميل الصورة', 'error');
    },
    'report-to-task': (d) => {
      const r = db.reports.find((x) => x.id === d.id);
      const v = vehById(r.vehicleId);
      openTask(null, { type: 'maintenance', mkind: 'corrective', title: `فحص ملاحظة ميدانية – ${vShort(v)}`, description: r.text, vehicleId: r.vehicleId, projectId: v?.assignment?.projectId || '', source: 'field', reportId: r.id });
    },

    // المهام
    'task-type': (d) => { ui.tasks.type = d.k; render(); },
    'task-new': (d) => openTask(null, d.project ? { projectId: d.project, assigneeId: projById(d.project)?.supervisorId, type: 'operation' } : {}),
    'task-edit': (d) => openTask(d.id),
    'task-move': (d) => {
      const t = db.tasks.find((x) => x.id === d.id);
      const i = TASK_ORDER.indexOf(t.status) + Number(d.dir);
      if (i >= 0 && i < TASK_ORDER.length) setTaskStatus(t, TASK_ORDER[i]);
    },
    'task-delete': (d) => confirmBox('حذف هذه المهمة نهائياً؟', () => {
      const t = db.tasks.find((x) => x.id === d.id);
      db.tasks = db.tasks.filter((x) => x.id !== d.id);
      db.reports.forEach((r) => { if (r.taskId === d.id) r.taskId = ''; });
      commit(`حذف المهمة «${t ? t.title : ''}»`);
      toast('تم حذف المهمة', 'info');
    }, 'حذف'),

    // المشاريع والمستخدمون
    'project-new': () => openProject(),
    'project-edit': (d) => openProject(d.id),
    'project-delete': (d) => {
      const p = projById(d.id);
      if (db.vehicles.some((v) => v.assignment && v.assignment.projectId === p.id)) { toast('لا يمكن حذف مشروع مرتبطة به معدات – فك ارتباطها أولاً', 'error'); return; }
      confirmBox(`حذف مشروع «${esc(p.name)}»؟`, () => { db.projects = db.projects.filter((x) => x.id !== p.id); commit(`حذف مشروع «${p.name}»`); toast('تم حذف المشروع', 'info'); }, 'حذف');
    },
    'user-new': (d) => openUser(null, d.role),
    'user-edit': (d) => openUser(d.id),
    'user-delete': (d) => {
      const u = userById(d.id);
      confirmBox(`حذف المستخدم <b>${esc(u.name)}</b>؟ يُفضّل إيقافه بدلاً من حذفه للحفاظ على السجلات.`, async () => {
        try {
          await Store.adminUsers({ action: 'delete', uid: u.id });
        } catch (e) { toast(userErrorText(e.message), 'error'); return; }
        db.users = db.users.filter((x) => x.id !== u.id);
        commit(`حذف المستخدم ${u.name}`);
        toast('تم حذف المستخدم', 'info');
      }, 'حذف');
    },

    // الفواتير
    'opreport-approve': () => { db.opReports[ui.invMonth] = { by: me.id, at: today() }; commit(`اعتماد تقرير التشغيل لشهر ${fmtMonth(ui.invMonth)}`); toast('تم اعتماد تقرير التشغيل'); },
    'invoice-view': (d) => viewInvoice(d.id),
    'invoice-approve': (d) => {
      const i = db.invoices.find((x) => x.id === d.id);
      confirmBox(`اعتماد الفاتورة <b>${esc(i.no)}</b> بقيمة <b>${money(i.total)}</b>؟ لا يمكن تعديلها بعد الاعتماد.`, () => {
        i.status = 'approved'; i.approvedBy = me.id; i.approvedAt = new Date().toISOString();
        commit(`اعتماد الفاتورة ${i.no} – ${money(i.total)}`);
        toast('تم اعتماد الفاتورة');
      }, 'اعتماد', false);
    },
    'invoice-delete': (d) => confirmBox('حذف مسودة الفاتورة؟ ستعود ساعاتها إلى «غير مفوترة».', () => {
      db.timesheets.forEach((t) => { if (t.invoiceId === d.id) t.invoiceId = ''; });
      db.invoices = db.invoices.filter((x) => x.id !== d.id);
      commit('حذف مسودة فاتورة');
      toast('تم حذف المسودة', 'info');
    }, 'حذف'),

    // الإعدادات
    'preset': (d) => {
      const p = PRESETS[Number(d.i)];
      ['primary', 'accent', 'sidebar'].forEach((k) => {
        $(`input[type=color][name=${k}]`).value = p[k];
        $(`input[data-input=theme-hex][data-k=${k}]`).value = p[k];
      });
      applyTheme(p);
    },
    'about-open': () => openAbout(),
    'about-edit': () => { go('settings'); setTimeout(() => { const el = $('#aboutEditor'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); },
    'about-updates': () => {
      if (window.desktop && window.desktop.checkUpdates) window.desktop.checkUpdates();
      else if (NATIVE) androidCheckUpdate(true);
    },
    'about-share': async () => {
      const url = APP_CONFIG.updates.apkUrl;
      const text = I18N.lang === 'en' ? 'Fleet & Equipment Management – Android app' : 'تطبيق أسطول الماسية لأندرويد – نظام إدارة الأسطول والمعدات';
      try {
        if (NP.Share) await NP.Share.share({ title: text, text, url, dialogTitle: text });
        else { await navigator.clipboard.writeText(url); toast('تم نسخ رابط التحميل', 'info'); }
      } catch (e) { /* أُلغيت المشاركة */ }
    },
    'apk-download': () => { closeModal(); },
    'dev-logo-remove': () => { ui.pendingDevLogo = ''; render(); setTimeout(() => { const el = $('#aboutEditor'); if (el) el.scrollIntoView({ block: 'start' }); }, 30); },
    'about-defaults': () => confirmBox('استعادة نص صفحة «حول» الافتراضي؟ ستُحذف بيانات التواصل التي أضفتها.', () => {
      db.about = {}; ui.pendingDevLogo = null;
      commit('استعادة صفحة «حول» الافتراضية');
      toast('تمت الاستعادة');
    }, 'استعادة', false),
    'logo-reset': () => { ui.pendingLogo = APP_CONFIG.logo; $('#logoPreview').src = APP_CONFIG.logo; },
    'settings-defaults': () => confirmBox('استعادة اسم النظام والشعار والألوان والتنبيهات إلى القيم الموجودة في ملف config.js؟', () => {
      db.settings = {}; ui.pendingLogo = null; commit('استعادة الإعدادات الافتراضية'); toast('تمت الاستعادة');
    }, 'استعادة', false),
    'backup-export': () => {
      saveFile(`almasiya-fleet-backup-${today()}.json`, JSON.stringify(db, null, 2), 'application/json').then((ok) => {
        if (!ok) return;
        log('تصدير نسخة احتياطية'); Store.save(db);
        if (!NATIVE) toast('تم تنزيل النسخة الاحتياطية');
      });
    },
  };

  const CHANGES = {
    // تسجيل الساعات: السائق يتبع المعدة المختارة (فارغ للمعدات المؤجرة بدون سائق)
    'ts-vehicle': (el) => {
      const v = vehById(el.value);
      const sel = $('#modalForm select[name=driverId]');
      if (sel && v) sel.value = hasDriver(v.assignment) ? (v.assignment.driverId || '') : '';
    },
    'vehicle-status': (el) => {
      const v = vehById(el.dataset.id);
      const s = el.value;
      if (s === 'active' && !v.assignment && can('assign')) { el.value = v.status; closeModal(); openAssign(v.id); return; }
      const inModal = !!el.closest('.modal');
      setVehicleStatus(v, s);
      if (inModal) viewVehicle(v.id);
    },
    'fleet-filter': (el) => { ui.fleet[el.dataset.key] = el.value; $('#fleetTable').innerHTML = fleetTable(); },
    'assign-kind': toggleRentalFields,
    'assign-project': (el) => {
      const p = projById(el.value);
      const client = $('#modalForm input[name=client]');
      if (p && client) client.value = p.client || '';
      const kind = $('#modalForm select[name=kind]');
      if (p && kind) { kind.value = p.kind === 'internal' ? 'internal' : 'rental'; toggleRentalFields(); }
    },
    'task-status': (el) => setTaskStatus(db.tasks.find((t) => t.id === el.dataset.id), el.value),
    'task-mine': (el) => { ui.tasks.mine = el.checked; render(); },
    'field-kind': (el) => {
      ui.fieldKind = el.value;
      const br = el.value === 'breakdown';
      $('#sevField').style.display = br ? '' : 'none';
      const b = $('#fieldSubmit');
      b.className = `btn ${br ? 'btn-danger' : 'btn-primary'}`;
      b.innerHTML = br ? icon('alert') + ' إرسال بلاغ العطل' : icon('upload') + ' إرسال الملاحظة';
    },
    'field-photos': async (el) => {
      const files = Array.from(el.files || []).slice(0, 3 - ui.pendingPhotos.length);
      if (!files.length) { toast('الحد الأقصى 3 صور', 'warn'); return; }
      try {
        for (const f of files) ui.pendingPhotos.push(await readImage(f, 900));
        $('#photoPreview').innerHTML = photoPreview();
      } catch (e) { toast('تعذّرت قراءة الصورة', 'error'); }
      el.value = '';
    },
    'inv-month': (el) => { if (el.value) { ui.invMonth = el.value; render(); } },
    'dev-logo-file': async (el) => {
      const f = el.files && el.files[0];
      if (!f) return;
      try {
        ui.pendingDevLogo = f.type === 'image/svg+xml' && f.size < 100000
          ? await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); })
          : await readImage(f, 256);
        const prev = $('#devLogoPreview');
        if (prev) prev.outerHTML = `<img class="logo-preview" id="devLogoPreview" src="${ui.pendingDevLogo}" alt="">`;
        toast('اضغط «حفظ صفحة حول» لتطبيق الشعار', 'info');
      } catch (e) { toast('تعذّرت قراءة الصورة', 'error'); }
    },
    'logo-file': async (el) => {
      const f = el.files && el.files[0];
      if (!f) return;
      try {
        ui.pendingLogo = f.type === 'image/svg+xml' && f.size < 150000
          ? await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); })
          : await readImage(f, 256);
        $('#logoPreview').src = ui.pendingLogo;
        toast('اضغط «حفظ الإعدادات» لتطبيق الشعار', 'info');
      } catch (e) { toast('تعذّرت قراءة الصورة', 'error'); }
    },
    'backup-import': (el) => {
      const f = el.files && el.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const data = JSON.parse(fr.result);
          if (!data || !Array.isArray(data.vehicles)) throw new Error('bad');
          const T = ['vehicles', 'projects', 'timesheets', 'tasks', 'reports', 'invoices'];
          const total = T.reduce((n, t) => n + (Array.isArray(data[t]) ? data[t].length : 0), 0);
          confirmBox(`استيراد ${num(total)} سجلاً من النسخة إلى قاعدة البيانات المركزية؟ تُحدَّث السجلات الموجودة بنفس الرقم وتُضاف الجديدة، ولا يُحذف شيء. حسابات المستخدمين لا تُستورد.`, () => {
            T.forEach((t) => {
              if (!Array.isArray(data[t])) return;
              const byId = new Map(db[t].map((r) => [r.id, r]));
              data[t].forEach((r) => { if (r && r.id) byId.set(r.id, r); });
              db[t] = Array.from(byId.values());
            });
            commit('استيراد نسخة احتياطية');
            toast('تم استيراد البيانات');
          }, 'استيراد', false);
        } catch (e) { toast('الملف غير صالح – يجب أن يكون نسخة احتياطية من هذا النظام', 'error'); }
      };
      fr.readAsText(f);
      el.value = '';
    },
  };

  const INPUTS = {
    'fleet-q': (el) => { ui.fleet.q = el.value; $('#fleetTable').innerHTML = fleetTable(); },
    'theme-color': (el) => {
      $(`input[data-input=theme-hex][data-k=${el.dataset.k}]`).value = el.value;
      document.documentElement.style.setProperty('--' + el.dataset.k, el.value);
    },
    'theme-hex': (el) => {
      if (/^#[0-9a-f]{6}$/i.test(el.value)) {
        $(`input[type=color][name=${el.dataset.k}]`).value = el.value;
        document.documentElement.style.setProperty('--' + el.dataset.k, el.value);
      }
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (!fn) return;
    // لا نمنع السلوك الافتراضي للروابط ولا لخلفية النافذة (حتى تعمل أزرار الإرسال داخلها)
    if (!['nav', 'modal-bg', 'apk-download'].includes(el.dataset.action)) e.preventDefault();
    fn(el.dataset, el, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && CHANGES[el.dataset.change]) CHANGES[el.dataset.change](el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && INPUTS[el.dataset.input]) INPUTS[el.dataset.input](el, e);
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target;
    if (f.id === 'modalForm') {
      e.preventDefault();
      if (!modalCb) { closeModal(); return; }
      const res = await modalCb(formData(f), f);
      if (res !== false && $('#modalForm') === f) closeModal();
      return;
    }
    if (f.dataset.form === 'field') { e.preventDefault(); submitField(f); }
    if (f.dataset.form === 'settings') { e.preventDefault(); saveSettings(f); }
    if (f.dataset.form === 'about') { e.preventDefault(); saveAbout(f); }
    if (f.dataset.form === 'login') { e.preventDefault(); doLogin(f); }
    if (f.dataset.form === 'invoice') { e.preventDefault(); const d = formData(f); if (d.projectId) generateInvoice(d.projectId); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if ($('#modal-root').innerHTML) { if (!modalLocked) closeModal(); } else closeSidebar(); }
  });
  window.addEventListener('hashchange', render);
  /* ---------- المزامنة اللحظية: تحديث الشاشة عند وصول تعديلات من أجهزة أخرى ---------- */
  let remoteTimer = null;
  function scheduleRemoteRender() {
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(() => {
      // لا نعيد الرسم أثناء الكتابة في حقل داخل الصفحة حتى لا يضيع ما يُكتب
      const a = document.activeElement;
      if (a && a.closest && a.closest('#view') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { a.addEventListener('blur', scheduleRemoteRender, { once: true }); return; }
      if (!me || !db) return;
      const u = db.users.find((x) => x.id === me.id);
      if (!u || u.active === false) { ACTIONS.logout(); return; }
      me = u;
      render();
    }, 250);
  }
  Store.on((type, detail) => {
    if (type === 'remote' || type === 'reload') scheduleRemoteRender();
    if (type === 'status') renderSync();
  });

  function renderSync() {
    const el = $('#syncState');
    if (!el) return;
    const st = Store.status;
    const map = {
      idle: ['ok', 'متزامن', 'check'],
      saving: ['busy', 'جارٍ الحفظ…', 'refresh'],
      offline: ['off', 'غير متصل', 'alert'],
      error: ['err', 'خطأ في الحفظ', 'alert'],
    };
    const [cls, label, ic] = map[st] || map.idle;
    el.className = `sync-state ${cls}`;
    el.innerHTML = `${icon(ic)}<span>${label}</span>`;
    el.title = label;
  }

  /* =======================================================================
     25) التشغيل
     ======================================================================= */
  (function init() {
    I18N.apply();
    platformReady = loadPlatformInfo();
    // أندرويد: فحص تلقائي للتحديثات (لا يتحدث التطبيق وحده كما في ويندوز)
    if (NATIVE) platformReady.then(() => setTimeout(() => androidCheckUpdate(false), 4000));
    // ويندوز: قائمة «مساعدة ← حول» (أو F1) تفتح صفحة «حول» داخل التطبيق
    if (window.desktop && window.desktop.onOpenAbout) window.desktop.onOpenAbout(() => { if (modalLocked) return; closeModal(); openAbout(); });
    // زر الرجوع في أندرويد: يغلق النافذة أو القائمة أولاً، ثم يعود للرئيسية، ثم يخرج من التطبيق
    if (NATIVE && NP.App) {
      NP.App.addListener('backButton', () => {
        if ($('#modal-root').innerHTML) { if (!modalLocked) closeModal(); return; }
        if ($('#sidebar').classList.contains('open')) { closeSidebar(); return; }
        if (me) {
          const home = Object.keys(PAGES).find((k) => PAGES[k].roles.includes(me.role));
          if (currentRoute() !== home) { go(home); return; }
        }
        NP.App.exitApp();
      });
    }
    // تطبيق الويب القابل للتثبيت (PWA): العمل دون اتصال
    if (!NATIVE && 'serviceWorker' in navigator && location.protocol === 'https:') {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
    // جلسة محفوظة؟ تحميل البيانات مباشرة دون إعادة تسجيل الدخول
    render();
    Store.getSession().then(async (session) => {
      if (!session) return;
      $('#login-screen').innerHTML = `<div class="boot">${icon('refresh', 'spin')}<span>جارٍ تحميل البيانات…</span></div>`;
      const ok = await startSession(false);
      if (ok && me.mustChange) openChangePassword(true);
    }).catch(() => render());
  })();
})();
