/**
 * PatientModalOrchestrator - Orquestador central del modal de pacientes
 * Gestiona el ciclo de vida de todos los componentes
 * Implementa patrón Singleton
 *
 * @author IntraNeuro Dev Team
 * @version 3.0.0-modular
 */

class PatientModalOrchestrator {
    constructor() {
        // Singleton pattern
        if (PatientModalOrchestrator.instance) {
            return PatientModalOrchestrator.instance;
        }

        this.components = {};
        this.currentPatient = null;
        this.activeTab = 'discharge'; // Empezamos con discharge como default

        // Registro de componentes disponibles (lazy loaded)
        // Solo agregamos los componentes que ya existen
        this.componentRegistry = {
            // 'admission': AdmissionComponent,  // TODO: Fase 2.4
            'discharge': DischargeComponent,     // Fase 2.1
            // 'notes': NotesComponent,          // TODO: Fase 2.2
            // 'tasks': TasksComponent,          // TODO: Fase 2.3
            // 'chat': ChatComponent             // TODO: Fase 2.5
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
            if (typeof window.showToast === 'function') {
                window.showToast('Paciente no encontrado', 'error');
            }
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
        if (!modalContent) {
            console.error('[ModalOrchestrator] Modal content not found');
            return;
        }

        modalContent.innerHTML = `
            <span class="close">&times;</span>

            <!-- Patient Header -->
            <div class="patient-header">
                <h2>${this.escapeHtml(this.currentPatient.name)}</h2>
                <div class="patient-meta">
                    <span>📅 ${this.currentPatient.age || 'N/A'} años</span>
                    <span>🆔 ${this.escapeHtml(this.currentPatient.rut) || 'Sin RUT'}</span>
                    <span>🛏️ Cama ${this.escapeHtml(this.currentPatient.bed) || 'N/A'}</span>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="modal-tabs">
                ${this.renderTabButtons()}
            </div>

            <!-- Tab Contents -->
            ${this.renderTabContents()}
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
     * Renderiza los botones de tabs
     * @returns {string} HTML de los botones
     */
    renderTabButtons() {
        const tabs = [];

        // Solo mostrar tabs para componentes que existen
        if (this.componentRegistry.admission) {
            tabs.push({ key: 'admission', label: '📊 Ingreso' });
        }
        if (this.componentRegistry.discharge) {
            tabs.push({ key: 'discharge', label: '🏥 Egreso' });
        }
        if (this.componentRegistry.notes) {
            tabs.push({ key: 'notes', label: '📝 Notas' });
        }
        if (this.componentRegistry.tasks) {
            tabs.push({ key: 'tasks', label: '✅ Tareas' });
        }
        if (this.componentRegistry.chat) {
            tabs.push({ key: 'chat', label: '💬 Chat' });
        }

        return tabs.map(tab => `
            <button class="tab-btn ${this.activeTab === tab.key ? 'active' : ''}"
                    data-tab="${tab.key}">
                ${tab.label}
            </button>
        `).join('');
    }

    /**
     * Renderiza los contenedores de tabs
     * @returns {string} HTML de los contenedores
     */
    renderTabContents() {
        const tabs = [];

        if (this.componentRegistry.admission) tabs.push('admission');
        if (this.componentRegistry.discharge) tabs.push('discharge');
        if (this.componentRegistry.notes) tabs.push('notes');
        if (this.componentRegistry.tasks) tabs.push('tasks');
        if (this.componentRegistry.chat) tabs.push('chat');

        return tabs.map(tab => `
            <div id="tab-${tab}" class="tab-content ${this.activeTab === tab ? 'active' : ''}"></div>
        `).join('');
    }

    /**
     * Carga (instancia) todos los componentes registrados
     * Lazy loading: solo instancia, no renderiza todavía
     */
    loadComponents() {
        Object.entries(this.componentRegistry).forEach(([key, ComponentClass]) => {
            const containerId = `tab-${key}`;

            try {
                this.components[key] = new ComponentClass(containerId, this.currentPatient);
                console.log(`[ModalOrchestrator] Component ${key} loaded`);
            } catch (error) {
                console.error(`[ModalOrchestrator] Error loading component ${key}:`, error);
            }
        });
    }

    /**
     * Muestra un tab específico
     * @param {string} tabName - Nombre del tab ('admission', 'discharge', etc.)
     */
    showTab(tabName) {
        console.log(`[ModalOrchestrator] Showing tab: ${tabName}`);

        // Verificar que el componente existe
        if (!this.componentRegistry[tabName]) {
            console.warn(`[ModalOrchestrator] Tab ${tabName} not registered yet`);
            return;
        }

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
        document.addEventListener('patient:discharged', async (e) => {
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

            if (typeof window.showToast === 'function') {
                window.showToast('Paciente egresado correctamente');
            }
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

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ====== EXPORTAR API GLOBAL ======

// Instancia singleton (se creará cuando se cargue el script)
const patientModal = new PatientModalOrchestrator();

// Exportar funciones globales para compatibilidad con código existente
window.openPatientModal = (id) => patientModal.open(id);
window.closePatientModal = () => patientModal.close();

console.log('[ModalOrchestrator] Global API exported');
