# 🏗️ ROADMAP: Migración a Arquitectura Modular de Componentes
## Sistema de Gestión de Pacientes - IntraNeuro v3.0

**Versión:** 1.0
**Fecha:** 18 de Noviembre de 2025
**Autor:** Equipo de Desarrollo IntraNeuro
**Estado:** 📋 Propuesta Aprobada

---

## 📊 RESUMEN EJECUTIVO

### Problema Actual
El modal de gestión de pacientes ha crecido hasta convertirse en un archivo monolítico de **~6,284 líneas de código** distribuidas en múltiples archivos interdependientes. A pesar del refactoring v2.7.0, agregar nueva funcionalidad (chat, audio, notas, tareas, egresos) sigue aumentando la complejidad y riesgo de bugs.

### Solución Propuesta
Migrar a una **arquitectura modular basada en componentes** con un orquestador central que gestiona componentes independientes y reutilizables.

### Beneficios Esperados
- ✅ Reducción de complejidad de archivos individuales (de 1,034 a ~150 líneas en orquestador)
- ✅ Separación clara de responsabilidades (1 componente = 1 funcionalidad)
- ✅ Facilita testing unitario y debugging
- ✅ Permite lazy loading para mejor performance
- ✅ Escalabilidad: agregar features sin modificar código existente
- ✅ Mantenibilidad: cambios aislados a componentes específicos

### Timeline Estimado
**Total:** 16-20 horas de desarrollo
**Duración:** 2-3 semanas (desarrollo incremental sin downtime)

---

## 🎯 OBJETIVOS

### Objetivos Principales

1. **Modularización Completa**
   - Separar cada funcionalidad del modal en componentes independientes
   - Crear un orquestador central que gestione el ciclo de vida de componentes
   - Eliminar dependencias cruzadas entre funcionalidades

2. **Mantenibilidad**
   - Reducir el tamaño de archivos individuales a <400 líneas
   - Facilitar la localización y corrección de bugs
   - Simplificar el onboarding de nuevos desarrolladores

3. **Escalabilidad**
   - Permitir agregar nuevas funcionalidades sin modificar código existente
   - Implementar sistema de plugins para componentes opcionales
   - Preparar infraestructura para futuras expansiones (reportes, análisis, etc.)

4. **Performance**
   - Implementar lazy loading de componentes
   - Reducir carga inicial del modal
   - Optimizar renderizado mediante virtualización de tabs

5. **Testing y Calidad**
   - Permitir testing unitario de componentes aislados
   - Implementar tests de integración entre componentes
   - Establecer cobertura mínima de 60%

### Objetivos Secundarios

- Mantener 100% de compatibilidad con código existente durante migración
- Migración sin downtime en producción
- Documentación completa de arquitectura y componentes
- Crear guías para desarrolladores sobre cómo crear nuevos componentes

---

## 📐 ARQUITECTURA PROPUESTA

### Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    MODAL ORCHESTRATOR                       │
│  - Gestión de estado global del paciente                   │
│  - Carga/descarga de componentes                           │
│  - Enrutamiento entre tabs                                 │
│  - Sistema de eventos entre componentes                    │
│  - Sincronización con array global 'patients'              │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┬──────────────┐
    │             │             │              │              │
┌───▼──────┐ ┌───▼──────┐ ┌───▼──────┐ ┌────▼─────┐ ┌──────▼───┐
│ Admission│ │ Discharge│ │  Notes   │ │  Tasks   │ │   Chat   │
│Component │ │Component │ │Component │ │Component │ │Component │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Componentes del Sistema

#### 1. BaseComponent (Clase Abstracta)
**Responsabilidad:** Clase base que define la interfaz común para todos los componentes.

**Métodos obligatorios:**
```javascript
class ModalComponent {
    constructor(containerId, patientData)
    render()              // Retorna HTML del componente
    mount()               // Inserta HTML en el DOM
    attachEventListeners() // Configura eventos
    update(newData)       // Actualiza con nuevos datos
    destroy()             // Limpia recursos
    emitEvent(name, data) // Comunica con otros componentes
}
```

**Archivo:** `/js/modal-components/base-component.js` (~80 líneas)

#### 2. ModalOrchestrator (Singleton)
**Responsabilidad:** Gestión centralizada del modal y sus componentes.

**Funcionalidades:**
- Registro de componentes disponibles
- Apertura/cierre del modal
- Navegación entre tabs
- Lazy loading de componentes
- Gestión de estado del paciente actual
- Sistema de eventos pub/sub entre componentes
- Sincronización con array global `patients`

**Archivo:** `/js/modal-orchestrator.js` (~200 líneas)

#### 3. Componentes Especializados

