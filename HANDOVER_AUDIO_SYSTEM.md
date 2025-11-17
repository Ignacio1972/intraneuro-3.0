# 🎙️ HANDOVER TÉCNICO - Sistema de Notas de Audio

## 📋 RESUMEN EJECUTIVO
Sistema de grabación de notas de voz para fichas de pacientes en IntraNeuro. Los doctores pueden grabar mensajes de audio que quedan asociados a cada admisión de paciente.

**Estado Actual**: ✅ Grabación funcional | ⚠️ Reproducción con problemas

---

## 🏗️ ARQUITECTURA

### Backend (Node.js + Express)
```
/backend/src/
├── models/audio-note.model.js       ✅ Modelo Sequelize
├── controllers/audio.controller.js  ✅ CRUD completo
├── routes/audio.routes.js           ✅ Endpoints REST
└── middleware/upload.middleware.js  ✅ Multer para uploads
```

### Frontend (JavaScript Vanilla)
```
/js/modules/
├── audio-notes-modal.js    # Sistema principal (toggle click)
└── audio-notes-simple.js   # Versión simplificada (backup)
```

### Base de Datos (PostgreSQL)
```sql
Tabla: audio_notes
- id, admission_id, filename, file_path
- duration_seconds, created_by, created_at
- is_important, is_deleted, etc.
```

---

## 🔴 PROBLEMA ACTUAL: Reproducción de Audio

### Síntoma
- Los audios se graban correctamente
- Se guardan en `/uploads/audio/2025/11/audio_xxx.webm`
- Al intentar reproducir: Error 404 o no se escucha nada

### Causa Raíz
**Discrepancia en las URLs generadas:**

1. **Backend guarda**: `file_path = "/var/www/intraneuro-dev/uploads/audio/2025/11/audio_xxx.webm"`
2. **Backend retorna**: `url = "/uploads/audio/audio_xxx.webm"` (sin año/mes)
3. **Frontend corrige**: `url = "/uploads/audio/2025/11/audio_xxx.webm"`
4. **Problema**: La corrección del frontend es un workaround, no siempre funciona

### Código Problemático

**Backend** (`audio-note.model.js` línea 161-173):
```javascript
getPublicUrl() {
    if (this.file_path) {
        const pathMatch = this.file_path.match(/uploads\/audio\/(\d{4})\/(\d{2})\/(.+)$/);
        if (pathMatch) {
            const [, year, month, filename] = pathMatch;
            return `/uploads/audio/${year}/${month}/${filename}`;
        }
    }
    return `/uploads/audio/${this.filename}`;
}
```

**Frontend** (`audio-notes-modal.js` línea 471-498):
```javascript
getAudioUrl(url) {
    // Workaround: Si no tiene año/mes, lo agrega
    if (!url.includes('/2025/') && !url.includes('/2024/')) {
        const filename = url.split('/').pop();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        url = `/uploads/audio/${year}/${month}/${filename}`;
    }
    return url;
}
```

---

## ✅ FUNCIONALIDADES OPERATIVAS

### 1. Grabación (100% funcional)
- Click para iniciar/detener
- Límite de 5 minutos
- Animación visual durante grabación
- Guardado automático en servidor

### 2. Almacenamiento (100% funcional)
- Archivos en: `/var/www/intraneuro-dev/uploads/audio/YYYY/MM/`
- Estructura año/mes para organización
- Nginx sirve archivos desde `/uploads/`

### 3. API Endpoints (100% funcional)
- `POST /api/audio` - Subir audio
- `GET /api/audio/admission/:id` - Listar audios
- `PATCH /api/audio/:id/important` - Marcar importante
- `DELETE /api/audio/:id` - Soft delete

---

## 🔧 SOLUCIÓN PROPUESTA

### Opción 1: Corregir Backend (Recomendado)
```javascript
// audio.controller.js - línea 43
// CAMBIAR:
file_path: file.path,

// POR:
file_path: file.path.replace('/var/www/intraneuro-dev', ''),
```

### Opción 2: Guardar solo el path relativo
```javascript
// En upload.middleware.js
// Modificar el path que se guarda para que sea relativo desde el principio
```

---

## 🚀 COMANDOS ÚTILES

```bash
# Ver audios grabados
ls -la /var/www/intraneuro-dev/uploads/audio/2025/11/

# Ver registros en BD (actualmente vacía - otro problema)
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -d intraneuro_db \
  -c "SELECT * FROM audio_notes ORDER BY created_at DESC LIMIT 5;"

# Logs del backend
pm2 logs intraneuro-api-dev --lines 50

# Reiniciar backend
pm2 restart intraneuro-api-dev

# Test manual de endpoint
curl -H "Authorization: Bearer TOKEN" \
  https://dev.intraneurodavila.com/api/audio/admission/258
```

---

## ⚠️ ISSUES ADICIONALES

1. **Base de datos vacía**: Los registros no se están guardando en PostgreSQL
   - Los archivos SÍ se guardan en el filesystem
   - Posible problema con Sequelize o la transacción

2. **CORS en desarrollo**: El frontend en localhost:3001 puede tener problemas

3. **Tipos MIME**: Algunos navegadores no soportan `audio/webm`

---

## 📝 TESTING

### Página de prueba
```
https://dev.intraneurodavila.com/test-audio-integration.html
```

### Flujo de prueba
1. Login: usuario `sistema`, código `4321`
2. Abrir ficha de cualquier paciente
3. Click en "🎤 Click para Grabar"
4. Hablar y click nuevamente para detener
5. Verificar si el audio aparece y se puede reproducir

---

## 📞 CONTACTO
- **Servidor**: root@64.176.7.170
- **Dev URL**: https://dev.intraneurodavila.com
- **Prod URL**: https://intraneurodavila.com

---

**Última actualización**: 15 Nov 2025, 19:30 UTC
**Prioridad**: Alta - Sistema parcialmente operativo