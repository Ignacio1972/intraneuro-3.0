// pacientes-ui.js - INTRANEURO Componentes UI de Pacientes

// Render patient card
function renderPatientCard(patient) {
    const initials = getInitials(patient.name);
    const diagnosisText = catalogos.getDiagnosisText(patient.diagnosis);

    // Usar configuración global de servicios
    const SERVICES = window.HOSPITAL_SERVICES_CONFIG || {
        UCI: { label: 'UCI', color: '#dc2626', icon: '🏥' },
        UTI: { label: 'UTI', color: '#ea580c', icon: '⚕️' },
        MQ: { label: 'MQ', color: '#2563eb', icon: '🔬' },
        Urgencias: { label: 'Urgencias', color: '#ca8a04', icon: '🚨' },
        Interconsulta: { label: 'IC', color: '#16a34a', icon: '📋' }
    };

    // Generar badge de servicio si existe
    let serviceBadge = '';
    if (patient.service && SERVICES[patient.service]) {
        const service = SERVICES[patient.service];
        serviceBadge = `
            <div class="service-badge" style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                background: ${service.color}15;
                border: 1px solid ${service.color}40;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                color: ${service.color};
                margin-left: 8px;
            ">
                <span>${service.icon}</span>
                <span>${service.label}</span>
                ${patient.unit ? `<span style="opacity: 0.7;">• ${patient.unit}</span>` : ''}
            </div>
        `;
    }

    return `
        <div class="patient-card" data-patient-id="${patient.id}" data-service="${patient.service || ''}" data-unit="${patient.unit || ''}">
            <div style="position: absolute; top: 10px; left: 10px; z-index: 10;">
                <input type="checkbox"
                       class="patient-select-checkbox"
                       data-patient-id="${patient.id}"
                       onchange="togglePatientSelection(${patient.id})"
                       style="cursor: pointer; width: 20px; height: 20px; opacity: 1;">
            </div>
            <div class="patient-header" style="display: block; padding-top: 1rem;">
                <div class="patient-basic-info">
                    <div class="patient-name" style="margin-bottom: 0.5rem; text-align: center;">
                        ${patient.name}
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem; text-align: left;">
                        ${serviceBadge || '<span style="color: #999; font-size: 0.9rem;">Sin servicio</span>'}
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">
                            Cama: <span class="bed-display">${patient.bed || 'n/a'}</span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="diagnosis-code">${diagnosisText}</div>
            <div class="tooltip">${patient.diagnosisText}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding: 0.5rem 0; border-top: 1px solid rgba(0,0,0,0.05);">
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="sharePatientFromList(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')"
                            class="share-btn-inline"
                            title="Compartir ficha"
                            style="background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.7; transition: all 0.2s ease;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 2L11 13"></path>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                        </svg>
                    </button>
                    <button onclick="deletePatient(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')"
                            class="delete-btn-inline"
                            title="Eliminar paciente"
                            style="background: none; border: none; cursor: pointer; padding: 5px; color: #dc3545; opacity: 0.7; transition: all 0.2s ease;"
                            onmouseover="this.style.opacity='1';"
                            onmouseout="this.style.opacity='0.7';">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Render patient table
function renderPatientTable(activePatients) {
    // Usar configuración global de servicios
    const SERVICES = window.HOSPITAL_SERVICES_CONFIG || {
        UCI: { label: 'UCI', color: '#dc2626', icon: '🏥' },
        UTI: { label: 'UTI', color: '#ea580c', icon: '⚕️' },
        MQ: { label: 'MQ', color: '#2563eb', icon: '🔬' },
        Urgencias: { label: 'Urgencias', color: '#ca8a04', icon: '🚨' },
        Interconsulta: { label: 'IC', color: '#16a34a', icon: '📋' }
    };

    return `
        <table class="patients-table">
            <thead>
                <tr>
                    <th style="width: 40px;">
                        <input type="checkbox" id="selectAllTable" onchange="selectAll()" style="cursor: pointer;">
                    </th>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th onclick="sortByColumn('service')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Servicio <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th onclick="sortByColumn('bed')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Cama <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th></th>
                    <th onclick="sortByColumn('name')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Nombre <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th onclick="sortByColumn('age')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Edad <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th onclick="sortByColumn('diagnosis')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Diagnóstico <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th onclick="sortByColumn('doctor')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Médico Tratante <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th onclick="sortByColumn('admission')" style="cursor: pointer; user-select: none; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">
                        Ingresado <span style="opacity: 0.6; font-size: 14px;">⇅</span>
                    </th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${activePatients.map((patient, index) => {
                    // Generar badge de servicio
                    const serviceConfig = patient.service ? SERVICES[patient.service] : null;
                    const serviceBadge = serviceConfig ? `
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                            padding: 4px 8px;
                            background: ${serviceConfig.color}15;
                            border: 1px solid ${serviceConfig.color}40;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                            color: ${serviceConfig.color};
                        ">
                            ${serviceConfig.icon} ${serviceConfig.label}
                        </span>
                    ` : '<span style="color: #999;">-</span>';

                    return `
                    <tr data-patient-id="${patient.id}" data-service="${patient.service || ''}" data-unit="${patient.unit || ''}">
                        <td>
                            <input type="checkbox"
                                   class="patient-select-checkbox"
                                   data-patient-id="${patient.id}"
                                   onchange="togglePatientSelection(${patient.id})"
                                   style="cursor: pointer;">
                        </td>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>${serviceBadge}</td>
                        <td>
                            <span class="bed-display">
                                ${patient.bed || 'n/a'}
                            </span>
                        </td>
                        <td>
                            <!-- Badge verde eliminado -->
                        </td>
                        <td>${patient.name}</td>
                        <td>${patient.age && patient.age > 0 ? `${patient.age} años` : 'n/a'}</td>
                        <td>${catalogos.getDiagnosisText(patient.diagnosis)}</td>
                        <td>
                            <span class="doctor-display">
                                ${patient.admittedBy || 'Sin asignar'}
                            </span>
                        </td>
                        <td>${formatDate(patient.admissionDate)}</td>
                        <td>
                            <button onclick="sharePatientFromList(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')"
                                    class="share-btn-inline"
                                    title="Compartir ficha"
                                    style="background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.7; transition: all 0.2s ease;"
                                    onmouseover="this.style.opacity='1'; this.style.color='#4CAF50';"
                                    onmouseout="this.style.opacity='0.7'; this.style.color='inherit';">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 2L11 13"></path>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                                </svg>
                            </button>
                            <button onclick="deletePatient(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')"
                                    class="delete-btn-inline"
                                    title="Eliminar paciente"
                                    style="background: none; border: none; cursor: pointer; padding: 5px; color: #dc3545; opacity: 0.7; transition: all 0.2s ease;"
                                    onmouseover="this.style.opacity='1';"
                                    onmouseout="this.style.opacity='0.7';">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    `;
}

// Render empty state
function renderEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">🏥</div>
            <h3>No hay pacientes activos</h3>
            <p>Haga clic en "Nuevo Ingreso" para registrar un paciente</p>
        </div>
    `;
}

// Render admission data (info del paciente en modal)
function renderAdmissionData(patient) {
    const diagnosisText = catalogos.getDiagnosisText(patient.diagnosis);

    // Usar configuración global de servicios
    const SERVICES = window.HOSPITAL_SERVICES_CONFIG || {
        UCI: { label: 'UCI', color: '#dc2626', icon: '🏥' },
        UTI: { label: 'UTI', color: '#ea580c', icon: '⚕️' },
        MQ: { label: 'MQ', color: '#2563eb', icon: '🔬' },
        Urgencias: { label: 'Urgencias', color: '#ca8a04', icon: '🚨' },
        Interconsulta: { label: 'IC', color: '#16a34a', icon: '📋' }
    };

    // Cargar notas simples y sistema de tareas al abrir el modal
    setTimeout(() => {
        // Cargar historia clínica
        if (typeof loadSimpleNotes === 'function') {
            loadSimpleNotes(patient.id);
        }

        // Inicializar sistema de tareas
        if (typeof initTaskManager === 'function') {
            initTaskManager(patient.id);
        }

        // Inicializar sistema de notas de voz
        if (typeof initPatientVoiceNotes === 'function') {
            initPatientVoiceNotes(patient.id);
        }
    }, 100);
    
    return `
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientField(event, ${patient.id}, 'name')" style="cursor: pointer;">Nombre:</span>
            <span class="info-value" id="name-${patient.id}"
                  onclick="editPatientField(event, ${patient.id}, 'name')"
                  style="cursor: pointer;">${patient.name}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientField(event, ${patient.id}, 'age')" style="cursor: pointer;">Edad:</span>
            <span class="info-value" id="age-${patient.id}"
                  onclick="editPatientField(event, ${patient.id}, 'age')"
                  style="cursor: pointer;">${patient.age && patient.age > 0 ? `${patient.age} años` : 'n/a'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientField(event, ${patient.id}, 'rut')" style="cursor: pointer;">RUT:</span>
            <span class="info-value" id="rut-${patient.id}"
                  onclick="editPatientField(event, ${patient.id}, 'rut')"
                  style="cursor: pointer;">${patient.rut || 'Sin RUT'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientPrevision(event, ${patient.id})" style="cursor: pointer;">Previsión:</span>
            <span class="info-value" id="prevision-${patient.id}"
                  onclick="editPatientPrevision(event, ${patient.id})"
                  style="cursor: pointer;">${patient.prevision || 'No especificada'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientField(event, ${patient.id}, 'bed')" style="cursor: pointer;">Cama:</span>
            <span class="info-value" id="bed-${patient.id}"
                  onclick="editPatientField(event, ${patient.id}, 'bed')"
                  style="cursor: pointer;">${patient.bed || 'n/a'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientService(event, ${patient.id})" style="cursor: pointer;">Servicio:</span>
            <span class="info-value" id="service-${patient.id}"
                  onclick="editPatientService(event, ${patient.id})"
                  style="cursor: pointer;">
                ${patient.service ? `
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        background: ${SERVICES[patient.service]?.color || '#666'}15;
                        color: ${SERVICES[patient.service]?.color || '#666'};
                        border: 1px solid ${SERVICES[patient.service]?.color || '#666'}40;
                    ">
                        ${SERVICES[patient.service]?.icon || '🏥'} ${patient.service}
                    </span>
                ` : 'Sin servicio asignado'}
            </span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editAdmissionDate(event, ${patient.id})" style="cursor: pointer;">Fecha Ingreso:</span>
            <span class="info-value" id="admission-date-${patient.id}"
                  onclick="editAdmissionDate(event, ${patient.id})"
                  style="cursor: pointer;">${formatDate(patient.admissionDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editPatientDiagnosis(event, ${patient.id})" style="cursor: pointer;">Diagnóstico:</span>
            <span class="info-value" id="diagnosis-${patient.id}"
                  onclick="editPatientDiagnosis(event, ${patient.id})"
                  style="cursor: pointer;">${diagnosisText}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editDiagnosisDetails(event, ${patient.id})" style="cursor: pointer;">Descripción:</span>
            <span class="info-value" id="diagnosis-details-${patient.id}"
                  onclick="editDiagnosisDetails(event, ${patient.id})"
                  style="cursor: pointer;">${patient.diagnosisDetails || ''}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label" onclick="editAdmittedBy(event, ${patient.id})" style="cursor: pointer;">Médico Tratante:</span>
            <span class="info-value" id="admitted-by-${patient.id}"
                  onclick="editAdmittedBy(event, ${patient.id})"
                  style="cursor: pointer;">${patient.admittedBy}</span>
        </div>

        <!-- SECCIÓN: Sistema de Notas Simples -->
        <div style="border-top: 2px solid var(--border-color); padding-top: 2rem;">
            <h2 style="font-size: 1.2rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color);">HISTORIA CLÍNICA</h2>
            <div class="simple-notes-container">
                <!-- Historia Clínica - TEXTAREA SIMPLE -->
                <div class="note-section">
                    <textarea
                        id="historia-${patient.id}"
                        class="note-textarea"
                        rows="5"
                        placeholder="Escribe la historia clínica aquí..."
                        onblur="saveSimpleNote(${patient.id}, 'historia')"
                    >${patient.observations || ''}</textarea>
                </div>

                <!-- Mensaje de estado Historia Clínica -->
                <div id="save-status-${patient.id}" style="margin-top: 10px; text-align: center; color: green; display: none;">
                    ✓ Guardado automáticamente
                </div>
            </div>

        </div>

        <!-- NOTAS DE VOZ -->
        <div style="border-top: 2px solid var(--border-color); padding-top: 2rem;">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
                <button class="btn-new-voice-note" onclick="startRecordingVoiceNote(${patient.id})">
                    <img src="assets/icons/mic-microphone-icon.svg" alt="Micrófono" style="width: 16px; height: 16px; filter: brightness(0) invert(1);">
                    Nota de voz
                </button>
            </div>

            <!-- Indicador de grabación -->
            <div id="voice-notes-recording-${patient.id}" style="display: none; margin-bottom: 15px;"></div>

            <!-- Lista de notas de voz -->
            <div class="voice-notes-list-container" id="voice-notes-list-${patient.id}">
                <!-- Las notas se cargan dinámicamente aquí -->
            </div>
        </div>

        <!-- NUEVO SISTEMA: Tareas Pendientes con Checkboxes y Audio -->
        <div style="border-top: 2px solid var(--border-color); padding-top: 2rem;">
            <div class="task-manager-container" style="padding: 0;">
                <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
                    <button class="btn-new-task" onclick="showNewTaskModal(${patient.id})">
                        <span style="color: white; font-weight: bold;">+</span> Nueva Tarea
                    </button>
                </div>
                <div class="task-list-container" id="task-list-${patient.id}">
                    <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                        <p style="font-size: 2em; margin-bottom: 10px;">📋</p>
                        <p style="font-size: 1.1em; font-weight: 500; margin-bottom: 5px;">Cargando tareas...</p>
                    </div>
                </div>
            </div>

            <!-- Campos ocultos para mantener compatibilidad -->
            <input type="hidden" id="patientObservations" value="${patient.observations || ''}">
            <input type="hidden" id="patientPendingTasks" value="${patient.pendingTasks || ''}">
        </div>
    `;
}


// Render discharged data (info de egreso)
function renderDischargedData(patient) {
    // Variable circles comentada ya que no se usa - 08/08/2025
    return `
        <div class="patient-info-row">
            <span class="info-label">Fecha Egreso:</span>
            <span class="info-value">${formatDate(patient.dischargeDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Diagnóstico Egreso:</span>
            <span class="info-value">${patient.dischargeDiagnosis}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Autorizado por:</span>
            <span class="info-value">${patient.dischargedBy}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value">${patient.deceased ? '✝️ Fallecido' : 'Egresado'}</span>
        </div>
    `;
}

// Mostrar mensaje toast/notificación
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
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
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

// Cargar historial de observaciones
async function loadObservationHistory(patientId) {
    try {
        const observations = await apiRequest(`/patients/${patientId}/admission/observations`);
        if (observations.length > 0) {
            const latest = observations[0];
            document.getElementById('patientObservations').value = latest.observation;
            
            // Mostrar información de la última actualización
            const historyDiv = document.getElementById('observationHistory');
            if (historyDiv) {
                const date = new Date(latest.created_at);
                historyDiv.innerHTML = `Última actualización: ${date.toLocaleDateString('es-CL')} por ${latest.created_by}`;
            }
        }
    } catch (error) {
        console.log('Usando datos locales para observaciones');
    }
}

// Cargar historial de tareas
async function loadTaskHistory(patientId) {
    try {
        const tasks = await apiRequest(`/patients/${patientId}/admission/tasks`);
        if (tasks.length > 0) {
            const latest = tasks[0];
            document.getElementById('patientPendingTasks').value = latest.task;
            
            // Mostrar información de la última actualización
            const historyDiv = document.getElementById('taskHistory');
            if (historyDiv) {
                const date = new Date(latest.created_at);
                historyDiv.innerHTML = `Última actualización: ${date.toLocaleDateString('es-CL')} por ${latest.created_by}`;
            }
        }
    } catch (error) {
        console.log('Usando datos locales para tareas');
    }
}

// Función helper para obtener iniciales
function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Función helper para formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // FIX: Agregar T12:00:00 para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Función temporal simplificada para editar servicio
// (Se reemplazará cuando cargue el módulo completo pacientes-service-edit.js)
if (typeof window.editPatientService === 'undefined') {
    window.editPatientService = async function(event, patientId) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        const patient = patients.find(p => p.id === patientId);
        if (!patient) {
            showToast('Paciente no encontrado', 'error');
            return;
        }

        const services = ['', 'UCI', 'UTI', 'MQ', 'Urgencias', 'Interconsulta'];
        const currentService = patient.service || '';

        const newService = prompt(
            `Editar servicio hospitalario\n\n` +
            `Paciente: ${patient.name}\n` +
            `Servicio actual: ${currentService || 'Sin servicio'}\n\n` +
            `Opciones disponibles:\n` +
            `• UCI\n• UTI\n• MQ\n• Urgencias\n• Interconsulta\n\n` +
            `(Dejar vacío para quitar servicio)`,
            currentService
        );

        if (newService === null) return;

        const trimmedService = newService.trim();
        if (trimmedService && !services.includes(trimmedService)) {
            showToast('Servicio no válido. Use: UCI, UTI, MQ, Urgencias o Interconsulta', 'error');
            return;
        }

        if (trimmedService === currentService) {
            showToast('Sin cambios en el servicio', 'info');
            return;
        }

        try {
            const response = await apiRequest(`/patients/${patientId}/service`, {
                method: 'PUT',
                body: JSON.stringify({ service: trimmedService || null })
            });

            if (response.success) {
                patient.service = trimmedService || null;

                // Actualizar UI del modal
                const serviceElement = document.getElementById(`service-${patientId}`);
                if (serviceElement) {
                    if (trimmedService && window.HOSPITAL_SERVICES_CONFIG) {
                        const config = window.HOSPITAL_SERVICES_CONFIG[trimmedService];
                        if (config) {
                            serviceElement.innerHTML = `
                                <span style="
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 4px;
                                    padding: 2px 8px;
                                    border-radius: 12px;
                                    font-size: 12px;
                                    font-weight: 600;
                                    background: ${config.color}15;
                                    color: ${config.color};
                                    border: 1px solid ${config.color}40;
                                ">
                                    ${config.icon} ${trimmedService}
                                </span>
                            `;
                        } else {
                            serviceElement.textContent = trimmedService;
                        }
                    } else {
                        serviceElement.textContent = 'Sin servicio asignado';
                    }
                }

                // Actualizar lista de pacientes
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }

                showToast('Servicio actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando servicio:', error);
            showToast('Error al actualizar servicio', 'error');
        }
    };
}

// Exportar funciones necesarias para otros módulos
/**
 * Navegar a la página de egreso
 * @param {number} patientId - ID del paciente a egresar
 */
function goToDischarge(patientId) {
    console.log(`[UI] Navegando a egreso para paciente ${patientId}`);

    // Buscar datos del paciente
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        showToast('Paciente no encontrado', 'error');
        return;
    }

    // Validar RUT y Previsión antes de permitir egreso
    const missingFields = [];
    if (!patient.rut || patient.rut.trim() === '') {
        missingFields.push('RUT');
    }
    if (!patient.prevision || patient.prevision.trim() === '') {
        missingFields.push('Previsión');
    }

    if (missingFields.length > 0) {
        showToast(`No se puede egresar: falta ${missingFields.join(' y ')}. Complete estos datos primero.`, 'error');
        return;
    }

    // Confirmación antes de egresar
    if (!confirm('¿Está seguro que quiere egresar al paciente?')) {
        console.log('[UI] Egreso cancelado por el usuario');
        return;
    }

    // Cerrar modal antes de navegar
    if (typeof closeModal === 'function') {
        closeModal('patientModal');
    }

    // Navegar a página de egreso
    window.location.href = `egreso.html?patientId=${patientId}`;
}

// Exportar funciones globales
window.renderPatientCard = renderPatientCard;
window.renderPatientTable = renderPatientTable;
window.renderEmptyState = renderEmptyState;
window.renderAdmissionData = renderAdmissionData;
window.goToDischarge = goToDischarge;