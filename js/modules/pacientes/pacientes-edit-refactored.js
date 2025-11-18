// pacientes-edit-refactored.js - Sistema genérico de edición inline
// Version refactorizada para eliminar duplicación de código
// COMPLETADO: Soporte completo para text, number, date, modal-dropdown
// Fecha última actualización: 14 de Noviembre de 2025

// ==========================================
// CONFIGURACIÓN CENTRALIZADA DE CAMPOS
// ==========================================

const FIELD_CONFIGS = {
    // Campo: Nombre del paciente
    name: {
        label: 'Nombre',
        apiField: 'name',
        inputType: 'text',
        placeholder: 'Ingrese el nuevo nombre (mínimo 3 caracteres)',

        // Validación
        validator: (val) => {
            const trimmed = val?.trim() || '';
            return trimmed.length >= 3;
        },
        validatorMessage: 'El nombre debe tener al menos 3 caracteres',

        // Transformación antes de guardar
        transformer: (val) => val.trim(),

        // Endpoint API - CORREGIDO: usar /patients/:id sin /name
        apiEndpoint: (id) => `/patients/${id}`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ name: value }),

        // Actualización de UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`name-${patientId}`);
            if (el) el.textContent = value;
        },

        // Formateo para mostrar
        formatDisplay: (value) => value || 'Sin nombre',
        formatPrompt: (value) => value || ''
    },

    // Campo: Edad
    age: {
        label: 'Edad',
        apiField: 'age',
        inputType: 'number',
        placeholder: 'Ingrese la nueva edad (1-120)',

        // Validación
        validator: (val) => {
            const num = parseInt(val);
            return !isNaN(num) && num >= 1 && num <= 120;
        },
        validatorMessage: 'La edad debe ser un número entre 1 y 120',

        // Transformación
        transformer: (val) => parseInt(val),

        // API - CORREGIDO: usar /patients/:id
        apiEndpoint: (id) => `/patients/${id}`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ age: value }),

        // UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`age-${patientId}`);
            if (el) el.textContent = `${value} años`;
        },

        // Formateo
        formatDisplay: (value) => value ? `${value} años` : 'Sin edad',
        formatPrompt: (value) => value ? String(value) : ''
    },

    // Campo: Cama
    bed: {
        label: 'Cama',
        apiField: 'bed',
        inputType: 'text',
        placeholder: 'Ingrese el número/código de cama',

        // Sin validación especial (permite vacío)
        validator: () => true,

        // Transformación
        transformer: (val) => val?.trim() || '',

        // API - Este SÍ usa /bed al final según el código original
        apiEndpoint: (id) => `/patients/${id}/bed`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ bed: value || 'Sin asignar' }),

        // UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`bed-${patientId}`);
            if (el) el.textContent = value || 'Sin asignar';
        },

        // Formateo
        formatDisplay: (value) => value || 'Sin asignar',
        formatPrompt: (value) => value || ''
    },

    // Campo: RUT (segundo grupo - fase 2)
    rut: {
        label: 'RUT',
        apiField: 'rut',
        inputType: 'text',
        placeholder: 'Ingrese el RUT (ej: 12345678-9)',

        // Validación con función externa
        validator: (val) => {
            if (!val || val.trim() === '') return true; // RUT opcional
            return typeof validateRut === 'function' ? validateRut(val) : true;
        },
        validatorMessage: 'RUT inválido',

        // Transformación
        transformer: (val) => val?.trim() || '',

        // API - CORREGIDO: usar /patients/:id
        apiEndpoint: (id) => `/patients/${id}`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ rut: value || null }),

        // UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`rut-${patientId}`);
            if (el) el.textContent = value || 'Sin RUT';
        },

        // Formateo
        formatDisplay: (value) => value || 'Sin RUT',
        formatPrompt: (value) => value || ''
    },

    // Campo: Médico tratante (segundo grupo - fase 2)
    admittedBy: {
        label: 'Médico Tratante',
        apiField: 'admittedBy',  // CORREGIDO: usar camelCase para coincidir con objeto patient
        inputType: 'text',
        placeholder: 'Ingrese el nombre del médico tratante',

        validator: () => true,
        transformer: (val) => val?.trim() || '',

        // API
        apiEndpoint: (id) => `/patients/${id}/admission`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ admitted_by: value || null }),  // API usa snake_case

        // UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`admitted-by-${patientId}`);
            if (el) el.textContent = value || 'Sin asignar';
        },

        // Formateo
        formatDisplay: (value) => value || 'Sin asignar',
        formatPrompt: (value) => value || ''
    },

    // Campo: Descripción del diagnóstico (segundo grupo - fase 2)
    diagnosisDetails: {
        label: 'Descripción del Diagnóstico',
        apiField: 'diagnosisDetails',  // CORREGIDO: usar camelCase para coincidir con objeto patient
        inputType: 'text',
        placeholder: 'Ingrese la descripción del diagnóstico',

        validator: () => true,
        transformer: (val) => val?.trim() || '',

        // API
        apiEndpoint: (id) => `/patients/${id}/admission`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ diagnosis_details: value || null }),  // API usa snake_case

        // UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`diagnosis-details-${patientId}`);
            if (el) el.textContent = value || 'Sin descripción';
        },

        // Formateo
        formatDisplay: (value) => value || 'Sin descripción',
        formatPrompt: (value) => value || ''
    },

    // ==========================================
    // CAMPOS COMPLEJOS CON MODAL + DROPDOWN
    // ==========================================

    // Campo: Previsión de Salud (modal-dropdown)
    prevision: {
        label: 'Previsión de Salud',
        apiField: 'prevision',
        inputType: 'modal-dropdown',
        dropdownType: 'prevision', // Para usar DropdownSystem.createPrevisionDropdown()

        validator: () => true,
        transformer: (val) => val?.trim() || '',

        // API
        apiEndpoint: (id) => `/patients/${id}/prevision`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ prevision: value || null }),

        // UI
        updateElement: (patientId, value) => {
            // Actualizar en modal si está abierto
            const modalElement = document.querySelector(`#patientModal .patient-info span[id*="prevision"]`);
            if (modalElement) {
                modalElement.textContent = value || 'No especificada';
            }
            // Actualizar en lista
            const listElement = document.getElementById(`prevision-${patientId}`);
            if (listElement) {
                listElement.textContent = value || 'No especificada';
            }
        },

        // Formateo
        formatDisplay: (value) => value || 'No especificada',
        formatPrompt: (value) => value || ''
    },

    // Campo: Diagnóstico (modal-dropdown)
    diagnosis: {
        label: 'Diagnóstico',
        apiField: 'diagnosis',
        inputType: 'modal-dropdown',
        dropdownType: 'diagnosis', // Para usar DropdownSystem.createDiagnosisDropdown()

        validator: () => true,
        transformer: (val) => val?.trim() || '',

        // API
        apiEndpoint: (id) => `/patients/${id}/admission`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ diagnosis: value || null }),

        // UI - CORREGIDO: Usar getDiagnosisText para consistencia con el renderizado
        updateElement: (patientId, value) => {
            // Obtener el texto del diagnóstico usando el catálogo
            const displayText = (typeof catalogos !== 'undefined' && catalogos.getDiagnosisText)
                ? catalogos.getDiagnosisText(value)
                : value;

            // Actualizar múltiples elementos porque el diagnóstico puede aparecer en varios lugares
            const elements = [
                document.getElementById(`diagnosis-${patientId}`),
                document.getElementById(`diagnosisText-${patientId}`),
                document.querySelector(`#patientModal .patient-info span[id*="diagnosis"]`)
            ];

            elements.forEach(el => {
                if (el) el.textContent = displayText || 'Sin diagnóstico';
            });
        },

        // Formateo
        formatDisplay: (value) => {
            if (!value) return 'Sin diagnóstico';
            // Usar getDiagnosisText si está disponible
            if (typeof catalogos !== 'undefined' && catalogos.getDiagnosisText) {
                return catalogos.getDiagnosisText(value);
            }
            return value;
        },
        formatPrompt: (value) => value || ''
    },

    // ==========================================
    // CAMPOS CON FECHA
    // ==========================================

    // Campo: Fecha de Ingreso
    admissionDate: {
        label: 'Fecha de Ingreso',
        apiField: 'admissionDate',  // CORREGIDO: usar camelCase para coincidir con objeto patient
        inputType: 'date',
        placeholder: 'DD/MM/YYYY',

        // Validación de formato DD/MM/YYYY
        validator: (val) => {
            const regex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!regex.test(val)) return false;

            // Validar que sea fecha válida
            const [day, month, year] = val.split('/').map(Number);
            const date = new Date(year, month - 1, day);

            return date.getDate() === day &&
                   date.getMonth() === month - 1 &&
                   date.getFullYear() === year;
        },
        validatorMessage: 'Fecha inválida. Use formato DD/MM/YYYY',

        // Transformar DD/MM/YYYY a YYYY-MM-DD para la API
        transformer: (val) => {
            const [day, month, year] = val.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        },

        // API
        apiEndpoint: (id) => `/patients/${id}/admission`,
        apiMethod: 'PUT',
        apiPayload: (value) => ({ admission_date: value }),  // API usa snake_case

        // UI
        updateElement: (patientId, value) => {
            const el = document.getElementById(`admission-date-${patientId}`);
            if (el) {
                // Convertir YYYY-MM-DD de vuelta a DD/MM/YYYY para mostrar
                const [year, month, day] = value.split('-');
                el.textContent = `${day}/${month}/${year}`;
            }
        },

        // Formateo para mostrar (YYYY-MM-DD -> DD/MM/YYYY)
        formatDisplay: (value) => {
            if (!value) return 'Sin fecha';
            if (value.includes('/')) return value; // Ya está en formato DD/MM/YYYY
            const [year, month, day] = value.split('-');
            return `${day}/${month}/${year}`;
        },

        // Formateo para el prompt (mostrar en formato DD/MM/YYYY)
        formatPrompt: (value) => {
            if (!value) return '';
            if (value.includes('/')) return value;
            const [year, month, day] = value.split('-');
            return `${day}/${month}/${year}`;
        }
    }
};

