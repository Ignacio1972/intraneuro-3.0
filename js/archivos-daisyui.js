// archivos-daisyui.js - Gestión de pacientes archivados con DaisyUI
let archivedPatients = [];
let currentFilter = {
    search: '',
    date: null
};
let currentPatientData = null;

// Variables de paginación
let currentPageSize = 25;
let currentPage = 1;

// Variables de ordenamiento
let currentArchiveSortColumn = null;
let archiveSortDirection = 'asc';

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const currentUser = sessionStorage.getItem('currentUser');

    if (!token || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Mostrar usuario actual
    document.getElementById('currentUser').textContent = `👤 ${currentUser}`;

    // Cargar pacientes archivados
    loadArchivedPatients();

    // Event listeners
    document.getElementById('searchArchivos').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchArchivos();
    });
});

// ========================================
// CARGA DE DATOS
// ========================================
async function loadArchivedPatients() {
    try {
        console.log('[Archivos] Cargando pacientes archivados...');
        const response = await apiRequest('/patients/archived');
        console.log('[Archivos] Total de pacientes archivados:', response.length);

        archivedPatients = response;
        populateDoctorFilter();
        renderArchivedPatients();
    } catch (error) {
        console.error('[Archivos] Error cargando archivos:', error);
        showToast('Error al cargar pacientes archivados', 'error');

        // Mostrar estado de error
        document.getElementById('archivosContainer').innerHTML = `
            <div class="alert alert-error m-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error al cargar los datos. Por favor, recarga la página.</span>
            </div>
        `;
    }
}

// ========================================
// FILTRO DE MÉDICOS
// ========================================
function populateDoctorFilter() {
    const select = document.getElementById('filterDoctor');
    if (!select) return;

    const doctorMap = new Map();

    archivedPatients.forEach(patient => {
        if (patient.admissions && patient.admissions.length > 0) {
            patient.admissions.forEach(admission => {
                const doctor = admission.admittedBy || admission.admitted_by;
                if (doctor && doctor !== 'Sin asignar') {
                    const normalized = normalizeName(doctor);
                    if (!doctorMap.has(normalized)) {
                        doctorMap.set(normalized, []);
                    }
                    if (!doctorMap.get(normalized).includes(doctor)) {
                        doctorMap.get(normalized).push(doctor);
                    }
                }
            });
        }
    });

    const currentValue = select.value;
    select.innerHTML = '<option value="">🔍 Todos los médicos</option>';

    const sortedDoctors = Array.from(doctorMap.keys()).sort();

    sortedDoctors.forEach(normalizedName => {
        const originalNames = doctorMap.get(normalizedName);
        const option = document.createElement('option');
        option.value = normalizedName;
        option.textContent = normalizedName;
        option.setAttribute('data-variations', JSON.stringify(originalNames));
        select.appendChild(option);
    });

    select.value = currentValue;
}