| Componente | Responsabilidad | Líneas Est. | Archivo |
|-----------|----------------|-------------|---------|
| **AdmissionComponent** | Datos de ingreso, edición inline de campos de admisión | ~250 | admission-component.js |
| **DischargeComponent** | Formulario de egreso, toggle alta programada, datos de egreso | ~280 | discharge-component.js |
| **NotesComponent** | Observaciones médicas, sistema de notas simples | ~180 | notes-component.js |
| **TasksComponent** | Tareas pendientes con checkboxes, notas de audio | ~150 | tasks-component.js |
| **ChatComponent** | Chat clínico tipo WhatsApp, timeline de eventos | ~320 | chat-component.js |
| **EditComponent** | Sistema de edición inline genérico (FIELD_CONFIGS) | ~380 | edit-component.js |

### Estructura de Archivos

```
/var/www/intraneuro-dev/
├── js/
│   ├── modal-orchestrator.js           # ✨ NUEVO - Orquestador principal
│   │
│   ├── modal-components/               # ✨ NUEVA CARPETA
│   │   ├── base-component.js          # Clase base abstracta
│   │   ├── admission-component.js     # Datos de ingreso
│   │   ├── discharge-component.js     # Egreso y alta programada
│   │   ├── notes-component.js         # Observaciones médicas
│   │   ├── tasks-component.js         # Tareas pendientes
│   │   ├── chat-component.js          # Chat clínico
│   │   └── edit-component.js          # Edición inline
│   │
│   ├── modules/
│   │   └── pacientes/
│   │       ├── pacientes-api.js       # ✅ MANTENER - API client
│   │       ├── pacientes-edit-refactored.js  # → MIGRAR a edit-component.js
│   │       └── pacientes-discharge.js        # → MIGRAR a discharge-component.js
│   │
│   ├── pacientes-refactored.js        # → DEPRECAR (sustituido por orchestrator)
│   └── pacientes-ui.js                # → DEPRECAR (funciones movidas a componentes)
│
├── deprecated/                         # Archivos obsoletos
│   ├── pacientes.js
│   ├── chat-notes.js
│   ├── pacientes-refactored.js        # ← MOVER AQUÍ en Fase 3
│   └── pacientes-ui.js                # ← MOVER AQUÍ en Fase 3
│
└── docs/
    ├── COMPONENT_API.md               # ✨ NUEVO - API de componentes
    └── ADDING_NEW_COMPONENTS.md       # ✨ NUEVO - Guía para devs
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Estrategia de Migración

**Tipo:** Migración incremental sin downtime (Strangler Fig Pattern)

**Principios:**
1. ✅ No romper funcionalidad existente
2. ✅ Migrar un componente a la vez
3. ✅ Testear cada componente antes de pasar al siguiente
4. ✅ Mantener compatibilidad con código legacy durante transición
5. ✅ Hacer commit por cada componente migrado

---

### FASE 0: Preparación (2-3 horas)

**Objetivo:** Configurar infraestructura base y entorno de testing

#### Tareas

**0.1. Análisis y Documentación**
- [ ] Revisar código actual y mapear dependencias
- [ ] Identificar funciones globales que deben exportarse
- [ ] Documentar flujo actual de eventos y actualizaciones de estado
- [ ] Crear matriz de compatibilidad (qué código legacy debe mantenerse)

**Tiempo:** 1 hora

**0.2. Setup de Infraestructura**
- [ ] Crear carpeta `/js/modal-components/`
- [ ] Crear carpeta `/docs/`
- [ ] Configurar script de build/concatenación (opcional)
- [ ] Crear archivo de configuración para componentes

**Tiempo:** 30 minutos

**0.3. Backup y Control de Versiones**
- [ ] Crear branch `feature/modal-modular`
- [ ] Hacer backup completo de archivos a modificar
- [ ] Crear release/tag de versión estable actual (v2.7.0)
- [ ] Configurar script de rollback automático

**Comando:**
```bash
git checkout -b feature/modal-modular
git tag -a v2.7.0-stable -m "Version estable antes de migración modular"
./scripts/backup_archivos_criticos.sh
```

**Tiempo:** 30 minutos

**0.4. Testing Setup**
- [ ] Crear `/tests/modal-components/` directory
- [ ] Configurar framework de testing (Jest o similar)
- [ ] Crear tests de regresión para funcionalidad actual
- [ ] Documentar casos de prueba críticos

**Tiempo:** 1 hora

**Entregables Fase 0:**
- ✅ Branch `feature/modal-modular` creado
- ✅ Backup de archivos críticos
- ✅ Infraestructura de carpetas lista
- ✅ Tests de regresión documentados

---

### FASE 1: Infraestructura Base (3-4 horas)

**Objetivo:** Crear la base sobre la cual se construirán todos los componentes

#### Tareas

**1.1. Crear BaseComponent**
- [ ] Implementar clase abstracta `ModalComponent`
- [ ] Definir interfaz de métodos obligatorios
- [ ] Implementar sistema de eventos personalizado
- [ ] Agregar helpers comunes (formatDate, showToast, etc.)
- [ ] Documentar API del componente base

**Archivo:** `/js/modal-components/base-component.js`

**Código esqueleto:**
```javascript
class ModalComponent {
    constructor(containerId, patientData) {
        this.containerId = containerId;
        this.patientData = patientData;
        this.isRendered = false;
        this.eventHandlers = new Map();
    }