// ==========================================
// FUNCIÓN GENÉRICA DE EDICIÓN
// ==========================================

async function editPatientField(event, patientId, fieldName) {
    // Prevenir propagación del evento
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // Obtener configuración del campo
    const config = FIELD_CONFIGS[fieldName];
    if (!config) {
        console.error(`[EditField] Configuración no encontrada para campo: ${fieldName}`);
        showToast(`Error: Campo ${fieldName} no configurado`, 'error');
        return;
    }

    console.log(`[EditField] Editando campo ${fieldName} para paciente ${patientId}`);

    // Verificar disponibilidad de datos
    if (typeof patients === 'undefined' || !Array.isArray(patients)) {
        console.error('[EditField] Variable patients no disponible');
        showToast('Error: Datos no cargados correctamente', 'error');
        return;
    }

    // Buscar paciente
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        console.error(`[EditField] Paciente no encontrado: ${patientId}`);
        showToast('Error: Paciente no encontrado', 'error');
        return;
    }

    try {
        // Obtener valor actual
        const currentValue = patient[config.apiField] || patient[fieldName] || '';
        const displayValue = config.formatDisplay(currentValue);

        console.log(`[EditField] Valor actual de ${fieldName}: ${currentValue}`);

        // Obtener nuevo valor según el tipo de input
        let newValue = null;

        switch (config.inputType) {
            case 'modal-dropdown':
                // Modal con dropdown usando DropdownSystem
                newValue = await showDropdownModal(patient, config, currentValue, displayValue);
                break;

            case 'date':
                // Campos de fecha con validación DD/MM/YYYY
                newValue = await showDateDialog(patient, config, currentValue, displayValue);
                break;

            case 'text':
            case 'number':
            default:
                // Diálogo simple de prompt
                newValue = await showPromptDialog(patient, config, currentValue, displayValue);
        }

        // Si el usuario canceló
        if (newValue === null) {
            console.log('[EditField] Operación cancelada por el usuario');
            return;
        }

        // IMPORTANTE: Validar ANTES de transformar
        // El validador espera el formato original (ej: DD/MM/YYYY)
        // El transformer convierte al formato de la API (ej: YYYY-MM-DD)
        if (config.validator && !config.validator(newValue)) {
            console.log(`[EditField] Validación fallida para: ${newValue}`);
            showToast(config.validatorMessage || `${config.label} inválido`, 'error');
            return;
        }

        // Transformar valor después de validar
        if (config.transformer) {
            newValue = config.transformer(newValue);
            console.log(`[EditField] Valor transformado: ${newValue}`);
        }

        // Verificar si hay cambios reales
        if (newValue === currentValue || (newValue === '' && !currentValue)) {
            console.log('[EditField] Sin cambios detectados');
            showToast(`Sin cambios en ${config.label.toLowerCase()}`, 'info');
            return;
        }

        console.log(`[EditField] Enviando actualización a API: ${newValue}`);

        // Preparar y realizar llamada a API
        const endpoint = typeof config.apiEndpoint === 'function'
            ? config.apiEndpoint(patientId)
            : config.apiEndpoint;

        const payload = config.apiPayload
            ? config.apiPayload(newValue)
            : { [config.apiField || fieldName]: newValue };

        // Usar la función global apiRequest si está disponible
        const response = await (
            typeof apiRequest !== 'undefined'
                ? apiRequest(endpoint, {
                    method: config.apiMethod || 'PUT',
                    body: JSON.stringify(payload)
                })
                : PacientesAPI.updateFieldAPI(patientId, fieldName, newValue)
        );

        if (response.success) {
            console.log(`[EditField] Actualización exitosa`);

            // Actualizar datos locales PRIMERO
            patient[config.apiField || fieldName] = newValue;

            // Actualizar elemento UI inmediatamente (sin esperar re-render)
            if (config.updateElement) {
                config.updateElement(patientId, newValue);
            }

            // Forzar actualización del objeto patient en el array global
            if (typeof patients !== 'undefined' && Array.isArray(patients)) {
                const index = patients.findIndex(p => p.id === patientId);
                if (index !== -1) {
                    patients[index][config.apiField || fieldName] = newValue;
                    console.log(`[EditField] Actualizado objeto en array patients[${index}]`);
                }
            }

            // CRÍTICO: Re-renderizar SIN recargar desde API para mantener el cambio local
            // skipAPILoad = true evita que se sobrescriban los datos recién actualizados
            if (typeof renderPatients === 'function') {
                renderPatients(true); // true = skipAPILoad
            }

            showToast(`${config.label} actualizado correctamente`);
        } else {
            throw new Error(response.error || 'Error en la respuesta del servidor');
        }

    } catch (error) {
        console.error(`[EditField] Error actualizando ${fieldName}:`, error);
        showToast(`Error al actualizar ${config.label}`, 'error');
    }
}

