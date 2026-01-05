// Registro del Service Worker para PWA
// Este archivo debe cargarse en todas las páginas principales

(function() {
  'use strict';

  // Verificar si el navegador soporta Service Workers
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers no soportados en este navegador');
    return;
  }

  // Variable para guardar el evento de instalación
  let deferredPrompt;

  // Capturar el evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que Chrome muestre el prompt automáticamente
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    // Mostrar botón de instalación personalizado
    showInstallButton();
  });

  // Registrar el Service Worker cuando la página cargue
  window.addEventListener('load', () => {
    registerServiceWorker();
    checkForUpdates();
  });

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registrado:', registration.scope);

      // Banner y notificaciones de actualización DESACTIVADOS
      // showPWABanner();

      // Escuchar actualizaciones - SIN RECARGA AUTOMÁTICA
      // La recarga automática causaba loops infinitos
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Nueva versión disponible - Se aplicará en el próximo refresh');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  }

  // Verificar actualizaciones cada 1 hora
  function checkForUpdates() {
    setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      } catch (error) {
        console.error('Error verificando actualizaciones:', error);
      }
    }, 60 * 60 * 1000); // 1 hora
  }

  // Mostrar notificación de actualización disponible
  function showUpdateNotification() {
    // Crear banner de actualización
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2563eb;
      color: white;
      padding: 12px 20px;
      text-align: center;
      z-index: 9999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    banner.innerHTML = `
      <span style="margin-right: 15px;">🔄 Nueva versión disponible</span>
      <button id="update-btn" style="
        background: white;
        color: #2563eb;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        margin-right: 10px;
      ">Actualizar ahora</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Más tarde</button>
    `;

    document.body.appendChild(banner);

    // Botón actualizar
    document.getElementById('update-btn').addEventListener('click', () => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    });

    // Botón cerrar
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      banner.remove();
    });
  }

  // Detectar cuando estamos offline
  window.addEventListener('offline', () => {
    console.log('📴 Modo offline activado');
    showOfflineIndicator();
  });

  window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    hideOfflineIndicator();
  });

  function showOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    `;
    indicator.innerHTML = '📴 Sin conexión - Modo offline';
    document.body.appendChild(indicator);
  }

  function hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Exponer funciones útiles para debugging
  window.PWA = {
    // Forzar actualización del SW
    forceUpdate: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Actualización forzada del Service Worker');
      }
    },

    // Limpiar todo el cache
    clearCache: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        const messageChannel = new MessageChannel();

        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };

          registration.active.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          );
        });
      }
    },

    // Des-registrar Service Worker (para debugging)
    unregister: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('Service Worker des-registrado');
        window.location.reload();
      }
    },

    // Info del estado actual
    status: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return { registered: false };
      }

      return {
        registered: true,
        scope: registration.scope,
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing,
        updateViaCache: registration.updateViaCache
      };
    }
  };

  // Mostrar botón de instalación personalizado
  function showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      padding: 16px 24px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: pulse 2s infinite;
    `;

    installBtn.innerHTML = `
      <span style="font-size: 20px;">📱</span>
      <span>Instalar App</span>
    `;

    // Agregar animación de pulso
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(installBtn);

    // Manejar click en el botón
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        return;
      }

      // Mostrar el prompt de instalación
      deferredPrompt.prompt();

      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
        installBtn.remove();
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }

      // Limpiar la variable
      deferredPrompt = null;
    });
  }

  // Escuchar cuando la app se haya instalado
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada exitosamente');
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.remove();
    }
    // Mostrar mensaje de éxito
    showInstallSuccessMessage();
  });

  // Mensaje de instalación exitosa
  function showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 600;
    `;
    message.innerHTML = '✅ App instalada correctamente';
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  // Mostrar banner de confirmación PWA
  function showPWABanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-success-banner';
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">✅</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">PWA Activada</div>
          <div style="font-size: 12px; opacity: 0.9;">IntraNeuro puede funcionar offline</div>
        </div>
        <button id="pwa-close-btn" style="
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 20px;
          padding: 0;
          margin-left: 8px;
        ">×</button>
      </div>
    `;

    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Cerrar manualmente
    document.getElementById('pwa-close-btn').addEventListener('click', () => {
      banner.remove();
    });

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => banner.remove(), 300);
      }
    }, 5000);
  }

  console.log('✅ PWA Helper cargado - Comandos disponibles en window.PWA');
})();
