// pacientes-service-edit.js - Módulo de edición del servicio hospitalario
// v2.0 - Simplificado usando DropdownSystem.showServiceSelector()

// Configuración de servicios disponibles (para uso en UI de lista)
const HOSPITAL_SERVICES = [
    { value: 'Urgencias', label: 'Urgencias', icon: '🚨', color: '#ca8a04' },
    { value: 'UCI', label: 'UCI', icon: '🏥', color: '#dc2626' },
    { value: 'UTI', label: 'UTI', icon: '⚕️', color: '#ea580c' },
    { value: 'MQ', label: 'MQ', icon: '🔬', color: '#2563eb' },
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

    // Usar el nuevo selector visual de servicios
    if (window.DropdownSystem && window.DropdownSystem.showServiceSelector) {
        window.DropdownSystem.showServiceSelector({
            currentValue: currentService,
            onSelect: async (newService) => {
                // Verificar si hay cambios
                if (newService === currentService) {
                    showToast('Sin cambios en el servicio', 'info');
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

                        // Actualizar UI del modal si está abierto
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

                        // Actualizar lista de pacientes
                        if (typeof renderPatients === 'function') {
                            renderPatients(true);
                        }

                        showToast('Servicio actualizado correctamente');
                    } else {
                        throw new Error(response.error || 'Error en la respuesta del servidor');
                    }
                } catch (error) {
                    console.error('[EditService] Error actualizando servicio:', error);
                    showToast('Error al actualizar servicio', 'error');
                }
            },
            onCancel: () => {
                // No hacer nada al cancelar
            }
        });
    } else {
        console.error('[EditService] DropdownSystem.showServiceSelector no disponible');
        showToast('Error: Sistema de selección no disponible', 'error');
    }
}

// Hacer la función global
window.editPatientService = editPatientService;

// Exportar configuración de servicios
window.HOSPITAL_SERVICES = HOSPITAL_SERVICES;

console.log('[PatientServiceEdit] v2.0 - Módulo cargado con selector visual');
