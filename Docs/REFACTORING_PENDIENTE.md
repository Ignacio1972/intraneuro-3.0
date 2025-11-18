# 📋 REFACTORIZACIÓN PENDIENTE - Sistema de Edición de Pacientes

**Fecha:** 14 de Noviembre de 2025
**Estado:** 🟡 EN TRANSICIÓN (60% completado)

---

## 🎯 RESUMEN

El sistema de edición está **parcialmente refactorizado**. Hay dos sistemas funcionando en paralelo:

- ✅ **Sistema Refactorizado** (`pacientes-edit-refactored.js`) - 6 campos migrados
- ⚠️ **Sistema Original** (`pacientes-edit.js`) - 11+ funciones, aún en uso

---

## 📊 ESTADO ACTUAL DE CAMPOS

### ✅ Campos YA MIGRADOS al sistema refactorizado (6/11)

| Campo | Función Original | Sistema Refactorizado | Estado |
|-------|-----------------|----------------------|--------|
| Nombre | `editPatientName()` | `editPatientField(id, 'name')` | ✅ Listo |
| Edad | `editPatientAge()` | `editPatientField(id, 'age')` | ✅ Listo |
| Cama | `editPatientBed()` | `editPatientField(id, 'bed')` | ✅ Listo |
| RUT | `editPatientRut()` | `editPatientField(id, 'rut')` | ✅ Listo |
| Médico Tratante | `editAdmittedBy()` | `editPatientField(id, 'admittedBy')` | ✅ Listo |
| Descripción Dx | `editDiagnosisDetails()` | `editPatientField(id, 'diagnosisDetails')` | ✅ Listo |

### ❌ Campos PENDIENTES de migrar (5/11)

| Campo | Función Original | Complejidad | Prioridad |
|-------|-----------------|-------------|-----------|
| **Previsión** | `editPatientPrevision()` | 🟡 Media (usa modal + dropdown) | 🔴 ALTA |
| **Diagnóstico** | `editDiagnosis()` / `editPatientDiagnosis()` | 🟡 Media (usa modal + dropdown) | 🔴 ALTA |
| **Fecha de Ingreso** | `editAdmissionDate()` | 🟢 Baja (solo validación de fecha) | 🟡 Media |
| **Servicio Hospitalario** | `editPatientService()` | 🟢 Baja (ya tiene módulo separado) | 🟢 Baja |
| **Cama (duplicado)** | `editBed()` | 🟢 Muy baja (duplicado de editPatientBed) | 🟢 Baja |

---

## 🔍 ANÁLISIS DETALLADO DE PENDIENTES

### 1. **Previsión** (editPatientPrevision) 🔴

**Complejidad:** MEDIA
**Líneas de código:** ~196 líneas
**Ubicación:** `pacientes-edit.js:164-360`

**Características:**
- Usa modal personalizado (no simple `prompt()`)
- Implementa dropdown con lista de previsiones chilenas
- Permite valor personalizado
- Tiene lógica compleja de guardado
- ⚠️ Hay un archivo separado: `fix-prevision-edit.js` (¿parche?)

**Desafío de migración:**
```javascript
// Sistema actual: Modal complejo con dropdown
const modal = document.createElement('div');
modal.innerHTML = `...complejo HTML...`;
// Dropdown con 12 opciones predefinidas
const previsiones = ['Fonasa A', 'Fonasa B', ...];
```

**Para migrar necesita:**
- Agregar soporte para `inputType: 'dropdown'` en FIELD_CONFIGS
- Builder de modal personalizado
- Integración con sistema de dropdowns existente

---

### 2. **Diagnóstico** (editDiagnosis / editPatientDiagnosis) 🔴

**Complejidad:** MEDIA
**Líneas de código:** ~120 líneas (hay 2 funciones similares)
**Ubicación:** `pacientes-edit.js:398-441` y `530-735`

**Características:**
- Similar a Previsión (modal + dropdown)
- Lista larga de diagnósticos (~30+ opciones)
- Permite valor personalizado
- Actualiza múltiples campos relacionados

**Desafío:**
- Hay **DOS funciones** que hacen lo mismo: `editDiagnosis()` y `editPatientDiagnosis()`
- Código duplicado que necesita consolidación

---

### 3. **Fecha de Ingreso** (editAdmissionDate) 🟡

**Complejidad:** BAJA
**Líneas de código:** ~38 líneas
**Ubicación:** `pacientes-edit.js:360-398`

**Características:**
```javascript
// Usa prompt simple con validación de fecha
const newDate = prompt('Ingrese nueva fecha (DD/MM/YYYY)', currentDate);
// Validación con regex
const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
```

**Para migrar:**
- Fácil: solo necesita `inputType: 'date'`
- Agregar transformer para convertir DD/MM/YYYY a formato ISO

---

### 4. **Servicio Hospitalario** (editPatientService) 🟢

