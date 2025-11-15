// INTRANEURO - Service Worker v3.2
// PWA con estrategia de cache para funcionalidad offline
// v3.2: Corregido manejo de PUT/POST requests

const CACHE_NAME = 'intraneuro-v3.2';
const RUNTIME_CACHE = 'intraneuro-runtime-v3.2';

// Assets estáticos para cachear en instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/archivos.html',
  '/ficha.html',
  '/css/main.css',
  '/css/pacientes.css',
  '/css/modal.css',
  '/css/chat-notes.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/main.js',
  '/js/ingreso.js',
  '/js/pacientes-ui.js',
  '/js/pacientes-refactored.js',
  '/js/simple-notes.js',
  '/js/validaciones.js',
  '/js/data-catalogos.js',
  '/js/modules/services.js',
  '/js/services-integration.js',
  '/js/modules/pacientes/pacientes-api.js',
  '/js/modules/pacientes/pacientes-edit.js',
  '/js/modules/pacientes/pacientes-discharge.js',
  '/manifest.json',
  '/assets/img/logo.png'
];

// Instalar Service Worker y cachear assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v3.1');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activar inmediatamente
  );
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control inmediato
  );
});

// Estrategia de fetch: Network First para API, Cache First para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Estrategia para peticiones al API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Estrategia para assets estáticos
  event.respondWith(cacheFirstStrategy(request));
});

// Network First: Intenta red primero, fallback a cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    // Intentar obtener de la red
    const networkResponse = await fetch(request);

    // Solo cachear requests GET exitosas
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Si falla la red, intentar cache (solo para GET)
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        console.log('[SW] Sirviendo desde cache (offline):', request.url);
        return cachedResponse;
      }
    }

    // Si no hay cache, retornar error
    return new Response(
      JSON.stringify({
        error: 'Sin conexión',
        offline: true,
        message: 'No hay conexión a internet y no hay datos en cache'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First: Intenta cache primero, fallback a red
async function cacheFirstStrategy(request) {
  // Buscar en cache estático primero
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Si no está en cache, obtener de la red
  try {
    const networkResponse = await fetch(request);

    // Cachear en runtime si es exitoso
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Si todo falla, mostrar página offline (si está disponible)
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Último recurso: error genérico
    return new Response('Recurso no disponible offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('[SW] Service Worker cargado correctamente');
