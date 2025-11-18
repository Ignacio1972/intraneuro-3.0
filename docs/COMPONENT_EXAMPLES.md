# 📚 Ejemplos de Implementación de Componentes
## IntraNeuro v3.0 - Arquitectura Modular

**Versión:** 1.0
**Fecha:** 18 de Noviembre de 2025

---

## 🎯 Propósito

Este documento proporciona ejemplos completos de código para implementar componentes en el nuevo sistema modular de IntraNeuro v3.0.

---

## 📦 BaseComponent - Clase Base

```javascript
/**
 * Clase base abstracta para todos los componentes del modal
 * Todos los componentes deben heredar de esta clase
 */
class ModalComponent {
    /**
     * @param {string} containerId - ID del elemento DOM donde se montará el componente
     * @param {Object} patientData - Datos del paciente actual
     */
    constructor(containerId, patientData) {
        this.containerId = containerId;
        this.patientData = patientData;
        this.isRendered = false;
        this.eventHandlers = new Map();
    }

    /**
     * Renderiza el HTML del componente
     * DEBE ser implementado por las subclases
     * @returns {string} HTML del componente
     */
    render() {
        throw new Error(`${this.constructor.name} must implement render() method`);
    }

    /**
     * Monta el componente en el DOM
     * Llama a render() y attachEventListeners()
     */
    mount() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        container.innerHTML = this.render();
        this.attachEventListeners();
        this.isRendered = true;

        console.log(`[${this.constructor.name}] Mounted successfully`);
    }

    /**
     * Adjunta event listeners después del renderizado
     * Puede ser sobrescrito por subclases
     */
    attachEventListeners() {
        // Implementar en subclases si necesario
    }

    /**
     * Actualiza el componente con nuevos datos
     * @param {Object} newData - Nuevos datos del paciente
     */
    update(newData) {
        console.log(`[${this.constructor.name}] Updating with new data`);
        this.patientData = newData;

        if (this.isRendered) {
            this.mount(); // Re-render
        }
    }

    /**
     * Limpia el componente antes de destruirlo
     */
    destroy() {
        console.log(`[${this.constructor.name}] Destroying...`);

        // Limpiar event listeners
        this.eventHandlers.forEach((handler, element) => {
            element.removeEventListener(handler.event, handler.callback);
        });
        this.eventHandlers.clear();

        // Limpiar HTML
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }

        this.isRendered = false;
    }

    /**
     * Emite un evento personalizado
     * @param {string} eventName - Nombre del evento (ej: 'patient:discharged')
     * @param {Object} data - Datos del evento
     */
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
        console.log(`[${this.constructor.name}] Event emitted: ${eventName}`, data);
    }

    /**
     * Registra un event listener para limpieza posterior
     * @param {Element} element - Elemento DOM
     * @param {string} event - Tipo de evento
     * @param {Function} callback - Función callback
     */
    addEventListener(element, event, callback) {
        element.addEventListener(event, callback);
        this.eventHandlers.set(element, { event, callback });
    }

    // ====== HELPERS COMPARTIDOS ======

    /**
     * Formatea una fecha a DD/MM/YYYY
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Muestra un mensaje toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'info'
     */
    showToast(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[Toast ${type}] ${message}`);
        }
    }

    /**
     * Valida un campo según reglas
     * @param {any} value - Valor a validar
     * @param {Object} rules - Reglas de validación
     * @returns {Object} { valid: boolean, error: string }
     */
    validateField(value, rules = {}) {
        if (rules.required && !value) {
            return { valid: false, error: 'Este campo es requerido' };
        }

        if (rules.minLength && value.length < rules.minLength) {
            return { valid: false, error: `Mínimo ${rules.minLength} caracteres` };
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return { valid: false, error: `Máximo ${rules.maxLength} caracteres` };
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            return { valid: false, error: rules.patternMessage || 'Formato inválido' };
        }

        return { valid: true, error: null };
    }
}
```

---

## 🏥 DischargeComponent - Ejemplo Completo

```javascript
/**
 * Componente de gestión de egresos
 * Maneja formulario de egreso y visualización de datos de pacientes egresados
 */
class DischargeComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.api = new PacientesAPI();
        this.formId = `discharge-form-${patientData.id}`;
    }

    /**
     * Renderiza el componente según estado del paciente
     */
    render() {
        if (this.patientData.dischargeDate) {
            return this.renderDischargedData();
        }
        return this.renderDischargeForm();
    }

    /**
     * Renderiza formulario de egreso para pacientes activos
     */
    renderDischargeForm() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="discharge-form">
                <div class="component-header">
                    <h3>🏥 Egreso del Paciente</h3>
                    <p class="subtitle">Complete los datos para procesar el egreso de ${this.patientData.name}</p>
                </div>

                <!-- Toggle Alta Programada -->
                <div class="scheduled-discharge-toggle">
                    <label class="switch">
                        <input type="checkbox"
                               id="toggleScheduledDischarge"
                               ${this.patientData.scheduledDischarge ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span class="switch-label">
                        ${this.patientData.scheduledDischarge
                            ? '✅ Alta programada para HOY'
                            : '📅 Programar alta para HOY'}
                    </span>
                </div>

                <form id="${this.formId}" class="discharge-form-content">
                    <!-- Fecha de Egreso -->
                    <div class="form-group">
                        <label for="dischargeDate" class="required">
                            Fecha de Egreso:
                        </label>
                        <input type="date"
                               id="dischargeDate"
                               name="dischargeDate"
                               required
                               max="${today}"
                               value="${today}">
                        <small class="field-hint">La fecha no puede ser futura</small>
                    </div>

                    <!-- Detalles del Egreso -->
                    <div class="form-group">
                        <label for="dischargeDetails">
                            Detalles del Egreso:
                        </label>
                        <textarea id="dischargeDetails"
                                  name="dischargeDetails"
                                  rows="4"
                                  placeholder="Condición del paciente al egreso, recomendaciones, seguimiento..."></textarea>
                        <small class="field-hint">Opcional - Máximo 500 caracteres</small>
                    </div>

                    <!-- Checkbox Fallecimiento -->
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox"
                                   id="patientDeceased"
                                   name="deceased">
                            <span class="checkbox-text">⚠️ Paciente fallecido</span>
                        </label>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            ✅ Confirmar Egreso
                        </button>
                        <button type="button"
                                class="btn btn-secondary"
                                onclick="closeModal('patientModal')">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Renderiza datos de paciente ya egresado (solo lectura)
     */
    renderDischargedData() {
        const { dischargeDate, dischargeDetails, deceased, dischargedBy } = this.patientData;

        return `
            <div class="discharged-info">
                <div class="alert alert-info">
                    <strong>ℹ️ Paciente Egresado</strong>
                    <p>Este paciente fue dado de alta. Los datos son de solo lectura.</p>
                </div>

                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">📅 Fecha de Egreso:</span>
                        <span class="info-value">${this.formatDate(dischargeDate)}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">📝 Detalles:</span>
                        <span class="info-value">${dischargeDetails || 'Sin detalles especificados'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">👨‍⚕️ Egresado por:</span>
                        <span class="info-value">${dischargedBy || 'No especificado'}</span>
                    </div>

                    ${deceased ? `
                        <div class="alert alert-warning">
                            <strong>⚠️ Paciente Fallecido</strong>
                            <p>Este paciente falleció durante su estadía.</p>
                        </div>
                    ` : ''}
                </div>

                <div class="discharged-actions">
                    <button class="btn btn-secondary" onclick="closeModal('patientModal')">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Adjunta event listeners después del renderizado
     */
    attachEventListeners() {
        // Toggle alta programada
        const toggleCheckbox = document.getElementById('toggleScheduledDischarge');
        if (toggleCheckbox) {
            this.addEventListener(toggleCheckbox, 'change', (e) => {
                this.handleScheduledDischargeToggle(e.target.checked);
            });
        }

        // Formulario de egreso
        const form = document.getElementById(this.formId);
        if (form) {
            this.addEventListener(form, 'submit', (e) => {
                this.handleSubmit(e);
            });
        }

        // Checkbox de fallecimiento (cambiar color del form)
        const deceasedCheckbox = document.getElementById('patientDeceased');
        if (deceasedCheckbox) {
            this.addEventListener(deceasedCheckbox, 'change', (e) => {
                const form = document.getElementById(this.formId);
                if (e.target.checked) {
                    form.classList.add('deceased-mode');
                } else {
                    form.classList.remove('deceased-mode');
                }
            });
        }
    }

    /**
     * Maneja el toggle de alta programada
     */
    async handleScheduledDischargeToggle(isChecked) {
        console.log(`[DischargeComponent] Toggle alta programada: ${isChecked}`);

        try {
            const response = await this.api.toggleScheduledDischargeAPI(
                this.patientData.id,
                isChecked
            );

            if (response) {
                // Actualizar datos locales
                this.patientData.scheduledDischarge = isChecked;

                // Actualizar label
                const label = document.querySelector('.switch-label');
                if (label) {
                    label.textContent = isChecked
                        ? '✅ Alta programada para HOY'
                        : '📅 Programar alta para HOY';
                    label.style.color = isChecked ? '#28a745' : '#666';
                }

                // Emitir evento para actualizar dashboard
                this.emitEvent('patient:updated', {
                    patientId: this.patientData.id,
                    field: 'scheduledDischarge',
                    value: isChecked
                });

                this.showToast(
                    isChecked ? 'Alta programada activada' : 'Alta programada desactivada'
                );
            }
        } catch (error) {
            console.error('[DischargeComponent] Error en toggle:', error);

            // Revertir checkbox si falló
            const checkbox = document.getElementById('toggleScheduledDischarge');
            if (checkbox) checkbox.checked = !isChecked;

            this.showToast('Error al actualizar alta programada', 'error');
        }
    }

    /**
     * Maneja el envío del formulario de egreso
     */
    async handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const dischargeDate = formData.get('dischargeDate');
        const dischargeDetails = formData.get('dischargeDetails');
        const deceased = formData.get('deceased') === 'on';

        // Validaciones
        if (!dischargeDate) {
            this.showToast('Por favor ingrese la fecha de egreso', 'error');
            return;
        }

        // Confirmación
        const confirmMessage = deceased
            ? `⚠️ CONFIRMAR FALLECIMIENTO\n\n¿Está seguro de registrar el fallecimiento de ${this.patientData.name}?\n\nEsta acción no se puede deshacer.`
            : `¿Confirmar el egreso de ${this.patientData.name}?\n\nFecha: ${this.formatDate(dischargeDate)}`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // Procesar egreso
        try {
            const dischargeData = {
                date: dischargeDate,
                details: dischargeDetails || '',
                deceased: deceased,
                dischargedBy: sessionStorage.getItem('currentUser') || 'Sistema'
            };

            const response = await this.api.processDischargeAPI(
                this.patientData.id,
                dischargeData
            );

            if (response.success) {
                this.showToast(`✅ Paciente ${this.patientData.name} egresado correctamente`);

                // Emitir evento para que el orquestador maneje la actualización
                this.emitEvent('patient:discharged', {
                    patientId: this.patientData.id,
                    dischargeData: dischargeData
                });

                // El orquestador cerrará el modal y actualizará la lista
            }
        } catch (error) {
            console.error('[DischargeComponent] Error procesando egreso:', error);
            this.showToast('Error al procesar el egreso', 'error');
        }
    }
}
```

---

## 📝 NotesComponent - Ejemplo Simplificado

```javascript
/**
 * Componente de observaciones médicas
 * Permite ver y crear observaciones del paciente
 */
class NotesComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.observations = [];
        this.isLoading = false;
    }

    /**
     * Hook de montaje - carga datos antes de renderizar
     */
    async mount() {
        this.isLoading = true;
        await this.loadObservations();
        this.isLoading = false;
        super.mount();
    }

    /**
     * Carga observaciones del paciente desde el API
     */
    async loadObservations() {
        try {
            const response = await fetch(
                `/api/patients/${this.patientData.id}/observations`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.ok) {
                this.observations = await response.json();
                console.log(`[NotesComponent] Loaded ${this.observations.length} observations`);
            }
        } catch (error) {
            console.error('[NotesComponent] Error loading observations:', error);
            this.showToast('Error cargando observaciones', 'error');
        }
    }

    render() {
        if (this.isLoading) {
            return '<div class="loading">Cargando observaciones...</div>';
        }

        return `
            <div class="notes-component">
                <div class="component-header">
                    <h3>📝 Observaciones Médicas</h3>
                    <p class="subtitle">Historial de observaciones de ${this.patientData.name}</p>
                </div>

                ${this.renderObservationsList()}
                ${this.renderNewObservationForm()}
            </div>
        `;
    }

    renderObservationsList() {
        if (this.observations.length === 0) {
            return `
                <div class="empty-state">
                    <p>No hay observaciones registradas</p>
                </div>
            `;
        }

        return `
            <div class="observations-list">
                ${this.observations.map(obs => `
                    <div class="observation-item">
                        <div class="observation-header">
                            <span class="observation-date">${this.formatDate(obs.created_at)}</span>
                            <span class="observation-author">👨‍⚕️ ${obs.created_by}</span>
                        </div>
                        <div class="observation-content">
                            ${obs.observation}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderNewObservationForm() {
        return `
            <div class="new-observation-form">
                <h4>Nueva Observación</h4>
                <form id="new-observation-form">
                    <textarea id="newObservation"
                              rows="4"
                              placeholder="Ingrese la observación médica..."
                              required></textarea>
                    <button type="submit" class="btn btn-primary">
                        💾 Guardar Observación
                    </button>
                </form>
            </div>
        `;
    }

    attachEventListeners() {
        const form = document.getElementById('new-observation-form');
        if (form) {
            this.addEventListener(form, 'submit', (e) => this.handleNewObservation(e));
        }
    }

    async handleNewObservation(event) {
        event.preventDefault();

        const textarea = document.getElementById('newObservation');
        const observation = textarea.value.trim();

        if (!observation) {
            this.showToast('Por favor ingrese una observación', 'error');
            return;
        }

        try {
            const response = await fetch(
                `/api/patients/${this.patientData.id}/observations`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        observation: observation,
                        created_by: sessionStorage.getItem('currentUser') || 'Sistema'
                    })
                }
            );

            if (response.ok) {
                this.showToast('Observación guardada correctamente');
                textarea.value = '';

                // Recargar observaciones
                await this.loadObservations();
                this.mount(); // Re-render
            }
        } catch (error) {
            console.error('[NotesComponent] Error guardando observación:', error);
            this.showToast('Error al guardar observación', 'error');
        }
    }
}
```

---

## 🎭 ModalOrchestrator - Ejemplo Completo

```javascript
/**
 * Orquestador central del modal de pacientes
 * Gestiona el ciclo de vida de todos los componentes
 * Implementa patrón Singleton
 */
class PatientModalOrchestrator {
    constructor() {
        // Singleton pattern
        if (PatientModalOrchestrator.instance) {
            return PatientModalOrchestrator.instance;
        }

        this.components = {};
        this.currentPatient = null;
        this.activeTab = 'admission';

        // Registro de componentes disponibles (lazy loaded)
        this.componentRegistry = {
            'admission': AdmissionComponent,
            'discharge': DischargeComponent,
            'notes': NotesComponent,
            'tasks': TasksComponent,
            'chat': ChatComponent
        };

        this.setupEventListeners();
        PatientModalOrchestrator.instance = this;

        console.log('[ModalOrchestrator] Initialized');
    }

    /**
     * Abre el modal para un paciente específico
     * @param {number} patientId - ID del paciente
     */
    open(patientId) {
        console.log(`[ModalOrchestrator] Opening modal for patient ${patientId}`);

        // Buscar paciente en array global
        this.currentPatient = window.patients.find(p => p.id === patientId);

        if (!this.currentPatient) {
            console.error(`[ModalOrchestrator] Patient ${patientId} not found`);
            showToast('Paciente no encontrado', 'error');
            return;
        }

        this.renderModal();
        this.loadComponents();
        this.showTab(this.activeTab);

        // Abrir modal (función global)
        if (typeof window.openModal === 'function') {
            window.openModal('patientModal');
        }
    }

    /**
     * Cierra el modal y limpia componentes
     */
    close() {
        console.log('[ModalOrchestrator] Closing modal');

        // Destruir todos los componentes
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });

        this.components = {};
        this.currentPatient = null;

        // Cerrar modal (función global)
        if (typeof window.closeModal === 'function') {
            window.closeModal('patientModal');
        }
    }

    /**
     * Renderiza la estructura HTML del modal
     */
    renderModal() {
        const modal = document.getElementById('patientModal');
        if (!modal) {
            console.error('[ModalOrchestrator] Modal element not found');
            return;
        }

        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close">&times;</span>

            <!-- Patient Header -->
            <div class="patient-header">
                <h2>${this.currentPatient.name}</h2>
                <div class="patient-meta">
                    <span>📅 ${this.currentPatient.age} años</span>
                    <span>🆔 ${this.currentPatient.rut || 'Sin RUT'}</span>
                    <span>🛏️ Cama ${this.currentPatient.bed || 'N/A'}</span>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="modal-tabs">
                <button class="tab-btn ${this.activeTab === 'admission' ? 'active' : ''}"
                        data-tab="admission">
                    📊 Ingreso
                </button>
                <button class="tab-btn ${this.activeTab === 'discharge' ? 'active' : ''}"
                        data-tab="discharge">
                    🏥 Egreso
                </button>
                <button class="tab-btn ${this.activeTab === 'notes' ? 'active' : ''}"
                        data-tab="notes">
                    📝 Notas
                </button>
                <button class="tab-btn ${this.activeTab === 'tasks' ? 'active' : ''}"
                        data-tab="tasks">
                    ✅ Tareas
                </button>
                <button class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}"
                        data-tab="chat">
                    💬 Chat
                </button>
            </div>

            <!-- Tab Contents -->
            <div id="tab-admission" class="tab-content"></div>
            <div id="tab-discharge" class="tab-content"></div>
            <div id="tab-notes" class="tab-content"></div>
            <div id="tab-tasks" class="tab-content"></div>
            <div id="tab-chat" class="tab-content"></div>
        `;

        // Attach tab navigation
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showTab(btn.dataset.tab));
        });

        // Attach close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Carga (instancia) todos los componentes
     * Lazy loading: solo instancia, no renderiza todavía
     */
    loadComponents() {
        Object.entries(this.componentRegistry).forEach(([key, ComponentClass]) => {
            const containerId = `tab-${key}`;
            this.components[key] = new ComponentClass(containerId, this.currentPatient);
            console.log(`[ModalOrchestrator] Component ${key} loaded`);
        });
    }

    /**
     * Muestra un tab específico
     * @param {string} tabName - Nombre del tab ('admission', 'discharge', etc.)
     */
    showTab(tabName) {
        console.log(`[ModalOrchestrator] Showing tab: ${tabName}`);

        // Ocultar todos los tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar tab seleccionado
        const tabContent = document.getElementById(`tab-${tabName}`);
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);

        if (tabContent) tabContent.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');

        // Renderizar componente si no está renderizado
        const component = this.components[tabName];
        if (component && !component.isRendered) {
            component.mount();
        }

        this.activeTab = tabName;
    }

    /**
     * Actualiza los datos del paciente actual en todos los componentes
     */
    async refreshCurrentPatient() {
        if (!this.currentPatient) return;

        // Recargar datos del paciente desde el array global
        const updatedPatient = window.patients.find(p => p.id === this.currentPatient.id);

        if (updatedPatient) {
            this.currentPatient = updatedPatient;

            // Actualizar todos los componentes
            Object.values(this.components).forEach(component => {
                if (component && typeof component.update === 'function') {
                    component.update(this.currentPatient);
                }
            });

            console.log('[ModalOrchestrator] Patient data refreshed');
        }
    }

    /**
     * Configura event listeners globales
     */
    setupEventListeners() {
        // Evento: paciente egresado
        document.addEventListener('patient:discharged', (e) => {
            const { patientId } = e.detail;
            console.log(`[ModalOrchestrator] Patient ${patientId} discharged`);

            // Actualizar array global
            window.patients = window.patients.filter(p => p.id !== patientId);

            // Cerrar modal
            this.close();

            // Actualizar vista
            if (typeof window.updateDashboardFromAPI === 'function') {
                window.updateDashboardFromAPI();
            }
            if (typeof window.renderPatients === 'function') {
                window.renderPatients();
            }

            showToast('Paciente egresado correctamente');
        });

        // Evento: paciente actualizado
        document.addEventListener('patient:updated', async (e) => {
            const { patientId, field, value } = e.detail;
            console.log(`[ModalOrchestrator] Patient ${patientId} updated: ${field} = ${value}`);

            // Actualizar array global
            const patient = window.patients.find(p => p.id === patientId);
            if (patient) {
                patient[field] = value;
            }

            // Actualizar dashboard
            if (typeof window.updateDashboardFromAPI === 'function') {
                window.updateDashboardFromAPI();
            }

            // Refrescar componentes
            await this.refreshCurrentPatient();
        });
    }
}

