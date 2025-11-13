# ROADMAP GENERAL - UPGRADE INTRANEURO

**Fecha inicio:** 2025-11-12
**Ambiente dev:** https://dev.intraneurodavila.com
**Progreso:** 4/7 funcionalidades completadas (57%)

---

## 📊 Estado Actual

```
[████████████████░░░░░░░░] 57% completado

✅ Completadas: 4
⏳ Pendientes: 3
```

---

## 🎯 Las 7 Funcionalidades

### ✅ 1. App Instalable (Completada)
**Prioridad:** Alta | **Tiempo:** 2 días | **Estado:** ✅ Funcionando

**Implementado:**
- App instalable en móvil/desktop
- Funciona offline con cache
- Botón de instalación Android
- HTTPS configurado en dev

**Beneficios:**
- Acceso rápido como app nativa
- Funciona sin internet (datos cacheados)
- Notificaciones push (preparado)

---

### ✅ 2. Asignación por Servicio/Unidad (Completada)
**Prioridad:** Alta | **Tiempo:** 1 día | **Estado:** ✅ Funcionando

**Implementado:**
- Selector de servicio: UCI, UTI, MQ, Urgencias, Interconsulta
- Campo de unidad opcional
- Filtro por servicio en dashboard
- Badges de color por servicio
- Backend + Frontend + BD

**Pendiente:**
- Probar con pacientes reales

---

### ⏳ 3. OCR para Ingreso de Pacientes
**Prioridad:** Media | **Tiempo:** 3-4 días | **Estado:** Pendiente

**Objetivo:**
- Foto de pantalla → Extrae datos automáticamente
- Campos: nombre, RUT, edad, previsión
- Confirmación manual antes de guardar

**Tecnología:**
- Tesseract.js (gratis) o Google Vision API
- Camera API del navegador
- Parser personalizado

**Cambios BD:** Ninguno

---

### ⏳ 4. Sistema de Audio (Mensajes de Voz)
**Prioridad:** Alta | **Tiempo:** 2-3 días | **Estado:** Pendiente

**Objetivo:**
- Grabar audio desde navegador
- Reproducir mensajes tipo WhatsApp
- Asociado a cada admisión

**Tecnología:**
- MediaRecorder API
- Multer para upload
- Storage en servidor

**Cambios BD:**
```sql
CREATE TABLE audio_messages (
    id SERIAL PRIMARY KEY,
    admission_id INTEGER REFERENCES admissions(id),
    filename VARCHAR(255),
    duration_seconds INTEGER,
    created_by VARCHAR(100),
    created_at TIMESTAMP,
    file_size INTEGER
);
```

**Espacio:** ~50MB/mes

---

### ⏳ 5. Autenticación Persistente
**Prioridad:** Media | **Tiempo:** 2 días | **Estado:** Pendiente

**Objetivo:**
- Login una sola vez por dispositivo
- Checkbox "Recordar dispositivo"
- Validez: 30 días
- Revocar dispositivos desde perfil

**Tecnología:**
- Device fingerprinting
- Refresh tokens en httpOnly cookie
- Tabla trusted_devices

**Cambios BD:**
```sql
CREATE TABLE trusted_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    device_fingerprint VARCHAR(255),
    device_name VARCHAR(100),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN
);
```

**Seguridad:**
- Máximo 5 dispositivos por usuario
- Tokens renovables automáticamente

---

### ⏳ 6. Filtros Avanzados
**Prioridad:** Media | **Tiempo:** 2 días | **Estado:** Pendiente

**Objetivo:**
- Panel de filtros multi-criterio
- Filtros: médico, diagnóstico, fecha, cama, servicio, edad
- Guardar filtros favoritos
- Exportar resultados filtrados

**Tecnología:**
- Query builder dinámico (Sequelize)
- LocalStorage para favoritos
- UI colapsable

**Cambios BD:**
- Índices compuestos para performance

---

### ⏳ 7. Catálogo de Diagnósticos Predefinidos
**Prioridad:** Alta | **Tiempo:** 1-2 días | **Estado:** Pendiente

**Objetivo:**
- Autocomplete inteligente
- Lista de diagnósticos frecuentes
- Búsqueda fuzzy
- Agregar nuevos on-the-fly

**Tecnología:**
- Fuse.js para búsqueda
- PostgreSQL full-text search

