// pacientes-refactored.js - Archivo principal refactorizado
// Orquestador que usa los módulos especializados

// NO declarar variables globales aquí - usar las de main.js
// viewMode se declara en main.js línea 6
// patients se declara en main.js línea 5
// currentPatientId se declara en main.js
// hasUnsavedChanges se declara en main.js línea 9

// Variable para el filtro de médico
let currentDoctorFilter = '';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Solo cargar pacientes si estamos autenticados (main app visible)
    const mainApp = document.getElementById('mainApp');
    if (mainApp && mainApp.style.display !== 'none') {
        // Cargar pacientes al inicio
        renderPatients();
        
        // Verificar si hay un paciente en la URL para abrir
        checkURLForPatient();
    }
    
    // Event listeners siempre se configuran
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Toggle vista cards/table
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('click', () => {
            viewMode = viewMode === 'cards' ? 'table' : 'cards';
            localStorage.setItem('viewMode', viewMode);
            renderPatients();
        });
    }
    
    // Botón nuevo paciente
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', () => {
            openModal('newPatientModal');
        });
    }
    
    // Botón exportar Excel
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportActivePatientsToExcel);
    }
    
    // Botón imprimir
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printActivePatients);
    }
}

// Renderizar pacientes (función principal)
async function renderPatients(skipAPILoad = false, forceReload = false) {
    // Solo cargar desde API si no se indica lo contrario
    if (!skipAPILoad) {
        await PacientesAPI.loadPatientsFromAPI(forceReload);
    }
    
    const container = document.getElementById('patientsContainer');
    let activePatients = patients.filter(p => p.status === 'active');
    
    // Aplicar filtro de médico si está activo
    if (currentDoctorFilter) {
        if (Array.isArray(currentDoctorFilter)) {
            // Si es un array de variaciones, filtrar por cualquiera de ellas
            activePatients = activePatients.filter(p => 
                currentDoctorFilter.includes(p.admittedBy)
            );
        } else {
            // Compatibilidad con string simple
            activePatients = activePatients.filter(p => p.admittedBy === currentDoctorFilter);
        }
    }
    
    // Actualizar el dropdown de médicos
    updateDoctorFilter();
    
    if (activePatients.length === 0) {
        // Mostrar mensaje específico si es por filtro
        if (currentDoctorFilter) {
            const doctorName = document.getElementById('doctorFilter').value;
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No hay pacientes para este médico</h3>
                    <p>No se encontraron pacientes activos asignados a: <strong>${doctorName}</strong></p>
                    <button onclick="document.getElementById('doctorFilter').value=''; filterByDoctor()" class="btn btn-secondary" style="margin-top: 10px;">Ver todos los pacientes</button>
                </div>
            `;
        } else {
            container.innerHTML = renderEmptyState();
        }
        return;
    }
    
    if (viewMode === 'cards') {
        container.className = 'patients-grid';
        container.innerHTML = activePatients.map(patient => renderPatientCard(patient)).join('');
    } else {
        container.className = 'patients-list';
        container.innerHTML = renderPatientTable(activePatients);
    }
    
    // Agregar click handlers
    addPatientClickHandlers();
}

// Agregar event handlers a elementos de pacientes
function addPatientClickHandlers() {
    const patientElements = document.querySelectorAll('[data-patient-id]');
    
    patientElements.forEach(element => {
        element.addEventListener('click', (e) => {
            // Ignorar clicks en checkboxes, botones y sus elementos hijos
            const clickedElement = e.target;
            const isInteractive = 
                clickedElement.tagName === 'INPUT' ||
                clickedElement.tagName === 'BUTTON' ||
                clickedElement.tagName === 'SELECT' ||
                clickedElement.closest('button') ||
                clickedElement.closest('input') ||
                clickedElement.classList.contains('patient-select-checkbox') ||
                clickedElement.classList.contains('share-btn-inline') ||
                clickedElement.classList.contains('delete-btn-inline');
                
            if (isInteractive) {
                e.stopPropagation();
                return;
            }
            
            const patientId = parseInt(e.currentTarget.dataset.patientId);
            openPatientModal(patientId);
        });
    });
}

// Abrir modal del paciente
function openPatientModal(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Establecer el paciente actual
    currentPatientId = patientId;
    
    // Llenar datos de admisión
    const admissionData = document.getElementById('admissionData');
    admissionData.innerHTML = renderAdmissionData(patient);

    // Abrir modal
    openModal('patientModal');

    // Agregar al historial para interceptar botón back
    history.pushState({patientModal: true, patientId: patientId}, '', '#patient-' + patientId);

    // Inicializar tracking de cambios
    initializeChangeTracking();
    
    // Si es paciente activo, establecer fecha de hoy en egreso
    if (!patient.dischargeDate) {
        setTimeout(() => {
            const dischargeDateField = document.getElementById('dischargeDate');
            if (dischargeDateField) {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                dischargeDateField.value = `${year}-${month}-${day}`;
            }
        }, 100);
    }
}

// Guardar observaciones y tareas
async function saveObservationsAndTasks(patientId) {
    const observationsField = document.getElementById('patientObservations');
    const tasksField = document.getElementById('patientPendingTasks');
    
    if (!observationsField && !tasksField) return;
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    try {
        // Guardar observaciones si hay cambios
        if (observationsField && observationsField.value.trim() !== patient.observations) {
            await PacientesAPI.saveObservationsAPI(patientId, observationsField.value.trim());
            patient.observations = observationsField.value.trim();
        }
        
        // Guardar tareas si hay cambios
        if (tasksField && tasksField.value.trim() !== patient.pendingTasks) {
            await PacientesAPI.savePendingTasksAPI(patientId, tasksField.value.trim());
            patient.pendingTasks = tasksField.value.trim();
        }
        
        hasUnsavedChanges = false;
        showToast('Cambios guardados correctamente');
        renderPatients();
        
    } catch (error) {
        console.error('Error guardando cambios:', error);
        showToast('Error al guardar cambios', 'error');
    }
}

// Inicializar tracking de cambios
function initializeChangeTracking() {
    const observationsField = document.getElementById('patientObservations');
    const tasksField = document.getElementById('patientPendingTasks');
    
    const markAsChanged = () => {
        hasUnsavedChanges = true;
    };
    
    if (observationsField) {
        observationsField.addEventListener('input', markAsChanged);
    }
    
    if (tasksField) {
        tasksField.addEventListener('input', markAsChanged);
    }
}

// COMENTADAS - Estas funciones están mejor implementadas en pacientes-ui.js
// Las funciones de abajo causaban el problema de "sin fecha - Usuario"
/*
// Cargar historial de observaciones
async function loadObservationHistory(patientId) {
    try {
        const observations = await PacientesAPI.loadObservationHistoryAPI(patientId);
        const historyDiv = document.getElementById('observationHistory');
        
        if (historyDiv && observations.length > 0) {
            const historyHTML = observations.slice(0, 3).map(obs => `
                <div class="history-item">
                    <small>${formatDate(obs.created_at)} - ${obs.observed_by || 'Usuario'}</small>
                    <p>${obs.observation}</p>
                </div>
            `).join('');
            
            historyDiv.innerHTML = `<strong>Historial:</strong>${historyHTML}`;
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

// Cargar historial de tareas
async function loadTaskHistory(patientId) {
    try {
        const tasks = await PacientesAPI.loadTaskHistoryAPI(patientId);
        const historyDiv = document.getElementById('taskHistory');
        
        if (historyDiv && tasks.length > 0) {
            const historyHTML = tasks.slice(0, 3).map(task => `
                <div class="history-item">
                    <small>${formatDate(task.created_at)} - ${task.assigned_to || 'Usuario'}</small>
                    <p>${task.task}</p>
                </div>
            `).join('');
            
            historyDiv.innerHTML = `<strong>Historial:</strong>${historyHTML}`;
        }
    } catch (error) {
        console.error('Error cargando tareas:', error);
    }
}
*/

// Exportar a Excel
async function exportActivePatientsToExcel(monthFilter = null) {
    try {
        showToast('Generando Excel...');
        
        let activePatients = patients.filter(p => p.status === 'active');
        let fileName = `pacientes_activos_${new Date().toISOString().split('T')[0]}.xlsx`;
        let sheetName = 'Pacientes Activos';
        
        // Si hay filtro de mes, aplicarlo
        if (monthFilter) {
            const [year, month] = monthFilter.split('-').map(Number);
            activePatients = activePatients.filter(p => {
                const admDate = new Date(p.admissionDate);
                return admDate.getFullYear() === year && 
                       (admDate.getMonth() + 1) === month;
            });
            
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            fileName = `pacientes_${monthNames[month - 1]}_${year}.xlsx`;
            sheetName = `Pacientes ${monthNames[month - 1]} ${year}`;
        }
        
        if (activePatients.length === 0) {
            showToast('No hay pacientes para el período seleccionado', 'warning');
            return;
        }
        
        // Crear datos para Excel
        const data = activePatients.map(p => ({
            'Nombre': p.name,
            'Edad': p.age,
            'RUT': p.rut || 'Sin RUT',
            'Cama': p.bed || 'Sin asignar',
            'Fecha Ingreso': formatDate(p.admissionDate),
            'Diagnóstico': catalogos.getDiagnosisText(p.diagnosis),
            'Médico': p.admittedBy,
            // 'Alta Programada': Campo eliminado
        }));
        
        // Crear libro de Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Descargar
        XLSX.writeFile(wb, fileName);
        
        showToast(`Excel generado: ${activePatients.length} pacientes exportados`);
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showToast('Error al generar Excel', 'error');
    }
}

// Nueva función para exportar por mes específico
async function exportByMonth() {
    const monthSelect = document.getElementById('exportMonth');
    const selectedMonth = monthSelect.value;
    
    if (!selectedMonth) {
        showToast('Por favor seleccione un mes', 'warning');
        return;
    }
    
    // Cerrar el menú
    document.getElementById('exportMenu').style.display = 'none';
    
    // Exportar con filtro de mes
    await exportActivePatientsToExcel(selectedMonth);
}

// Imprimir pacientes activos
async function printActivePatients() {
    const printWindow = window.open('', '_blank');
    const activePatients = patients.filter(p => p.status === 'active');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pacientes Activos - INTRANEURO</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .fecha { text-align: right; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>INTRANEURO - Pacientes Activos</h1>
            <div class="fecha">Fecha: ${new Date().toLocaleDateString('es-CL')}</div>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Edad</th>
                        <th>RUT</th>
                        <th>Cama</th>
                        <th>Ingreso</th>
                        <th>Diagnóstico</th>
                        <th>Médico</th>
                    </tr>
                </thead>
                <tbody>
                    ${activePatients.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.age}</td>
                            <td>${p.rut || 'Sin RUT'}</td>
                            <td>${p.bed || 'Sin asignar'}</td>
                            <td>${formatDate(p.admissionDate)}</td>
                            <td>${catalogos.getDiagnosisText(p.diagnosis)}</td>
                            <td>${p.admittedBy}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// COMENTADA - Esta función está mejor implementada en pacientes.js
// La función de abajo causaba conflictos con el posicionamiento del botón
/*
// Agregar botón de compartir
function addShareButton(patientId, patientName) {
    // Implementación del botón compartir
    const existingButton = document.querySelector('.share-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const shareButton = document.createElement('button');
    shareButton.className = 'share-button';
    shareButton.innerHTML = '📤 Compartir Ficha';
    shareButton.onclick = () => sharePatient(patientId, patientName);
    
    const modal = document.querySelector('#patientModal .modal-content');
    if (modal) {
        modal.appendChild(shareButton);
    }
}
*/

// Compartir paciente
async function sharePatient(patientId, patientName) {
    const shareUrl = `${window.location.origin}/ficha.html?id=${patientId}`;
    
    // Crear contenido del modal de compartir
    const modalContent = document.getElementById('shareModalContent');
    modalContent.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <p style="margin-bottom: 20px;">Compartir ficha de <strong>${patientName}</strong></p>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="shareViaWhatsApp('${shareUrl}', '${patientName.replace(/'/g, "\\'")}')" 
                        class="btn btn-success" 
                        style="width: 100%; background: #25D366; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer;">
                    📱 Compartir por WhatsApp
                </button>
                
                <button onclick="shareViaEmail('${shareUrl}', '${patientName.replace(/'/g, "\\'")}')" 
                        class="btn btn-info" 
                        style="width: 100%; background: #0078D4; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer;">
                    ✉️ Enviar por correo
                </button>
                
                <button onclick="copyShareLink('${shareUrl}')" 
                        class="btn btn-primary" 
                        style="width: 100%; background: #007bff; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer;">
                    📋 Copiar enlace
                </button>
                
                <button onclick="closeModal('shareModal')" 
                        class="btn btn-secondary" 
                        style="width: 100%; background: #6c757d; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    // Abrir modal
    openModal('shareModal');
}

// Compartir por WhatsApp
function shareViaWhatsApp(url, patientName) {
    const message = `Ficha médica de ${patientName}:\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    closeModal('shareModal');
}

// Compartir por email
function shareViaEmail(url, patientName) {
    const subject = `Ficha médica de ${patientName}`;
    const body = `Hola,\n\nComparto la ficha médica de ${patientName}:\n\n${url}\n\nSaludos`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    closeModal('shareModal');
}

// Copiar enlace
function copyShareLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Enlace copiado al portapapeles');
        setTimeout(() => closeModal('shareModal'), 1500);
    });
}

