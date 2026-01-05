// archivos.js - Gestión de pacientes archivados (diseño dashboard)
// Adaptado para coincidir con el estilo visual del sistema principal

let archivedPatients = [];
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
    document.getElementById('currentUser').textContent = currentUser;

    // Cargar pacientes archivados
    loadArchivedPatients();

    // Event listener para búsqueda con Enter
    const searchInput = document.getElementById('searchArchivos');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchArchivos();
        });
    }

    // Cerrar modal con clic fuera
    const modal = document.getElementById('archivedPatientModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeArchivedModal();
            }
        });
    }
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
        renderArchivedPatients();
    } catch (error) {
        console.error('[Archivos] Error cargando archivos:', error);
        showToast('Error al cargar pacientes archivados', 'error');

        // Mostrar estado de error
        document.getElementById('archivosContainer').innerHTML = `
            <div class="alert alert-error">
                <span>Error al cargar los datos. Por favor, recarga la página.</span>
            </div>
        `;
    }
}

// ========================================
// FILTROS
// ========================================

// Poblar filtro de médicos
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
    select.innerHTML = '<option value="">Todos</option>';

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

// Poblar filtro de diagnósticos
function populateDiagnosisFilter() {
    const select = document.getElementById('filterDiagnosis');
    if (!select) return;

    const diagnosisSet = new Set();

    archivedPatients.forEach(patient => {
        if (patient.admissions && patient.admissions.length > 0) {
            patient.admissions.forEach(admission => {
                const diagnosis = admission.diagnosisText || admission.diagnosis_text;
                if (diagnosis && diagnosis.trim() !== '' && diagnosis !== '-') {
                    diagnosisSet.add(diagnosis.trim());
                }
            });
        }
    });

    const currentValue = select.value;
    select.innerHTML = '<option value="">Todos</option>';

    const sortedDiagnosis = Array.from(diagnosisSet).sort();

    sortedDiagnosis.forEach(diagnosis => {
        const option = document.createElement('option');
        option.value = diagnosis;
        // Truncar texto largo para el dropdown
        option.textContent = diagnosis.length > 40 ? diagnosis.substring(0, 37) + '...' : diagnosis;
        option.title = diagnosis;
        select.appendChild(option);
    });

    select.value = currentValue;
}

