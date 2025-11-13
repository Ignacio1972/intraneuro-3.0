# PWA IMPLEMENTADA - INTRANEURO ✅

## Resumen
IntraNeuro ahora es una **Progressive Web App (PWA)** completamente funcional.

---

## Archivos Creados

### Core PWA
```
/manifest.json              - Configuración PWA
/service-worker.js          - Cache y funcionalidad offline
/js/sw-register.js          - Registro y gestión del SW
/offline.html               - Página fallback sin conexión
```

### Assets
```
/assets/icons/              - 8 iconos (72px hasta 512px)
  ├── icon-72x72.png
  ├── icon-96x96.png
  ├── icon-128x128.png
  ├── icon-144x144.png
  ├── icon-152x152.png
  ├── icon-192x192.png
  ├── icon-384x384.png
  └── icon-512x512.png

/assets/screenshots/        - Screenshots para app store
  ├── screenshot1.png (desktop - 1280x720)
  └── screenshot2.png (mobile - 750x1334)
```

---

## Funcionalidades Implementadas

### ✅ Instalable
- **Android:** Botón "Agregar a pantalla de inicio"
- **iOS:** Safari → Compartir → "Agregar a pantalla de inicio"
- **Desktop:** Chrome/Edge → Icono de instalación en barra de direcciones

### ✅ Offline
- **Assets estáticos** cacheados (CSS, JS, imágenes)
- **API responses** cacheadas
- **Fallback** a página offline cuando no hay conexión

### ✅ Cache Strategy
- **Network First** para API (intenta red, fallback a cache)
- **Cache First** para assets estáticos (rápido, actualiza en background)

### ✅ Actualizaciones Automáticas
- Verifica updates cada 1 hora
- Banner de notificación cuando hay nueva versión
- Actualización manual disponible

### ✅ Indicadores
- Badge "Sin conexión" cuando estás offline
- Notificación de actualización disponible
- Auto-reconexión cuando vuelve internet

---

## Cómo Usar

### Instalar en Dispositivo

**Android (Chrome/Edge):**
1. Abrir `http://64.176.7.170:8080` en el navegador
2. Tocar menú (⋮) → "Agregar a pantalla de inicio"
3. La app se abre en modo standalone (sin barra de navegación)

**iOS (Safari):**
1. Abrir `http://64.176.7.170:8080` en Safari
2. Tocar botón "Compartir" (⬆️)
3. Seleccionar "Agregar a pantalla de inicio"
4. La app aparece como icono independiente

**Desktop (Chrome/Edge):**
1. Abrir `http://64.176.7.170:8080`
2. Click en icono de instalación (+ o computadora) en barra de direcciones
3. Confirmar instalación
4. La app se abre en ventana independiente

### Comandos de Debug (Consola)

Abre la consola del navegador (F12) y usa:

```javascript
// Ver estado de la PWA
await PWA.status()
// {registered: true, scope: "/", active: true, ...}

// Forzar actualización del Service Worker
await PWA.forceUpdate()

// Limpiar todo el cache
await PWA.clearCache()

// Des-registrar PWA (para debugging)
await PWA.unregister()
```

---

## Estrategia de Cache

### Static Cache (`intraneuro-v1`)
Archivos que se cachean en instalación:
- HTML (index.html, archivos.html, ficha.html)
- CSS (main.css, pacientes.css, modal.css, etc)
- JavaScript (api.js, auth.js, main.js, etc)
- Manifest y logo

### Runtime Cache (`intraneuro-runtime`)
Archivos que se cachean después de primera carga:
- Responses del API
- Recursos adicionales cargados dinámicamente

---

## Actualizaciones

### Automáticas
El Service Worker verifica updates cada **1 hora**. Cuando hay una nueva versión:
1. Descarga el nuevo SW en background
2. Muestra banner: "🔄 Nueva versión disponible"
3. Usuario elige actualizar o esperar
4. Al actualizar, recarga la página con nueva versión

### Manuales
```javascript
// Desde consola
await PWA.forceUpdate()

// O recarga con Ctrl+F5 (ignora cache)
```

---

## Testing

### Verificar Instalación
```bash
# Manifest accesible
curl http://localhost:8080/manifest.json

# Service Worker accesible
curl http://localhost:8080/service-worker.js

# Iconos disponibles
curl -I http://localhost:8080/assets/icons/icon-192x192.png
```

### Test en Navegador

**Chrome DevTools:**
1. Abrir DevTools (F12)
2. Tab "Application"
3. Ver:
   - **Manifest:** Verifica iconos y configuración
   - **Service Workers:** Estado del SW
   - **Cache Storage:** Contenido cacheado
   - **Offline:** Toggle para simular sin conexión

---

## Próximos Pasos

### Opcional (Futuro)
- [ ] Notificaciones Push
- [ ] Sincronización en background
- [ ] Shortcuts personalizados
- [ ] Share Target API (recibir archivos)

---

## Beneficios

### Usuario
✅ **Instalable** como app nativa
✅ **Funciona offline** (lectura de datos cacheados)
✅ **Carga más rápida** (assets cacheados)
✅ **Actualizaciones automáticas**
✅ **Menos datos móviles** (cache reduce tráfico)

### Técnico
✅ **Progressive Enhancement** (funciona con/sin SW)
✅ **Backward Compatible** (navegadores viejos funcionan normal)
✅ **Fácil mantenimiento** (versiones en CACHE_NAME)
✅ **Debugging tools** (window.PWA)

---

## Compatibilidad

| Plataforma | Soportado | Notas |
|-----------|-----------|-------|
| Android (Chrome) | ✅ Completo | Instalación nativa |
| Android (Firefox) | ✅ Completo | Instalación nativa |
| iOS (Safari 16.4+) | ✅ Completo | Limitación de cache 50MB |
| Desktop (Chrome) | ✅ Completo | Instalación como app |
| Desktop (Edge) | ✅ Completo | Instalación como app |
| Desktop (Firefox) | ⚠️ Parcial | SW funciona, no instala |

---

## Troubleshooting

### PWA no se instala
- Verificar que esté en HTTPS (producción) o localhost (dev)
- Verificar manifest.json es válido
- Verificar Service Worker registrado correctamente

### Cache no funciona
```javascript
// Limpiar y re-registrar
await PWA.clearCache()
await PWA.unregister()
// Recargar página
location.reload()
```

### Actualización no aparece
```javascript
// Forzar verificación
await PWA.forceUpdate()
```

---

**Implementado:** 2025-11-12
**Versión SW:** v1.0
**Estado:** ✅ Producción-ready
