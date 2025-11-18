# 📘 Guía de Migración: Sistema de Edición Refactorizado

## 🎯 Objetivo
Eliminar duplicación de código en las funciones de edición de pacientes, reduciendo de **736 líneas** a aproximadamente **350 líneas** (-52%).

## 📊 Estado Actual

### ✅ Fase 1 Completada
- **Archivo creado:** `js/modules/pacientes/pacientes-edit-refactored.js`
- **Campos migrados:** 6 campos
  - ✅ `name` - Nombre del paciente
  - ✅ `age` - Edad
  - ✅ `bed` - Cama
  - ✅ `rut` - RUT (configurado, pendiente de probar)
  - ✅ `admittedBy` - Médico tratante (configurado, pendiente de probar)
  - ✅ `diagnosisDetails` - Descripción diagnóstico (configurado, pendiente de probar)

### 🔄 Pendientes - Fase 2
Campos que requieren modales personalizados:
- ⏳ `prevision` - Requiere modal con dropdown
- ⏳ `diagnosis` - Requiere modal con dropdown
- ⏳ `admissionDate` - Requiere date picker

## 🧪 Cómo Probar

### 1. Prueba Local
```bash
# Abrir el archivo de prueba en el navegador
https://intraneurodavila.com/test-edit-refactored.html
```

### 2. Verificar Funcionalidad
1. **Columna Izquierda (Roja):** Sistema original
2. **Columna Derecha (Verde):** Sistema refactorizado
3. Ambos deben comportarse idénticamente

### 3. Consola del Navegador
```javascript
// Ver configuración de campos
PacientesEditRefactored.FIELD_CONFIGS

// Probar edición directa
editPatientField(null, 1, 'name')

// Probar wrapper de compatibilidad
editPatientNameRefactored(null, 1)
```

## 🔧 Cómo Migrar un Campo Nuevo

### 1. Agregar Configuración
```javascript
// En FIELD_CONFIGS agregar:
fieldName: {
    label: 'Etiqueta Visible',
    apiField: 'campo_en_bd',
    inputType: 'text', // o 'number', 'date', 'modal'
    placeholder: 'Mensaje de ayuda',

    // Validación
    validator: (val) => { /* lógica de validación */ },
    validatorMessage: 'Mensaje de error',

    // Transformación
    transformer: (val) => val.trim(),

    // API
    apiEndpoint: (id) => `/patients/${id}/campo`,
    apiPayload: (value) => ({ campo: value }),

    // UI
    updateElement: (patientId, value) => {
        const el = document.getElementById(`campo-${patientId}`);
        if (el) el.textContent = value;
    }
}
```

### 2. Actualizar el HTML
```html
<!-- Cambiar de: -->
<button onclick="editPatientCampo(event, ${patient.id})">

<!-- A: -->
<button onclick="editPatientField(event, ${patient.id}, 'fieldName')">
```

### 3. Opcional: Crear Wrapper
```javascript
// Para mantener compatibilidad temporal
async function editPatientCampoRefactored(event, patientId) {
    return editPatientField(event, patientId, 'fieldName');
}
```

## 📝 Integración en Producción

### Paso 1: Incluir el Nuevo Script
```html
<!-- En index.html, ficha.html, etc. -->
<script src="js/modules/pacientes/pacientes-edit-refactored.js"></script>
```

### Paso 2: Migración Gradual
```javascript
// Opción A: Reemplazar función por función
// En lugar de editPatientName, usar editPatientField

// Opción B: Usar wrappers temporales
// Reemplazar editPatientName con editPatientNameRefactored
```

### Paso 3: Eliminar Código Antiguo
Una vez probado y estable:
1. Eliminar funciones originales de `pacientes-edit.js`
2. Renombrar wrappers quitando el sufijo "Refactored"
3. Eliminar archivo antiguo

## ⚠️ Consideraciones Importantes

### Dependencias Requeridas
- `window.patients` - Array global de pacientes
- `showToast()` - Función de notificaciones
- `renderPatients()` - Función de actualización de UI
- `apiRequest()` - Cliente HTTP (o PacientesAPI)

### Validación de RUT
```javascript
// Asegurarse que validateRut esté disponible globalmente
function validateRut(rut) {
    // Implementación actual del sistema
}
```

### Campos Especiales
Los campos `prevision` y `diagnosis` requieren modales con dropdowns. Estos se implementarán en Fase 2 con:
- `modalBuilder` personalizado
- Sistema de promesas para manejar la asincronía
- Reutilización del código de dropdowns existente

## 📈 Métricas de Mejora

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código | 736 | ~350 | -52% |
| Funciones duplicadas | 11 | 1 | -91% |
| Complejidad ciclomática | Alta | Baja | ✅ |
| Mantenibilidad | Difícil | Fácil | ✅ |
| Agregar nuevo campo | 50+ líneas | 15 líneas | -70% |

## 🚀 Próximos Pasos

1. **Inmediato:**
   - [ ] Probar en ambiente de desarrollo
   - [ ] Verificar que las validaciones funcionan
   - [ ] Confirmar integración con API

2. **Fase 2:**
   - [ ] Implementar `showSelectDialog()` para dropdowns
   - [ ] Implementar `showDateDialog()` para fechas
   - [ ] Migrar campos con modales (prevision, diagnosis)

3. **Fase 3:**
   - [ ] Eliminar código duplicado original
   - [ ] Actualizar todos los archivos HTML
   - [ ] Documentar en el sistema principal

## 💡 Tips de Debugging

```javascript
// Activar logs detallados
console.log('[EditField]', ...);

// Ver configuración actual
console.table(FIELD_CONFIGS);

// Verificar que las funciones estén disponibles
console.log(window.editPatientField); // debe existir

// Mock para testing sin backend
window.apiRequest = async (url, opts) => {
    console.log('Mock API:', url, opts);
    return { success: true };
};
```

---

**Fecha de creación:** Noviembre 2025
**Autor:** Sistema IntraNeuro
**Versión:** 1.0.0