// ==========================================
// HELPERS PARA DIÁLOGOS
// ==========================================

// Helper para diálogos simples con prompt
async function showPromptDialog(patient, config, currentValue, displayValue) {
    const message = `Editar ${config.label}:\n\n` +
                   `${config.label} actual: ${displayValue}\n\n` +
                   `${config.placeholder || 'Ingrese el nuevo valor'}:`;

    const promptValue = config.formatPrompt ? config.formatPrompt(currentValue) : currentValue;

    return prompt(message, promptValue);
}

// Helper para modales con dropdown (usando DropdownSystem)
async function showDropdownModal(patient, config, currentValue, displayValue) {
    return new Promise((resolve) => {
        const modalId = `edit-${config.apiField}-modal`;

        // Remover modal existente si hay uno
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        // Crear modal
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal active';
        modal.style.zIndex = '10000';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                    Editar ${config.label}
                </h3>
                <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 14px;">
                    ${config.label} actual: <strong>${displayValue}</strong>
                </p>
                <div id="${modalId}-dropdown-container" style="margin-bottom: 1.5rem;">
                    <!-- El dropdown se insertará aquí -->
                </div>
                <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" id="${modalId}-cancel-btn">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" id="${modalId}-save-btn">
                        Guardar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Crear dropdown usando DropdownSystem
        let dropdownInstance = null;

        if (window.DropdownSystem) {
            const containerId = `${modalId}-dropdown-container`;

            // Usar el tipo de dropdown apropiado
            if (config.dropdownType === 'diagnosis') {
                dropdownInstance = window.DropdownSystem.createDiagnosisDropdown({
                    containerId: containerId,
                    required: false
                });
            } else if (config.dropdownType === 'prevision') {
                dropdownInstance = window.DropdownSystem.createPrevisionDropdown({
                    containerId: containerId,
                    required: false
                });
            } else {
                console.error('[DropdownModal] Tipo de dropdown desconocido:', config.dropdownType);
            }

            // Establecer valor actual si existe
            if (dropdownInstance && currentValue) {
                setTimeout(() => {
                    dropdownInstance.setValue(currentValue);
                }, 100);
            }
        } else {
            console.error('[DropdownModal] DropdownSystem no disponible');
            modal.remove();
            resolve(null);
            return;
        }

        // Event listener para cancelar
        document.getElementById(`${modalId}-cancel-btn`).addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });

        // Event listener para guardar
        document.getElementById(`${modalId}-save-btn`).addEventListener('click', () => {
            const newValue = dropdownInstance ? dropdownInstance.getValue() : '';
            modal.remove();
            resolve(newValue);
        });

        // Permitir cerrar con ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
                resolve(null);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// Helper para selector de fechas (calendario nativo)
async function showDateDialog(patient, config, currentValue, displayValue) {
    return new Promise((resolve) => {
        const modalId = `edit-${config.apiField}-modal`;

        // Remover modal existente si hay uno
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        // Convertir valor actual a formato YYYY-MM-DD
        let dateValue = '';
        if (currentValue) {
            if (currentValue.includes('-')) {
                dateValue = currentValue;
            } else if (currentValue.includes('/')) {
                const [day, month, year] = currentValue.split('/');
                dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        // Crear modal
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal active';
        modal.style.zIndex = '10000';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                    📅 ${config.label}
                </h3>
                <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 13px;">
                    Actual: <strong>${displayValue}</strong>
                </p>
                <div style="margin-bottom: 1.5rem;">
                    <input
                        type="date"
                        id="${modalId}-date-input"
                        value="${dateValue}"
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 15px; font-family: inherit;"
                    />
                </div>
                <div class="form-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" id="${modalId}-cancel-btn">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" id="${modalId}-save-btn">
                        Guardar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const dateInput = document.getElementById(`${modalId}-date-input`);

        // Event listener para cancelar
        document.getElementById(`${modalId}-cancel-btn`).addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });

        // Event listener para guardar
        document.getElementById(`${modalId}-save-btn`).addEventListener('click', () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                alert('Por favor seleccione una fecha');
                return;
            }

            // Convertir YYYY-MM-DD a DD/MM/YYYY
            const [year, month, day] = selectedDate.split('-');
            const formattedDate = `${day}/${month}/${year}`;

            modal.remove();
            resolve(formattedDate);
        });

        // Permitir cerrar con ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
                resolve(null);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus en el input
        setTimeout(() => dateInput.focus(), 100);
    });
}