**Cambios BD:**
```sql
CREATE TABLE diagnosis_catalog (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE,
    description VARCHAR(200),
    category VARCHAR(50),
    frequency_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);

-- Popular con diagnósticos existentes
INSERT INTO diagnosis_catalog (code, description, frequency_count)
SELECT DISTINCT diagnosis_code, diagnosis_text, COUNT(*)
FROM admissions
WHERE diagnosis_code IS NOT NULL
GROUP BY diagnosis_code, diagnosis_text;
```

---

## 📅 Roadmap por Fases

### ✅ FASE 1: Fundamentos (Completada)
```
✅ App Instalable (2 días)
✅ Asignación por Servicio (1 día)
⏳ Diagnósticos Predefinidos (2 días) ← SIGUIENTE
```

### FASE 2: Comunicación
```
⏳ Sistema de Audio (3 días)
⏳ Filtros Avanzados (2 días)
```

### FASE 3: Automatización
```
⏳ OCR para Pacientes (4 días)
⏳ Autenticación Persistente (2 días)
```

**Tiempo restante:** ~13 días laborales

---

## 🗂️ Impacto en Base de Datos

### Tablas Nuevas (3 pendientes)
```
audio_messages        → Sistema de Audio
trusted_devices       → Autenticación Persistente
diagnosis_catalog     → Diagnósticos Predefinidos
```

### Modificaciones (1 completada)
```
✅ admissions: + service, + unit
```

### Espacio Estimado
- Tablas: ~10MB
- Audios: ~50MB/mes → ~600MB/año
- **Total año 1:** ~700MB

---

## 🛠️ Tecnologías a Instalar

### Frontend
```javascript
{
  "fuse.js": "^7.0.0",           // Búsqueda fuzzy (Diagnósticos)
  "tesseract.js": "^5.0.0"       // OCR (Pacientes)
}
```

### Backend
```javascript
{
  "multer": "^1.4.5",            // Upload (Audio, OCR)
  "sharp": "^0.33.0",            // Imágenes (OCR)
  "tesseract.js": "^5.0.0",      // OCR servidor
  "node-cache": "^5.1.2"         // Cache
}
```

---

## ⚠️ Decisiones Pendientes

- [ ] **OCR:** ¿Tesseract gratis o Google Vision API de pago?
- [ ] **Audio:** ¿Límite de duración? (recomendado: 60s)
- [ ] **Audio:** ¿Compresión automática?
- [ ] **Auth:** ¿Cuántos dispositivos permitir? (recomendado: 5)
- [ ] **Diagnósticos:** ¿Usar categorías predefinidas?

---

## 🎯 Próximos Pasos Recomendados

### Opción A: Completar Fase 1
Implementar **Diagnósticos Predefinidos** (2 días)
→ Terminar fundamentos antes de pasar a Fase 2

### Opción B: Saltar a Audio
Implementar **Sistema de Audio** (3 días)
→ Funcionalidad más pedida por usuarios

### Opción C: Quick Wins
Implementar **Filtros Avanzados** (2 días)
→ Bajo esfuerzo, alto valor

---

## 📈 Progreso por Día

```
Día 1-2:   ✅ App Instalable
Día 3:     ✅ Asignación por Servicio
Día 4:     ✅ Configuración HTTPS
Día 5-6:   ⏳ Diagnósticos (pendiente)
Día 7-9:   ⏳ Sistema de Audio (pendiente)
Día 10-11: ⏳ Filtros Avanzados (pendiente)
Día 12-15: ⏳ OCR (pendiente)
Día 16-17: ⏳ Auth Persistente (pendiente)
```

**Días trabajados:** 4
**Días restantes:** ~13

---

## 📝 Notas Importantes

### Arquitectura Modular
✅ Todo el código nuevo está en módulos pequeños y enfocados
✅ No se modificaron archivos monolíticos
✅ Fácil de mantener y extender

### Ambiente de Desarrollo
✅ Producción sin modificar (seguro)
✅ Dev en https://dev.intraneurodavila.com
✅ Base de datos separada (intraneuro_dev)
✅ Backend independiente (puerto 3001)

### Testing
✅ App instalable funcionando en Android
✅ Filtro de servicio verificado
⏳ Pendiente: crear pacientes de prueba con servicio

---

**Última actualización:** 2025-11-12 22:30
**Próxima funcionalidad:** Diagnósticos Predefinidos o Sistema de Audio (a decidir)