    // Métodos abstractos (deben ser implementados por subclases)
    render() {
        throw new Error(`${this.constructor.name} must implement render()`);
    }

    // Métodos concretos (heredados por todas las subclases)
    mount() { /* ... */ }
    attachEventListeners() { /* ... */ }
    update(newData) { /* ... */ }
    destroy() { /* ... */ }
    emitEvent(eventName, data) { /* ... */ }

    // Helpers compartidos
    formatDate(date) { /* ... */ }
    showToast(message, type) { /* ... */ }
    validateField(value, rules) { /* ... */ }
}
```

**Tests:**
```javascript
describe('BaseComponent', () => {
    test('should throw error if render() not implemented', () => {
        const component = new ModalComponent('test', {});
        expect(() => component.render()).toThrow();
    });

    test('should emit custom events', () => {
        // ... test event emission
    });
});
```

**Tiempo:** 2 horas

**1.2. Crear ModalOrchestrator**
- [ ] Implementar singleton pattern
- [ ] Crear registro de componentes
- [ ] Implementar sistema de lazy loading
- [ ] Agregar gestión de estado del paciente
- [ ] Implementar sistema de navegación entre tabs
- [ ] Crear sistema pub/sub para comunicación entre componentes

**Archivo:** `/js/modal-orchestrator.js`

**Código esqueleto:**
```javascript
class PatientModalOrchestrator {
    constructor() {
        if (PatientModalOrchestrator.instance) {
            return PatientModalOrchestrator.instance;
        }

        this.components = {};
        this.currentPatient = null;
        this.activeTab = 'admission';

        // Registro de componentes disponibles
        this.componentRegistry = {
            'admission': null,    // Lazy loaded
            'discharge': null,
            'notes': null,
            'tasks': null,
            'chat': null
        };

        this.setupEventListeners();
        PatientModalOrchestrator.instance = this;
    }

    // API pública
    open(patientId) { /* ... */ }
    close() { /* ... */ }
    showTab(tabName) { /* ... */ }
    refreshCurrentPatient() { /* ... */ }

    // Gestión de componentes
    loadComponents() { /* ... */ }
    registerComponent(name, ComponentClass) { /* ... */ }
    unloadComponent(name) { /* ... */ }

    // Sistema de eventos
    setupEventListeners() { /* ... */ }
    handlePatientUpdated(event) { /* ... */ }
    handlePatientDischarged(event) { /* ... */ }

    // Renderizado
    renderModal() { /* ... */ }
    renderTabs() { /* ... */ }
}

// Singleton global
const patientModal = new PatientModalOrchestrator();

// Exportar funciones globales para compatibilidad
window.openPatientModal = (id) => patientModal.open(id);
window.closePatientModal = () => patientModal.close();
```

**Tiempo:** 1.5 horas

**1.3. Actualizar HTML del Modal**
- [ ] Modificar estructura HTML para soportar tabs
- [ ] Agregar contenedores para cada componente
- [ ] Actualizar CSS para sistema de tabs
- [ ] Asegurar compatibilidad con modales existentes

**Archivo:** `/var/www/intraneuro-dev/index.html`

**HTML actualizado:**
```html
<div id="patientModal" class="modal">
    <div class="modal-content patient-modal-content">
        <span class="close">&times;</span>

        <!-- Patient Header (nombre, edad, RUT) -->
        <div id="patient-header" class="patient-header"></div>

        <!-- Tabs Navigation -->
        <div class="modal-tabs">
            <button class="tab-btn active" data-tab="admission">📊 Ingreso</button>
            <button class="tab-btn" data-tab="discharge">🏥 Egreso</button>
            <button class="tab-btn" data-tab="notes">📝 Notas</button>
            <button class="tab-btn" data-tab="tasks">✅ Tareas</button>
            <button class="tab-btn" data-tab="chat">💬 Chat</button>
        </div>

        <!-- Tab Contents -->
        <div id="tab-admission" class="tab-content active"></div>
        <div id="tab-discharge" class="tab-content"></div>
        <div id="tab-notes" class="tab-content"></div>
        <div id="tab-tasks" class="tab-content"></div>
        <div id="tab-chat" class="tab-content"></div>
    </div>
</div>
```

**CSS:**
```css
.modal-tabs {
    display: flex;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 20px;
}

.tab-btn {
    flex: 1;
    padding: 12px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s;
}