// ========================================
// RENDERIZADO DE TABLA
// ========================================
function renderArchivedPatients(patientsToRender = archivedPatients) {
    const container = document.getElementById('archivosContainer');

    if (!patientsToRender || patientsToRender.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info m-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>No se encontraron pacientes archivados</span>
            </div>
        `;
        return;
    }

    // Aplicar paginación
    let paginatedPatients;
    if (currentPageSize === 'all') {
        paginatedPatients = patientsToRender;
    } else {
        const startIndex = (currentPage - 1) * currentPageSize;
        const endIndex = startIndex + currentPageSize;
        paginatedPatients = patientsToRender.slice(startIndex, endIndex);
    }

    // Crear tabla con DaisyUI
    let html = `
        <table class="table table-zebra table-pin-rows">
            <thead>
                <tr>
                    <th class="cursor-pointer hover:bg-base-300" onclick="sortArchivedByColumn('name')">
                        Nombre <span id="sort-name" class="text-xs ml-1"></span>
                    </th>
                    <th>RUT</th>
                    <th>Edad</th>
                    <th class="cursor-pointer hover:bg-base-300" onclick="sortArchivedByColumn('admission')">
                        F. Ingreso <span id="sort-admission" class="text-xs ml-1"></span>
                    </th>
                    <th class="cursor-pointer hover:bg-base-300" onclick="sortArchivedByColumn('discharge')">
                        F. Alta <span id="sort-discharge" class="text-xs ml-1"></span>
                    </th>
                    <th>Diagnóstico</th>
                    <th class="cursor-pointer hover:bg-base-300" onclick="sortArchivedByColumn('doctor')">
                        Médico <span id="sort-doctor" class="text-xs ml-1"></span>
                    </th>
                    <th class="cursor-pointer hover:bg-base-300" onclick="sortArchivedByColumn('days')">
                        Días <span id="sort-days" class="text-xs ml-1"></span>
                    </th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    paginatedPatients.forEach(patient => {
        const lastAdmission = patient.admissions[0];

        if (!lastAdmission) {
            console.error('[Archivos] Paciente sin admisiones:', patient);
            return;
        }

        const days = calculateDaysBetween(lastAdmission.admissionDate, lastAdmission.dischargeDate);
        const doctorName = normalizeName(lastAdmission.admittedBy || lastAdmission.admitted_by) || 'Sin asignar';

        html += `
            <tr class="hover">
                <td class="font-medium">${patient.name}</td>
                <td><span class="badge badge-ghost">${patient.rut || 'Sin RUT'}</span></td>
                <td>${patient.age}</td>
                <td>${formatDate(lastAdmission.admissionDate)}</td>
                <td>${formatDate(lastAdmission.dischargeDate)}</td>
                <td class="max-w-xs truncate" title="${lastAdmission.diagnosisText || ''}">${lastAdmission.diagnosisText || '-'}</td>
                <td>${doctorName}</td>
                <td><span class="badge badge-primary">${days}</span></td>
                <td>
                    <a href="ficha-archivo.html?id=${patient.id}" class="btn btn-primary btn-sm">
                        Ver Ficha
                    </a>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Actualizar controles de paginación
    updatePaginationControls(patientsToRender.length, paginatedPatients.length);

    // Restaurar indicadores de ordenamiento
    if (currentArchiveSortColumn) {
        updateArchiveSortIndicators(currentArchiveSortColumn);
    }
}

// ========================================
// BÚSQUEDA Y FILTROS
// ========================================
function searchArchivos() {
    const searchTerm = document.getElementById('searchArchivos').value.toLowerCase();
    const select = document.getElementById('filterDoctor');
    const doctorFilter = select.value;
    const dateFilter = document.getElementById('filterDate').value;

    currentPage = 1;

    let filtered = archivedPatients;

    // Filtrar por búsqueda de texto
    if (searchTerm) {
        filtered = filtered.filter(patient =>
            patient.name.toLowerCase().includes(searchTerm) ||
            (patient.rut && patient.rut.includes(searchTerm))
        );
    }

    // Filtrar por médico tratante
    if (doctorFilter) {
        const selectedOption = select.options[select.selectedIndex];
        const variations = selectedOption.getAttribute('data-variations');
        const doctorVariations = variations ? JSON.parse(variations) : [doctorFilter];

        filtered = filtered.filter(patient => {
            return patient.admissions && patient.admissions.some(admission => {
                const doctor = admission.admittedBy || admission.admitted_by;
                return doctorVariations.includes(doctor);
            });
        });
    }

    // Filtrar por fecha
    if (dateFilter) {
        filtered = filtered.filter(patient => {
            const lastAdmission = patient.admissions[0];
            return lastAdmission.dischargeDate === dateFilter;
        });
    }

    renderArchivedPatients(filtered);
}

// ========================================
// MODAL DE PACIENTE
// ========================================
async function viewArchivedPatient(patientId) {
    try {
        const response = await apiRequest(`/patients/${patientId}/history`);
        showArchivedPatientModal(response);
    } catch (error) {
        console.error('Error cargando historial:', error);

        const patient = archivedPatients.find(p => p.id === patientId);
        if (patient) {
            showArchivedPatientModal(patient);
        } else {
            showToast('Error al cargar la información del paciente', 'error');
        }
    }
}

function showArchivedPatientModal(patientData) {
    if (!patientData) {
        console.error('No se recibieron datos del paciente');
        return;
    }

    currentPatientData = patientData;

    // Llenar datos personales
    const modalPatientName = document.getElementById('modalPatientName');
    const modalName = document.getElementById('modalName');
    const modalRut = document.getElementById('modalRut');
    const modalAge = document.getElementById('modalAge');
    const modalPhone = document.getElementById('modalPhone');

    if (modalPatientName) modalPatientName.textContent = patientData.name;
    if (modalName) modalName.textContent = patientData.name;
    if (modalRut) modalRut.textContent = patientData.rut || 'Sin RUT';
    if (modalAge) modalAge.textContent = patientData.age + ' años';
    if (modalPhone) modalPhone.textContent = patientData.phone || 'Sin teléfono';

    // Mostrar historial de admisiones
    if (patientData.admissions) {
        renderAdmissionsHistory(patientData.admissions);
    }

    // Resetear tabs
    showTab('datos');

    // Mostrar modal (DaisyUI dialog)
    const modal = document.getElementById('archivedPatientModal');
    if (modal) {
        modal.showModal();
    }
}

function renderAdmissionsHistory(admissions) {
    const container = document.getElementById('admissionsHistory');

    if (!admissions || admissions.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <span>No hay admisiones registradas</span>
            </div>
        `;
        return;
    }

    let html = '';

    admissions.forEach((admission, index) => {
        const days = calculateDaysBetween(admission.admissionDate, admission.dischargeDate);

        html += `
            <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                    <div class="flex justify-between items-start">
                        <h4 class="card-title text-base">
                            <span class="badge badge-primary">Admisión #${admissions.length - index}</span>
                        </h4>
                        <span class="text-sm text-base-content/60">
                            ${formatDate(admission.admissionDate)} → ${formatDate(admission.dischargeDate)}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                        <p><strong>Diagnóstico:</strong> ${admission.diagnosisText} (${admission.diagnosis})</p>
                        <p><strong>Días hospitalizado:</strong> <span class="badge badge-outline">${days}</span></p>
                        <p><strong>Detalles:</strong> ${admission.diagnosisDetails || 'Sin detalles'}</p>
                        <p><strong>Escala Rankin:</strong> ${admission.ranking || 'No especificado'}</p>
                        <p><strong>Dado de alta por:</strong> ${admission.dischargedBy || '-'}</p>
                        ${admission.allergies ? `<p><strong>Alergias:</strong> <span class="badge badge-error badge-outline">${admission.allergies}</span></p>` : ''}
                    </div>

                    <div class="card-actions justify-end mt-2">
                        <button onclick="loadObservations(${admission.admissionId})" class="btn btn-sm btn-primary">
                            📝 Ver Observaciones
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function loadObservations(admissionId) {
    try {
        showTab('observaciones');

        const container = document.getElementById('observationsHistory');
        container.innerHTML = `
            <div class="flex justify-center py-4">
                <span class="loading loading-spinner loading-md"></span>
                <span class="ml-2">Cargando observaciones...</span>
            </div>
        `;

        const response = await apiRequest(`/patients/admission/${admissionId}/observations`);

        if (!response || response.length === 0) {
            container.innerHTML = `
                <div class="alert">
                    <span>No hay observaciones para esta admisión</span>
                </div>
            `;
            return;
        }

        let html = '';
        response.forEach(obs => {
            html += `
                <div class="chat chat-start">
                    <div class="chat-header">
                        ${obs.created_by}
                        <time class="text-xs opacity-50 ml-2">${formatDateTime(obs.created_at)}</time>
                    </div>
                    <div class="chat-bubble chat-bubble-primary">${obs.observation}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando observaciones:', error);
        document.getElementById('observationsHistory').innerHTML = `
            <div class="alert alert-warning">
                <span>No hay observaciones disponibles para esta admisión</span>
            </div>
        `;
    }
}

function showTab(tabName, clickedTab = null) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remover clase activa de todos los tabs
    document.querySelectorAll('[role="tab"]').forEach(btn => {
        btn.classList.remove('tab-active');
    });

    // Mostrar tab seleccionado
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // Marcar el tab activo
    if (clickedTab) {
        clickedTab.classList.add('tab-active');
    } else {
        // Buscar el tab correcto basado en el nombre
        document.querySelectorAll('[role="tab"]').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName.substring(0, 4))) {
                btn.classList.add('tab-active');
            }
        });
    }
}

