// ficha-archivo.js - Lógica para la ficha de paciente archivado
// VERSIÓN 2.0 - Edición Inline (igual que dashboard principal)

let patientId = null;
let patientData = null;
let currentEditingField = null;
let isClickingButton = false; // Flag para evitar interferencia

// Configuración de campos editables
const FIELD_CONFIG = {
    name: {
        label: 'Nombre Completo',
        type: 'text',
        viewId: 'viewName',
        required: true,
        validate: (val) => val && val.trim().length >= 2,
        errorMsg: 'El nombre debe tener al menos 2 caracteres'
    },
    rut: {
        label: 'RUT',
        type: 'text',
        viewId: 'viewRut',
        placeholder: '12345678-9',
        format: (val) => val || 'Sin RUT'
    },
    age: {
        label: 'Edad',
        type: 'number',
        viewId: 'viewAge',
        min: 1,
        max: 120,
        validate: (val) => !val || (val >= 1 && val <= 120),
        errorMsg: 'La edad debe estar entre 1 y 120',
        format: (val) => val ? `${val} años` : '-'
    },
    prevision: {
        label: 'Previsión',
        type: 'dropdown',
        viewId: 'viewPrevision',
        format: (val) => val || 'Sin previsión'
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    patientId = urlParams.get('id');

    if (!patientId || isNaN(patientId)) {
        showToast('ID de paciente no válido', 'error');
        setTimeout(() => window.location.href = 'archivos.html', 2000);
        return;
    }

    loadPatientData();

    // Cerrar edición al hacer click fuera
    document.addEventListener('click', handleClickOutside);

    // Cerrar edición con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentEditingField) {
            cancelCurrentEdit();
        }
    });
});

// ========================================
// CARGA DE DATOS
// ========================================
async function loadPatientData() {
    showLoading(true);

    try {
        const response = await apiRequest(`/patients/${patientId}/history`);

        if (!response) {
            throw new Error('No se recibieron datos del paciente');
        }

        patientData = response;
        displayPatientData();

    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar datos del paciente', 'error');
        setTimeout(() => window.location.href = 'archivos.html', 3000);
    } finally {
        showLoading(false);
    }
}

// ========================================
// MOSTRAR DATOS
// ========================================
function displayPatientData() {
    if (!patientData) return;

    // Header
    document.getElementById('patientNameHeader').textContent = patientData.name || 'Sin nombre';
    document.title = `INTRANEURO - ${patientData.name}`;

    // Datos personales
    updateFieldDisplay('name', patientData.name);
    updateFieldDisplay('rut', patientData.rut);
    updateFieldDisplay('age', patientData.age);
    updateFieldDisplay('prevision', patientData.prevision);

    // Admisiones
    displayAdmissions();
}

function updateFieldDisplay(fieldName, value) {
    const config = FIELD_CONFIG[fieldName];
    if (!config) return;

    const element = document.getElementById(config.viewId);
    if (!element) return;

    const displayValue = config.format ? config.format(value) : (value || '-');
    element.textContent = displayValue;
}

// ========================================
// EDICIÓN INLINE - DATOS PERSONALES
// ========================================
function editField(fieldName) {
    event.stopPropagation();

    // Si ya está editando este campo, no hacer nada
    if (currentEditingField === fieldName) {
        return;
    }

    // Si ya está editando otro campo, cancelar
    if (currentEditingField) {
        cancelCurrentEdit();
    }

    const config = FIELD_CONFIG[fieldName];
    if (!config) return;

    // Para dropdowns (previsión), abrir selector
    if (config.type === 'dropdown') {
        openDropdownSelector(fieldName);
        return;
    }

    const viewElement = document.getElementById(config.viewId);
    if (!viewElement) return; // El elemento no existe (ya está en modo edición)

    const container = viewElement.parentElement;
    const currentValue = patientData[fieldName] || '';

    // Crear input inline
    const inputHtml = createInlineInput(fieldName, config, currentValue);

    // Guardar contenido original
    container.dataset.originalHtml = container.innerHTML;
    container.innerHTML = `
        <label>${config.label}:</label>
        ${inputHtml}
    `;
    container.classList.add('editing');

    // Focus en el input
    const input = container.querySelector('input');
    if (input) {
        input.focus();
        input.select();

        // Solo manejar teclas
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveField(fieldName);
            } else if (e.key === 'Escape') {
                cancelCurrentEdit();
            }
        });
    }

    currentEditingField = fieldName;
}