.tab-btn.active {
    background: #007bff;
    color: white;
    border-bottom: 3px solid #0056b3;
}

.tab-content {
    display: none;
    padding: 20px;
    min-height: 400px;
}

.tab-content.active {
    display: block;
}
```

**Tiempo:** 30 minutos

**Entregables Fase 1:**
- ✅ `base-component.js` implementado y testeado
- ✅ `modal-orchestrator.js` implementado y testeado
- ✅ HTML del modal actualizado con tabs
- ✅ CSS de tabs funcionando
- ✅ Tests unitarios pasando
- ✅ Documentación de API base

---

### FASE 2: Migración de Componentes (8-10 horas)

**Objetivo:** Migrar cada funcionalidad a su propio componente

**Estrategia:** Migrar un componente a la vez, testear, hacer commit, continuar.

---

#### 2.1. DischargeComponent (Prioridad 1) - 2 horas

**¿Por qué primero?**
- ✅ Es la funcionalidad que motivó este roadmap
- ✅ Está bien aislada en `pacientes-discharge.js`
- ✅ Tiene pocas dependencias externas
- ✅ Es crítica y debe funcionar perfectamente

**Tareas:**
- [ ] Crear `discharge-component.js` extendiendo `BaseComponent`
- [ ] Migrar funciones de `pacientes-discharge.js`:
  - `renderDischargeForm()`
  - `renderDischargedData()`
  - `processDischarge()`
  - `toggleScheduledDischarge()`
- [ ] Implementar comunicación con API via `PacientesAPI`
- [ ] Emitir evento `patient:discharged` al completar egreso
- [ ] Agregar validaciones de formulario
- [ ] Testear integración con backend

**Código ejemplo:**
```javascript
class DischargeComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.api = new PacientesAPI();
    }

    render() {
        if (this.patientData.dischargeDate) {
            return this.renderDischargedData();
        }
        return this.renderDischargeForm();
    }

    renderDischargeForm() {
        return `
            <div class="discharge-form">
                <h3>Egreso del Paciente</h3>
                <!-- Formulario completo -->
            </div>
        `;
    }

    async handleSubmit(event) {
        event.preventDefault();
        // ... lógica de egreso

        // Emitir evento al completar
        this.emitEvent('patient:discharged', {
            patientId: this.patientData.id
        });
    }
}
```

**Tests:**
```javascript
describe('DischargeComponent', () => {
    test('should render form for active patient', () => {
        const component = new DischargeComponent('test', { id: 1 });
        const html = component.render();
        expect(html).toContain('Egreso del Paciente');
    });

    test('should emit event on successful discharge', async () => {
        // ... test event emission
    });
});
```

**Criterios de aceptación:**
- [ ] Formulario de egreso se renderiza correctamente
- [ ] Toggle de alta programada funciona
- [ ] Egreso completo actualiza BD
- [ ] Evento `patient:discharged` se emite correctamente
- [ ] Modal se cierra y lista se actualiza
- [ ] Validaciones funcionan (fecha requerida)
- [ ] Checkbox de fallecimiento funciona

**Commit:** `feat: Implementar DischargeComponent modular`

---

#### 2.2. NotesComponent (Prioridad 2) - 1.5 horas

**¿Por qué segundo?**
- ✅ Funcionalidad simple y bien definida
- ✅ Ya usa sistema simplificado (textareas)
- ✅ Pocas dependencias

**Tareas:**
- [ ] Crear `notes-component.js`
- [ ] Migrar sistema de observaciones de `simple-notes.js`
- [ ] Implementar renderizado de lista de notas
- [ ] Agregar formulario de nueva nota
- [ ] Implementar guardado automático
- [ ] Integrar con API de observaciones

**Código ejemplo:**
```javascript
class NotesComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.observations = [];
        this.autoSaveTimer = null;
    }

    async mount() {
        await this.loadObservations();
        super.mount();
        this.setupAutoSave();
    }

    async loadObservations() {
        try {
            const response = await fetch(`/api/patients/${this.patientData.id}/observations`);
            this.observations = await response.json();
        } catch (error) {
            console.error('Error loading observations:', error);
        }
    }

    render() {
        return `
            <div class="notes-component">
                <h3>Observaciones Médicas</h3>
                ${this.renderObservationsList()}
                ${this.renderNewObservationForm()}
            </div>
        `;
    }
}
```

**Commit:** `feat: Implementar NotesComponent modular`

---

#### 2.3. TasksComponent (Prioridad 3) - 2 horas

**Tareas:**
- [ ] Crear `tasks-component.js`
- [ ] Migrar sistema de tareas pendientes
- [ ] Implementar checkboxes interactivos
- [ ] Integrar sistema de notas de audio
- [ ] Gestionar estados de tareas (pending/completed)

**Commit:** `feat: Implementar TasksComponent modular`

---

#### 2.4. AdmissionComponent (Prioridad 4) - 2.5 horas

**Tareas:**
- [ ] Crear `admission-component.js`
- [ ] Migrar `renderAdmissionData()` de `pacientes-ui.js`
- [ ] Integrar sistema de edición inline para campos de admisión
- [ ] Implementar actualización optimista de UI
- [ ] Gestionar validaciones de campos

**Código ejemplo:**
```javascript
class AdmissionComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.editComponent = null;
    }

    render() {
        return `
            <div class="admission-component">
                <h3>Datos de Ingreso</h3>
                <div class="info-grid">
                    ${this.renderEditableField('name', 'Nombre')}
                    ${this.renderEditableField('age', 'Edad')}
                    ${this.renderEditableField('bed', 'Cama')}
                    <!-- ... más campos -->
                </div>
            </div>
        `;
    }

    renderEditableField(fieldName, label) {
        const value = this.patientData[fieldName] || 'N/A';
        return `
            <div class="info-row">
                <span class="info-label">${label}:</span>
                <span class="info-value editable"
                      onclick="editPatientField(event, ${this.patientData.id}, '${fieldName}')">
                    ${value}
                </span>
            </div>
        `;
    }
}
```

**Commit:** `feat: Implementar AdmissionComponent modular`

---

#### 2.5. ChatComponent (Prioridad 5) - 2.5 horas

**Tareas:**
- [ ] Crear `chat-component.js`
- [ ] Migrar sistema de chat clínico de `clinical-chat.js`
- [ ] Implementar timeline de eventos
- [ ] Integrar sistema de mensajes
- [ ] Gestionar estado de chat (nueva instancia por paciente)

**Commit:** `feat: Implementar ChatComponent modular`

---

#### 2.6. EditComponent (Opcional) - 2 horas

**Nota:** Este componente es transversal y lo usan otros componentes.

**Tareas:**
- [ ] Crear `edit-component.js`
- [ ] Migrar sistema de edición inline de `pacientes-edit-refactored.js`
- [ ] Mantener `FIELD_CONFIGS` y validaciones
- [ ] Crear API para que otros componentes usen edición inline

**Commit:** `feat: Implementar EditComponent modular`

---

**Entregables Fase 2:**
- ✅ 5-6 componentes migrados y funcionando
- ✅ Tests unitarios para cada componente
- ✅ Integración con ModalOrchestrator
- ✅ Funcionalidad 100% equivalente al sistema anterior
- ✅ Commits individuales por componente

---

### FASE 3: Integración y Limpieza (2-3 horas)

**Objetivo:** Integrar todos los componentes, eliminar código legacy, optimizar

#### Tareas

**3.1. Integración Completa**
- [ ] Registrar todos los componentes en `ModalOrchestrator`
- [ ] Verificar comunicación entre componentes via eventos
- [ ] Testear flujos completos (ingreso → egreso → archivo)
- [ ] Verificar sincronización con array global `patients`
- [ ] Probar navegación entre tabs

**Tiempo:** 1 hora

**3.2. Eliminar Código Legacy**
- [ ] Mover `pacientes-refactored.js` a `/deprecated/`
- [ ] Mover `pacientes-ui.js` a `/deprecated/`
- [ ] Mover `pacientes-discharge.js` a `/deprecated/`
- [ ] Actualizar imports en `index.html`
- [ ] Eliminar funciones globales no utilizadas
- [ ] Limpiar event listeners antiguos

**Archivos a deprecar:**
```bash
mv js/pacientes-refactored.js deprecated/
mv js/pacientes-ui.js deprecated/
mv js/modules/pacientes/pacientes-discharge.js deprecated/
```

**Nuevos imports en index.html:**
```html
<!-- ANTES -->
<script src="/js/pacientes-ui.js"></script>
<script src="/js/pacientes-refactored.js"></script>
<script src="/js/modules/pacientes/pacientes-discharge.js"></script>