// Poblar filtro de meses
function populateMonthFilter() {
    const select = document.getElementById('filterMonth');
    if (!select) return;

    const monthsSet = new Set();

    archivedPatients.forEach(patient => {
        if (patient.admissions && patient.admissions.length > 0) {
            patient.admissions.forEach(admission => {
                const admissionDate = admission.admissionDate || admission.admission_date;
                if (admissionDate) {
                    const date = new Date(admissionDate + 'T12:00:00');
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    monthsSet.add(monthKey);
                }
            });
        }
    });

    const currentValue = select.value;
    select.innerHTML = '<option value="">Todos</option>';

    // Ordenar meses de más reciente a más antiguo
    const sortedMonths = Array.from(monthsSet).sort().reverse();

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthName = monthNames[parseInt(month) - 1];
        const option = document.createElement('option');
        option.value = monthKey;
        option.textContent = `${monthName} ${year}`;
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
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <h3>No se encontraron pacientes archivados</h3>
                <p>Ajusta los filtros de búsqueda o verifica que existan registros</p>
            </div>
        `;
        updatePaginationControls(0, 0);
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

    // Crear tabla con estilos del dashboard
    let html = `
        <table class="patients-table">
            <thead>
                <!-- Fila de filtros inline (arriba de los títulos) -->
                <tr class="filters-row">
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>
                        <select id="filterMonth" onchange="searchArchivos()" class="filter-inline" title="Filtrar por mes de ingreso">
                            <option value="">Todos</option>
                        </select>
                    </th>
                    <th>
                        <select id="filterDiagnosis" onchange="searchArchivos()" class="filter-inline" title="Filtrar por diagnóstico">
                            <option value="">Todos</option>
                        </select>
                    </th>
                    <th>
                        <select id="filterDoctor" onchange="searchArchivos()" class="filter-inline" title="Filtrar por médico">
                            <option value="">Todos</option>
                        </select>
                    </th>
                    <th>
                        <button onclick="clearFilters()" class="btn-clear-filters" title="Limpiar todos los filtros">
                            Limpiar
                        </button>
                    </th>
                </tr>
                <!-- Fila de títulos de columnas -->
                <tr>
                    <th onclick="sortArchivedByColumn('name')" style="cursor: pointer;">
                        Nombre <span id="sort-name" class="sort-indicator"></span>
                    </th>
                    <th>RUT</th>
                    <th>Edad</th>
                    <th onclick="sortArchivedByColumn('discharge')" style="cursor: pointer;">
                        F. Alta <span id="sort-discharge" class="sort-indicator"></span>
                    </th>
                    <th onclick="sortArchivedByColumn('admission')" style="cursor: pointer;">
                        F. Ingreso <span id="sort-admission" class="sort-indicator"></span>
                    </th>
                    <th>Diagnóstico</th>
                    <th onclick="sortArchivedByColumn('doctor')" style="cursor: pointer;">
                        Médico <span id="sort-doctor" class="sort-indicator"></span>
                    </th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    paginatedPatients.forEach(patient => {
        const lastAdmission = patient.admissions && patient.admissions[0];

        if (!lastAdmission) {
            console.error('[Archivos] Paciente sin admisiones:', patient);
            return;
        }

        const days = calculateDaysBetween(lastAdmission.admissionDate, lastAdmission.dischargeDate);
        const doctorName = normalizeName(lastAdmission.admittedBy || lastAdmission.admitted_by) || 'Sin asignar';

        html += `
            <tr onclick="viewArchivedPatient(${patient.id})" style="cursor: pointer;">
                <td style="font-weight: 500;">${patient.name}</td>
                <td><span class="rut-badge">${patient.rut || 'Sin RUT'}</span></td>
                <td>${patient.age || '-'}</td>
                <td>${formatDate(lastAdmission.dischargeDate)}</td>
                <td>${formatDate(lastAdmission.admissionDate)}</td>
                <td class="truncate" title="${lastAdmission.diagnosisText || ''}">${lastAdmission.diagnosisText || '-'}</td>
                <td>${doctorName}</td>
                <td>
                    <a href="ficha-archivo.html?id=${patient.id}"
                       class="btn btn-primary btn-sm"
                       onclick="event.stopPropagation();">
                        Ver Ficha
                    </a>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Poblar los filtros inline después de crear la tabla
    populateDoctorFilter();
    populateDiagnosisFilter();
    populateMonthFilter();

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
    const doctorSelect = document.getElementById('filterDoctor');
    const diagnosisSelect = document.getElementById('filterDiagnosis');
    const monthSelect = document.getElementById('filterMonth');

    const doctorFilter = doctorSelect ? doctorSelect.value : '';
    const diagnosisFilter = diagnosisSelect ? diagnosisSelect.value : '';
    const monthFilter = monthSelect ? monthSelect.value : '';

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
    if (doctorFilter && doctorSelect) {
        const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
        const variations = selectedOption.getAttribute('data-variations');
        const doctorVariations = variations ? JSON.parse(variations) : [doctorFilter];

        filtered = filtered.filter(patient => {
            return patient.admissions && patient.admissions.some(admission => {
                const doctor = admission.admittedBy || admission.admitted_by;
                return doctorVariations.includes(doctor);
            });
        });
    }

    // Filtrar por diagnóstico
    if (diagnosisFilter) {
        filtered = filtered.filter(patient => {
            return patient.admissions && patient.admissions.some(admission => {
                const diagnosis = admission.diagnosisText || admission.diagnosis_text;
                return diagnosis && diagnosis.trim() === diagnosisFilter;
            });
        });
    }

    // Filtrar por mes de ingreso
    if (monthFilter) {
        filtered = filtered.filter(patient => {
            return patient.admissions && patient.admissions.some(admission => {
                const admissionDate = admission.admissionDate || admission.admission_date;
                if (admissionDate) {
                    const date = new Date(admissionDate + 'T12:00:00');
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return monthKey === monthFilter;
                }
                return false;
            });
        });
    }

    renderArchivedPatients(filtered);
}

function clearFilters() {
    document.getElementById('searchArchivos').value = '';

    // Limpiar filtros inline (pueden no existir si la tabla no está renderizada)
    const doctorFilter = document.getElementById('filterDoctor');
    const diagnosisFilter = document.getElementById('filterDiagnosis');
    const monthFilter = document.getElementById('filterMonth');

    if (doctorFilter) doctorFilter.value = '';
    if (diagnosisFilter) diagnosisFilter.value = '';
    if (monthFilter) monthFilter.value = '';

    currentPage = 1;
    renderArchivedPatients();
}

// ========================================
// VER FICHA DE PACIENTE
// ========================================
function viewArchivedPatient(patientId) {
    window.location.href = `ficha-archivo.html?id=${patientId}`;
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
    const modalPrevision = document.getElementById('modalPrevision');

    if (modalPatientName) modalPatientName.textContent = patientData.name;
    if (modalName) modalName.textContent = patientData.name;
    if (modalRut) modalRut.textContent = patientData.rut || 'Sin RUT';
    if (modalAge) modalAge.textContent = patientData.age ? patientData.age + ' años' : '-';
    if (modalPrevision) modalPrevision.textContent = patientData.prevision || 'No especificada';

    // Mostrar historial de admisiones
    if (patientData.admissions) {
        renderAdmissionsHistory(patientData.admissions);
    }

    // Resetear tabs
    showTab('datos');

    // Mostrar modal
    const modal = document.getElementById('archivedPatientModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function renderAdmissionsHistory(admissions) {
    const container = document.getElementById('admissionsHistory');

    if (!admissions || admissions.length === 0) {
        container.innerHTML = `
            <div class="empty-state-small">
                <p>No hay admisiones registradas</p>
            </div>
        `;
        return;
    }

    let html = '';

    admissions.forEach((admission, index) => {
        const days = calculateDaysBetween(admission.admissionDate, admission.dischargeDate);

        html += `
            <div class="admission-card">
                <div class="admission-card-header">
                    <span class="admission-number">Admisión #${admissions.length - index}</span>
                    <span class="admission-dates">
                        ${formatDate(admission.admissionDate)} → ${formatDate(admission.dischargeDate)}
                    </span>
                </div>

                <div class="admission-details">
                    <p><strong>Diagnóstico:</strong> ${admission.diagnosisText || '-'} (${admission.diagnosis || '-'})</p>
                    <p><strong>Días hospitalizado:</strong> <span class="days-badge">${days}</span></p>
                    <p><strong>Detalles:</strong> ${admission.diagnosisDetails || 'Sin detalles'}</p>
                    <p><strong>Dado de alta por:</strong> ${admission.dischargedBy || '-'}</p>
                    ${admission.allergies ? `<p><strong>Alergias:</strong> ${admission.allergies}</p>` : ''}
                </div>

                <div class="admission-actions">
                    <button onclick="loadObservations(${admission.admissionId})" class="btn btn-primary btn-sm">
                        Ver Observaciones
                    </button>
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
            <div class="loading-container" style="min-height: 100px;">
                <div class="loading-spinner"></div>
                <span style="margin-left: 1rem;">Cargando observaciones...</span>
            </div>
        `;

        const response = await apiRequest(`/patients/admission/${admissionId}/observations`);

        if (!response || response.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <p>No hay observaciones para esta admisión</p>
                </div>
            `;
            return;
        }

        let html = '';
        response.forEach(obs => {
            html += `
                <div class="observation-item">
                    <div class="observation-header">
                        <span class="observation-author">${obs.created_by}</span>
                        <span class="observation-date">${formatDateTime(obs.created_at)}</span>
                    </div>
                    <div class="observation-text">${obs.observation}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando observaciones:', error);
        document.getElementById('observationsHistory').innerHTML = `
            <div class="empty-state-small">
                <p>No hay observaciones disponibles para esta admisión</p>
            </div>
        `;
    }
}

function showTab(tabName, clickedTab = null) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover clase activa de todos los botones de tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar tab seleccionado
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Marcar el botón activo
    if (clickedTab) {
        clickedTab.classList.add('active');
    } else {
        // Buscar el botón correcto basado en el data-tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });
    }
}

function closeArchivedModal() {
    const modal = document.getElementById('archivedPatientModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentPatientData = null;
}

// ========================================
// EDICIÓN DE PACIENTE
// ========================================
function editPatientData() {
    const modalName = document.getElementById('modalName');
    const modalRut = document.getElementById('modalRut');
    const modalAge = document.getElementById('modalAge');
    const modalPrevision = document.getElementById('modalPrevision');

    if (modalName) {
        modalName.innerHTML = `<input type="text" id="editName" value="${currentPatientData.name}" class="form-control">`;
    }
    if (modalRut) {
        modalRut.innerHTML = `<input type="text" id="editRut" value="${currentPatientData.rut || ''}" class="form-control">`;
    }
    if (modalAge) {
        modalAge.innerHTML = `<input type="number" id="editAge" value="${currentPatientData.age || ''}" class="form-control" min="1" max="150">`;
    }
    if (modalPrevision) {
        modalPrevision.innerHTML = `<input type="text" id="editPrevision" value="${currentPatientData.prevision || ''}" class="form-control">`;
    }

    // Cambiar botones del footer
    const modalFooter = document.querySelector('.modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button onclick="savePatientData()" class="btn btn-success">
                Guardar
            </button>
            <button onclick="cancelEdit()" class="btn btn-secondary">
                Cancelar
            </button>
        `;
    }
}

async function savePatientData() {
    const updatedData = {
        name: document.getElementById('editName').value,
        rut: document.getElementById('editRut').value,
        age: parseInt(document.getElementById('editAge').value) || null,
        prevision: document.getElementById('editPrevision').value
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
        restoreModalFooter();

    } catch (error) {
        console.error('Error actualizando paciente:', error);
        showToast('Error al actualizar los datos', 'error');
    }
}

function cancelEdit() {
    showArchivedPatientModal(currentPatientData);
    restoreModalFooter();
}

function restoreModalFooter() {
    const modalFooter = document.querySelector('.modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button onclick="editPatientData()" class="btn btn-primary">
                Editar Datos
            </button>
            <button onclick="closeArchivedModal()" class="btn btn-secondary">
                Cerrar
            </button>
        `;
    }
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
            ['Nombre', 'RUT', 'Edad', 'Previsión', 'Fecha Ingreso', 'Fecha Egreso', 'Diagnóstico', 'Médico Tratante', 'Días Hospitalizado']
        ];

        archivedPatients.forEach(patient => {
            const lastAdmission = patient.admissions && patient.admissions.length > 0
                ? patient.admissions[0]
                : {};

            const days = lastAdmission.admissionDate && lastAdmission.dischargeDate
                ? calculateDaysBetween(lastAdmission.admissionDate, lastAdmission.dischargeDate)
                : 0;

            excelData.push([
                patient.name || '-',
                patient.rut || 'Sin RUT',
                patient.age || '-',
                patient.prevision || '-',
                formatDate(lastAdmission.admissionDate) || '-',
                formatDate(lastAdmission.dischargeDate) || '-',
                `${lastAdmission.diagnosis || ''} - ${lastAdmission.diagnosisText || ''}`,
                normalizeName(lastAdmission.admittedBy || lastAdmission.admitted_by) || 'Sin asignar',
                days
            ]);
        });

        excelData.push([]);
        excelData.push(['RESUMEN']);
        excelData.push(['Total de pacientes archivados:', archivedPatients.length]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);

        ws['!cols'] = [
            { wch: 30 }, { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 18 }
        ];

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
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
    searchArchivos(); // Re-aplicar filtros
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        searchArchivos();
        document.getElementById('archivosContainer').scrollIntoView({ behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = calculateTotalPages(archivedPatients.length);
    if (currentPage < totalPages) {
        currentPage++;
        searchArchivos();
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
        if (totalItems === 0) {
            paginationInfo.textContent = 'No hay pacientes';
        } else if (currentPageSize === 'all') {
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
        pageIndicator.textContent = currentPageSize === 'all' ? 'Todos' : `Página ${currentPage} de ${totalPages || 1}`;
    }

    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1 || currentPageSize === 'all';
    }

    if (nextBtn) {
        const totalPages = calculateTotalPages(totalItems);
        nextBtn.disabled = currentPage >= totalPages || currentPageSize === 'all';
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

        const admissionA = a.admissions && a.admissions[0];
        const admissionB = b.admissions && b.admissions[0];

        switch(column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'admission':
                valueA = admissionA ? new Date(admissionA.admissionDate) : new Date(0);
                valueB = admissionB ? new Date(admissionB.admissionDate) : new Date(0);
                break;
            case 'discharge':
                valueA = admissionA ? new Date(admissionA.dischargeDate) : new Date(0);
                valueB = admissionB ? new Date(admissionB.dischargeDate) : new Date(0);
                break;
            case 'doctor':
                valueA = (admissionA ? (admissionA.admittedBy || admissionA.admitted_by) : 'Sin asignar').toLowerCase();
                valueB = (admissionB ? (admissionB.admittedBy || admissionB.admitted_by) : 'Sin asignar').toLowerCase();
                break;
            case 'days':
                valueA = admissionA ? calculateDaysBetween(admissionA.admissionDate, admissionA.dischargeDate) : 0;
                valueB = admissionB ? calculateDaysBetween(admissionB.admissionDate, admissionB.dischargeDate) : 0;
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
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-CL');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL');
}

function calculateDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'success') {
    // Remover toast anterior si existe
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span class="toast-message">${message}</span>
    `;

    // Agregar al body
    document.body.appendChild(toast);

    // Animación de entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Remover después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