function createInlineInput(fieldName, config, value) {
    const attrs = [
        `type="${config.type}"`,
        `value="${value}"`,
        `class="inline-edit-input"`,
        `data-field="${fieldName}"`
    ];

    if (config.placeholder) attrs.push(`placeholder="${config.placeholder}"`);
    if (config.min !== undefined) attrs.push(`min="${config.min}"`);
    if (config.max !== undefined) attrs.push(`max="${config.max}"`);

    return `
        <div class="inline-edit-container" onclick="event.stopPropagation()">
            <input ${attrs.join(' ')} onclick="event.stopPropagation()">
            <div class="inline-edit-actions">
                <button type="button" class="btn-inline-save" onclick="event.stopPropagation(); saveField('${fieldName}')" title="Guardar">✓</button>
                <button type="button" class="btn-inline-cancel" onclick="event.stopPropagation(); cancelCurrentEdit()" title="Cancelar">✗</button>
            </div>
        </div>
    `;
}

function handleClickOutside(e) {
    if (!currentEditingField) return;

    const editingContainer = document.querySelector('.data-item.editing');
    if (editingContainer && !editingContainer.contains(e.target)) {
        cancelCurrentEdit();
    }
}

async function saveField(fieldName) {
    const config = FIELD_CONFIG[fieldName];
    const input = document.querySelector(`input[data-field="${fieldName}"]`);

    if (!input) {
        cancelCurrentEdit();
        return;
    }

    let value = input.value.trim();

    // Para números, convertir
    if (config.type === 'number') {
        value = value ? parseInt(value) : null;
    }

    // Validar
    if (config.validate && !config.validate(value)) {
        showToast(config.errorMsg || 'Valor no válido', 'error');
        input.focus();
        return;
    }

    // Guardar
    try {
        const updateData = { [fieldName]: value || null };

        await apiRequest(`/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        // Actualizar datos locales
        patientData[fieldName] = value;

        // Restaurar vista
        restoreFieldView(fieldName);

        // Actualizar header si es el nombre
        if (fieldName === 'name') {
            document.getElementById('patientNameHeader').textContent = value;
        }

        showToast('Guardado', 'success');

    } catch (error) {
        console.error('Error guardando:', error);
        showToast('Error al guardar', 'error');
    }
}

function cancelCurrentEdit() {
    if (!currentEditingField) return;
    restoreFieldView(currentEditingField);
}

function restoreFieldView(fieldName) {
    const config = FIELD_CONFIG[fieldName];

    // Buscar el container - puede ser por el viewId o por la clase editing
    let container = document.getElementById(config.viewId)?.parentElement;

    // Si no lo encontramos por ID (porque está en modo edición), buscar por clase
    if (!container) {
        container = document.querySelector('#patientDataView .data-item.editing');
    }

    if (!container) {
        currentEditingField = null;
        return;
    }

    // Regenerar el contenido con el valor actualizado
    const displayValue = config.format ? config.format(patientData[fieldName]) : (patientData[fieldName] || '-');
    container.innerHTML = `
        <label>${config.label}:</label>
        <span id="${config.viewId}" class="data-value clickable">${displayValue}</span>
    `;
    container.classList.remove('editing');
    delete container.dataset.originalHtml;

    currentEditingField = null;
}

// ========================================
// DROPDOWNS (Previsión)
// ========================================
function openDropdownSelector(fieldName) {
    if (fieldName === 'prevision') {
        DropdownSystem.showPrevisionSelector({
            currentValue: patientData.prevision || '',
            onSelect: async (value) => {
                if (value !== patientData.prevision) {
                    try {
                        await apiRequest(`/patients/${patientId}`, {
                            method: 'PUT',
                            body: JSON.stringify({ prevision: value })
                        });

                        patientData.prevision = value;
                        updateFieldDisplay('prevision', value);
                        showToast('Previsión actualizada', 'success');

                    } catch (error) {
                        console.error('Error:', error);
                        showToast('Error al guardar', 'error');
                    }
                }
            },
            onCancel: () => {}
        });
    }
}

// ========================================
// ADMISIONES - EDICIÓN INLINE
// ========================================
function displayAdmissions() {
    const container = document.getElementById('admissionsList');

    if (!patientData.admissions || patientData.admissions.length === 0) {
        container.innerHTML = '<p class="no-data">No hay admisiones registradas</p>';
        return;
    }

    const sortedAdmissions = [...patientData.admissions].sort((a, b) =>
        new Date(b.admissionDate) - new Date(a.admissionDate)
    );

    let html = '';

    sortedAdmissions.forEach((admission) => {
        html += renderAdmissionCard(admission);
    });

    container.innerHTML = html;
}

function renderAdmissionCard(admission) {
    const admId = admission.admissionId;

    return `
        <div class="admission-inline-content" data-admission-id="${admId}">
            <div class="patient-data-grid">
                <div class="data-item editable-field" onclick="editAdmissionField(${admId}, 'admissionDate')">
                    <label>Fecha Ingreso:</label>
                    <span id="admDate-${admId}" class="data-value clickable">${formatDate(admission.admissionDate)}</span>
                </div>
                <div class="data-item">
                    <label>Fecha Egreso:</label>
                    <span class="data-value">${formatDate(admission.dischargeDate)}</span>
                </div>
                <div class="data-item editable-field" onclick="editAdmissionField(${admId}, 'diagnosis')">
                    <label>Diagnóstico:</label>
                    <span id="admDiag-${admId}" class="data-value clickable">${admission.diagnosis || '-'}</span>
                </div>
                <div class="data-item editable-field" onclick="editAdmissionField(${admId}, 'admittedBy')">
                    <label>Médico Tratante:</label>
                    <span id="admDoctor-${admId}" class="data-value clickable">${admission.admittedBy || '-'}</span>
                </div>
                <div class="data-item editable-field" onclick="editAdmissionField(${admId}, 'bed')">
                    <label>Cama:</label>
                    <span id="admBed-${admId}" class="data-value clickable">${admission.bed || '-'}</span>
                </div>
                ${admission.dischargeDiagnosis ? `
                <div class="data-item">
                    <label>Diagnóstico Egreso:</label>
                    <span class="data-value">${admission.dischargeDiagnosis}</span>
                </div>
                ` : ''}
                ${admission.dischargeDetails ? `
                <div class="data-item full-width">
                    <label>Detalles de Egreso:</label>
                    <span class="data-value">${admission.dischargeDetails}</span>
                </div>
                ` : ''}
            </div>
            <div class="admission-actions-inline">
                <button onclick="loadObservations(${admId})" class="btn btn-small btn-secondary">
                    Ver Observaciones
                </button>
            </div>
        </div>
    `;
}

// Configuración de campos de admisión
const ADMISSION_FIELD_CONFIG = {
    admissionDate: {
        label: 'Fecha de Ingreso',
        type: 'date',
        elementPrefix: 'admDate',
        apiField: 'admission_date'
    },
    diagnosis: {
        label: 'Diagnóstico',
        type: 'dropdown',
        elementPrefix: 'admDiag',
        apiField: 'diagnosis_text'
    },
    admittedBy: {
        label: 'Médico Tratante',
        type: 'text',
        elementPrefix: 'admDoctor',
        apiField: 'admitted_by'
    },
    bed: {
        label: 'Cama',
        type: 'text',
        elementPrefix: 'admBed',
        apiField: 'bed',
        placeholder: 'Ej: 12A'
    }
};

let currentEditingAdmission = null;

function editAdmissionField(admissionId, fieldName) {
    event.stopPropagation();

    // Cancelar edición anterior
    if (currentEditingAdmission) {
        cancelAdmissionEdit();
    }

    const config = ADMISSION_FIELD_CONFIG[fieldName];
    if (!config) return;

    const admission = patientData.admissions.find(a => a.admissionId === admissionId);
    if (!admission) return;

    // Para diagnóstico, abrir selector
    if (config.type === 'dropdown') {
        openAdmissionDiagnosisSelector(admissionId, admission);
        return;
    }

    const elementId = `${config.elementPrefix}-${admissionId}`;
    const element = document.getElementById(elementId);
    if (!element) return;

    const container = element.parentElement;
    let currentValue = admission[fieldName] || '';

    // Para fecha, formatear para input date
    if (config.type === 'date' && currentValue) {
        currentValue = currentValue.split('T')[0];
    }

    // Guardar estado original
    container.dataset.originalHtml = container.innerHTML;
    container.dataset.admissionId = admissionId;
    container.dataset.fieldName = fieldName;

    // Crear input
    const inputType = config.type === 'date' ? 'date' : 'text';
    container.innerHTML = `
        <label>${config.label}:</label>
        <div class="inline-edit-container" onclick="event.stopPropagation()">
            <input type="${inputType}"
                   value="${currentValue}"
                   class="inline-edit-input"
                   data-admission="${admissionId}"
                   data-field="${fieldName}"
                   onclick="event.stopPropagation()"
                   ${config.placeholder ? `placeholder="${config.placeholder}"` : ''}>
            <div class="inline-edit-actions">
                <button type="button" class="btn-inline-save" onclick="event.stopPropagation(); saveAdmissionField(${admissionId}, '${fieldName}')" title="Guardar">✓</button>
                <button type="button" class="btn-inline-cancel" onclick="event.stopPropagation(); cancelAdmissionEdit()" title="Cancelar">✗</button>
            </div>
        </div>
    `;
    container.classList.add('editing');

    const input = container.querySelector('input');
    input.focus();
    if (config.type !== 'date') input.select();

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveAdmissionField(admissionId, fieldName);
        } else if (e.key === 'Escape') {
            cancelAdmissionEdit();
        }
    });

    currentEditingAdmission = { admissionId, fieldName, container };
}

async function saveAdmissionField(admissionId, fieldName) {
    const config = ADMISSION_FIELD_CONFIG[fieldName];
    const input = document.querySelector(`input[data-admission="${admissionId}"][data-field="${fieldName}"]`);

    if (!input) {
        cancelAdmissionEdit();
        return;
    }

    const value = input.value.trim();

    // Validar fecha
    if (config.type === 'date' && !value) {
        showToast('La fecha es obligatoria', 'error');
        input.focus();
        return;
    }

    try {
        const updateData = {
            [config.apiField]: value || null
        };

        // Para diagnóstico, actualizar también el código
        if (fieldName === 'diagnosis') {
            updateData.diagnosis_code = value;
        }

        await apiRequest(`/patients/admission/${admissionId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        // Actualizar datos locales
        const admission = patientData.admissions.find(a => a.admissionId === admissionId);
        if (admission) {
            admission[fieldName] = value;
        }

        // Restaurar vista
        cancelAdmissionEdit();
        displayAdmissions(); // Re-renderizar para mostrar cambios

        showToast('Guardado', 'success');

    } catch (error) {
        console.error('Error guardando admisión:', error);
        showToast('Error al guardar', 'error');
    }
}

function cancelAdmissionEdit() {
    if (!currentEditingAdmission) return;

    const { container } = currentEditingAdmission;

    if (container && container.dataset.originalHtml) {
        container.innerHTML = container.dataset.originalHtml;
        container.classList.remove('editing');
        delete container.dataset.originalHtml;
        delete container.dataset.admissionId;
        delete container.dataset.fieldName;
    }

    currentEditingAdmission = null;
}

function openAdmissionDiagnosisSelector(admissionId, admission) {
    DropdownSystem.showDiagnosisAccordion({
        currentValue: admission.diagnosis || '',
        onSelect: async (value) => {
            if (value !== admission.diagnosis) {
                try {
                    await apiRequest(`/patients/admission/${admissionId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            diagnosis_code: value,
                            diagnosis_text: value
                        })
                    });

                    admission.diagnosis = value;
                    displayAdmissions();
                    showToast('Diagnóstico actualizado', 'success');

                } catch (error) {
                    console.error('Error:', error);
                    showToast('Error al guardar', 'error');
                }
            }
        },
        onCancel: () => {}
    });
}

// ========================================
// OBSERVACIONES
// ========================================
async function loadObservations(admissionId) {
    showLoading(true);

    try {
        const response = await apiRequest(`/patients/admission/${admissionId}/observations`);

        if (response && response.length > 0) {
            displayObservations(admissionId, response);
        } else {
            showToast('No hay observaciones para esta admisión', 'info');
        }

    } catch (error) {
        console.error('Error cargando observaciones:', error);
        showToast('Error al cargar observaciones', 'error');
    } finally {
        showLoading(false);
    }
}

function displayObservations(admissionId, observations) {
    const section = document.getElementById('observationsSection');
    const container = document.getElementById('observationsContainer');

    const admission = patientData.admissions.find(a => a.admissionId === admissionId);

    let html = `
        <div class="observations-header">
            <h4>Observaciones - Admisión del ${formatDate(admission?.admissionDate)}</h4>
            <button onclick="hideObservations()" class="btn btn-small btn-secondary">
                Cerrar
            </button>
        </div>
        <div class="observations-list">
    `;

    observations.forEach(obs => {
        html += `
            <div class="observation-item">
                <div class="observation-meta">
                    <span class="observation-date">${formatDateTime(obs.created_at)}</span>
                    <span class="observation-author">${obs.created_by}</span>
                </div>
                <div class="observation-text">${obs.observation}</div>
            </div>
        `;
    });

    html += '</div>';

    container.innerHTML = html;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
}

function hideObservations() {
    document.getElementById('observationsSection').style.display = 'none';
}

// ========================================
// MODALES: BORRAR Y REINGRESAR
// ========================================
function mostrarModalBorrar() {
    document.getElementById('modalBorrar').style.display = 'flex';
}

function cerrarModalBorrar() {
    document.getElementById('modalBorrar').style.display = 'none';
}

async function confirmarBorrado() {
    showLoading(true);

    try {
        await apiRequest(`/patients/${patientId}`, { method: 'DELETE' });

        showToast('Ficha eliminada correctamente', 'success');
        setTimeout(() => window.location.href = 'archivos.html', 2000);

    } catch (error) {
        console.error('Error borrando paciente:', error);
        showToast('Error al borrar la ficha', 'error');
        showLoading(false);
    }
}

function mostrarModalReingresar() {
    document.getElementById('reingresoNombre').value = patientData.name || '';
    document.getElementById('reingresoRut').value = patientData.rut || '';
    document.getElementById('reingresoEdad').value = patientData.age || '';
    document.getElementById('reingresoDiagnostico').value = '';
    document.getElementById('reingresoDiagnosticoText').textContent = 'Sin seleccionar';
    document.getElementById('modalReingresar').style.display = 'flex';
}

function openReingresoDiagnosisAccordion() {
    const currentValue = document.getElementById('reingresoDiagnostico').value;

    DropdownSystem.showDiagnosisAccordion({
        currentValue: currentValue,
        onSelect: function(value) {
            if (value) {
                document.getElementById('reingresoDiagnostico').value = value;
                document.getElementById('reingresoDiagnosticoText').textContent = value;
            }
        },
        onCancel: () => {}
    });
}

function cerrarModalReingresar() {
    document.getElementById('modalReingresar').style.display = 'none';
}

async function procesarReingreso() {
    const nombre = document.getElementById('reingresoNombre').value.trim();
    const edad = document.getElementById('reingresoEdad').value;
    const diagValue = document.getElementById('reingresoDiagnostico').value;

    if (!nombre) {
        showToast('El nombre es obligatorio', 'error');
        return;
    }

    if (!edad) {
        showToast('La edad es obligatoria', 'error');
        return;
    }

    if (!diagValue) {
        showToast('Debe seleccionar un diagnóstico', 'error');
        return;
    }

    const datos = {
        name: nombre,
        age: parseInt(edad),
        rut: document.getElementById('reingresoRut').value || null,
        admissionDate: new Date().toISOString().split('T')[0],
        diagnosis: diagValue,
        diagnosisText: diagValue,
        bed: document.getElementById('reingresoCama').value || 'Sin asignar',
        admittedBy: sessionStorage.getItem('currentUser') || 'Sistema'
    };

    showLoading(true);

    try {
        await apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(datos)
        });

        showToast('Paciente reingresado correctamente', 'success');
        setTimeout(() => window.location.href = 'index.html', 2000);

    } catch (error) {
        console.error('Error reingresando paciente:', error);
        showToast('Error al reingresar paciente', 'error');
        showLoading(false);
    }
}

// ========================================
// UTILIDADES
// ========================================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Impresión
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.admission-section').forEach(card => {
        card.style.pageBreakInside = 'avoid';
    });
});