// ==========================================
// FUNCIONES WRAPPER PARA COMPATIBILIDAD
// ==========================================

// Estas funciones mantienen la compatibilidad con el código existente
// mientras migramos gradualmente al nuevo sistema

// Wrapper para editar nombre
async function editPatientNameRefactored(event, patientId) {
    return editPatientField(event, patientId, 'name');
}

// Wrapper para editar edad
async function editPatientAgeRefactored(event, patientId) {
    return editPatientField(event, patientId, 'age');
}

// Wrapper para editar cama
async function editPatientBedRefactored(event, patientId) {
    return editPatientField(event, patientId, 'bed');
}

// Wrappers fase 2
async function editPatientRutRefactored(event, patientId) {
    return editPatientField(event, patientId, 'rut');
}

async function editAdmittedByRefactored(event, patientId) {
    return editPatientField(event, patientId, 'admittedBy');
}

async function editDiagnosisDetailsRefactored(event, patientId) {
    return editPatientField(event, patientId, 'diagnosisDetails');
}

// ==========================================
// WRAPPERS PARA CAMPOS NUEVOS (REEMPLAZAN SISTEMA ORIGINAL)
// ==========================================

// Wrapper para Previsión - REEMPLAZA editPatientPrevision() y fix-prevision-edit.js
async function editPatientPrevision(event, patientId) {
    return editPatientField(event, patientId, 'prevision');
}

