/**
 * =============================================
 * 🏥 DICOM VIEWER SERVICE WORKER - HOSPITAL SAN JOSÉ
 * =============================================
 * Service Worker para el Visor DICOM
 * Version: 1.0.0
 * Last Updated: 2025
 */

'use strict';

// Nombre de la caché
const CACHE_NAME = 'dicom-viewer-cache-v1';

// Archivos a cachear inicialmente
const INITIAL_CACHED_RESOURCES = [
  '/',
  '/static/css/dicom_viewer.css',
  '/static/js/dicom_viewer.js',
  // Imágenes e iconos
  '/static/img/favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  
  // Precachear recursos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🔧 Service Worker: Precacheando archivos');
        return cache.addAll(INITIAL_CACHED_RESOURCES);
      })
      .then(() => {
        console.log('🔧 Service Worker: Instalación completada');
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('🔧 Service Worker: Activando...');
  
  // Limpiar cachés antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Service Worker: Eliminando caché antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🔧 Service Worker: Ahora está activo y controlando la página');
      return self.clients.claim();
    })
  );
});

// Estrategia de caché: Cache First, luego Network
self.addEventListener('fetch', event => {
  // Solo cachear solicitudes GET
  if (event.request.method !== 'GET') return;
  
  // No cachear solicitudes a la API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si está en caché, devolver la respuesta cacheada
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en caché, obtener de la red
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para poder guardarla en caché
            const responseToCache = response.clone();
            
            // Guardar en caché para futuras solicitudes
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('🔧 Service Worker: Error en fetch', error);
            // Aquí se podría devolver una página de fallback o un mensaje de error
          });
      })
  );
});

// Manejo de mensajes desde la aplicación principal
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🧹 Service Worker: Limpiando caché por solicitud de la aplicación');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ result: 'OK' });
    });
  }
});

// Sincronización en segundo plano (para guardar estudios sin conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-dicom-studies') {
    console.log('🔄 Service Worker: Sincronizando estudios DICOM pendientes');
    // Aquí iría la lógica para sincronizar datos almacenados localmente
  }
});

// Notificaciones push
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Notificación del Visor DICOM',
    icon: '/static/img/dicom-icon.png',
    badge: '/static/img/dicom-badge.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Hospital San José - Visor DICOM', 
      options
    )
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url;
        
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventanas abiertas, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('🔧 Service Worker: Registrado');