function closeArchivedModal() {
    const modal = document.getElementById('archivedPatientModal');
    if (modal) {
        modal.close();
    }
    currentPatientData = null;
}

// ========================================
// EDICIÓN DE PACIENTE
// ========================================
function editPatientData() {
    document.getElementById('modalName').innerHTML =
        `<input type="text" id="editName" value="${currentPatientData.name}" class="input input-bordered input-sm w-full">`;

    document.getElementById('modalRut').innerHTML =
        `<input type="text" id="editRut" value="${currentPatientData.rut || ''}" class="input input-bordered input-sm w-full">`;

    document.getElementById('modalAge').innerHTML =
        `<input type="number" id="editAge" value="${currentPatientData.age}" class="input input-bordered input-sm w-full" min="1" max="150">`;

    document.getElementById('modalPhone').innerHTML =
        `<input type="text" id="editPhone" value="${currentPatientData.phone || ''}" class="input input-bordered input-sm w-full">`;

    // Cambiar botones del footer
    const modalAction = document.querySelector('.modal-action');
    modalAction.innerHTML = `
        <button onclick="savePatientData()" class="btn btn-secondary">
            ✓ Guardar
        </button>
        <button onclick="cancelEdit()" class="btn btn-ghost">
            Cancelar
        </button>
    `;
}