// Wrapper para Diagnóstico - REEMPLAZA editDiagnosis() y editPatientDiagnosis()
async function editDiagnosis(event, patientId) {
    return editPatientField(event, patientId, 'diagnosis');
}

async function editPatientDiagnosis(event, patientId) {
    return editPatientField(event, patientId, 'diagnosis');
}

// Wrapper para Fecha de Ingreso - REEMPLAZA editAdmissionDate()
async function editAdmissionDate(event, patientId) {
    return editPatientField(event, patientId, 'admissionDate');
}

// Wrapper para Descripción del Diagnóstico - REEMPLAZA editDiagnosisDetails()
async function editDiagnosisDetails(event, patientId) {
    return editPatientField(event, patientId, 'diagnosisDetails');
}

// ==========================================
// API HELPERS (si PacientesAPI no está disponible)
// ==========================================

// Fallback para cuando PacientesAPI no esté disponible
const PacientesAPIFallback = {
    async updateFieldAPI(patientId, fieldName, value) {
        const config = FIELD_CONFIGS[fieldName];
        if (!config) {
            throw new Error(`Campo no configurado: ${fieldName}`);
        }

        const endpoint = typeof config.apiEndpoint === 'function'
            ? config.apiEndpoint(patientId)
            : config.apiEndpoint;

        return apiRequest(endpoint, {
            method: config.apiMethod || 'PUT',
            body: JSON.stringify(config.apiPayload(value))
        });
    }
};

