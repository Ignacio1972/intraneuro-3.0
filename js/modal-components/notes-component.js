/**
 * NotesComponent - Componente de observaciones médicas / historia clínica
 * Maneja textarea simple con autosave y carga de observaciones
 *
 * @author IntraNeuro Dev Team
 * @version 3.0.0-modular
 */

class NotesComponent extends ModalComponent {
    constructor(containerId, patientData) {
        super(containerId, patientData);
        this.observations = '';
        this.saveTimeout = null;
        this.isSaving = false;
    }

    /**
     * Monta el componente y carga las observaciones
     */
    async mount() {
        await this.loadObservations();
        super.mount();
    }

    /**
     * Renderiza el componente de notas
     */
    render() {
        return `
            <div class="notes-component">
                <div class="component-header">
                    <h3>📝 Historia Clínica y Observaciones</h3>
                    <p class="subtitle">Observaciones médicas del paciente ${this.escapeHtml(this.patientData.name)}</p>
                </div>

                <!-- Textarea Principal -->
                <div class="note-section">
                    <label for="observations-${this.patientData.id}" style="display: block; margin-bottom: 8px; font-weight: 500;">
                        <strong>Observaciones:</strong>
                    </label>
                    <textarea
                        id="observations-${this.patientData.id}"
                        class="note-textarea"
                        rows="10"
                        placeholder="Escriba la historia clínica y observaciones del paciente aquí...&#10;&#10;• Evolución clínica&#10;• Signos vitales&#10;• Tratamientos&#10;• Procedimientos&#10;• Notas del equipo médico"
                    >${this.escapeHtml(this.observations)}</textarea>

                    <small class="field-hint">
                        💡 El texto se guarda automáticamente al hacer clic fuera del campo
                    </small>
                </div>

                <!-- Estado de Guardado -->
                <div id="save-status-${this.patientData.id}" class="save-status" style="display: none;">
                    ✓ Guardado automáticamente
                </div>

                <!-- Historial de Observaciones (Opcional) -->
                <div class="observations-history" style="margin-top: 30px;">
                    <details>
                        <summary style="cursor: pointer; font-weight: 500; color: #666; padding: 10px 0;">
                            📋 Ver historial de observaciones anteriores
                        </summary>
                        <div id="history-list-${this.patientData.id}" style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                            <p style="text-align: center; color: #999;">Cargando historial...</p>
                        </div>
                    </details>
                </div>
            </div>
        `;
    }

    /**
     * Adjunta event listeners
     */
    attachEventListeners() {
        const textarea = document.getElementById(`observations-${this.patientData.id}`);

        if (textarea) {
            // Autosave al perder foco
            this.addEventListener(textarea, 'blur', () => {
                this.saveObservations();
            });

            // Opcional: autosave con debounce mientras escribe
            this.addEventListener(textarea, 'input', () => {
                this.debouncedSave();
            });
        }

        // Event listener para cargar historial cuando se abre el details
        const historyDetails = this.container?.querySelector('details');
        if (historyDetails) {
            historyDetails.addEventListener('toggle', (e) => {
                if (e.target.open) {
                    this.loadObservationsHistory();
                }
            });
        }
    }

    /**
     * Carga las observaciones más recientes del backend
     */
    async loadObservations() {
        try {
            console.log(`[NotesComponent] Cargando observaciones para paciente ${this.patientData.id}`);

            const response = await apiRequest(`/patients/${this.patientData.id}/admission/observations`);

            if (response && response.length > 0) {
                // Buscar la primera observación válida (que no sea JSON array)
                for (let obs of response) {
                    if (obs.observation && obs.observation.trim() !== '') {
                        // Verificar si es un JSON array y saltarlo
                        try {
                            const parsed = JSON.parse(obs.observation);
                            if (Array.isArray(parsed)) {
                                continue; // Saltar arrays JSON (legacy)
                            }
                        } catch (e) {
                            // No es JSON, es texto simple - usarlo
                            if (obs.observation !== '[]') {
                                this.observations = obs.observation;
                                break;
                            }
                        }
                    }
                }
            }

            console.log(`[NotesComponent] ✓ Observaciones cargadas`);

        } catch (error) {
            console.error('[NotesComponent] Error cargando observaciones:', error);
            this.observations = '';
        }
    }