**Complejidad:** BAJA
**Estado:** Ya tiene módulo separado: `pacientes-service-edit.js`
**Ubicación:** `js/modules/pacientes/pacientes-service-edit.js:14`

**Situación:**
- Ya está separado del archivo principal ✅
- Usa dropdown con servicios predefinidos
- Solo necesita incorporarse a FIELD_CONFIGS si se quiere unificar

**Decisión recomendada:**
- ✅ Dejarlo como módulo separado (ya está bien organizado)
- O migrarlo para consistencia total

---

### 5. **Cama duplicado** (editBed) 🟢

**Complejidad:** MUY BAJA
**Estado:** DUPLICADO de `editPatientBed()`
**Ubicación:** `pacientes-edit.js:504-530`

**Acción:**
- ✅ Ya está migrado como `editPatientBed()` → `editPatientField(id, 'bed')`
- ❌ Eliminar función duplicada `editBed()`

---

## 📋 PLAN DE MIGRACIÓN COMPLETA

### Fase 1: Campos Simples ✅ (COMPLETADO)
- [x] Nombre
- [x] Edad
- [x] Cama
- [x] RUT
- [x] Médico Tratante
- [x] Descripción Diagnóstico

### Fase 2: Campos con Fecha 🔄 (PENDIENTE)
- [ ] Agregar soporte `inputType: 'date'` a FIELD_CONFIGS
- [ ] Migrar `editAdmissionDate()`
- [ ] Testing de validación de fechas

**Estimación:** 2-3 horas

### Fase 3: Campos con Dropdown 🔄 (PENDIENTE - PRIORIDAD ALTA)
- [ ] Extender FIELD_CONFIGS con `inputType: 'modal-dropdown'`
- [ ] Crear builder genérico de modales con dropdown
- [ ] Migrar `editPatientPrevision()`
- [ ] Migrar `editDiagnosis()` y consolidar con `editPatientDiagnosis()`
- [ ] Testing completo

**Estimación:** 6-8 horas

### Fase 4: Limpieza y Consolidación 🔄 (PENDIENTE)
- [ ] Eliminar funciones duplicadas del sistema original
- [ ] Actualizar todas las referencias en HTML/JS
- [ ] Comentar/deprecar `pacientes-edit.js`
- [ ] Validación en producción
- [ ] Mover `pacientes-edit.js` a `/deprecated`

**Estimación:** 2-3 horas

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Opción A: Completar Migración Total (Recomendado)

**Beneficios:**
- Elimina ~735 líneas de código duplicado
- Arquitectura 100% consistente
- Más fácil de mantener a largo plazo

**Tiempo total:** ~10-14 horas de desarrollo

**Pasos:**
1. Implementar soporte para `inputType: 'date'`
2. Implementar soporte para `inputType: 'modal-dropdown'`
3. Migrar Previsión y Diagnóstico
4. Migrar Fecha de Ingreso
5. Testing exhaustivo
6. Deploy gradual

---

### Opción B: Mantener Sistema Híbrido (Actual)

**Estado actual:**
- ✅ 60% de campos en sistema nuevo
- ⚠️ 40% de campos en sistema viejo
- ❌ Dos archivos activos haciendo cosas similares

**Riesgos:**
- Confusión al mantener código
- Código duplicado dificulta debugging
- Nuevos desarrolladores no sabrán qué usar

---

## 🔧 CÓDIGO NECESARIO PARA COMPLETAR

### 1. Agregar soporte de fecha a FIELD_CONFIGS:

```javascript
// En pacientes-edit-refactored.js, agregar:
admissionDate: {
    label: 'Fecha de Ingreso',
    apiField: 'admission_date',
    inputType: 'date',
    placeholder: 'DD/MM/YYYY',

    validator: (val) => {
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(val)) return false;
        // Validar que sea fecha válida
        const [day, month, year] = val.split('/');
        const date = new Date(year, month - 1, day);
        return date.getDate() == day &&
               date.getMonth() == month - 1 &&
               date.getFullYear() == year;
    },
    validatorMessage: 'Fecha inválida (use DD/MM/YYYY)',

    transformer: (val) => {
        // Convertir DD/MM/YYYY a YYYY-MM-DD para la API
        const [day, month, year] = val.split('/');
        return `${year}-${month}-${day}`;
    },

    apiEndpoint: (id) => `/patients/${id}/admission`,
    apiMethod: 'PUT',
    apiPayload: (value) => ({ admission_date: value }),

    updateElement: (patientId, value) => {
        const el = document.getElementById(`admission-date-${patientId}`);
        if (el) el.textContent = value;
    },

    formatDisplay: (value) => value || 'Sin fecha',
    formatPrompt: (value) => value || ''
}
```

### 2. Agregar soporte de dropdown modal:

```javascript
// En FIELD_CONFIGS, ejemplo para Previsión:
prevision: {
    label: 'Previsión de Salud',
    apiField: 'prevision',
    inputType: 'modal-dropdown',

    // Opciones del dropdown
    dropdownOptions: [
        'Fonasa A', 'Fonasa B', 'Fonasa C', 'Fonasa D',
        'Isapre Banmédica', 'Isapre Consalud',
        'Isapre Cruz Blanca', 'Isapre Colmena',
        'Isapre Vida Tres', 'Isapre Nueva Masvida',
        'Particular', 'Sin previsión'
    ],
    allowCustom: true,  // Permitir valor personalizado

    validator: () => true,
    transformer: (val) => val?.trim() || '',

    apiEndpoint: (id) => `/patients/${id}/admission`,
    apiMethod: 'PUT',
    apiPayload: (value) => ({ prevision: value }),

    updateElement: (patientId, value) => {
        const el = document.getElementById(`prevision-${patientId}`);
        if (el) el.textContent = value || 'No especificada';
    },

    formatDisplay: (value) => value || 'No especificada',
    formatPrompt: (value) => value || ''
}
```

### 3. Modificar función `editPatientField()` para soportar modales:

```javascript
// En la función editPatientField(), agregar caso:
case 'modal-dropdown':
    // Crear modal con dropdown
    newValue = await showDropdownModal(
        config.label,
        currentValue,
        config.dropdownOptions,
        config.allowCustom
    );
    break;
```

### 4. Crear función helper para modal con dropdown:

```javascript
async function showDropdownModal(title, currentValue, options, allowCustom = false) {
    return new Promise((resolve) => {
        const modalId = 'genericDropdownModal';

        // Crear modal
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal active';
        modal.style.zIndex = '10000';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem;">
                <h3 style="margin-bottom: 1rem;">Editar ${title}</h3>
                <p style="margin-bottom: 1rem; color: #666;">
                    Valor actual: <strong>${currentValue || 'No especificado'}</strong>
                </p>
                <div id="dropdown-container-modal"></div>
                <div class="form-actions" style="margin-top: 1.5rem; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="saveBtn">Guardar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Usar DropdownSystem si está disponible
        let dropdownInstance;
        if (window.DropdownSystem) {
            // Determinar tipo de dropdown basado en las opciones
            const isDiagnosis = title.toLowerCase().includes('diagnóstico');
            const isPrevision = title.toLowerCase().includes('previsión');

            if (isDiagnosis) {
                dropdownInstance = window.DropdownSystem.createDiagnosisDropdown({
                    containerId: 'dropdown-container-modal',
                    required: false
                });
            } else if (isPrevision) {
                dropdownInstance = window.DropdownSystem.createPrevisionDropdown({
                    containerId: 'dropdown-container-modal',
                    required: false
                });
            } else {
                // Dropdown genérico (implementar si es necesario)
                console.warn('Dropdown genérico no implementado aún');
            }

            // Establecer valor actual
            if (dropdownInstance && currentValue) {
                dropdownInstance.setValue(currentValue);
            }
        }

        // Event listeners
        document.getElementById('cancelBtn').addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            const newValue = dropdownInstance ? dropdownInstance.getValue() : '';
            modal.remove();
            resolve(newValue);
        });
    });
}
```

---

## 📈 IMPACTO DE LA MIGRACIÓN COMPLETA

### Antes (Estado Actual):
- Archivos: 2 sistemas en paralelo
- Líneas de código: 735 (original) + 465 (refactorizado) = **1,200 líneas**
- Duplicación: ~60%
- Mantenibilidad: ⚠️ MEDIA-BAJA

### Después (Migración Completa):
- Archivos: 1 sistema unificado
- Líneas de código: ~600 líneas (con dropdowns incluidos)
- Duplicación: 0%
- Mantenibilidad: ✅ ALTA

**Reducción:** 50% menos código, 100% más limpio

---

## ⚠️ ARCHIVOS RELACIONADOS A REVISAR

1. **`fix-prevision-edit.js`** - ¿Qué hace este archivo?
   - Parece ser un parche para la edición de previsión
   - Revisar si es necesario después de la migración

2. **`pacientes-edit-improved.js`** - Ya movido a `/deprecated`
   - Era un intento intermedio que nunca se usó

3. **`pacientes-service-edit.js`** - Módulo separado para servicio
   - Funciona bien como está
   - Opcional: migrar para consistencia total

---

## 🎯 RECOMENDACIÓN FINAL

**Opción recomendada:** Completar la migración (Fases 2 y 3)

**Razones:**
1. Ya está 60% completado (sería desperdiciar el trabajo)
2. Elimina confusión y deuda técnica
3. Facilita mantenimiento futuro
4. Reduce bugs por código duplicado
5. Mejora la experiencia de desarrollo

**Timeline sugerido:**
- Semana 1: Implementar soporte de fecha y modal-dropdown
- Semana 2: Migrar Previsión y Diagnóstico
- Semana 3: Testing y validación
- Semana 4: Deploy y monitoreo

---

**Última actualización:** 14 de Noviembre de 2025
**Próxima revisión:** Después de completar Fase 2