// ==========================================
// EXPORTACIÓN Y REGISTRO GLOBAL
// ==========================================

// Hacer funciones disponibles globalmente para onclick
if (typeof window !== 'undefined') {
    // Sistema refactorizado
    window.editPatientField = editPatientField;

    // Wrappers para compatibilidad
    window.editPatientNameRefactored = editPatientNameRefactored;
    window.editPatientAgeRefactored = editPatientAgeRefactored;
    window.editPatientBedRefactored = editPatientBedRefactored;
    window.editPatientRutRefactored = editPatientRutRefactored;
    window.editAdmittedByRefactored = editAdmittedByRefactored;
    window.editDiagnosisDetailsRefactored = editDiagnosisDetailsRefactored;

    // IMPORTANTE: Sobrescribir funciones del sistema original con versiones refactorizadas
    // Esto reemplaza las funciones de pacientes-edit.js sin necesidad de comentarlas
    window.editPatientPrevision = editPatientPrevision;
    window.editDiagnosis = editDiagnosis;
    window.editPatientDiagnosis = editPatientDiagnosis;
    window.editAdmissionDate = editAdmissionDate;
    window.editDiagnosisDetails = editDiagnosisDetails;  // REFACTOR #3: Agregado para compatibilidad

    console.log('[PacientesEditRefactored] ✅ Funciones del sistema original sobrescritas con versiones refactorizadas');
    console.log('[PacientesEditRefactored] - editPatientPrevision (reemplaza fix-prevision-edit.js)');
    console.log('[PacientesEditRefactored] - editDiagnosis / editPatientDiagnosis');
    console.log('[PacientesEditRefactored] - editAdmissionDate');
    console.log('[PacientesEditRefactored] - editDiagnosisDetails (REFACTOR #3)');
}

// Exportar módulo
const PacientesEditRefactored = {
    // Sistema principal
    FIELD_CONFIGS,
    editPatientField,

    // Helpers
    showPromptDialog,
    showDropdownModal,
    showDateDialog,

    // Wrappers de compatibilidad (versión _Refactored)
    editPatientNameRefactored,
    editPatientAgeRefactored,
    editPatientBedRefactored,
    editPatientRutRefactored,
    editAdmittedByRefactored,
    editDiagnosisDetailsRefactored,

    // Funciones que reemplazan el sistema original
    editPatientPrevision,
    editDiagnosis,
    editPatientDiagnosis,
    editAdmissionDate,
    editDiagnosisDetails  // REFACTOR #3: Agregado
};

// Hacer el módulo globalmente accesible
if (typeof window !== 'undefined') {
    window.PacientesEditRefactored = PacientesEditRefactored;
}

// Log de inicialización
console.log('[PacientesEditRefactored] ✅ Módulo cargado con configuración para', Object.keys(FIELD_CONFIGS).length, 'campos');
console.log('[PacientesEditRefactored] 📋 Campos disponibles:', Object.keys(FIELD_CONFIGS).join(', '));
console.log('[PacientesEditRefactored] 🔧 Sistema completo refactorizado - Soporta: text, number, date, modal-dropdown');