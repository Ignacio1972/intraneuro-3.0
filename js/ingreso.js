// ingreso.js - INTRANEURO Admission Management
// Modificado: 18/12/2025 - Dropdown de diagnóstico eliminado del formulario de ingreso
// El diagnóstico ahora se asigna desde el modal del paciente después del ingreso

// Initialize admission form
document.addEventListener('DOMContentLoaded', () => {
    const admissionForm = document.getElementById('admissionForm');
    if (admissionForm) {
        admissionForm.addEventListener('submit', handleAdmission);
    }
});

// MODIFICADA: Handle admission form submission con API
async function handleAdmission(e) {
    e.preventDefault();

    console.log('📝 INICIANDO PROCESO DE INGRESO...');

    // Obtener el valor de la cama del campo de entrada
    const bedInput = document.getElementById('patientBedInput');
    const bedValue = bedInput ? bedInput.value.trim() : '';

    // Diagnóstico eliminado del ingreso - se asigna desde el modal del paciente (18/12/2025)
    const formData = {
        name: document.getElementById('patientName').value,
        age: document.getElementById('patientAge')?.value ? parseInt(document.getElementById('patientAge').value) : 1, // Default 1 si no se ingresa
        rut: document.getElementById('patientRut').value || null, // Sin validación
        prevision: document.getElementById('patientPrevision')?.value || null, // Tomar del campo del formulario (OCR o manual)
        bed: bedValue || 'n/a', // Usar el valor ingresado o 'n/a' si está vacío
        admissionDate: document.getElementById('admissionDate').value,
        diagnosis: null, // Se asigna desde el modal del paciente
        diagnosisText: null,
        diagnosisDetails: '',
        allergies: null,
        admittedBy: 'Sistema', // Se actualizará desde el modal del paciente
        status: 'active'
    };

    console.log('Cama asignada:', bedValue || 'n/a');

    // Sin validación de RUT - ingreso rápido

    // NUEVO: Intentar guardar en API primero
    console.log('Enviando datos del paciente:', formData);
    try {
        const response = await apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('Respuesta del servidor:', response);
        console.log('Paciente creado con ID:', response?.patient?.id);
        console.log('Admisión creada con ID:', response?.admission?.id);

        if (response && response.patient) {
            console.log('Paciente guardado en BD:', response);

            // Crear objeto paciente con datos de respuesta y admisión
            const newPatient = {
                ...response.patient,
                bed: response.admission?.bed || formData.bed,
                admissionDate: response.admission?.admission_date || formData.admissionDate,
                diagnosis: response.admission?.diagnosis_code || formData.diagnosis,
                diagnosisText: response.admission?.diagnosis_text || formData.diagnosisText,
                diagnosisDetails: response.admission?.diagnosis_details || formData.diagnosisDetails,
                allergies: formData.allergies,
                admittedBy: response.admission?.admitted_by || formData.admittedBy,
                status: 'active',
                daysInHospital: calculateDays(response.admission?.admission_date || formData.admissionDate),
                scheduledDischarge: false,
                admission_id: response.admission?.id
            };

            // Actualizar array local para mantener sincronía
            patients.push(newPatient);

            // ✨ NUEVO: Verificar si viene de OCR para flujo automático
            if (window.OCR_AUTO_OPEN_MODAL === true) {
                console.log('[Ingreso] Detectado flag OCR - Abriendo modal del paciente automáticamente');

                // Limpiar flag inmediatamente
                window.OCR_AUTO_OPEN_MODAL = false;

                // Reset form
                e.target.reset();

                // Limpiar campo de cama
                if (bedInput) {
                    bedInput.value = '';
                }

                // Cerrar modal de ingreso SIN delay
                closeModal('admissionModal');

                // Actualizar dashboard (sin recargar lista completa)
                if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }

                // Esperar un momento para que el modal de ingreso cierre completamente
                setTimeout(() => {
                    console.log('[Ingreso] Abriendo modal del paciente ID:', newPatient.id);

                    // Abrir modal del paciente recién creado
                    if (typeof openPatientModal === 'function') {
                        openPatientModal(newPatient.id);
                    } else {
                        console.error('[Ingreso] openPatientModal no está disponible');
                        // Fallback: mostrar toast de éxito
                        if (typeof showToast === 'function') {
                            showToast(`Paciente ${newPatient.name} ingresado correctamente`, 'success');
                        }
                    }
                }, 400); // Delay para transición suave entre modales

                return; // Salir - flujo OCR completado
            }

            // Flujo normal (sin OCR) - mantener comportamiento original
            // Show success message
            showAdmissionSuccess(newPatient);

            // Reset form
            e.target.reset();

            // Limpiar campo de cama
            if (bedInput) {
                bedInput.value = '';
            }

            // Close modal y actualizar la lista de pacientes
            setTimeout(async () => {
                closeModal('admissionModal');

                // Actualizar la lista de pacientes sin recargar toda la página
                if (typeof renderPatients === 'function') {
                    // Forzar recarga desde la API con un pequeño delay adicional
                    setTimeout(async () => {
                        console.log('Actualizando lista de pacientes...');
                        await renderPatients(false, true); // false = no skip API load, true = force reload

                        // Actualizar también el dashboard si existe
                        if (typeof updateDashboard === 'function') {
                            updateDashboard();
                        }
                    }, 500); // Delay adicional para asegurar que la BD esté actualizada
                } else {
                    // Fallback: recargar la página si no encuentra la función
                    window.location.reload();
                }
            }, 1500);

            return; // Salir si API funcionó
        } else {
            console.error('Respuesta inesperada del servidor:', response);
        }
    } catch (error) {
        console.error('❌ ERROR CRÍTICO guardando en API:', error);
        console.error('Detalles del error:', error.message);

        // Limpiar flag OCR en caso de error
        if (window.OCR_AUTO_OPEN_MODAL === true) {
            window.OCR_AUTO_OPEN_MODAL = false;
            console.log('[Ingreso] Flag OCR limpiado debido a error');
        }

        // Determinar mensaje de error apropiado
        let errorMessage = error.message || 'Error desconocido';

        // Si el error viene del backend con mensaje específico, usarlo
        if (error.response && error.response.message) {
            errorMessage = error.response.message;
        } else if (error.response && error.response.error) {
            errorMessage = error.response.error;
        }

        // Detectar caso específico de paciente ya ingresado
        if (errorMessage.includes('ya tiene una admisión activa') || errorMessage.includes('ya está ingresado')) {
            errorMessage = `⚠️ Este paciente ya está ingresado en el sistema. Verifique el RUT.`;
        }

        // Mostrar error al usuario
        if (typeof showToast === 'function') {
            showToast(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }

        // NO continuar con el fallback si hay error
        return;
    }
    
    // FALLBACK: Lógica original si API falla
    const newPatient = {
        ...formData,
        id: Date.now(), // Temporary ID generation
        daysInHospital: calculateDays(formData.admissionDate),
        scheduledDischarge: false
    };
    
    patients.push(newPatient);
    
    // Show success message
    showAdmissionSuccess(newPatient);
    
    // Reset form
    e.target.reset();
    // document.getElementById('allergyDetails').style.display = 'none'; // Deshabilitado - 08/08/2025
    
    // Close modal
    setTimeout(() => {
        closeModal('admissionModal');
        updateDashboard();
        renderPatients();
    }, 1500);
}

