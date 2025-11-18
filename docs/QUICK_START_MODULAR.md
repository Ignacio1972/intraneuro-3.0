# 🚀 Guía Rápida: Arquitectura Modular de Componentes
## IntraNeuro v3.0

**Para:** Desarrolladores que implementarán el sistema modular
**Tiempo de lectura:** 10 minutos

---

## 🎯 ¿Qué vamos a hacer?

Migrar el modal de pacientes de un archivo monolítico de 6,284 líneas a una arquitectura modular con componentes independientes de ~200-300 líneas cada uno.

**Antes:**
```
pacientes-refactored.js (1,034 líneas)
  + pacientes-ui.js (630 líneas)
  + pacientes-discharge.js (203 líneas)
  + clinical-chat.js (635 líneas)
  + ...
  = 6,284 líneas TOTALES
```

**Después:**
```
modal-orchestrator.js (200 líneas)
  → admission-component.js (250 líneas)
  → discharge-component.js (280 líneas)
  → notes-component.js (180 líneas)
  → tasks-component.js (150 líneas)
  → chat-component.js (320 líneas)
```

---

## 📋 Checklist de Inicio Rápido

### Día 1: Setup (2-3 horas)

- [ ] **Crear branch de trabajo**
  ```bash
  git checkout -b feature/modal-modular
  git tag -a v2.7.0-stable -m "Versión estable pre-migración"
  ```

- [ ] **Crear estructura de carpetas**
  ```bash
  mkdir -p js/modal-components
  mkdir -p docs
  mkdir -p tests/modal-components
  ```

- [ ] **Hacer backup**
  ```bash
  ./scripts/backup_automatico.sh
  cp js/pacientes-refactored.js js/pacientes-refactored.js.backup
  cp js/pacientes-ui.js js/pacientes-ui.js.backup
  ```

- [ ] **Leer documentación**
  - [ ] `ROADMAP_MODAL_MODULAR.md` (completo)
  - [ ] `COMPONENT_EXAMPLES.md` (referencia)

### Día 2-3: Infraestructura Base (3-4 horas)

- [ ] **Crear BaseComponent**
  - [ ] Copiar código de `COMPONENT_EXAMPLES.md`
  - [ ] Guardar en `/js/modal-components/base-component.js`
  - [ ] Probar en consola del navegador

- [ ] **Crear ModalOrchestrator**
  - [ ] Copiar código de `COMPONENT_EXAMPLES.md`
  - [ ] Guardar en `/js/modal-orchestrator.js`
  - [ ] Actualizar `index.html` con nuevos imports

- [ ] **Actualizar HTML del modal**
  - [ ] Agregar estructura de tabs en `index.html`
  - [ ] Agregar CSS para tabs
  - [ ] Probar navegación entre tabs vacíos

### Día 4-10: Migración de Componentes (1-2 horas cada uno)

- [ ] **Día 4: DischargeComponent** (prioridad 1)
- [ ] **Día 5: NotesComponent** (prioridad 2)
- [ ] **Día 6: TasksComponent** (prioridad 3)
- [ ] **Día 7: AdmissionComponent** (prioridad 4)
- [ ] **Día 8-9: ChatComponent** (prioridad 5)
- [ ] **Día 10: Buffer para ajustes**

### Día 11-12: Testing y Deploy (3-4 horas)

- [ ] **Testing completo**
  - [ ] Flujo: abrir modal → editar → cerrar
  - [ ] Flujo: abrir modal → egreso → verificar en archivo
  - [ ] Flujo: navegación entre tabs
  - [ ] Verificar sincronización con array global `patients`

- [ ] **Deploy a producción**
  - [ ] Merge a main
  - [ ] Tag v3.0.0-modular
  - [ ] Deploy y monitoreo

---

## 🏗️ Estructura de un Componente

**Template básico para copiar y modificar:**

```javascript
/**
 * [Nombre]Component - [Descripción breve]
 */
class [Nombre]Component extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        // Estado específico del componente
    }

    render() {
        return `
            <div class="[nombre]-component">
                <h3>[Título]</h3>
                <!-- HTML del componente -->
            </div>
        `;
    }

    attachEventListeners() {
        // Event listeners específicos
    }

    async handleSubmit(event) {
        event.preventDefault();
        // Lógica de submit

        // Emitir evento al completar
        this.emitEvent('patient:updated', {
            patientId: this.patientData.id,
            field: 'campo',
            value: 'valor'
        });
    }
}
```