<!-- DESPUÉS -->
<script src="/js/modal-components/base-component.js"></script>
<script src="/js/modal-components/admission-component.js"></script>
<script src="/js/modal-components/discharge-component.js"></script>
<script src="/js/modal-components/notes-component.js"></script>
<script src="/js/modal-components/tasks-component.js"></script>
<script src="/js/modal-components/chat-component.js"></script>
<script src="/js/modal-orchestrator.js"></script>
```

**Tiempo:** 1 hora

**3.3. Optimizaciones**
- [ ] Implementar lazy loading real (cargar componentes bajo demanda)
- [ ] Agregar cache de componentes renderizados
- [ ] Optimizar re-renders (solo re-renderizar tab activo)
- [ ] Minificar archivos para producción

**Tiempo:** 1 hora

**Entregables Fase 3:**
- ✅ Código legacy removido/deprecado
- ✅ Imports actualizados
- ✅ Sistema optimizado
- ✅ Sin dependencias a código antiguo

---

### FASE 4: Testing y Documentación (2-3 horas)

**Objetivo:** Asegurar calidad y facilitar mantenimiento futuro

#### Tareas

**4.1. Testing Completo**
- [ ] Tests unitarios para cada componente (cobertura >60%)
- [ ] Tests de integración entre componentes
- [ ] Tests end-to-end de flujos críticos:
  - Abrir modal → editar datos → cerrar
  - Abrir modal → hacer egreso → verificar en archivo
  - Abrir modal → agregar nota → verificar guardado
  - Navegar entre tabs sin perder datos
- [ ] Tests de regresión (comparar con sistema anterior)
- [ ] Tests de performance (tiempo de carga del modal)

**Herramientas:**
```javascript
// Jest + Testing Library
describe('Patient Modal Integration', () => {
    test('should discharge patient and update archive', async () => {
        // ... test completo
    });
});
```

**Tiempo:** 1.5 horas

**4.2. Documentación Técnica**
- [ ] Crear `/docs/COMPONENT_API.md` - API de cada componente
- [ ] Crear `/docs/ADDING_NEW_COMPONENTS.md` - Guía para devs
- [ ] Documentar sistema de eventos y comunicación
- [ ] Crear diagramas de arquitectura
- [ ] Documentar mejores prácticas

**Tiempo:** 1 hora

**4.3. Documentación de Usuario**
- [ ] Actualizar `CLAUDE.md` con nueva arquitectura
- [ ] Documentar nuevas funcionalidades de tabs
- [ ] Crear guía de troubleshooting
- [ ] Actualizar changelog

**Tiempo:** 30 minutos

**Entregables Fase 4:**
- ✅ Cobertura de tests >60%
- ✅ Documentación técnica completa
- ✅ Guías para desarrolladores
- ✅ `CLAUDE.md` actualizado

---

### FASE 5: Deploy y Monitoreo (1 hora)

**Objetivo:** Desplegar a producción de forma segura y monitorear

#### Tareas

**5.1. Deploy a Staging**
- [ ] Hacer merge a branch `staging`
- [ ] Deploy en ambiente de staging
- [ ] Ejecutar suite completa de tests
- [ ] Verificar funcionalidad con datos reales
- [ ] Hacer testing de aceptación con usuarios

**Tiempo:** 30 minutos

**5.2. Deploy a Producción**
- [ ] Hacer backup completo de producción
- [ ] Merge a `main`
- [ ] Crear tag de versión `v3.0.0-modular`
- [ ] Deploy a producción
- [ ] Verificar funcionamiento
- [ ] Monitorear logs por 24 horas

**Comandos:**
```bash
# Backup
./scripts/backup_automatico.sh

