/* =========================================================================
   © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
   طبقة البيانات — قاعدة بيانات مركزية (Supabase) مع مزامنة لحظية
   -------------------------------------------------------------------------
   • كل الأجهزة (الموقع وتطبيقا أندرويد وويندوز) تقرأ وتكتب في القاعدة نفسها.
   • التغييرات تظهر فوراً عند الجميع (Realtime).
   • الصلاحيات مطبّقة على الخادم (Row Level Security)، لا في المتصفح فقط.
   • عند انقطاع الإنترنت: تُعرض آخر نسخة محفوظة، وتُرسل التعديلات عند عودة الاتصال.
   ========================================================================= */

const Store = (function () {
  'use strict';

  const CFG = APP_CONFIG.supabase;
  const TABLES = ['vehicles', 'projects', 'timesheets', 'tasks', 'reports', 'invoices', 'activity'];
  const APPEND_ONLY = { activity: true };           // سجل النشاط: إضافة فقط، لا حذف
  const SETTINGS_ROWS = { settings: 'settings', seq: 'seq', opReports: 'opReports', about: 'about' };
  const CACHE_KEY = APP_CONFIG.storageKey + '_cache';
  const ACTIVITY_LIMIT = 150;

  const client = window.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: APP_CONFIG.storageKey + '_auth' },
    realtime: { params: { eventsPerSecond: 20 } },
  });

  let db = null;          // الحالة الحالية (نفس الكائن الذي يستخدمه التطبيق)
  let snap = {};          // آخر نسخة متزامنة مع الخادم: جدول ← (id ← JSON)
  let channel = null;
  let listeners = [];
  let status = 'idle';    // idle | saving | offline | error
  let saving = null;
  let pendingAgain = false;

  /* ---------------- أدوات ---------------- */
  const pad = (n) => String(n).padStart(2, '0');
  function fmtDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /** JSON بترتيب ثابت للمفاتيح (للمقارنة مع ما يعيده الخادم) */
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }

  /** توحيد ما تكتبه لوحات المفاتيح في الجوال (أرقام عربية، علامات اتجاه غير مرئية) */
  function normalizeCred(s) {
    return String(s ?? '')
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
      .replace(/[​-‏‪-‮⁦-⁩﻿­]/g, '')
      .replace(/ /g, ' ')
      .trim();
  }
  const emailOf = (username) => `${normalizeCred(username).toLowerCase()}@${CFG.emailDomain}`;

  function setStatus(s) { if (status !== s) { status = s; emit('status', s); } }
  function emit(type, detail) { listeners.forEach((fn) => { try { fn(type, detail); } catch (e) { console.error(e); } }); }
  function on(fn) { listeners.push(fn); }

  function errMsg(e) {
    const m = String((e && (e.message || e.error_description || e.error)) || e || '');
    if (/Failed to fetch|NetworkError|network|Load failed|fetch/i.test(m)) return 'NETWORK';
    if (/row-level security|permission|NO_PERMISSION|42501/i.test(m)) return 'PERMISSION';
    return m || 'UNKNOWN';
  }

  /* ---------------- التخزين المحلي (للعمل دون اتصال) ---------------- */
  function cacheLocal() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ db, snap: serializeSnap() })); } catch (e) { /* المساحة ممتلئة */ }
  }
  function serializeSnap() { const o = {}; Object.keys(snap).forEach((t) => { o[t] = Array.from(snap[t].entries()); }); return o; }
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      snap = {};
      Object.keys(c.snap || {}).forEach((t) => { snap[t] = new Map(c.snap[t]); });
      return c.db;
    } catch (e) { return null; }
  }
  function clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ } }

  /* ---------------- تسجيل الدخول ---------------- */
  async function signIn(username, password) {
    const { data, error } = await client.auth.signInWithPassword({ email: emailOf(username), password: normalizeCred(password) });
    if (error) throw error;
    return data.session;
  }
  async function signOut() {
    try { if (channel) await client.removeChannel(channel); } catch (e) { /* ignore */ }
    channel = null;
    clearCache();
    db = null; snap = {};
    await client.auth.signOut().catch(() => {});
  }
  async function getSession() {
    const { data } = await client.auth.getSession();
    return data.session || null;
  }
  async function verifyPassword(username, password) {
    const { error } = await client.auth.signInWithPassword({ email: emailOf(username), password: normalizeCred(password) });
    return !error;
  }
  async function changeOwnPassword(newPassword) {
    const { error } = await client.auth.updateUser({ password: normalizeCred(newPassword) });
    if (error) throw error;
    const r = await client.rpc('clear_must_change');
    if (r.error) throw r.error;
  }
  async function touchLogin() { await client.rpc('touch_login'); }

  /* ---------------- تحميل البيانات ---------------- */
  async function fetchAll(table) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await client.from(table).select('id,data').order('id').range(from, from + 999);
      if (error) throw error;
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  }

  const profileToUser = (p) => ({
    id: p.uid, authId: p.auth_id, username: p.username, name: p.name, role: p.role, phone: p.phone,
    active: p.active, mustChange: p.must_change, lastLogin: p.last_login,
  });

  async function loadAll() {
    const [profiles, settingsRows, activity, ...rest] = await Promise.all([
      client.from('profiles').select('*').order('uid'),
      client.from('app_settings').select('id,data'),
      client.from('activity').select('id,data').order('updated_at', { ascending: false }).limit(ACTIVITY_LIMIT),
      ...TABLES.filter((t) => t !== 'activity').map(fetchAll),
    ]);
    if (profiles.error) throw profiles.error;
    if (settingsRows.error) throw settingsRows.error;
    if (activity.error) throw activity.error;

    const next = { users: profiles.data.map(profileToUser), settings: {}, seq: { invoice: 0 }, opReports: {}, about: {} };
    snap = {};
    TABLES.filter((t) => t !== 'activity').forEach((t, i) => {
      next[t] = rest[i].map((r) => Object.assign({}, r.data, { id: r.id }));
    });
    next.activity = activity.data.map((r) => Object.assign({}, r.data, { id: r.id }))
      .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
    TABLES.forEach((t) => { snap[t] = new Map(next[t].map((r) => [r.id, canon(r)])); });
    snap.app_settings = new Map();
    settingsRows.data.forEach((r) => {
      const key = Object.keys(SETTINGS_ROWS).find((k) => SETTINGS_ROWS[k] === r.id);
      if (key) { next[key] = r.data || {}; snap.app_settings.set(r.id, canon(next[key])); }
    });

    if (db) { Object.keys(db).forEach((k) => delete db[k]); Object.assign(db, next); } else db = next;
    cacheLocal();
    return db;
  }

  /** تحميل من الخادم، أو من آخر نسخة محفوظة عند انقطاع الاتصال */
  async function load() {
    try {
      const d = await loadAll();
      setStatus('idle');
      return { db: d, offline: false };
    } catch (e) {
      const cached = loadCache();
      if (cached && errMsg(e) === 'NETWORK') {
        db = cached;
        setStatus('offline');
        return { db, offline: true };
      }
      throw e;
    }
  }

  /* ---------------- الحفظ (إرسال الفروقات فقط) ---------------- */
  function diff() {
    const ops = [];
    TABLES.forEach((t) => {
      const prev = snap[t] || (snap[t] = new Map());
      const list = Array.isArray(db[t]) ? db[t] : [];
      const cur = new Map(list.map((r) => [r.id, r]));
      const inserts = [], updates = [];
      cur.forEach((r, id) => {
        const c = canon(r);
        if (!prev.has(id)) inserts.push({ id, data: r, c });
        else if (prev.get(id) !== c) updates.push({ id, data: r, c });
      });
      const deletes = APPEND_ONLY[t] ? [] : Array.from(prev.keys()).filter((id) => !cur.has(id));
      if (inserts.length || updates.length || deletes.length) ops.push({ t, inserts, updates, deletes });
    });
    const sPrev = snap.app_settings || (snap.app_settings = new Map());
    const sUpd = [];
    Object.keys(SETTINGS_ROWS).forEach((k) => {
      const id = SETTINGS_ROWS[k], c = canon(db[k] || {});
      if (sPrev.get(id) !== c) sUpd.push({ id, data: db[k] || {}, c });
    });
    if (sUpd.length) ops.push({ t: 'app_settings', inserts: [], updates: sUpd, deletes: [] });
    return ops;
  }

  async function pushOps(ops) {
    const errors = [];
    await Promise.all(ops.map(async ({ t, inserts, updates, deletes }) => {
      const prev = snap[t];
      if (inserts.length) {
        const { error } = await client.from(t).insert(inserts.map(({ id, data }) => ({ id, data })));
        if (error) errors.push(error); else inserts.forEach((r) => prev.set(r.id, r.c));
      }
      if (updates.length) {
        const { data: n, error } = await client.rpc('bulk_update', { tbl: t, rows: updates.map(({ id, data }) => ({ id, data })) });
        if (error) errors.push(error);
        else if (n < updates.length) errors.push(new Error('NO_PERMISSION'));
        else updates.forEach((r) => prev.set(r.id, r.c));
      }
      if (deletes.length) {
        const { data, error } = await client.from(t).delete().in('id', deletes).select('id');
        if (error) errors.push(error);
        else {
          (data || []).forEach((r) => prev.delete(r.id));
          if ((data || []).length < deletes.length) errors.push(new Error('NO_PERMISSION'));
        }
      }
    }));
    return errors;
  }

  /** يحفظ كل التعديلات المحلية على الخادم. يُعيد Promise بنتيجة {ok, error} */
  function save() {
    if (!db) return Promise.resolve({ ok: true });
    cacheLocal();
    if (saving) { pendingAgain = true; return saving; }
    saving = (async () => {
      let result = { ok: true };
      do {
        pendingAgain = false;
        const ops = diff();
        if (!ops.length) break;
        setStatus('saving');
        let errors;
        try { errors = await pushOps(ops); } catch (e) { errors = [e]; }
        if (errors.length) {
          const kind = errMsg(errors[0]);
          result = { ok: false, error: kind };
          setStatus(kind === 'NETWORK' ? 'offline' : 'error');
          if (kind === 'PERMISSION') await rollback();   // التراجع عن تعديل رفضه الخادم
          break;
        }
      } while (pendingAgain);
      if (result.ok) setStatus('idle');
      cacheLocal();
      saving = null;
      return result;
    })();
    return saving;
  }

  /** عند رفض الخادم لتعديل: نعيد تحميل البيانات الحقيقية */
  async function rollback() {
    try { await loadAll(); emit('reload'); } catch (e) { /* ignore */ }
  }

  function pendingCount() { return diff().reduce((s, o) => s + o.inserts.length + o.updates.length + o.deletes.length, 0); }

  /* ---------------- المزامنة اللحظية ---------------- */
  function applyRemote(table, payload) {
    if (!db) return;
    if (table === 'profiles') {
      const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
      if (!row) return;
      if (payload.eventType === 'DELETE') db.users = db.users.filter((u) => u.authId !== row.auth_id);
      else {
        const u = profileToUser(row);
        const i = db.users.findIndex((x) => x.authId === u.authId);
        if (i >= 0) db.users[i] = u; else db.users.push(u);
      }
      emit('remote', table);
      return;
    }
    if (table === 'app_settings') {
      const row = payload.new;
      if (!row) return;
      const key = Object.keys(SETTINGS_ROWS).find((k) => SETTINGS_ROWS[k] === row.id);
      if (!key) return;
      const c = canon(row.data || {});
      if (snap.app_settings.get(row.id) === c) return;
      snap.app_settings.set(row.id, c);
      db[key] = row.data || {};
      emit('remote', table);
      return;
    }
    const prev = snap[table] || (snap[table] = new Map());
    if (payload.eventType === 'DELETE') {
      const id = payload.old && payload.old.id;
      if (!id || !prev.has(id)) return;
      prev.delete(id);
      db[table] = db[table].filter((r) => r.id !== id);
    } else {
      const row = payload.new;
      if (!row) return;
      const rec = Object.assign({}, row.data, { id: row.id });
      const c = canon(rec);
      if (prev.get(row.id) === c) return;   // صدى تعديلنا نحن
      prev.set(row.id, c);
      const i = db[table].findIndex((r) => r.id === row.id);
      if (i >= 0) db[table][i] = rec;
      else if (table === 'activity') db[table].unshift(rec);
      else db[table].push(rec);
    }
    cacheLocal();
    emit('remote', table);
  }

  function subscribe() {
    if (channel) return;
    channel = client.channel('fleet-sync');
    [...TABLES, 'app_settings', 'profiles'].forEach((t) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, (p) => applyRemote(t, p));
    });
    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED') emit('realtime', 'on');
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') emit('realtime', 'off');
    });
  }

  /* الهوية المنشورة (settings / about): متاحة للقراءة قبل تسجيل الدخول، مع متابعة لحظية */
  let brandChannel = null;
  async function watchBrand(cb) {
    const ids = ['settings', 'about'];
    const pull = async () => {
      try {
        const { data, error } = await client.from('app_settings').select('id,data').in('id', ids);
        if (!error && data) data.forEach((r) => cb(r.id, r.data || {}));
      } catch (e) { /* دون اتصال: تبقى النسخة المحفوظة */ }
    };
    await pull();
    if (brandChannel) return;
    brandChannel = client.channel('brand-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (p) => {
        const r = p.new;
        if (r && ids.includes(r.id)) cb(r.id, r.data || {});
      })
      .subscribe();
    window.addEventListener('online', pull);
  }

  // عودة الاتصال: إرسال المعلّق ثم تحديث البيانات
  window.addEventListener('online', async () => {
    if (!db) return;
    await save();
    try { await loadAll(); setStatus('idle'); emit('reload'); } catch (e) { /* ignore */ }
  });
  window.addEventListener('offline', () => { if (db) setStatus('offline'); });

  /* ---------------- الحسابات (عبر الخادم) ---------------- */
  async function adminUsers(body) {
    const { data, error } = await client.functions.invoke('manage-users', { body });
    if (error) {
      let code = 'UNKNOWN';
      try { const j = await error.context.json(); code = j.error || code; } catch (e) { code = errMsg(error); }
      throw new Error(code);
    }
    return data;
  }
  async function updateProfile(uid, fields) {
    const map = { name: 'name', phone: 'phone', role: 'role', active: 'active' };
    const row = {};
    Object.keys(fields).forEach((k) => { if (map[k]) row[map[k]] = fields[k]; });
    const { data, error } = await client.from('profiles').update(row).eq('uid', uid).select('*');
    if (error) throw error;
    if (!data || !data.length) throw new Error('NO_PERMISSION');
    return profileToUser(data[0]);
  }

  /* ---------------- صور الأعطال ---------------- */
  async function uploadPhoto(path, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    const { error } = await client.storage.from(CFG.photosBucket).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
    if (error) throw error;
    return path;
  }
  const urlCache = new Map();
  async function photoUrls(paths) {
    const need = paths.filter((p) => !urlCache.has(p));
    if (need.length) {
      const { data, error } = await client.storage.from(CFG.photosBucket).createSignedUrls(need, 3600);
      if (!error) (data || []).forEach((r) => { if (r.signedUrl) urlCache.set(r.path, r.signedUrl); });
    }
    return paths.map((p) => urlCache.get(p) || '');
  }
  const cachedPhotoUrl = (p) => urlCache.get(p) || '';

  return {
    client, fmtDate, normalizeCred, canon,
    signIn, signOut, getSession, verifyPassword, changeOwnPassword, touchLogin,
    load, loadAll, save, subscribe, on, pendingCount, watchBrand,
    get status() { return status; },
    adminUsers, updateProfile,
    uploadPhoto, photoUrls, cachedPhotoUrl,
  };
})();
