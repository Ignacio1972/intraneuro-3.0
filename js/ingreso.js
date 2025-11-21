// ingreso.js - INTRANEURO Admission Management

// Variable global para el dropdown de diagnóstico
let diagnosisDropdownInstance = null;

// Initialize admission form
document.addEventListener('DOMContentLoaded', () => {
    const admissionForm = document.getElementById('admissionForm');
    if (admissionForm) {
        admissionForm.addEventListener('submit', handleAdmission);
    }

    // Inicializar dropdown de diagnóstico con retry
    initializeDiagnosisDropdown();
});

// Función para inicializar el dropdown con reintentos
function initializeDiagnosisDropdown() {
    const maxAttempts = 10;
    let attempts = 0;

    function tryInit() {
        attempts++;
        console.log(`[ingreso.js] Intento ${attempts} de inicializar dropdown...`);

        const diagnosisContainer = document.getElementById('diagnosis-container');

        if (!diagnosisContainer) {
            console.log('[ingreso.js] Contenedor diagnosis-container no encontrado aún');
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 500);
            }
            return;
        }

        if (!window.DropdownSystem) {
            console.log('[ingreso.js] DropdownSystem no cargado aún');
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 500);
            }
            return;
        }

        // Si el dropdown ya existe, no re-crear
        if (diagnosisContainer.querySelector('.intraneuro-dropdown')) {
            console.log('[ingreso.js] Dropdown ya existe');
            return;
        }

        try {
            diagnosisDropdownInstance = window.DropdownSystem.createDiagnosisDropdown({
                containerId: 'diagnosis-container',
                required: false
            });

            // Hacer la instancia disponible globalmente para debug
            window.diagnosisDropdownInstance = diagnosisDropdownInstance;

            console.log('[ingreso.js] ✅ Dropdown de diagnóstico inicializado correctamente');
        } catch (error) {
            console.error('[ingreso.js] Error creando dropdown:', error);
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 1000);
            }
        }
    }

    tryInit();
}

// MODIFICADA: Handle admission form submission con API
async function handleAdmission(e) {
    e.preventDefault();

    console.log('📝 INICIANDO PROCESO DE INGRESO...');

    // Get form data - SIMPLIFICADO
    console.log('🔍 Verificando dropdown de diagnóstico...');

    const diagnosisValue = diagnosisDropdownInstance ? diagnosisDropdownInstance.getValue() : '';
    console.log('📋 Valor del diagnóstico obtenido:', diagnosisValue);

    // Obtener el valor de la cama del campo de entrada
    const bedInput = document.getElementById('patientBedInput');
    const bedValue = bedInput ? bedInput.value.trim() : '';

    const formData = {
        name: document.getElementById('patientName').value,
        age: parseInt(document.getElementById('patientAge').value) || 1, // Tomar edad del campo o usar 1 por defecto
        rut: document.getElementById('patientRut').value || null, // Sin validación
        prevision: null, // Se agregará desde el modal del paciente
        bed: bedValue || 'n/a', // Usar el valor ingresado o 'n/a' si está vacío
        admissionDate: document.getElementById('admissionDate').value,
        diagnosis: diagnosisValue,
        diagnosisText: diagnosisValue,
        diagnosisDetails: '', // Ya no se usa en el ingreso
        allergies: null,
        admittedBy: 'Sistema', // Se actualizará desde el modal del paciente
        status: 'active'
    };

    console.log('Diagnóstico seleccionado:', diagnosisValue || '(sin diagnóstico)');
    console.log('Cama asignada:', bedValue || 'n/a');

    // Diagnóstico es opcional - se puede asignar después desde el modal del paciente
    // if (!diagnosisValue || diagnosisValue.trim() === '') {
    //     if (typeof showToast === 'function') {
    //         showToast('Por favor seleccione un diagnóstico', 'error');
    //     } else {
    //         alert('Por favor seleccione un diagnóstico');
    //     }
    //     return;
    // }

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
            
            // Show success message
            showAdmissionSuccess(newPatient);

            // Reset form
            e.target.reset();

            // Limpiar dropdown de diagnósticos
            if (diagnosisDropdownInstance && typeof diagnosisDropdownInstance.clear === 'function') {
                diagnosisDropdownInstance.clear();
            }

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

        // Mostrar error al usuario
        if (typeof showToast === 'function') {
            showToast(`Error al crear ingreso: ${error.message}`, 'error');
        } else {
            alert(`Error al crear ingreso: ${error.message}`);
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