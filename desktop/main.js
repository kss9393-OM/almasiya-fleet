// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م (Services Square LLC)
// تطبيق ويندوز لنظام إدارة الأسطول والمعدات — Electron
'use strict';

const { app, BrowserWindow, protocol, net, shell, Menu, dialog, ipcMain } = require('electron');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const WWW = path.join(__dirname, 'www');
const APP_URL = 'app://fleet/index.html';
const isAr = () => (app.getLocale() || 'ar').startsWith('ar');

// بروتوكول app:// آمن بدلاً من file:// (أصل ثابت للتخزين والاتصال بالخادم)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// الإبقاء على مجلد البيانات القديم بعد تغيير الاسم إلى FLEET (لا تضيع الجلسة ولا البيانات المحفوظة)
app.setPath('userData', path.join(app.getPath('appData'), 'Almasiya Fleet'));

// نسخة واحدة فقط من التطبيق
if (!app.requestSingleInstanceLock()) { app.quit(); }

app.setAppUserModelId('om.almasiya.fleet');
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#f2f4f7',
    title: isAr() ? 'أسطول' : 'FLEET',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.loadURL(APP_URL);

  // الروابط الخارجية تُفتح في المتصفح، ولا يُسمح بالتنقل خارج التطبيق
  const EXTERNAL = /^(https?:\/\/|mailto:|tel:)/i;
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) {
      e.preventDefault();
      if (EXTERNAL.test(url)) shell.openExternal(url);
    }
  });

  // صلاحيات المتصفح: الكاميرا لالتقاط صور الأعطال فقط
  win.webContents.session.setPermissionRequestHandler((wc, permission, cb) => cb(['media', 'clipboard-sanitized-write'].includes(permission)));

  win.on('closed', () => { win = null; });
}

function buildMenu() {
  const ar = isAr();
  const template = [
    {
      label: ar ? 'ملف' : 'File',
      submenu: [
        { label: ar ? 'طباعة' : 'Print', accelerator: 'CmdOrCtrl+P', click: () => win && win.webContents.print() },
        { type: 'separator' },
        { role: 'quit', label: ar ? 'خروج' : 'Exit' },
      ],
    },
    {
      label: ar ? 'تحرير' : 'Edit',
      submenu: [
        { role: 'undo', label: ar ? 'تراجع' : 'Undo' },
        { role: 'redo', label: ar ? 'إعادة' : 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: ar ? 'قص' : 'Cut' },
        { role: 'copy', label: ar ? 'نسخ' : 'Copy' },
        { role: 'paste', label: ar ? 'لصق' : 'Paste' },
        { role: 'selectAll', label: ar ? 'تحديد الكل' : 'Select all' },
      ],
    },
    {
      label: ar ? 'عرض' : 'View',
      submenu: [
        { role: 'reload', label: ar ? 'إعادة تحميل' : 'Reload' },
        { type: 'separator' },
        { role: 'zoomIn', label: ar ? 'تكبير' : 'Zoom in' },
        { role: 'zoomOut', label: ar ? 'تصغير' : 'Zoom out' },
        { role: 'resetZoom', label: ar ? 'الحجم الافتراضي' : 'Actual size' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: ar ? 'ملء الشاشة' : 'Full screen' },
      ],
    },
    {
      label: ar ? 'مساعدة' : 'Help',
      submenu: [
        { label: ar ? 'البحث عن تحديثات' : 'Check for updates', click: () => checkUpdates(true) },
        { type: 'separator' },
        { label: ar ? 'حول البرنامج والمطور' : 'About', accelerator: 'F1', click: () => openAbout() },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// صفحة «حول» داخل التطبيق (يعدّل المطور محتواها من إعدادات المطور)
function openAbout() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
  win.webContents.send('open-about');
}

// معلومات التطبيق لصفحة «حول»
ipcMain.handle('app-info', () => ({
  version: app.getVersion(),
  platform: 'windows',
  os: `Windows ${os.release()}`,
  arch: process.arch,
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  packaged: app.isPackaged,
}));
ipcMain.handle('check-updates', () => { checkUpdates(true); return app.isPackaged; });

// التحديث التلقائي من صفحة الإصدارات على GitHub
let updater = null;
function checkUpdates(manual) {
  if (!app.isPackaged) return;
  try {
    if (!updater) {
      updater = require('electron-updater').autoUpdater;
      updater.autoDownload = true;
      updater.autoInstallOnAppQuit = true;
      updater.on('update-downloaded', (info) => {
        const ar = isAr();
        dialog.showMessageBox(win, {
          type: 'info',
          buttons: ar ? ['إعادة التشغيل الآن', 'لاحقاً'] : ['Restart now', 'Later'],
          defaultId: 0,
          title: ar ? 'تحديث جديد' : 'Update ready',
          message: ar ? `تم تنزيل الإصدار ${info.version}` : `Version ${info.version} downloaded`,
          detail: ar ? 'سيُثبَّت التحديث عند إعادة تشغيل التطبيق.' : 'The update will be installed when the app restarts.',
        }).then(({ response }) => { if (response === 0) updater.quitAndInstall(); });
      });
    }
    const p = updater.checkForUpdates();
    if (manual && p) {
      p.then((r) => {
        const ar = isAr();
        const latest = r && r.updateInfo && r.updateInfo.version;
        if (!latest || latest === app.getVersion()) {
          dialog.showMessageBox(win, { type: 'info', message: ar ? 'لديك أحدث إصدار' : 'You have the latest version', detail: `${ar ? 'الإصدار' : 'Version'} ${app.getVersion()}` });
        }
      }).catch(() => {});
    }
  } catch (e) { /* لا اتصال — سيُعاد الفحص عند التشغيل التالي */ }
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let rel = decodeURIComponent(url.pathname);
    if (!rel || rel === '/') rel = '/index.html';
    const file = path.normalize(path.join(WWW, rel));
    if (!file.startsWith(WWW)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  buildMenu();
  createWindow();
  setTimeout(() => checkUpdates(false), 5000);
  setInterval(() => checkUpdates(false), 6 * 60 * 60 * 1000);
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.on('window-all-closed', () => app.quit());