---

## 🔄 Flujo de Trabajo: Migrar un Componente

### Paso 1: Crear el archivo del componente

```bash
# Crear archivo
touch js/modal-components/discharge-component.js

# Copiar template base
cat > js/modal-components/discharge-component.js << 'EOF'
class DischargeComponent extends ModalComponent {
    // ... template básico
}
EOF
```

### Paso 2: Migrar funciones del archivo original

**Antes (en pacientes-discharge.js):**
```javascript
function renderDischargeForm(patientId, patient) {
    return `<div>...</div>`;
}

async function processDischarge(event, patientId) {
    // lógica
}
```

**Después (en discharge-component.js):**
```javascript
class DischargeComponent extends ModalComponent {
    renderDischargeForm() {
        return `<div>...</div>`;
    }

    async handleSubmit(event) {
        // lógica migrada
    }
}
```

### Paso 3: Registrar en el orquestador

**En modal-orchestrator.js:**
```javascript
this.componentRegistry = {
    'admission': AdmissionComponent,
    'discharge': DischargeComponent,  // ← Agregar aquí
    'notes': NotesComponent,
    'tasks': TasksComponent,
    'chat': ChatComponent
};
```

### Paso 4: Actualizar imports en index.html

```html
<!-- Agregar ANTES del orchestrator -->
<script src="/js/modal-components/discharge-component.js"></script>
```

### Paso 5: Probar

```javascript
// En consola del navegador
openPatientModal(1);  // Abrir modal
// Navegar al tab de egreso
// Verificar que se renderiza correctamente
```

### Paso 6: Commit

```bash
git add js/modal-components/discharge-component.js
git add js/modal-orchestrator.js
git add index.html
git commit -m "feat: Implementar DischargeComponent modular"
```

---

## 🎨 Orden de Imports en index.html

**IMPORTANTE:** El orden de carga es crítico.

```html
<!-- 1. Librerías base -->
<script src="/assets/libs/fuse.min.js"></script>

<!-- 2. API y utilidades -->
<script src="/js/api.js"></script>
<script src="/js/auth.js"></script>

<!-- 3. Módulos de datos -->
<script src="/js/data-catalogos.js"></script>
<script src="/js/modules/dropdown-system.js"></script>

<!-- 4. Componentes del modal (NUEVO) -->
<script src="/js/modal-components/base-component.js"></script>
<script src="/js/modal-components/admission-component.js"></script>
<script src="/js/modal-components/discharge-component.js"></script>
<script src="/js/modal-components/notes-component.js"></script>
<script src="/js/modal-components/tasks-component.js"></script>
<script src="/js/modal-components/chat-component.js"></script>

<!-- 5. Orquestador del modal (NUEVO) -->
<script src="/js/modal-orchestrator.js"></script>

<!-- 6. Inicialización -->
<script src="/js/main.js"></script>

<!-- DEPRECAR (comentar o mover al final) -->
<!-- <script src="/js/pacientes-ui.js"></script> -->
<!-- <script src="/js/pacientes-refactored.js"></script> -->
```

---

## 🐛 Debugging Tips

### 1. Verificar que el componente se carga

```javascript
// En consola del navegador
console.log(DischargeComponent);  // Debe mostrar la clase
console.log(patientModal);  // Debe mostrar el orquestador
```

### 2. Verificar eventos

```javascript
// Escuchar todos los eventos de pacientes
document.addEventListener('patient:discharged', (e) => {
    console.log('Paciente egresado:', e.detail);
});

document.addEventListener('patient:updated', (e) => {
    console.log('Paciente actualizado:', e.detail);
});
```

### 3. Ver estado del orquestador

```javascript
// En consola
patientModal.currentPatient;  // Ver paciente actual
patientModal.activeTab;  // Ver tab activo
patientModal.components;  // Ver componentes cargados
```

### 4. Forzar re-render de un componente