// ====== EXPORTAR API GLOBAL ======

// Instancia singleton
const patientModal = new PatientModalOrchestrator();

// Exportar funciones globales para compatibilidad con código existente
window.openPatientModal = (id) => patientModal.open(id);
window.closePatientModal = () => patientModal.close();

console.log('[ModalOrchestrator] Global API exported');
```

---

## 🎓 Mejores Prácticas

### 1. Separación de Responsabilidades

✅ **CORRECTO:**
```javascript
class NotesComponent extends ModalComponent {
    render() {
        return this.renderHeader() + this.renderList() + this.renderForm();
    }

    renderHeader() { /* ... */ }
    renderList() { /* ... */ }
    renderForm() { /* ... */ }
}
```

❌ **INCORRECTO:**
```javascript
class NotesComponent extends ModalComponent {
    render() {
        // 500 líneas de HTML en un solo método
    }
}
```

### 2. Manejo de Estado

✅ **CORRECTO:**
```javascript
class TasksComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.tasks = [];  // Estado local del componente
        this.isEditing = false;
    }

    update(newData) {
        super.update(newData);
        this.loadTasks();  // Recargar datos al actualizar
    }
}
```

### 3. Comunicación entre Componentes

✅ **CORRECTO (via eventos):**
```javascript
// En DischargeComponent
this.emitEvent('patient:discharged', { patientId: this.patientData.id });

// El orquestador escucha
document.addEventListener('patient:discharged', (e) => {
    // Manejar egreso
});
```

❌ **INCORRECTO (acoplamiento directo):**
```javascript
// En DischargeComponent
window.notesComponent.refresh();  // ❌ Acoplamiento fuerte
```

### 4. Limpieza de Recursos

✅ **CORRECTO:**
```javascript
class ChatComponent extends ModalComponent {
    mount() {
        super.mount();
        this.intervalId = setInterval(() => this.refreshMessages(), 5000);
    }

    destroy() {
        clearInterval(this.intervalId);  // ✅ Limpiar recursos
        super.destroy();
    }
}
```

---

## 📖 Referencias

- `ROADMAP_MODAL_MODULAR.md` - Plan completo de implementación
- `ADDING_NEW_COMPONENTS.md` - Guía para crear nuevos componentes
- `CLAUDE.md` - Documentación general del sistema

---

*Última actualización: 18 de Noviembre de 2025*
