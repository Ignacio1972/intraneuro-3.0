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

                <!-- Toggle Alta Programada -->
                <div class="scheduled-discharge-toggle">
                    <label class="switch-label">
                        <label class="switch">
                            <input type="checkbox"
                                   id="toggleScheduledDischarge"
                                   ${isScheduled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span style="color: ${isScheduled ? '#28a745' : '#666'}">
                            ${isScheduled ? '✅ Alta programada para HOY' : '📅 Programar alta para HOY'}
                        </span>
                    </label>
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
                const formContent = document.querySelector('.discharge-form-content');
                if (formContent) {
                    if (e.target.checked) {
                        formContent.classList.add('deceased-mode');
                    } else {
                        formContent.classList.remove('deceased-mode');
                    }
                }
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

                // Actualizar label del toggle
                const label = document.querySelector('.switch-label span');
                if (label) {
                    label.textContent = isChecked
                        ? '✅ Alta programada para HOY'
                        : '📅 Programar alta para HOY';
                    label.style.color = isChecked ? '#28a745' : '#666';
                }

                // Emitir evento para actualizar dashboard y lista
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
                diagnosis: null,
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

console.log('[DischargeComponent] Loaded successfully');
