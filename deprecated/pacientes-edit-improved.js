/**
 * Funciones mejoradas de edición de pacientes
 * Usa DropdownManager para consistencia
 */

// Función mejorada para editar diagnóstico
async function editPatientDiagnosisImproved(event, patientId) {
    event.stopPropagation();

    // Verificar que la variable global patients esté disponible
    if (typeof patients === 'undefined' || !Array.isArray(patients)) {
        console.error('Variable patients no disponible');
        if (typeof showToast === 'function') {
            showToast('Error: Datos no cargados correctamente', 'error');
        } else {
            alert('Error: Datos no cargados correctamente');
        }
        return;
    }

    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        console.error('Paciente no encontrado:', patientId);
        if (typeof showToast === 'function') {
            showToast('Error: Paciente no encontrado', 'error');
        } else {
            alert('Error: Paciente no encontrado');
        }
        return;
    }

    const currentDiagnosis = patient.diagnosis || patient.diagnosisText || '';

    // Crear modal personalizado con dropdown
    const modalId = 'editDiagnosisModal';
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
                Editar Diagnóstico
            </h3>
            <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 14px;">
                Diagnóstico actual: <strong>${currentDiagnosis || 'Sin diagnóstico'}</strong>
            </p>
            <div id="edit-diagnosis-container" style="margin-bottom: 1.5rem;">
                <!-- El dropdown se insertará aquí -->
            </div>
            <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="saveDiagnosisBtn">
                    Guardar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Usar DropdownSystem para crear el dropdown
    let dropdownInstance = null;

    if (window.DropdownSystem) {
        dropdownInstance = window.DropdownSystem.createDiagnosisDropdown({
            containerId: 'edit-diagnosis-container',
            currentValue: currentDiagnosis,
            required: true
        });
    } else {
        // Fallback si DropdownSystem no está disponible
        console.error('DropdownSystem no disponible');
        document.getElementById('edit-diagnosis-container').innerHTML =
            '<p style="color: red;">Error: Sistema de dropdowns no disponible</p>';
    }

    // Configurar botón de guardar
    const saveBtn = document.getElementById('saveDiagnosisBtn');
    saveBtn.onclick = async () => {
        if (!dropdownInstance) {
            showToast('Error: Dropdown no inicializado', 'error');
            return;
        }

        const newDiagnosis = dropdownInstance.getValue();

        if (!newDiagnosis) {
            showToast('Por favor seleccione o escriba un diagnóstico', 'error');
            return;
        }

        try {
            const response = await apiRequest(`/patients/${patientId}/admission`, {
                method: 'PUT',
                body: JSON.stringify({
                    diagnosis: newDiagnosis,
                    diagnosisText: newDiagnosis
                })
            });

            if (response.admission) {
                // Actualizar datos locales
                patient.diagnosis = response.admission.diagnosis;
                patient.diagnosisText = response.admission.diagnosisText || response.admission.diagnosis;

                // Actualizar UI
                const diagElement = document.getElementById(`diagnosis-${patientId}`);
                if (diagElement) {
                    diagElement.textContent = patient.diagnosisText;
                }

                // Re-renderizar lista si existe la función
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }

                // Cerrar modal
                document.getElementById(modalId).remove();

                showToast('Diagnóstico actualizado correctamente', 'success');
            }
        } catch (error) {
            console.error('Error actualizando diagnóstico:', error);
            showToast('Error al actualizar el diagnóstico', 'error');
        }
    };
}

// Función mejorada para editar previsión
async function editPatientPrevisionImproved(event, patientId) {
    event.stopPropagation();

    // Verificar que la variable global patients esté disponible
    if (typeof patients === 'undefined' || !Array.isArray(patients)) {
        console.error('Variable patients no disponible');
        if (typeof showToast === 'function') {
            showToast('Error: Datos no cargados correctamente', 'error');
        } else {
            alert('Error: Datos no cargados correctamente');
        }
        return;
    }

    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        console.error('Paciente no encontrado:', patientId);
        if (typeof showToast === 'function') {
            showToast('Error: Paciente no encontrado', 'error');
        } else {
            alert('Error: Paciente no encontrado');
        }
        return;
    }

    const currentPrevision = patient.prevision || '';

    // Crear modal personalizado con dropdown
    const modalId = 'editPrevisionModal';
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
                Editar Previsión
            </h3>
            <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 14px;">
                Previsión actual: <strong>${currentPrevision || 'Sin previsión'}</strong>
            </p>
            <div id="edit-prevision-container" style="margin-bottom: 1.5rem;">
                <!-- El dropdown se insertará aquí -->
            </div>
            <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="savePrevisionBtn">
                    Guardar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Usar DropdownSystem para crear el dropdown
    let dropdownInstance = null;

    if (window.DropdownSystem) {
        dropdownInstance = window.DropdownSystem.createPrevisionDropdown({
            containerId: 'edit-prevision-container',
            currentValue: currentPrevision,
            required: false
        });
    } else {
        // Fallback si DropdownSystem no está disponible
        console.error('DropdownSystem no disponible');
        document.getElementById('edit-prevision-container').innerHTML =
            '<p style="color: red;">Error: Sistema de dropdowns no disponible</p>';
    }

    // Configurar botón de guardar
    const saveBtn = document.getElementById('savePrevisionBtn');
    saveBtn.onclick = async () => {
        if (!dropdownInstance) {
            showToast('Error: Dropdown no inicializado', 'error');
            return;
        }

        const newPrevision = dropdownInstance.getValue() || null;

        try {
            const response = await apiRequest(`/patients/${patientId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    prevision: newPrevision
                })
            });

            if (response.patient) {
                // Actualizar datos locales
                patient.prevision = response.patient.prevision;

                // Actualizar UI
                const prevElement = document.getElementById(`prevision-${patientId}`);
                if (prevElement) {
                    prevElement.textContent = patient.prevision || 'No especificada';
                }

                // Re-renderizar lista si existe la función
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }

                // Cerrar modal
                document.getElementById(modalId).remove();

                showToast('Previsión actualizada correctamente', 'success');
            }
        } catch (error) {
            console.error('Error actualizando previsión:', error);
            showToast('Error al actualizar la previsión', 'error');
        }
    };
}

// Reemplazar las funciones originales si existen
if (typeof window !== 'undefined') {
    // Guardar referencias a las funciones originales
    window.editPatientDiagnosisOriginal = window.editPatientDiagnosis;
    window.editPatientPrevisionOriginal = window.editPatientPrevision;

    // Usar las nuevas funciones mejoradas
    window.editPatientDiagnosis = editPatientDiagnosisImproved;
    window.editPatientPrevision = editPatientPrevisionImproved;

    console.log('✅ Funciones de edición mejoradas cargadas');
}