```javascript
// En consola
const component = patientModal.components.discharge;
component.mount();  // Forzar re-render
```

---

## ⚠️ Errores Comunes y Soluciones

### Error: "ModalComponent is not defined"

**Causa:** `base-component.js` no se cargó antes del componente.

**Solución:** Verificar orden de imports en `index.html`.

---

### Error: "Cannot read property 'id' of undefined"

**Causa:** `patientData` no se pasó correctamente al componente.

**Solución:** Verificar que el orquestador pasa `currentPatient` al constructor:
```javascript
this.components[key] = new ComponentClass(containerId, this.currentPatient);
```

---

### Error: "Container tab-discharge not found"

**Causa:** El HTML del modal no tiene el contenedor para el tab.

**Solución:** Verificar que `index.html` tiene:
```html
<div id="tab-discharge" class="tab-content"></div>
```

---

### El componente no se renderiza

**Causa:** El componente no está registrado en el orquestador.

**Solución:** Verificar que está en `componentRegistry`:
```javascript
this.componentRegistry = {
    'discharge': DischargeComponent,  // ← Debe estar aquí
};
```

---

### Los eventos no se emiten

**Causa:** No se está usando `emitEvent()` correctamente.

**Solución:** Usar método heredado de `BaseComponent`:
```javascript
this.emitEvent('patient:updated', { patientId: 123 });
```

---

## 📊 Verificación de Progreso

### Checklist por Componente

Para cada componente migrado, verificar:

- [ ] ✅ Archivo creado en `/js/modal-components/`
- [ ] ✅ Clase extiende `ModalComponent`
- [ ] ✅ Implementa `render()`
- [ ] ✅ Implementa `attachEventListeners()` si necesita eventos
- [ ] ✅ Emite eventos cuando actualiza datos
- [ ] ✅ Registrado en `componentRegistry`
- [ ] ✅ Import agregado en `index.html`
- [ ] ✅ Probado manualmente
- [ ] ✅ Sin errores en consola
- [ ] ✅ Commit realizado

---

## 🎯 Criterios de Éxito

**Un componente está COMPLETO cuando:**

1. ✅ Se renderiza correctamente en su tab
2. ✅ Todos los botones y formularios funcionan
3. ✅ Actualiza la BD correctamente
4. ✅ Emite eventos para sincronizar con otros componentes
5. ✅ No hay errores en consola del navegador
6. ✅ No hay errores en logs del backend
7. ✅ La funcionalidad es 100% equivalente al sistema anterior

---

## 📚 Recursos Rápidos

| Necesito... | Ver documento... |
|------------|------------------|
| Visión general del proyecto | `ROADMAP_MODAL_MODULAR.md` |
| Ejemplos de código completo | `COMPONENT_EXAMPLES.md` |
| Guía de la arquitectura actual | `CLAUDE.md` |
| Análisis del sistema actual | `ANALISIS_ARQUITECTURA.md` |

---

## 🚀 Comando Rápido para Empezar

```bash
# Setup completo en un solo comando
git checkout -b feature/modal-modular && \
git tag -a v2.7.0-stable -m "Pre-migración modular" && \
mkdir -p js/modal-components docs tests/modal-components && \
./scripts/backup_automatico.sh && \
echo "✅ Setup completo! Ahora crea base-component.js"
```

---

## 💡 Tip Final

**Migra UN componente a la vez.** No intentes hacer todo de golpe.

**Orden recomendado:**
1. DischargeComponent (más simple, bien aislado)
2. NotesComponent (simple)
3. TasksComponent (media complejidad)
4. AdmissionComponent (usa sistema de edición inline)
5. ChatComponent (más complejo)

**Después de cada componente:**
- Prueba exhaustivamente
- Commit
- Respira
- Siguiente componente

---

## 🎉 ¿Listo para empezar?

1. Lee el `ROADMAP_MODAL_MODULAR.md` completo (30 min)
2. Ejecuta el comando de setup
3. Crea `base-component.js` y `modal-orchestrator.js`
4. Migra tu primer componente (DischargeComponent)
5. Celebra tu primer componente modular funcionando! 🎊

---

*Última actualización: 18 de Noviembre de 2025*