    /**
     * Guarda las observaciones en el backend
     */
    async saveObservations() {
        if (this.isSaving) {
            console.log('[NotesComponent] Ya hay un guardado en proceso');
            return;
        }

        try {
            this.isSaving = true;

            const textarea = document.getElementById(`observations-${this.patientData.id}`);
            if (!textarea) return;

            const text = textarea.value.trim();
            const statusDiv = document.getElementById(`save-status-${this.patientData.id}`);

            // Mostrar estado "Guardando..."
            if (statusDiv) {
                statusDiv.textContent = '⏳ Guardando...';
                statusDiv.style.color = 'orange';
                statusDiv.style.display = 'block';
            }

            // NO guardar solo si es exactamente []
            if (text === '[]') {
                console.log('[NotesComponent] Saltando guardado de []');
                if (statusDiv) statusDiv.style.display = 'none';
                return;
            }

            const textToSave = text || '';

            // Guardar en backend
            const response = await apiRequest(`/patients/${this.patientData.id}/admission/observations`, {
                method: 'POST',
                body: JSON.stringify({
                    observation: textToSave,
                    created_by: sessionStorage.getItem('currentUser') || 'Usuario'
                })
            });

            // Actualizar datos locales
            this.observations = textToSave;

            // Actualizar array global si existe
            if (window.patients) {
                const patient = window.patients.find(p => p.id === this.patientData.id);
                if (patient) {
                    patient.observations = textToSave;
                }
            }

            // Mostrar confirmación
            if (statusDiv) {
                statusDiv.textContent = textToSave === '' ? '✓ Contenido borrado' : '✓ Guardado automáticamente';
                statusDiv.style.color = 'green';
                statusDiv.style.display = 'block';

                // Ocultar mensaje después de 3 segundos
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 3000);
            }

            // Emitir evento
            this.emitEvent('patient:observations-updated', {
                patientId: this.patientData.id,
                observations: textToSave
            });

            console.log(`[NotesComponent] ✓ Observaciones guardadas`);

        } catch (error) {
            console.error('[NotesComponent] Error guardando observaciones:', error);

            const statusDiv = document.getElementById(`save-status-${this.patientData.id}`);
            if (statusDiv) {
                statusDiv.textContent = '❌ Error al guardar';
                statusDiv.style.color = 'red';
                statusDiv.style.display = 'block';
            }

            this.showToast('Error al guardar observaciones', 'error');
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Autosave con debounce (para evitar guardar en cada tecla)
     */
    debouncedSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveObservations();
        }, 2000); // Guardar 2 segundos después de dejar de escribir
    }

    /**
     * Carga el historial completo de observaciones
     */
    async loadObservationsHistory() {
        try {
            const container = document.getElementById(`history-list-${this.patientData.id}`);
            if (!container) return;

            container.innerHTML = '<p style="text-align: center; color: #999;">Cargando historial...</p>';

            const response = await apiRequest(`/patients/${this.patientData.id}/admission/observations`);

            if (!response || response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999;">No hay observaciones anteriores</p>';
                return;
            }

            // Filtrar observaciones válidas (no arrays JSON)
            const validObservations = response.filter(obs => {
                if (!obs.observation || obs.observation.trim() === '' || obs.observation === '[]') {
                    return false;
                }

                try {
                    const parsed = JSON.parse(obs.observation);
                    return !Array.isArray(parsed); // Excluir arrays JSON
                } catch (e) {
                    return true; // Es texto simple, es válido
                }
            });

            if (validObservations.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999;">No hay observaciones anteriores</p>';
                return;
            }

            // Renderizar historial
            const historyHtml = validObservations.map((obs, index) => `
                <div class="observation-history-item" style="
                    padding: 15px;
                    margin-bottom: 10px;
                    background: white;
                    border-left: 3px solid ${index === 0 ? '#4CAF50' : '#ddd'};
                    border-radius: 4px;
                ">
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                        📅 ${this.formatDate(obs.created_at)}
                        ${obs.created_by ? `• 👤 ${this.escapeHtml(obs.created_by)}` : ''}
                        ${index === 0 ? '<span style="color: #4CAF50; font-weight: 600;"> • ACTUAL</span>' : ''}
                    </div>
                    <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">
                        ${this.escapeHtml(obs.observation)}
                    </div>
                </div>
            `).join('');

            container.innerHTML = historyHtml;

        } catch (error) {
            console.error('[NotesComponent] Error cargando historial:', error);
            const container = document.getElementById(`history-list-${this.patientData.id}`);
            if (container) {
                container.innerHTML = '<p style="text-align: center; color: #dc2626;">Error al cargar historial</p>';
            }
        }
    }

    /**
     * Limpia recursos al destruir
     */
    destroy() {
        // Limpiar timeout de autosave
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        super.destroy();
    }
}

console.log('[NotesComponent] Loaded successfully');
