/**
 * Fix para asegurar que se use la función correcta de edición de previsión
 * Este archivo debe cargarse al final después de todos los demás scripts
 */

(function() {
    'use strict';

    console.log('[Fix Prevision] Iniciando corrección de función editPatientPrevision...');

    // Función mejorada de edición de previsión con DropdownSystem
    async function editPatientPrevisionFixed(event, patientId) {
        event.stopPropagation();

        console.log('[Fix Prevision] Editando previsión para paciente:', patientId);

        // Verificar que patients existe
        if (typeof patients === 'undefined' || !Array.isArray(patients)) {
            console.error('[Fix Prevision] Variable patients no disponible');
            if (typeof showToast === 'function') {
                showToast('Error: Datos no cargados correctamente', 'error');
            }
            return;
        }

        const patient = patients.find(p => p.id === patientId);
        if (!patient) {
            console.error('[Fix Prevision] Paciente no encontrado:', patientId);
            if (typeof showToast === 'function') {
                showToast('Error: Paciente no encontrado', 'error');
            }
            return;
        }

        const currentPrevision = patient.prevision || '';
        console.log('[Fix Prevision] Previsión actual:', currentPrevision);

        // Crear modal con DropdownSystem si está disponible
        const modalId = 'editPrevisionModal';
        let existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal active';
        modal.style.zIndex = '10000';

        // Si DropdownSystem está disponible, usarlo
        if (window.DropdownSystem) {
            console.log('[Fix Prevision] Usando DropdownSystem para el dropdown');

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

            // Crear dropdown con DropdownSystem
            const dropdownInstance = window.DropdownSystem.createPrevisionDropdown({
                containerId: 'edit-prevision-container',
                currentValue: currentPrevision,
                required: false
            });

            // Configurar botón de guardar
            const saveBtn = document.getElementById('savePrevisionBtn');
            saveBtn.onclick = async () => {
                const newPrevision = dropdownInstance ? dropdownInstance.getValue() : '';

                console.log('[Fix Prevision] Nueva previsión seleccionada:', newPrevision);

                try {
                    const response = await apiRequest(`/patients/${patientId}/prevision`, {
                        method: 'PUT',
                        body: JSON.stringify({ prevision: newPrevision || null })
                    });

                    console.log('[Fix Prevision] Respuesta del servidor:', response);

                    if (response.success) {
                        // Actualizar datos locales
                        patient.prevision = response.prevision !== undefined ? response.prevision : newPrevision;

                        console.log('[Fix Prevision] Paciente actualizado localmente:', patient);

                        // Actualizar UI del modal del paciente si está abierto
                        const modalPrevisionElement = document.querySelector(`#patientModal .patient-info span[id*="prevision"]`);
                        if (modalPrevisionElement) {
                            modalPrevisionElement.textContent = patient.prevision || 'No especificada';
                        }

                        // Actualizar elemento en la lista
                        const listPrevisionElement = document.getElementById(`prevision-${patientId}`);
                        if (listPrevisionElement) {
                            listPrevisionElement.textContent = patient.prevision || 'No especificada';
                        }

                        // Recargar datos desde API con force reload
                        if (typeof PacientesAPI !== 'undefined' && PacientesAPI.loadPatientsFromAPI) {
                            console.log('[Fix Prevision] Recargando datos desde API...');
                            await PacientesAPI.loadPatientsFromAPI(true);
                        }

                        // Re-renderizar lista
                        if (typeof renderPatients === 'function') {
                            renderPatients();
                        }

                        if (typeof showToast === 'function') {
                            showToast('Previsión actualizada correctamente', 'success');
                        }

                        modal.remove();
                    } else {
                        console.error('[Fix Prevision] Error en respuesta:', response);
                        if (typeof showToast === 'function') {
                            showToast(response.error || 'Error al actualizar previsión', 'error');
                        }
                    }
                } catch (error) {
                    console.error('[Fix Prevision] Error actualizando previsión:', error);
                    if (typeof showToast === 'function') {
                        showToast('Error al actualizar previsión', 'error');
                    }
                }
            };

        } else {
            console.warn('[Fix Prevision] DropdownSystem no disponible, usando función básica');
            // Fallback a la función original si DropdownSystem no está disponible
            if (window.PacientesEdit && window.PacientesEdit.editPatientPrevision) {
                window.PacientesEdit.editPatientPrevision(event, patientId);
            }
        }
    }

    // Reemplazar la función global después de un pequeño delay para asegurar que todos los scripts han cargado
    setTimeout(() => {
        window.editPatientPrevision = editPatientPrevisionFixed;
        console.log('[Fix Prevision] ✅ Función editPatientPrevision reemplazada exitosamente');

        // Verificar que se está usando la función correcta
        if (window.editPatientPrevision === editPatientPrevisionFixed) {
            console.log('[Fix Prevision] ✅ Verificación exitosa: usando función corregida');
        } else {
            console.error('[Fix Prevision] ❌ Error: la función no se reemplazó correctamente');
        }
    }, 100);

})();