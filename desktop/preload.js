// © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م (Services Square LLC)
// جسر آمن بين واجهة التطبيق وويندوز: الإصدار، البحث عن تحديثات، وفتح صفحة «حول» من القائمة.
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  platform: 'windows',
  getInfo: () => ipcRenderer.invoke('app-info'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  onOpenAbout: (cb) => {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('open-about', () => cb());
  },
});
