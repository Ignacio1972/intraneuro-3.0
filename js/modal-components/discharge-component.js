/**
 * DischargeComponent - Componente de gestión de egresos
 * Maneja formulario de egreso, toggle alta programada, y visualización de datos
 *
 * @author IntraNeuro Dev Team
 * @version 3.0.0-modular
 */

class DischargeComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.api = PacientesAPI; // API global
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
        const isScheduled = this.patientData.scheduledDischarge || false;

        return `
            <div class="discharge-form">
                <div class="component-header">
                    <h3>🏥 Egreso del Paciente</h3>
                    <p class="subtitle">Complete los datos para procesar el egreso de ${this.escapeHtml(this.patientData.name)}</p>
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

                    <!-- Botones de Acción -->
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            ✅ Confirmar Egreso
                        </button>
                        <button type="button"
                                class="btn btn-secondary"
                                data-action="cancel">
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
                        <span class="info-value">${this.escapeHtml(dischargeDetails) || 'Sin detalles especificados'}</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">👨‍⚕️ Egresado por:</span>
                        <span class="info-value">${this.escapeHtml(dischargedBy) || 'No especificado'}</span>
                    </div>

                    ${deceased ? `
                        <div class="alert alert-warning">
                            <strong>⚠️ Paciente Fallecido</strong>
                            <p>Este paciente falleció durante su estadía.</p>
                        </div>
                    ` : ''}
                </div>

                <div class="discharged-actions">
                    <button class="btn btn-secondary" data-action="close">
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
        // Formulario de egreso
        const form = document.getElementById(this.formId);
        if (form) {
            this.addEventListener(form, 'submit', (e) => {
                this.handleSubmit(e);
            });
        }

        // Botón cancelar
        const cancelBtn = document.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            this.addEventListener(cancelBtn, 'click', () => {
                if (typeof window.closeModal === 'function') {
                    window.closeModal('patientModal');
                }
            });
        }

        // Botón cerrar (en vista de egresado)
        const closeBtn = document.querySelector('[data-action="close"]');
        if (closeBtn) {
            this.addEventListener(closeBtn, 'click', () => {
                if (typeof window.closeModal === 'function') {
                    window.closeModal('patientModal');
                }
            });
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

        // Validaciones
        if (!dischargeDate) {
            this.showToast('Por favor ingrese la fecha de egreso', 'error');
            return;
        }

        // Confirmación
        const confirmMessage = `¿Confirmar el egreso de ${this.patientData.name}?\n\nFecha: ${this.formatDate(dischargeDate)}`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // Procesar egreso
        try {
            const dischargeData = {
                dischargeDate: dischargeDate,
                dischargeDiagnosis: null,
                dischargeDetails: dischargeDetails || '',
                deceased: false,
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

console.log('[DischargeComponent] Loaded successfully');