# Deploy
git checkout main
git merge feature/modal-modular
git tag -a v3.0.0-modular -m "Arquitectura modular de componentes"
git push origin main --tags

# En servidor
ssh root@64.176.7.170
cd /var/www/intraneuro-dev
git pull origin main
pm2 restart intraneuro-api
```

**Tiempo:** 30 minutos

**5.3. Monitoreo Post-Deploy**
- [ ] Monitorear logs de errores (pm2 logs)
- [ ] Verificar métricas de performance
- [ ] Recoger feedback de usuarios
- [ ] Documentar issues encontrados
- [ ] Plan de rollback si es necesario

**Entregables Fase 5:**
- ✅ Sistema en producción
- ✅ Versión taggeada
- ✅ Monitoreo activo
- ✅ Plan de rollback documentado

---

## 📊 MÉTRICAS DE ÉXITO

### Métricas Técnicas

| Métrica | Antes | Objetivo | Medición |
|---------|-------|----------|----------|
| **Tamaño archivo principal** | 1,034 líneas | <200 líneas | Contar líneas en orchestrator |
| **Tamaño componente promedio** | N/A | <300 líneas | Promedio de archivos en `/modal-components/` |
| **Complejidad ciclomática** | Alta | Media-Baja | Herramienta de análisis estático |
| **Tiempo carga modal** | ~800ms | <500ms | Performance API |
| **Cobertura de tests** | 0% | >60% | Jest coverage |
| **Código duplicado** | ~20% | <5% | Análisis de duplicación |
| **Bugs críticos** | N/A | 0 | Tracking de issues |

### Métricas de Calidad

| Aspecto | Métrica | Objetivo |
|---------|---------|----------|
| **Mantenibilidad** | Índice de mantenibilidad | >70/100 |
| **Documentación** | % código documentado | >80% |
| **Dependencias** | Acoplamiento entre módulos | Bajo (score <3) |
| **Performance** | Lighthouse Performance | >90 |

### Métricas de Producto

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Tiempo agregar feature** | <2 horas (nuevo componente) | Tracking de desarrollo |
| **Bugs reportados post-deploy** | <3 en primera semana | Issue tracker |
| **Satisfacción usuarios** | >8/10 | Encuesta post-implementación |
| **Tiempo debugging** | -50% vs sistema anterior | Tracking de tiempo |

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Romper funcionalidad existente** | Media | Alto | • Tests de regresión exhaustivos<br>• Migración incremental<br>• Mantener código legacy durante transición |
| **Problemas de performance** | Baja | Medio | • Implementar lazy loading<br>• Profiling antes/después<br>• Optimizar re-renders |
| **Incompatibilidad entre componentes** | Media | Alto | • Definir API clara desde el inicio<br>• Tests de integración<br>• Sistema de eventos documentado |
| **Pérdida de datos en migración** | Baja | Crítico | • Sin cambios en BD<br>• Mantener API actual<br>• Backups antes de deploy |
| **Bugs en producción** | Media | Alto | • Testing exhaustivo en staging<br>• Plan de rollback<br>• Monitoreo activo |

### Riesgos de Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Sobrestimación de tiempos** | Media | Medio | • Buffer de 20% en estimaciones<br>• Migrar componentes críticos primero |
| **Falta de documentación** | Baja | Medio | • Documentar durante desarrollo<br>• Code reviews obligatorios |
| **Resistencia al cambio** | Baja | Bajo | • Mantener UX idéntica<br>• Capacitación a usuarios |
| **Deuda técnica nueva** | Media | Medio | • Code reviews estrictos<br>• Establecer estándares desde inicio |

### Plan de Rollback

**En caso de problemas críticos en producción:**

1. **Detección** (< 5 minutos)
   ```bash
   pm2 logs intraneuro-api --err --lines 50
   ```

2. **Rollback de código** (< 10 minutos)
   ```bash
   ssh root@64.176.7.170
   cd /var/www/intraneuro-dev
   git checkout v2.7.0-stable
   pm2 restart intraneuro-api
   ```

3. **Verificación** (< 5 minutos)
   ```bash
   curl https://intraneurodavila.com/api/health
   ```

4. **Comunicación**
   - Notificar a usuarios del rollback
   - Documentar issue encontrado
   - Planear fix para siguiente iteración

**Tiempo total de rollback:** < 20 minutos

---

## 📅 TIMELINE Y RECURSOS

### Calendario Propuesto

**Semana 1: Preparación e Infraestructura**
- Lunes-Martes: Fase 0 (Preparación)
- Miércoles-Viernes: Fase 1 (Infraestructura base)

**Semana 2: Migración de Componentes**
- Lunes: DischargeComponent + NotesComponent
- Martes: TasksComponent
- Miércoles: AdmissionComponent
- Jueves: ChatComponent + EditComponent
- Viernes: Buffer para ajustes

**Semana 3: Testing, Deploy y Monitoreo**
- Lunes-Martes: Fase 3 (Integración y limpieza)
- Miércoles: Fase 4 (Testing y documentación)
- Jueves: Deploy a staging y testing de aceptación
- Viernes: Deploy a producción y monitoreo

### Recursos Necesarios

**Equipo:**
- 1 Desarrollador Senior Full-Stack (16-20 horas)
- 1 Tester/QA (4-6 horas) - Opcional
- 1 Tech Lead para code reviews (2-3 horas) - Opcional

**Herramientas:**
- Git + GitHub
- Jest (testing)
- ESLint (linting)
- Herramienta de análisis estático (SonarQube o similar) - Opcional
- Ambiente de staging

**Infraestructura:**
- Branch `feature/modal-modular`
- Tag `v2.7.0-stable` (rollback point)
- Backup de BD y archivos

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

### Documentos a Crear

1. **COMPONENT_API.md**
   - API de cada componente
   - Métodos públicos y privados
   - Eventos emitidos y escuchados
   - Ejemplos de uso

2. **ADDING_NEW_COMPONENTS.md**
   - Tutorial paso a paso
   - Template de componente base
   - Checklist de integración
   - Best practices

3. **ARCHITECTURE_DIAGRAM.md**
   - Diagrama de componentes
   - Flujo de datos
   - Sistema de eventos
   - Ciclo de vida

4. **MIGRATION_NOTES.md**
   - Decisiones de diseño tomadas
   - Problemas encontrados y soluciones
   - Lecciones aprendidas
   - Recomendaciones futuras

### Estándares de Código

**Nomenclatura:**
```javascript
// Clases: PascalCase
class DischargeComponent { }