async function savePatientData() {
    const updatedData = {
        name: document.getElementById('editName').value,
        rut: document.getElementById('editRut').value,
        age: parseInt(document.getElementById('editAge').value),
        phone: document.getElementById('editPhone').value
    };

    try {
        await apiRequest(`/patients/${currentPatientData.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        currentPatientData = { ...currentPatientData, ...updatedData };

        const patientIndex = archivedPatients.findIndex(p => p.id === currentPatientData.id);
        if (patientIndex !== -1) {
            archivedPatients[patientIndex] = { ...archivedPatients[patientIndex], ...updatedData };
        }

        showToast('Datos actualizados correctamente', 'success');
        showArchivedPatientModal(currentPatientData);
        renderArchivedPatients();

    } catch (error) {
        console.error('Error actualizando paciente:', error);
        showToast('Error al actualizar los datos', 'error');
    }
}

function cancelEdit() {
    showArchivedPatientModal(currentPatientData);
}

// ========================================
// EXPORTAR A EXCEL
// ========================================
function exportToExcel() {
    if (!archivedPatients || archivedPatients.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();

        const excelData = [
            ['LISTADO DE PACIENTES ARCHIVADOS - INTRANEURO'],
            ['Fecha de generación:', new Date().toLocaleString('es-CL')],
            [''],
            ['Nombre', 'RUT', 'Edad', 'Fecha Ingreso', 'Fecha Egreso', 'Días Hospitalizado', 'Diagnóstico Ingreso', 'Diagnóstico Egreso', 'Médico Tratante', 'Ranking', 'Médico de Alta']
        ];

        archivedPatients.forEach(patient => {
            const lastAdmission = patient.admissions && patient.admissions.length > 0
                ? patient.admissions[patient.admissions.length - 1]
                : {};

            const days = lastAdmission.admissionDate && lastAdmission.dischargeDate
                ? calculateDaysBetween(lastAdmission.admissionDate, lastAdmission.dischargeDate)
                : 0;

            excelData.push([
                patient.name || '-',
                patient.rut || 'Sin RUT',
                patient.age || '-',
                formatDate(lastAdmission.admissionDate) || '-',
                formatDate(lastAdmission.dischargeDate) || '-',
                days,
                `${lastAdmission.diagnosis || ''} - ${lastAdmission.diagnosisText || ''}`,
                lastAdmission.dischargeDiagnosis || '-',
                normalizeName(lastAdmission.admittedBy || lastAdmission.admitted_by) || 'Sin asignar',
                lastAdmission.ranking !== undefined ? `${lastAdmission.ranking} - ${getRankinDescription(lastAdmission.ranking)}` : '-',
                lastAdmission.dischargedBy || '-'
            ]);
        });

        excelData.push([]);
        excelData.push(['RESUMEN']);
        excelData.push(['Total de pacientes archivados:', archivedPatients.length]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);

        ws['!cols'] = [
            { wch: 30 }, { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
            { wch: 10 }, { wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 25 }
        ];

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Pacientes Archivados');

        const fileName = `pacientes_archivados_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showToast('Excel exportado correctamente', 'success');

    } catch (error) {
        console.error('Error exportando Excel:', error);
        showToast('Error al exportar Excel', 'error');
    }
}

// ========================================
// PAGINACIÓN
// ========================================
function changePageSize() {
    const select = document.getElementById('pageSizeSelector');
    if (!select) return;

    const value = select.value;
    currentPageSize = value === 'all' ? 'all' : parseInt(value);
    currentPage = 1;
    renderArchivedPatients();
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderArchivedPatients();
        document.getElementById('archivosContainer').scrollIntoView({ behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = calculateTotalPages(archivedPatients.length);
    if (currentPage < totalPages) {
        currentPage++;
        renderArchivedPatients();
        document.getElementById('archivosContainer').scrollIntoView({ behavior: 'smooth' });
    }
}

function calculateTotalPages(totalItems) {
    if (currentPageSize === 'all') return 1;
    return Math.ceil(totalItems / currentPageSize);
}

function updatePaginationControls(totalItems, displayedItems) {
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        if (currentPageSize === 'all') {
            paginationInfo.textContent = `Mostrando todos los ${totalItems} pacientes`;
        } else {
            const startIndex = (currentPage - 1) * currentPageSize + 1;
            const endIndex = Math.min(startIndex + displayedItems - 1, totalItems);
            paginationInfo.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} pacientes`;
        }
    }

    const pageIndicator = document.getElementById('pageIndicator');
    if (pageIndicator) {
        const totalPages = calculateTotalPages(totalItems);
        pageIndicator.textContent = currentPageSize === 'all' ? 'Todos' : `Página ${currentPage} de ${totalPages}`;
    }

    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1 || currentPageSize === 'all';
        prevBtn.classList.toggle('btn-disabled', prevBtn.disabled);
    }

    if (nextBtn) {
        const totalPages = calculateTotalPages(totalItems);
        nextBtn.disabled = currentPage >= totalPages || currentPageSize === 'all';
        nextBtn.classList.toggle('btn-disabled', nextBtn.disabled);
    }
}

// ========================================
// ORDENAMIENTO
// ========================================
function sortArchivedByColumn(column) {
    if (currentArchiveSortColumn === column) {
        archiveSortDirection = archiveSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentArchiveSortColumn = column;
        archiveSortDirection = 'asc';
    }

    const sortedPatients = [...archivedPatients].sort((a, b) => {
        let valueA, valueB;

        const admissionA = a.admissions[0];
        const admissionB = b.admissions[0];

        switch(column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'admission':
                valueA = new Date(admissionA.admissionDate);
                valueB = new Date(admissionB.admissionDate);
                break;
            case 'discharge':
                valueA = new Date(admissionA.dischargeDate);
                valueB = new Date(admissionB.dischargeDate);
                break;
            case 'doctor':
                valueA = (admissionA.admittedBy || admissionA.admitted_by || 'Sin asignar').toLowerCase();
                valueB = (admissionB.admittedBy || admissionB.admitted_by || 'Sin asignar').toLowerCase();
                break;
            case 'days':
                valueA = calculateDaysBetween(admissionA.admissionDate, admissionA.dischargeDate);
                valueB = calculateDaysBetween(admissionB.admissionDate, admissionB.dischargeDate);
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return archiveSortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return archiveSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderArchivedPatients(sortedPatients);
}

function updateArchiveSortIndicators(column) {
    ['name', 'admission', 'discharge', 'doctor', 'days'].forEach(col => {
        const indicator = document.getElementById(`sort-${col}`);
        if (indicator) {
            indicator.textContent = '';
        }
    });

    const currentIndicator = document.getElementById(`sort-${column}`);
    if (currentIndicator) {
        currentIndicator.textContent = archiveSortDirection === 'asc' ? '▲' : '▼';
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function normalizeName(name) {
    if (!name) return '';

    let normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();

    normalized = normalized.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');

    return normalized
        .replace(/\bDe\b/g, 'de')
        .replace(/\bDel\b/g, 'del')
        .replace(/\bLa\b/g, 'la')
        .replace(/\bLos\b/g, 'los')
        .replace(/\bLas\b/g, 'las');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL');
}

function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

function getRankinDescription(ranking) {
    const descriptions = [
        'Sin síntomas',
        'Sin incapacidad importante',
        'Incapacidad leve',
        'Incapacidad moderada',
        'Incapacidad moderadamente grave',
        'Incapacidad grave',
        'Muerte'
    ];
    return descriptions[ranking] || 'Sin evaluar';
}

// ========================================
// TOAST NOTIFICATIONS (DaisyUI)
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    const toast = document.createElement('div');
    toast.className = `alert ${alertClass} shadow-lg`;
    toast.innerHTML = `
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