// Variables para el ordenamiento
let currentSortColumn = null;
let sortDirection = 'asc';

// Función para ordenar por columna (global para ser accesible desde HTML)
window.sortByColumn = function(column) {
    // Si es la misma columna, cambiar dirección
    if (currentSortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        sortDirection = 'asc';
    }
    
    // Obtener pacientes activos y aplicar filtro de médico si está activo
    let activePatients = patients.filter(p => p.status === 'active');
    
    if (currentDoctorFilter) {
        if (Array.isArray(currentDoctorFilter)) {
            activePatients = activePatients.filter(p => 
                currentDoctorFilter.includes(p.admittedBy)
            );
        } else {
            activePatients = activePatients.filter(p => p.admittedBy === currentDoctorFilter);
        }
    }

    // Ordenar según la columna
    activePatients.sort((a, b) => {
        let valueA, valueB;

        switch(column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'age':
                valueA = parseInt(a.age) || 0;
                valueB = parseInt(b.age) || 0;
                break;
            case 'doctor':
                valueA = (a.admittedBy || '').toLowerCase();
                valueB = (b.admittedBy || '').toLowerCase();
                break;
            case 'bed':
                // Ordenar camas numéricamente si es posible
                valueA = parseInt(a.bed) || a.bed || '';
                valueB = parseInt(b.bed) || b.bed || '';
                break;
            case 'service':
                // Ordenar por servicio (los pacientes sin servicio al final)
                valueA = (a.service || 'zzz').toLowerCase();
                valueB = (b.service || 'zzz').toLowerCase();
                break;
            case 'diagnosis':
                // Ordenar por diagnóstico
                valueA = (a.diagnosis || '').toLowerCase();
                valueB = (b.diagnosis || '').toLowerCase();
                break;
            case 'days':
                valueA = a.daysInHospital || 0;
                valueB = b.daysInHospital || 0;
                break;
            case 'admission':
                valueA = new Date(a.admissionDate);
                valueB = new Date(b.admissionDate);
                break;
            default:
                return 0;
        }
        
        // Comparar valores
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Actualizar el array global de pacientes manteniendo los inactivos al final
    const inactivePatients = patients.filter(p => p.status !== 'active');
    patients = [...activePatients, ...inactivePatients];
    
    // Re-renderizar la tabla
    const container = document.getElementById('patientsContainer');
    console.log('ViewMode actual:', viewMode);
    console.log('Container encontrado:', !!container);
    
    if (viewMode === 'list' || viewMode === 'table') {
        container.className = 'patients-list';
        container.innerHTML = renderPatientTable(activePatients);
        addPatientClickHandlers();
        console.log('Tabla re-renderizada con pacientes ordenados');
    } else {
        // También ordenar en vista de cards
        container.className = 'patients-grid';
        container.innerHTML = activePatients.map(patient => renderPatientCard(patient)).join('');
        addPatientClickHandlers();
        console.log('Cards re-renderizadas con pacientes ordenados');
    }
    
    // Actualizar indicadores visuales de ordenamiento
    updateSortIndicators(column);
}

// Actualizar indicadores visuales de ordenamiento
function updateSortIndicators(column) {
    // Remover todos los indicadores anteriores y restaurar el ícono neutro
    document.querySelectorAll('th[onclick^="sortByColumn"]').forEach(th => {
        const span = th.querySelector('span');
        if (span) {
            span.innerHTML = '⇅';
            span.style.opacity = '0.6';
            span.style.color = 'inherit';
        }
    });
    
    // Actualizar el indicador de la columna activa
    const th = document.querySelector(`th[onclick="sortByColumn('${column}')"]`);
    if (th) {
        const span = th.querySelector('span');
        if (span) {
            span.innerHTML = sortDirection === 'asc' ? '↑' : '↓';
            span.style.opacity = '1';
            span.style.color = '#007bff';
        }
    }
}

// Verificar URL para abrir paciente
function checkURLForPatient() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#patient-')) {
        const patientId = parseInt(hash.replace('#patient-', ''));
        if (patientId) {
            setTimeout(() => {
                openPatientModal(patientId);
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// Interceptar botón back del navegador
window.addEventListener('popstate', (e) => {
    const patientModal = document.getElementById('patientModal');
    
    if (patientModal && patientModal.classList.contains('active')) {
        e.preventDefault();
        
        if (confirm('¿Cerrar información del paciente y volver a la lista?')) {
            closeModal('patientModal');
            history.replaceState(null, '', window.location.pathname);
        } else {
            const currentState = e.state || {};
            history.pushState({
                patientModal: true, 
                patientId: currentState.patientId || currentPatientId
            }, '', '#patient-' + (currentState.patientId || currentPatientId));
        }
    }
});

// Hacer funciones globales disponibles
window.renderPatients = renderPatients;
window.openPatientModal = openPatientModal;
window.saveObservationsAndTasks = saveObservationsAndTasks;
window.exportActivePatientsToExcel = exportActivePatientsToExcel;
window.printActivePatients = printActivePatients;

// Exponer funciones de edición
window.editPatientName = PacientesEdit.editPatientName;
window.editPatientAge = PacientesEdit.editPatientAge;
window.editPatientRut = PacientesEdit.editPatientRut;
window.editPatientBed = PacientesEdit.editPatientBed;
// window.editPatientPrevision = PacientesEdit.editPatientPrevision; // Comentado: Usar la versión con DropdownSystem
window.editPatientPrevision = PacientesEdit.editPatientPrevision; // Mantenemos la función básica
// window.editAdmissionDate = PacientesEdit.editAdmissionDate; // Comentado: Usar la versión refactorizada con Flatpickr
window.editDiagnosis = PacientesEdit.editDiagnosis;
window.editDiagnosisDetails = PacientesEdit.editDiagnosisDetails;
window.editAdmittedBy = PacientesEdit.editAdmittedBy;
window.editBed = PacientesEdit.editBed;

// Exponer funciones de alta/egreso
window.toggleScheduledDischarge = PacientesDischarge.toggleScheduledDischarge;
window.processDischarge = PacientesDischarge.processDischarge;
window.setRating = PacientesDischarge.setRating;

// Exponer funciones de historial
// window.loadObservationHistory = loadObservationHistory;  // Función no definida aún
// window.loadTaskHistory = loadTaskHistory;  // Función no definida aún

// Función para compartir desde la lista
window.sharePatientFromList = function(event, patientId, patientName) {
    event.stopPropagation();
    sharePatient(patientId, patientName);
};

// Función para eliminar paciente
window.deletePatient = async function(event, patientId, patientName) {
    event.stopPropagation();
    
    // Confirmación para evitar eliminación accidental
    const confirmDelete = confirm(`¿Está seguro que desea eliminar al paciente?`);
    
    if (confirmDelete) {
        try {
            // Llamar a la API para eliminar
            const response = await apiRequest(`/patients/${patientId}`, { method: 'DELETE' });
            
            console.log('Respuesta de eliminación:', response);
            
            if (response) {
                // Remover de la lista local
                patients = patients.filter(p => p.id !== patientId);
                
                // Actualizar UI sin recargar desde API
                renderPatients(true);
                updateDashboard();
                
                showToast(`Paciente ${patientName} eliminado correctamente`, 'success');
                
                // Forzar recarga de datos después de 1 segundo para verificar
                setTimeout(() => {
                    console.log('Verificando eliminación...');
                    PacientesAPI.loadPatientsFromAPI().then(() => {
                        const stillExists = patients.find(p => p.id === patientId);
                        if (stillExists) {
                            console.error('¡El paciente aún existe en el servidor!');
                            showToast('Error: El paciente no se eliminó del servidor', 'error');
                        } else {
                            console.log('Paciente eliminado correctamente del servidor');
                        }
                        renderPatients(true);
                    });
                }, 1000);
            } else {
                showToast('Error al eliminar el paciente', 'error');
            }
        } catch (error) {
            console.error('Error eliminando paciente:', error);
            showToast('Error al eliminar el paciente', 'error');
        }
    }
};

// ========== SELECCIÓN MÚLTIPLE ==========
let selectedPatients = new Set();

// Alternar selección de paciente
window.togglePatientSelection = function(patientId) {
    if (selectedPatients.has(patientId)) {
        selectedPatients.delete(patientId);
    } else {
        selectedPatients.add(patientId);
    }
    
    // Mostrar/ocultar botones de acciones
    const exportBtn = document.getElementById('exportSelectedBtn');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    
    if (selectedPatients.size > 0) {
        exportBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        document.getElementById('selectedCount').textContent = selectedPatients.size;
    } else {
        exportBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }
    
    // Actualizar estado del checkbox "seleccionar todos"
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll('.patient-select-checkbox');
        selectAllCheckbox.checked = selectedPatients.size === allCheckboxes.length && allCheckboxes.length > 0;
    }
};

// Seleccionar/deseleccionar todos
window.selectAll = function() {
    const checkboxes = document.querySelectorAll('.patient-select-checkbox');
    // Buscar el checkbox que esté visible (puede ser el del header o el de la tabla)
    let selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) {
        selectAllCheckbox = document.getElementById('selectAllTable');
    }
    const shouldSelect = selectAllCheckbox ? !selectAllCheckbox.checked : true;
    
    selectedPatients.clear();
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = shouldSelect;
        if (shouldSelect) {
            selectedPatients.add(parseInt(checkbox.dataset.patientId));
        }
    });
    
    // Actualizar UI
    const exportBtn = document.getElementById('exportSelectedBtn');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    
    if (selectedPatients.size > 0) {
        exportBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        document.getElementById('selectedCount').textContent = selectedPatients.size;
    } else {
        exportBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = shouldSelect;
    }
    // Actualizar también el otro checkbox si existe
    const otherCheckbox = selectAllCheckbox?.id === 'selectAllCheckbox' 
        ? document.getElementById('selectAllTable') 
        : document.getElementById('selectAllCheckbox');
    if (otherCheckbox) {
        otherCheckbox.checked = shouldSelect;
    }
};

// Exportar pacientes seleccionados a Excel
window.exportSelectedToExcel = function() {
    if (selectedPatients.size === 0) {
        showToast('No hay pacientes seleccionados', 'warning');
        return;
    }
    
    const selectedData = patients.filter(p => selectedPatients.has(p.id));
    
    // Preparar datos para Excel
    const excelData = selectedData.map(patient => ({
        'Nombre': patient.name,
        'Edad': patient.age,
        'RUT': patient.rut || 'Sin RUT',
        'Previsión': patient.prevision || 'No especificada',
        'Diagnóstico': catalogos.getDiagnosisText(patient.diagnosis),
        'Cama': patient.bed || 'Sin asignar',
        'Días Hospitalizado': patient.daysInHospital,
        'Fecha Ingreso': formatDate(patient.admissionDate),
        'Médico Tratante': patient.admittedBy || 'No asignado'
    }));
    
    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pacientes Seleccionados");
    
    // Descargar archivo
    const fileName = `pacientes_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showToast(`${selectedPatients.size} pacientes exportados a Excel`, 'success');
};

// Función para actualizar el dropdown de médicos
function updateDoctorFilter() {
    const select = document.getElementById('doctorFilter');
    if (!select) {
        return;
    }
    
    // Función para normalizar nombres (capitalizar cada palabra correctamente)
    function normalizeName(name) {
        if (!name) return '';
        
        // Normalizar espacios y convertir a minúsculas
        let normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();
        
        // Capitalizar primera letra de cada palabra (incluyendo con tildes)
        normalized = normalized.split(' ').map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
        
        // Corregir preposiciones y artículos
        return normalized
            .replace(/\bDe\b/g, 'de')
            .replace(/\bDel\b/g, 'del')
            .replace(/\bLa\b/g, 'la')
            .replace(/\bLos\b/g, 'los')
            .replace(/\bLas\b/g, 'las');
    }
    
    // Usar un Map para mantener relación entre nombre normalizado y originales
    const doctorMap = new Map();
    
    patients.filter(p => p.status === 'active').forEach(p => {
        if (p.admittedBy && p.admittedBy !== 'Sin asignar') {
            const normalized = normalizeName(p.admittedBy);
            if (!doctorMap.has(normalized)) {
                doctorMap.set(normalized, []);
            }
            doctorMap.get(normalized).push(p.admittedBy);
        }
    });
    
    // Guardar valor actual
    const currentValue = select.value;
    
    // Limpiar opciones actuales (excepto la primera)
    select.innerHTML = '<option value="">🔍 Todos los médicos</option>';
    
    // Agregar médicos normalizados y ordenados alfabéticamente
    const sortedDoctors = Array.from(doctorMap.keys()).sort();
    
    sortedDoctors.forEach(normalizedName => {
        const originalNames = doctorMap.get(normalizedName);
        const option = document.createElement('option');
        // Usar el nombre normalizado para mostrar y como valor
        option.value = normalizedName;
        option.textContent = normalizedName;
        // Guardar todas las variaciones como atributo de datos
        option.setAttribute('data-variations', JSON.stringify(originalNames));
        select.appendChild(option);
    });
    
    // Restaurar selección previa si existe
    select.value = currentValue;
}

// Función para filtrar por médico
window.filterByDoctor = function() {
    const select = document.getElementById('doctorFilter');
    const selectedOption = select.options[select.selectedIndex];
    
    if (select.value === '') {
        currentDoctorFilter = '';
    } else {
        // Obtener todas las variaciones del médico seleccionado
        const variations = selectedOption.getAttribute('data-variations');
        currentDoctorFilter = variations ? JSON.parse(variations) : [select.value];
    }
    
    renderPatients(true); // true para evitar recargar desde API
};

// Eliminar pacientes seleccionados
window.deleteSelectedPatients = async function() {
    if (selectedPatients.size === 0) {
        showToast('No hay pacientes seleccionados', 'warning');
        return;
    }
    
    const count = selectedPatients.size;
    const confirmDelete = confirm(`¿Está seguro que desea eliminar ${count} paciente(s)?`);
    
    if (confirmDelete) {
        let successCount = 0;
        let errorCount = 0;
        
        // Eliminar cada paciente seleccionado
        for (const patientId of selectedPatients) {
            try {
                const response = await apiRequest(`/patients/${patientId}`, 'DELETE');
                if (response) {
                    successCount++;
                    // Remover de la lista local
                    patients = patients.filter(p => p.id !== patientId);
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error(`Error eliminando paciente ${patientId}:`, error);
                errorCount++;
            }
        }
        
        // Limpiar selección
            selectedPatients.clear();
            
            // Actualizar UI sin recargar desde API
            renderPatients(true);
            updateDashboard();
            document.getElementById('exportSelectedBtn').style.display = 'none';
            document.getElementById('deleteSelectedBtn').style.display = 'none';
            
            // Mostrar resultado
            if (errorCount === 0) {
                showToast(`${successCount} paciente(s) eliminados correctamente`, 'success');
            } else {
                showToast(`${successCount} eliminados, ${errorCount} errores`, 'warning');
            }
    }
};

// Exponer funciones de compartir globalmente
window.sharePatient = sharePatient;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaEmail = shareViaEmail;
window.copyShareLink = copyShareLink;