// MODIFICADA: Check for existing patient con API
async function checkExistingPatient() {
    const rut = document.getElementById('patientRut').value;
    if (!rut) return;
    
    // NUEVO: Intentar buscar en API primero
    try {
        const response = await apiRequest(`/patients/search?rut=${encodeURIComponent(rut)}`);
        
        if (response && response.found && response.previousAdmissions) {
            const patientHistory = response.previousAdmissions;
            if (patientHistory.length > 0) {
                showReadmissionAlert(patientHistory);
                return;
            }
        }
    } catch (error) {
   //     console.log('Error buscando en API, usando datos locales:', error);
    }
    
    // FALLBACK: Buscar en datos locales
    const patientHistory = patients.filter(p => p.rut === rut && p.status === 'discharged');
    
    if (patientHistory.length > 0) {
        showReadmissionAlert(patientHistory);
    }
}

// Show readmission alert
function showReadmissionAlert(history) {
    const lastAdmission = history[history.length - 1];
    
    // Create alert banner
    const existingAlert = document.querySelector('.readmission-alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = 'readmission-alert';
    alert.innerHTML = `
        <div style="background: #FFF3CD; border: 1px solid #FFEAA7; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <h4 style="color: #856404; margin-bottom: 0.5rem;">⚠️ Paciente con historial previo</h4>
            <p style="color: #856404; margin: 0;">
                Último egreso: ${formatDate(lastAdmission.dischargeDate || lastAdmission.discharge_date)}<br>
                Diagnóstico previo: ${lastAdmission.diagnosis || lastAdmission.diagnosis_code} - ${lastAdmission.diagnosisText || lastAdmission.diagnosis_text}<br>
                Total de ingresos previos: ${history.length}
            </p>
        </div>
    `;
    
    // Insert after patient data section
    const formSection = document.querySelector('#admissionForm .form-section');
    formSection.appendChild(alert);
}

// Get diagnosis text
function getDiagnosisText(code) {
    const diagnoses = {
        'F32.1': 'Episodio depresivo moderado',
        'F41.1': 'Trastorno de ansiedad generalizada',
        'F20.0': 'Esquizofrenia paranoide',
        'F31.1': 'Trastorno bipolar, episodio maníaco',
        'F10.2': 'Dependencia del alcohol',
        'F43.1': 'Trastorno de estrés post-traumático',
        'F60.3': 'Trastorno límite de la personalidad',
        'F84.0': 'Autismo infantil',
        'F90.0': 'Trastorno por déficit de atención con hiperactividad',
        'F50.0': 'Anorexia nerviosa',
        'other': 'Otro diagnóstico'
    };
    
    return diagnoses[code] || code;
}

// Show admission success message
function showAdmissionSuccess(patient) {
    // Create success overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    text-align: center; z-index: 2000;">
            <div style="font-size: 3rem; color: #27AE60; margin-bottom: 1rem;">✓</div>
            <h3 style="color: #2C3E50; margin-bottom: 0.5rem;">Ingreso Registrado</h3>
            <p style="color: #7F8C8D;">${patient.name} ha sido ingresado correctamente</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Remove after animation
    setTimeout(() => {
        overlay.remove();
    }, 1500);
}

// Quick patient search for discharge
function quickSearchPatient(searchTerm) {
    const activePatients = patients.filter(p => p.status === 'active');
    
    return activePatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rut?.includes(searchTerm)
    );
}

// Populate diagnosis descriptions
const diagnosisDescriptions = {
    'F32.1': 'Caracterizado por estado de ánimo deprimido, pérdida de interés y disminución de energía',
    'F41.1': 'Ansiedad y preocupación excesivas que ocurren la mayoría de los días durante al menos 6 meses',
    'F20.0': 'Presencia de ideas delirantes, alucinaciones, lenguaje desorganizado',
    'F31.1': 'Período de estado de ánimo anormal y persistentemente elevado, expansivo o irritable',
    'F10.2': 'Patrón desadaptativo de consumo de alcohol que conlleva deterioro o malestar clínicamente significativo',
    'F43.1': 'Re-experimentación persistente del acontecimiento traumático',
    'F60.3': 'Patrón general de inestabilidad en las relaciones interpersonales',
    'F84.0': 'Desarrollo anormal o deficiente de la interacción social y comunicación',
    'F90.0': 'Patrón persistente de inatención y/o hiperactividad-impulsividad',
    'F50.0': 'Rechazo a mantener el peso corporal igual o por encima del valor mínimo normal'
};