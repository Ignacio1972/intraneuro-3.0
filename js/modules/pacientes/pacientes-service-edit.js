// pacientes-service-edit.js - Módulo de edición del servicio hospitalario
// Sistema de dropdown para selección de servicio (UCI, UTI, etc.)

// Configuración de servicios disponibles - USAR LOS MISMOS QUE EN EL DASHBOARD
const HOSPITAL_SERVICES = [
    { value: 'UCI', label: 'UCI', icon: '🏥', color: '#dc2626' },
    { value: 'UTI', label: 'UTI', icon: '⚕️', color: '#ea580c' },
    { value: 'MQ', label: 'MQ', icon: '🔬', color: '#2563eb' },
    { value: 'Urgencias', label: 'Urgencias', icon: '🚨', color: '#ca8a04' },
    { value: 'Interconsulta', label: 'Interconsulta', icon: '📋', color: '#16a34a' }
];

// Función principal para editar servicio
async function editPatientService(event, patientId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // Verificar disponibilidad de datos
    if (typeof patients === 'undefined' || !Array.isArray(patients)) {
        console.error('[EditService] Variable patients no disponible');
        showToast('Error: Datos no cargados correctamente', 'error');
        return;
    }

    // Buscar paciente
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        console.error(`[EditService] Paciente no encontrado: ${patientId}`);
        showToast('Error: Paciente no encontrado', 'error');
        return;
    }

    const currentService = patient.service || '';

    // Crear modal personalizado con dropdown
    const modalId = 'editServiceModal';
    let existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal active';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: 2rem;">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                Editar Servicio Hospitalario
            </h3>
            <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 14px;">
                Paciente: <strong>${patient.name}</strong><br>
                Servicio actual: <strong>${currentService || 'No asignado'}</strong>
            </p>
            <div id="edit-service-container" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                    Seleccionar Servicio
                </label>
                <select id="edit-service-select" class="service-dropdown" required style="
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    background: white;
                ">
                    <option value="">-- Sin servicio asignado --</option>
                    ${HOSPITAL_SERVICES.map(s => `
                        <option value="${s.value}"
                                ${s.value === currentService ? 'selected' : ''}
                                style="padding: 8px;">
                            ${s.icon} ${s.label}
                        </option>
                    `).join('')}
                </select>

                <!-- Vista previa del servicio seleccionado -->
                <div id="service-preview" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; display: ${currentService ? 'block' : 'none'};">
                    <small style="color: #666; display: block; margin-bottom: 5px;">Vista previa:</small>
                    <span id="service-badge-preview" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.3s;
                    ">
                        ${currentService ? `
                            ${HOSPITAL_SERVICES.find(s => s.value === currentService)?.icon || '🏥'}
                            ${HOSPITAL_SERVICES.find(s => s.value === currentService)?.label || currentService}
                        ` : ''}
                    </span>
                </div>
            </div>

            <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="saveServiceBtn">
                    Guardar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Configurar eventos del dropdown
    const select = document.getElementById('edit-service-select');
    const preview = document.getElementById('service-preview');
    const badgePreview = document.getElementById('service-badge-preview');

    select.addEventListener('change', function() {
        const selectedValue = this.value;
        const selectedService = HOSPITAL_SERVICES.find(s => s.value === selectedValue);

        if (selectedService) {
            preview.style.display = 'block';
            badgePreview.style.background = `${selectedService.color}15`;
            badgePreview.style.color = selectedService.color;
            badgePreview.style.border = `1px solid ${selectedService.color}40`;
            badgePreview.innerHTML = `${selectedService.icon} ${selectedService.label}`;
        } else {
            preview.style.display = 'none';
        }
    });

    // Si hay servicio actual, configurar preview inicial
    if (currentService) {
        const currentServiceConfig = HOSPITAL_SERVICES.find(s => s.value === currentService);
        if (currentServiceConfig) {
            badgePreview.style.background = `${currentServiceConfig.color}15`;
            badgePreview.style.color = currentServiceConfig.color;
            badgePreview.style.border = `1px solid ${currentServiceConfig.color}40`;
        }
    }

    // Configurar botón de guardar
    const saveBtn = document.getElementById('saveServiceBtn');
    saveBtn.onclick = async () => {
        const newService = select.value;

        // Verificar si hay cambios
        if (newService === currentService) {
            showToast('Sin cambios en el servicio', 'info');
            modal.remove();
            return;
        }

        try {
            // Llamar a la API para actualizar
            const response = await apiRequest(`/patients/${patientId}/service`, {
                method: 'PUT',
                body: JSON.stringify({ service: newService || null })
            });

            if (response.success) {
                // Actualizar datos locales
                patient.service = newService || null;

                // Actualizar UI del modal
                const serviceElement = document.getElementById(`service-${patientId}`);
                if (serviceElement) {
                    const selectedService = HOSPITAL_SERVICES.find(s => s.value === newService);
                    if (newService && selectedService) {
                        serviceElement.innerHTML = `
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 12px;
                                font-weight: 600;
                                background: ${selectedService.color}15;
                                color: ${selectedService.color};
                                border: 1px solid ${selectedService.color}40;
                            ">
                                ${selectedService.icon} ${newService}
                            </span>
                        `;
                    } else {
                        serviceElement.textContent = 'Sin servicio asignado';
                    }
                }

                // Actualizar lista de pacientes si está disponible
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }

                showToast('Servicio actualizado correctamente');
                modal.remove();
            } else {
                throw new Error(response.error || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('[EditService] Error actualizando servicio:', error);
            showToast('Error al actualizar servicio', 'error');
        }
    };

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Focus en el select
    setTimeout(() => select.focus(), 100);
}

// Hacer la función global
window.editPatientService = editPatientService;

// Exportar configuración de servicios
window.HOSPITAL_SERVICES = HOSPITAL_SERVICES;

console.log('[PatientServiceEdit] Módulo cargado - Servicios disponibles:', HOSPITAL_SERVICES.length);