// Archivos: kebab-case
discharge-component.js

// Métodos: camelCase
renderDischargeForm()

// Eventos: namespace:action
'patient:discharged'
'patient:updated'
```

**Estructura de componente:**
```javascript
class ComponentName extends ModalComponent {
    // 1. Constructor
    constructor(containerId, patientData) { }

    // 2. Lifecycle methods
    async mount() { }
    destroy() { }

    // 3. Render methods
    render() { }
    renderSubComponent() { }

    // 4. Event handlers
    attachEventListeners() { }
    handleSubmit(event) { }

    // 5. API calls
    async loadData() { }
    async saveData() { }

    // 6. Helpers
    formatData(data) { }
    validateInput(value) { }
}
```

---

## ✅ CHECKLIST DE FINALIZACIÓN

### Pre-Deploy

- [ ] Todos los componentes migrados y funcionando
- [ ] Tests unitarios pasando (cobertura >60%)
- [ ] Tests de integración pasando
- [ ] Tests de regresión pasando
- [ ] Código legacy deprecado (no eliminado)
- [ ] Documentación completa
- [ ] Code review aprobado
- [ ] Performance igual o mejor que sistema anterior
- [ ] Sin warnings en consola del navegador
- [ ] Sin errores en logs del backend

### Deploy

- [ ] Backup de producción realizado
- [ ] Deploy a staging exitoso
- [ ] Testing de aceptación en staging aprobado
- [ ] Plan de rollback documentado
- [ ] Merge a `main` aprobado
- [ ] Tag de versión creado (`v3.0.0-modular`)
- [ ] Deploy a producción exitoso
- [ ] Verificación post-deploy OK
- [ ] Monitoreo activado

### Post-Deploy

- [ ] Sin errores críticos en primeras 24 horas
- [ ] Feedback de usuarios recopilado
- [ ] Métricas de éxito alcanzadas
- [ ] Issues menores documentados
- [ ] Plan de mejoras continuas establecido
- [ ] Celebración del equipo 🎉

---

## 🔄 MEJORAS FUTURAS (Post v3.0)

### Corto Plazo (1-2 meses)

1. **Sistema de Plugins**
   - Permitir componentes opcionales
   - Configuración de componentes visibles por usuario
   - Lazy loading real de componentes no esenciales

2. **Offline Support**
   - Service Worker para funcionalidad offline
   - Sincronización cuando vuelve conexión
   - Cache de datos del paciente actual

3. **Mejoras de UX**
   - Animaciones entre tabs
   - Atajos de teclado (Ctrl+1 = tab ingreso, etc.)
   - Breadcrumbs de navegación

### Medio Plazo (3-6 meses)

1. **Componentes Adicionales**
   - ReportsComponent (reportes del paciente)
   - HistoryComponent (historial completo de admisiones)
   - AttachmentsComponent (archivos adjuntos)
   - NotificationsComponent (alertas y recordatorios)

2. **Analytics**
   - Tracking de uso de componentes
   - Métricas de performance en producción
   - Dashboard de salud del sistema

3. **Internacionalización**
   - Soporte multi-idioma
   - Configuración regional (formatos de fecha, etc.)

### Largo Plazo (6-12 meses)

1. **Migración a Framework Moderno**
   - Considerar React/Vue/Svelte
   - Mantener arquitectura de componentes
   - TypeScript para mayor seguridad de tipos

2. **Real-time Collaboration**
   - WebSockets para actualizaciones en tiempo real
   - Ver quién está editando un paciente
   - Prevenir conflictos de edición simultánea

3. **Progressive Web App**
   - Instalable en dispositivos móviles
   - Notificaciones push
   - Sincronización en background

---

## 📞 CONTACTO Y SOPORTE

**Líder del Proyecto:** Equipo IntraNeuro Dev
**Repositorio:** https://github.com/Ignacio1972/intraneuro-3.0
**Documentación:** `/docs/` en el repositorio

**Para preguntas o issues:**
- Crear issue en GitHub
- Revisar documentación en `/docs/`
- Consultar `CLAUDE.md` para información general del sistema

---

## 📝 HISTORIAL DE CAMBIOS

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 18/11/2025 | IntraNeuro Dev | Documento inicial del roadmap |

---

## 🎯 CONCLUSIÓN

Esta migración a arquitectura modular representa un **cambio fundamental** en cómo gestionamos el código del modal de pacientes. Los beneficios a largo plazo (mantenibilidad, escalabilidad, testing) justifican ampliamente la inversión inicial de 16-20 horas.

**Principios guía:**
1. ✅ **No romper nada** - Migración incremental sin downtime
2. ✅ **Calidad primero** - Testing exhaustivo antes de deploy
3. ✅ **Documentar todo** - Facilitar mantenimiento futuro
4. ✅ **Pensar en el futuro** - Arquitectura escalable y extensible

**Próximos pasos:**
1. Revisión y aprobación de este roadmap
2. Asignación de recursos
3. Inicio de Fase 0 (Preparación)

---

**Estado actual:** 📋 Propuesta Aprobada
**Versión objetivo:** v3.0.0-modular
**Fecha estimada de completion:** 3 semanas desde inicio

---

*Generado con Claude Code - IntraNeuro v3.0*
