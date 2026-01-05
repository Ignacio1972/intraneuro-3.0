// pacientes-service-edit.js - Módulo de edición del servicio hospitalario
// Sistema de dropdown para selección de servicio (UCI, UTI, etc.)

// Configuración de servicios disponibles - USAR LOS MISMOS QUE EN EL DASHBOARD
const HOSPITAL_SERVICES = [
    { value: 'UCI', label: 'UCI', icon: '🏥', color: '#dc2626' },
    { value: 'UTI', label: 'UTI', icon: '⚕️', color: '#ea580c' },
    { value: 'MQ', label: 'MQ', icon: '🔬', color: '#2563eb' },
    { value: 'Urgencias', label: 'Urgencias', icon: '🚨', color: '#ca8a04' },
    { value: 'Interconsulta', label: 'IC', icon: '📋', color: '#16a34a' }
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

    // Crear otros servicios (todos menos Urgencias)
    const otherServices = HOSPITAL_SERVICES.filter(s => s.value !== 'Urgencias');

    // Determinar texto inicial del botón "Hospitalización"
    const currentOtherService = otherServices.find(s => s.value === currentService);
    const otherButtonText = currentOtherService
        ? `${currentOtherService.icon} ${currentOtherService.label}`
        : 'Hospitalización';
    const otherButtonSelected = currentOtherService ? 'selected' : '';

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal active';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px; padding: 2rem; min-height: 480px; overflow: visible;">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                Editar Servicio Hospitalario
            </h3>
            <p style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 14px;">
                Paciente: <strong>${patient.name}</strong><br>
                Servicio actual: <strong>${currentService || 'No asignado'}</strong>
            </p>

            <div id="edit-service-container" class="service-selector-container" style="margin-bottom: 2rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">Seleccionar Servicio</label>
                <div class="service-selector">
                    <!-- Botón de Urgencias -->
                    <button type="button" id="editBtnUrgencias" class="btn-urgencias-primary ${currentService === 'Urgencias' ? 'selected' : ''}" data-service="Urgencias">
                        <span class="icon">🚨</span>
                        <span>Urgencias</span>
                    </button>

                    <!-- Dropdown de otros servicios -->
                    <div class="service-dropdown-wrapper">
                        <button type="button" id="editBtnOtherServices" class="btn-other-services ${otherButtonSelected}">
                            <span id="editOtherServicesLabel">${otherButtonText}</span>
                            <span class="arrow">▼</span>
                        </button>
                        <div id="editServiceDropdownMenu" class="service-dropdown-menu">
                            ${otherServices.map(s => `
                                <div class="service-dropdown-item ${s.value === currentService ? 'selected' : ''}" data-service="${s.value}">
                                    <span class="icon">${s.icon}</span>
                                    <span class="label">${s.label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: auto;">
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

    // Variable para guardar el servicio seleccionado en el modal de edición
    let editSelectedService = currentService;

    // Configurar event listeners para el selector
    const btnUrgencias = document.getElementById('editBtnUrgencias');
    const btnOtherServices = document.getElementById('editBtnOtherServices');
    const otherServicesLabel = document.getElementById('editOtherServicesLabel');
    const dropdownMenu = document.getElementById('editServiceDropdownMenu');
    const dropdownItems = document.querySelectorAll('#editServiceDropdownMenu .service-dropdown-item');

    // Click en botón de Urgencias
    if (btnUrgencias) {
        btnUrgencias.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Toggle selection
            if (editSelectedService === 'Urgencias') {
                // Deseleccionar
                editSelectedService = null;
                this.classList.remove('selected');
            } else {
                // Seleccionar Urgencias
                editSelectedService = 'Urgencias';
                this.classList.add('selected');

                // Deseleccionar otros
                btnOtherServices.classList.remove('selected');
                btnOtherServices.classList.remove('active');
                dropdownMenu.classList.remove('show');
                dropdownItems.forEach(item => item.classList.remove('selected'));
                otherServicesLabel.textContent = 'Hospitalización';
            }
        });
    }

    // Click en botón de otros servicios (toggle dropdown)
    if (btnOtherServices) {
        btnOtherServices.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            this.classList.toggle('active');
            dropdownMenu.classList.toggle('show');
        });
    }

    // Click en items del dropdown
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const service = this.dataset.service;

            // Si ya está seleccionado, deseleccionar
            if (editSelectedService === service) {
                editSelectedService = null;
                this.classList.remove('selected');
                btnOtherServices.classList.remove('selected');
                btnOtherServices.classList.remove('active');
                dropdownMenu.classList.remove('show');
                otherServicesLabel.textContent = 'Hospitalización';
                return;
            }

            // Seleccionar nuevo servicio
            editSelectedService = service;

            // Deseleccionar botón de Urgencias
            if (btnUrgencias) btnUrgencias.classList.remove('selected');

            // Actualizar UI del dropdown
            dropdownItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');

            // Mostrar servicio seleccionado en el botón
            const serviceConfig = HOSPITAL_SERVICES.find(s => s.value === service);
            if (serviceConfig) {
                otherServicesLabel.textContent = serviceConfig.icon + ' ' + serviceConfig.label;
            }
            btnOtherServices.classList.add('selected');

            // Cerrar dropdown
            btnOtherServices.classList.remove('active');
            dropdownMenu.classList.remove('show');
        });
    });

    // Cerrar dropdown al hacer click fuera (solo dentro del modal)
    modal.addEventListener('click', function(e) {
        if (!e.target.closest('.service-dropdown-wrapper')) {
            if (btnOtherServices) btnOtherServices.classList.remove('active');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        }
    });

    // Configurar botón de guardar
    const saveBtn = document.getElementById('saveServiceBtn');
    saveBtn.onclick = async () => {
        const newService = editSelectedService;

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

    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Hacer la función global
window.editPatientService = editPatientService;

// Exportar configuración de servicios
window.HOSPITAL_SERVICES = HOSPITAL_SERVICES;

console.log('[PatientServiceEdit] Módulo cargado - Servicios disponibles:', HOSPITAL_SERVICES.length);
