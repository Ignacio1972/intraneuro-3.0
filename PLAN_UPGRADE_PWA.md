# PLAN DE UPGRADE - INTRANEURO PWA

## Resumen Ejecutivo

Conversión de IntraNeuro a PWA con 7 nuevas funcionalidades para mejorar productividad y experiencia de usuario.

**Tiempo total:** 3-4 semanas (17 días laborales)
**Costo adicional:** $0 (usando librerías open source)
**Impacto:** Alto - Mejora significativa en flujo de trabajo clínico

---

## Funcionalidades Propuestas

### 1. PWA (Progressive Web App) ⭐ ALTA
- **Tiempo:** 2 días | **Complejidad:** Baja-Media
- **Resultado:** App instalable, funciona offline, carga rápida
- **Tecnología:** Service Worker + Manifest.json + Workbox
- **Cambios BD:** Ninguno

### 2. OCR para Ingreso de Pacientes ⭐ MEDIA
- **Tiempo:** 3-4 días | **Complejidad:** Alta
- **Resultado:** Foto de pantalla → Extrae nombre, RUT, edad automáticamente
- **Tecnología:** Tesseract.js + Multer + Sharp
- **Cambios BD:** Ninguno

### 3. Sistema de Audio (Mensajes de Voz) ⭐ ALTA
- **Tiempo:** 2-3 días | **Complejidad:** Media
- **Resultado:** Grabar/reproducir audios tipo WhatsApp por paciente
- **Tecnología:** MediaRecorder API + Multer
- **Cambios BD:** Nueva tabla `audio_messages`

### 4. Asignación por Servicio/Unidad ⭐ ALTA
- **Tiempo:** 1-2 días | **Complejidad:** Baja-Media
- **Resultado:** Clasificar pacientes por UCI, UTI, MQ, Urgencias, Interconsulta
- **Tecnología:** PostgreSQL ENUM + Filtros frontend
- **Cambios BD:** Agregar columna `service` a `admissions`

### 5. Autenticación Persistente ⭐ MEDIA
- **Tiempo:** 2 días | **Complejidad:** Media
- **Resultado:** Login una sola vez por dispositivo (30 días)
- **Tecnología:** Device Fingerprinting + Refresh Tokens
- **Cambios BD:** Nueva tabla `trusted_devices`

### 6. Filtros Avanzados ⭐ MEDIA
- **Tiempo:** 2 días | **Complejidad:** Baja-Media
- **Resultado:** Filtrar por médico, diagnóstico, fecha, cama, servicio
- **Tecnología:** Query builder Sequelize + UI multi-filtros
- **Cambios BD:** Índices adicionales

### 7. Menú de Diagnósticos Predefinidos ⭐ ALTA
- **Tiempo:** 1-2 días | **Complejidad:** Baja-Media
- **Resultado:** Autocomplete inteligente con diagnósticos frecuentes
- **Tecnología:** Fuse.js + PostgreSQL
- **Cambios BD:** Nueva tabla `diagnosis_catalog`

---

## Roadmap de Implementación

### FASE 1: Fundamentos (Semana 1)
```
Día 1-2: PWA Base
Día 3-4: Asignación por Servicio
Día 5:   Diagnósticos Predefinidos
```
**Entregables:** Sistema instalable, clasificación por servicios, catálogo de diagnósticos

### FASE 2: Comunicación (Semana 2)
```
Día 1-3: Sistema de Audio
Día 4-5: Filtros Avanzados
```
**Entregables:** Mensajes de voz, filtros multi-dimensionales

### FASE 3: Automatización (Semana 3)
```
Día 1-4: OCR para Pacientes
Día 5:   Autenticación Persistente
```
**Entregables:** Ingreso automático por foto, login persistente

---

## Impacto en Base de Datos

### Nuevas Tablas (3)
```sql
audio_messages        -- Mensajes de voz
trusted_devices       -- Dispositivos confiables
diagnosis_catalog     -- Catálogo de diagnósticos
```

### Modificaciones (1)
```sql
ALTER TABLE admissions:
  + service ENUM('UCI','UTI','MQ','Urgencias','Interconsulta')
  + unit VARCHAR(50)
```

### Espacio Estimado
- Tablas iniciales: ~10MB
- Audio mensual: ~50MB/mes
- Total año 1: ~600MB

---

## Tecnologías Requeridas

### Frontend
```
- workbox-webpack-plugin  (Service Worker)
- idb                     (IndexedDB)
- canvas-fingerprint      (Device ID)
- fuse.js                 (Búsqueda fuzzy)
```

### Backend
```
- multer                  (Upload archivos)
- sharp                   (Procesamiento imágenes)
- tesseract.js            (OCR)
- node-cache              (Cache)
```

---

## Priorización Recomendada

### Quick Wins (Implementar primero)
1. **PWA** - Base fundamental, alto impacto
2. **Asignación por Servicio** - Bajo esfuerzo, alto valor
3. **Diagnósticos** - Mejora inmediata en UX

### Valor Agregado (Implementar después)
4. **Sistema de Audio** - Mejora comunicación equipo
5. **Filtros Avanzados** - Mayor control sobre datos

### Nice to Have (Implementar al final)
6. **OCR** - Útil pero complejo, puede esperar
7. **Auth Persistente** - Comodidad, no crítico

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| OCR baja precisión | Alto | Confirmación manual pre-guardado |
| Storage lleno (audios) | Medio | Límite 60s/audio, compresión |
| PWA limitado en iOS | Bajo | Progressive enhancement |
| Compatibilidad audio | Medio | Conversión automática backend |

---

## Checklist de Inicio

```
[ ] Confirmar prioridades con stakeholders
[ ] Decidir: ¿Tesseract gratis o API de pago?
[ ] Definir límites de audio (60s máximo)
[ ] Verificar espacio en disco (600MB necesarios)
[ ] Crear branch: feature/pwa-upgrade
[ ] Backup completo antes de empezar
```

---

## Próximos Pasos

### Opción A: Implementación Completa
Seguir roadmap completo (3-4 semanas)

### Opción B: MVP (Mínimo Viable)
Implementar solo Quick Wins (1 semana):
- PWA + Servicios + Diagnósticos

### Opción C: Prototipo
Hacer demo de una funcionalidad específica para validar

---

**Documento generado:** 2025-11-12
**Ambiente de desarrollo:** http://64.176.7.170:8080
**Estado:** Listo para comenzar implementación
