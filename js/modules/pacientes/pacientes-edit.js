// pacientes-edit.js - Módulo de edición inline de pacientes
// Todas las funciones de edición de campos

// Editar nombre del paciente
async function editPatientName(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentName = patient.name;
    const newName = prompt(
        `Editar nombre del paciente:\n\n` +
        `Nombre actual: ${currentName}\n\n` +
        `Ingrese el nuevo nombre (mínimo 3 caracteres):`,
        currentName
    );
    
    if (newName === null) return;
    
    const trimmedName = newName.trim();
    
    if (trimmedName.length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (trimmedName === currentName) {
        showToast('Sin cambios en el nombre', 'info');
        return;
    }
    
    try {
        const response = await PacientesAPI.updatePatientNameAPI(patientId, trimmedName);
        
        if (response.success) {
            patient.name = trimmedName;
            document.getElementById(`name-${patientId}`).textContent = trimmedName;
            renderPatients();
            showToast('Nombre actualizado correctamente');
        }
    } catch (error) {
        console.error('Error actualizando nombre:', error);
        showToast('Error al actualizar nombre', 'error');
    }
}

// Editar edad del paciente
async function editPatientAge(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentAge = patient.age;
    const newAge = prompt(
        `Editar edad del paciente:\n\n` +
        `Edad actual: ${currentAge} años\n\n` +
        `Ingrese la nueva edad (1-120):`,
        currentAge
    );
    
    if (newAge !== null && newAge !== '') {
        const ageNum = parseInt(newAge);
        
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            showToast('La edad debe ser un número entre 1 y 120', 'error');
            return;
        }
        
        if (ageNum === currentAge) {
            showToast('Sin cambios en la edad', 'info');
            return;
        }
        
        try {
            const response = await PacientesAPI.updatePatientAgeAPI(patientId, ageNum);
            
            if (response.success) {
                patient.age = ageNum;
                document.getElementById(`age-${patientId}`).textContent = `${ageNum} años`;
                renderPatients();
                showToast('Edad actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando edad:', error);
            showToast('Error al actualizar edad', 'error');
        }
    }
}

// Editar RUT del paciente
async function editPatientRut(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentRut = patient.rut || '';
    const newRut = prompt(
        `Editar RUT del paciente:\n\n` +
        `RUT actual: ${currentRut || 'Sin RUT'}\n\n` +
        `Ingrese el nuevo RUT:`,
        currentRut
    );
    
    if (newRut !== null) {
        const trimmedRut = newRut.trim();
        
        if (trimmedRut && !validateRut(trimmedRut)) {
            showToast('RUT inválido', 'error');
            return;
        }
        
        try {
            const response = await PacientesAPI.updatePatientRutAPI(patientId, trimmedRut);
            
            if (response.success) {
                patient.rut = trimmedRut;
                document.getElementById(`rut-${patientId}`).textContent = trimmedRut || 'Sin RUT';
                renderPatients();
                showToast('RUT actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando RUT:', error);
            showToast('Error al actualizar RUT', 'error');
        }
    }
}

// Editar cama del paciente
async function editPatientBed(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentBed = patient.bed || '';
    const newBed = prompt(
        `Editar cama del paciente:\n\n` +
        `Cama actual: ${currentBed || 'Sin asignar'}\n\n` +
        `Ingrese la nueva cama:`,
        currentBed
    );
    
    if (newBed !== null) {
        try {
            const response = await PacientesAPI.updatePatientBedAPI(patientId, newBed);
            
            if (response.success) {
                patient.bed = newBed || 'Sin asignar';
                document.getElementById(`bed-${patientId}`).textContent = newBed || 'Sin asignar';
                renderPatients();
                showToast('Cama actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando cama:', error);
            showToast('Error al actualizar cama', 'error');
        }
    }
}

// Editar previsión del paciente
async function editPatientPrevision(event, patientId) {
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
                Editar Previsión de Salud
            </h3>
            <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 14px;">
                Previsión actual: <strong>${currentPrevision || 'No especificada'}</strong>
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

    // Inicializar dropdown en el contenedor
    const container = document.getElementById('edit-prevision-container');
    if (container) {
        // Lista de previsiones en Chile (sincronizada con DropdownSystem)
        const previsiones = [
            'Fonasa A',
            'Fonasa B',
            'Fonasa C',
            'Fonasa D',
            'Isapre Banmédica',
            'Isapre Consalud',
            'Isapre Cruz Blanca',
            'Isapre Colmena',
            'Isapre Vida Tres',
            'Isapre Nueva Masvida',
            'Particular',
            'Sin previsión'
        ];

        container.innerHTML = `
            <label>Nueva Previsión</label>
            <select id="edit-prevision-select" class="prevision-dropdown" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">-- Sin previsión --</option>
                ${previsiones.map(p => `<option value="${p}" ${p === currentPrevision ? 'selected' : ''}>${p}</option>`).join('')}
                <option value="otro">── Otra previsión ──</option>
            </select>
            <div id="edit-prevision-otro-container" style="display: none; margin-top: 10px;">
                <input type="text"
                       id="edit-prevision-otro"
                       class="prevision-input-otro"
                       placeholder="Escriba la previsión..."
                       value="${!previsiones.includes(currentPrevision) && currentPrevision ? currentPrevision : ''}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        `;

        // Configurar eventos del dropdown
        const select = document.getElementById('edit-prevision-select');
        const otroContainer = document.getElementById('edit-prevision-otro-container');
        const otroInput = document.getElementById('edit-prevision-otro');

        // Si la previsión actual no está en la lista, seleccionar "otro"
        if (currentPrevision && !previsiones.includes(currentPrevision)) {
            select.value = 'otro';
            otroContainer.style.display = 'block';
        }

        select.addEventListener('change', function() {
            if (this.value === 'otro') {
                otroContainer.style.display = 'block';
                otroInput.required = true;
                otroInput.focus();
            } else {
                otroContainer.style.display = 'none';
                otroInput.required = false;
            }
        });
    }

    // Configurar botón de guardar
    const saveBtn = document.getElementById('savePrevisionBtn');
    saveBtn.onclick = async () => {
        const select = document.getElementById('edit-prevision-select');
        const otroInput = document.getElementById('edit-prevision-otro');

        let newPrevision = '';
        if (select.value === 'otro') {
            newPrevision = otroInput.value.trim();
        } else {
            newPrevision = select.value;
        }

        // Permitir previsión vacía
        console.log('[Edit Prevision] Enviando nueva previsión:', newPrevision);
        console.log('[Edit Prevision] Patient ID:', patientId);

        try {
            const response = await apiRequest(`/patients/${patientId}/prevision`, {
                method: 'PUT',
                body: JSON.stringify({ prevision: newPrevision || null })
            });

            console.log('[Edit Prevision] Respuesta del servidor:', response);

            if (response.success) {
                // Actualizar datos locales
                patient.prevision = response.prevision !== undefined ? response.prevision : (newPrevision || null);
                console.log('[Edit Prevision] Paciente actualizado localmente:', patient);

                // Actualizar UI
                const previsionElement = document.getElementById(`prevision-${patientId}`);
                if (previsionElement) {
                    previsionElement.textContent = patient.prevision || 'No especificada';
                    console.log('[Edit Prevision] UI actualizada');
                }

                // Recargar datos desde el servidor para asegurar sincronización
                if (typeof PacientesAPI !== 'undefined' && PacientesAPI.loadPatientsFromAPI) {
                    console.log('[Edit Prevision] Recargando datos desde API con force reload...');
                    await PacientesAPI.loadPatientsFromAPI(true); // Force reload para evitar cache
                }

                // Actualizar lista de pacientes si la función está disponible
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }

                if (typeof showToast === 'function') {
                    showToast('Previsión actualizada correctamente');
                }
                modal.remove();
            } else {
                console.error('[Edit Prevision] Respuesta no exitosa:', response);
                if (typeof showToast === 'function') {
                    showToast(response.error || 'Error al actualizar previsión', 'error');
                }
            }
        } catch (error) {
            console.error('[Edit Prevision] Error actualizando previsión:', error);
            if (typeof showToast === 'function') {
                showToast('Error al actualizar previsión', 'error');
            }
        }
    };

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Editar fecha de ingreso
async function editAdmissionDate(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDate = patient.admissionDate.split('T')[0];
    const newDate = prompt(
        `Editar fecha de ingreso:\n\n` +
        `Fecha actual: ${formatDate(patient.admissionDate)}\n\n` +
        `Ingrese la nueva fecha (YYYY-MM-DD):`,
        currentDate
    );
    
    if (newDate !== null && newDate !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDate)) {
            showToast('Formato de fecha inválido. Use YYYY-MM-DD', 'error');
            return;
        }
        
        try {
            const response = await PacientesAPI.updateAdmissionDateAPI(patientId, newDate);
            
            if (response.success) {
                patient.admissionDate = newDate;
                document.getElementById(`admission-date-${patientId}`).textContent = formatDate(newDate);
                renderPatients();
                showToast('Fecha de ingreso actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando fecha:', error);
            showToast('Error al actualizar fecha de ingreso', 'error');
        }
    }
}

// Editar diagnóstico
async function editDiagnosis(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDiagnosis = patient.diagnosis || '';
    const diagnosisOptions = Object.entries(catalogos.diagnosis).map(([codigo, nombre]) => 
        `${codigo} - ${nombre}`
    ).join('\n');
    
    const newDiagnosis = prompt(
        `Editar diagnóstico del paciente:\n\n` +
        `Diagnóstico actual: ${catalogos.getDiagnosisText(currentDiagnosis)}\n\n` +
        `Ingrese el código del nuevo diagnóstico:\n${diagnosisOptions}`,
        currentDiagnosis
    );
    
    if (newDiagnosis !== null && newDiagnosis !== '') {
        const validDiagnosis = catalogos.diagnosis[newDiagnosis];
        
        if (!validDiagnosis) {
            showToast('Código de diagnóstico inválido', 'error');
            return;
        }
        
        try {
            const response = await PacientesAPI.updateDiagnosisAPI(patientId, newDiagnosis);
            
            if (response.success) {
                patient.diagnosis = newDiagnosis;
                document.getElementById(`diagnosis-${patientId}`).textContent = catalogos.getDiagnosisText(newDiagnosis);
                renderPatients();
                showToast('Diagnóstico actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando diagnóstico:', error);
            showToast('Error al actualizar diagnóstico', 'error');
        }
    }
}

// Editar descripción del diagnóstico
async function editDiagnosisDetails(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDetails = patient.diagnosisDetails || '';
    const newDetails = prompt(
        `Editar descripción del diagnóstico:\n\n` +
        `Descripción actual: ${currentDetails || 'Sin descripción'}\n\n` +
        `Ingrese la nueva descripción:`,
        currentDetails
    );
    
    if (newDetails !== null) {
        try {
            const response = await PacientesAPI.updateDiagnosisDetailsAPI(patientId, newDetails);
            
            if (response.success) {
                patient.diagnosisDetails = newDetails || '';
                document.getElementById(`diagnosis-details-${patientId}`).textContent = newDetails || 'Sin descripción';
                showToast('Descripción actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando descripción:', error);
            showToast('Error al actualizar descripción', 'error');
        }
    }
}

// Editar médico tratante
async function editAdmittedBy(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDoctor = patient.admittedBy || '';
    const newDoctor = prompt(
        `Editar médico tratante:\n\n` +
        `Médico actual: ${currentDoctor || 'Sin asignar'}\n\n` +
        `Ingrese el nombre del nuevo médico tratante:`,
        currentDoctor
    );
    
    if (newDoctor !== null && newDoctor !== '') {
        try {
            const response = await PacientesAPI.updateAdmittedByAPI(patientId, newDoctor);
            
            if (response.success) {
                patient.admittedBy = newDoctor;
                document.getElementById(`admitted-by-${patientId}`).textContent = newDoctor;
                renderPatients();
                showToast('Médico tratante actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando médico:', error);
            showToast('Error al actualizar médico tratante', 'error');
        }
    }
}

// Editar cama desde la lista (versión simplificada)
async function editBed(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentBed = patient.bed || 'Sin asignar';
    const newBed = prompt(`Cambiar cama del paciente ${patient.name}:\n\nCama actual: ${currentBed}`, currentBed);
    
    if (newBed !== null && newBed !== currentBed) {
        try {
            const response = await PacientesAPI.updatePatientBedAPI(patientId, newBed);
            
            if (response.success) {
                patient.bed = newBed || 'Sin asignar';
                renderPatients();
                showToast('Cama actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando cama:', error);
            showToast('Error al actualizar cama', 'error');
        }
    }
}

// Función para editar diagnóstico desde la lista (diferente a editDiagnosis del modal)
async function editPatientDiagnosis(event, patientId) {
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

    // Inicializar dropdown en el contenedor
    const container = document.getElementById('edit-diagnosis-container');
    if (container) {
        // Crear dropdown usando el mismo código que en diagnosis-dropdown.js
        const diagnosticos = [
            'ACV Isquémico',
            'ACV Hemorrágico',
            'Epilepsia',
            'Crisis Convulsiva',
            'Cefalea',
            'Migraña',
            'Demencia tipo Alzheimer',
            'Demencia Vascular',
            'Enfermedad de Parkinson',
            'Esclerosis Múltiple',
            'Neuropatía Periférica',
            'Síndrome de Guillain-Barré',
            'Meningitis',
            'Encefalitis',
            'Tumor Cerebral',
            'Traumatismo Craneoencefálico',
            'Hidrocefalia',
            'Vértigo',
            'Miastenia Gravis',
            'Esclerosis Lateral Amiotrófica'
        ];

        container.innerHTML = `
            <label>Nuevo Diagnóstico</label>
            <select id="edit-diagnosis-select" class="diagnosis-dropdown" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">-- Seleccione un diagnóstico --</option>
                ${diagnosticos.map(d => `<option value="${d}" ${d === currentDiagnosis ? 'selected' : ''}>${d}</option>`).join('')}
                <option value="otro">── Otro diagnóstico ──</option>
            </select>
            <div id="edit-diagnosis-otro-container" style="display: none; margin-top: 10px;">
                <input type="text"
                       id="edit-diagnosis-otro"
                       class="diagnosis-input-otro"
                       placeholder="Escriba el diagnóstico..."
                       value="${!diagnosticos.includes(currentDiagnosis) && currentDiagnosis ? currentDiagnosis : ''}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
        `;

        // Configurar eventos del dropdown
        const select = document.getElementById('edit-diagnosis-select');
        const otroContainer = document.getElementById('edit-diagnosis-otro-container');
        const otroInput = document.getElementById('edit-diagnosis-otro');

        // Si el diagnóstico actual no está en la lista, seleccionar "otro"
        if (currentDiagnosis && !diagnosticos.includes(currentDiagnosis)) {
            select.value = 'otro';
            otroContainer.style.display = 'block';
        }

        select.addEventListener('change', function() {
            if (this.value === 'otro') {
                otroContainer.style.display = 'block';
                otroInput.required = true;
                otroInput.focus();
            } else {
                otroContainer.style.display = 'none';
                otroInput.required = false;
            }
        });
    }

    // Configurar botón de guardar
    const saveBtn = document.getElementById('saveDiagnosisBtn');
    saveBtn.onclick = async () => {
        const select = document.getElementById('edit-diagnosis-select');
        const otroInput = document.getElementById('edit-diagnosis-otro');

        let newDiagnosis = '';
        if (select.value === 'otro') {
            newDiagnosis = otroInput.value.trim();
        } else {
            newDiagnosis = select.value;
        }

        if (!newDiagnosis) {
            showToast('Por favor seleccione o escriba un diagnóstico', 'error');
            return;
        }

        try {
            const response = await apiRequest(`/patients/${patientId}/admission`, {
                method: 'PUT',
                body: JSON.stringify({
                    diagnosis_code: newDiagnosis,
                    diagnosis_text: newDiagnosis
                })
            });

            if (response.success) {
                patient.diagnosis = newDiagnosis;
                patient.diagnosisText = newDiagnosis;
                const diagElement = document.getElementById(`diagnosis-${patientId}`);
                if (diagElement) {
                    diagElement.textContent = newDiagnosis;
                }

                // Actualizar lista de pacientes si la función está disponible
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }

                if (typeof showToast === 'function') {
                    showToast('Diagnóstico actualizado correctamente');
                }
                modal.remove();
            }
        } catch (error) {
            console.error('Error actualizando diagnóstico:', error);
            if (typeof showToast === 'function') {
                showToast('Error al actualizar diagnóstico', 'error');
            }
        }
    };

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Hacer la función global para el onclick
window.editPatientDiagnosis = editPatientDiagnosis;

// Exportar funciones para usar en otros módulos
const PacientesEdit = {
    editPatientName,
    editPatientAge,
    editPatientRut,
    editPatientBed,
    editPatientPrevision,
    editAdmissionDate,
    editDiagnosis,
    editDiagnosisDetails,
    editAdmittedBy,
    editBed,
    editPatientDiagnosis
};