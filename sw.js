// Ecossistema · service worker
// Só cuida de notificação. Não guarda cópia das páginas (para a versão nova chegar sempre na hora).
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { titulo: e.data ? e.data.text() : '' }; }
  var area = d.area === 'financas' ? 'financas' : (d.area === 'carteira' ? 'carteira' : 'compromissos');
  e.waitUntil(self.registration.showNotification(d.titulo || 'Ecossistema', {
    body: d.corpo || '',
    icon: 'assets/icon-192.png',
    badge: 'assets/favicon-32.png',
    tag: d.id || undefined,
    data: { area: area }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var area = (e.notification.data && e.notification.data.area) || 'compromissos';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].url.indexOf('carteira-w3g.html') >= 0 && 'focus' in lista[i]) {
        lista[i].postMessage({ tipo: 'abrir-area', area: area });
        return lista[i].focus();
      }
    }
    return self.clients.openWindow('carteira-w3g.html#' + area);
  }));
});
