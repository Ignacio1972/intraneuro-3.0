// task-manager.js - Sistema de Tareas Pendientes con Audio
// INTRANEURO - Sistema de Gestión Hospitalaria

// ========================================
// ESTRUCTURA DE DATOS
// ========================================
// Las tareas se guardan como JSON en el campo "task" de la tabla pending_tasks
// Estructura:
// {
//   tasks: [
//     {
//       id: "task-1731934200000-abc123",
//       text: "Ajustar dosis de medicamento",
//       createdAt: "2025-11-18T10:30:00.000Z",
//       createdBy: "Dr. González",
//       completed: false,
//       completedAt: null,
//       completedBy: null,
//       audioNote: {
//         url: "/uploads/tasks/audio-task-123.webm",
//         duration: 45,
//         createdAt: "2025-11-18T10:35:00.000Z"
//       }
//     }
//   ]
// }

// ========================================
// ESTADO GLOBAL
// ========================================
window.taskManagerState = {
    currentPatientId: null,
    tasks: [],
    isLoading: false
};

// Estado temporal para audio durante creación de nueva tarea
window.newTaskAudioState = {
    recorder: null,
    stream: null,
    audioBlob: null,
    duration: 0,
    audioChunks: [],
    recordingStartTime: null,
    recordingInterval: null,
    audioUrl: null  // URL temporal para preview
};

// ========================================
// FUNCIONES CORE - GESTIÓN DE TAREAS
// ========================================

/**
 * Inicializar el sistema de tareas para un paciente
 */
async function initTaskManager(patientId) {
    console.log(`[TaskManager] Inicializando para paciente ${patientId}`);
    window.taskManagerState.currentPatientId = patientId;
    await loadTasksFromBackend(patientId);
    renderTaskList(patientId);
}

/**
 * Generar ID único para una tarea
 */
function generateTaskId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task-${timestamp}-${random}`;
}

/**
 * Obtener usuario actual de la sesión
 */
function getCurrentUser() {
    return sessionStorage.getItem('currentUser') || 'Usuario';
}

/**
 * Crear nueva tarea
 */
function createTask(text, patientId) {
    if (!text || text.trim() === '') {
        showToast('El pendiente no puede estar vacío', 'error');
        return null;
    }

    const newTask = {
        id: generateTaskId(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser(),
        completed: false,
        completedAt: null,
        completedBy: null
    };

    // Agregar a la lista de tareas
    window.taskManagerState.tasks.push(newTask); // Agregar al final (cronología ascendente)

    console.log(`[TaskManager] Tarea creada:`, newTask);

    // Guardar en backend
    saveTasksToBackend(patientId);

    // Re-renderizar lista
    renderTaskList(patientId);

    return newTask;
}

/**
 * Toggle completado de una tarea
 */
function toggleTaskComplete(taskId, patientId) {
    const task = window.taskManagerState.tasks.find(t => t.id === taskId);

    if (!task) {
        console.error(`[TaskManager] Tarea ${taskId} no encontrada`);
        return;
    }

    // Toggle estado
    task.completed = !task.completed;

    if (task.completed) {
        task.completedAt = new Date().toISOString();
        task.completedBy = getCurrentUser();
    } else {
        task.completedAt = null;
        task.completedBy = null;
    }

    console.log(`[TaskManager] Tarea ${taskId} ${task.completed ? 'completada' : 'pendiente'}`);

    // Guardar en backend
    saveTasksToBackend(patientId);

    // Re-renderizar lista
    renderTaskList(patientId);
}

/**
 * Eliminar una tarea
 */
function deleteTask(taskId, patientId) {
    const taskIndex = window.taskManagerState.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        console.error(`[TaskManager] Tarea ${taskId} no encontrada`);
        return;
    }

    const task = window.taskManagerState.tasks[taskIndex];

    // Confirmar eliminación
    if (!confirm(`¿Eliminar pendiente "${task.text}"?`)) {
        return;
    }

    // Eliminar de la lista
    window.taskManagerState.tasks.splice(taskIndex, 1);

    console.log(`[TaskManager] Tarea ${taskId} eliminada`);

    // Guardar en backend
    saveTasksToBackend(patientId);

    // Re-renderizar lista
    renderTaskList(patientId);

    showToast('Pendiente eliminado', 'success');
}

// ========================================
// FUNCIONES DE GUARDADO/CARGA
// ========================================

/**
 * Guardar tareas en el backend
 */
async function saveTasksToBackend(patientId) {
    try {
        const tasksData = {
            tasks: window.taskManagerState.tasks
        };

        const payload = JSON.stringify(tasksData);

        console.log(`[TaskManager] Guardando ${window.taskManagerState.tasks.length} tareas...`);

        const response = await apiRequest(`/patients/${patientId}/admission/tasks`, {
            method: 'POST',
            body: JSON.stringify({
                task: payload,
                created_by: getCurrentUser()
            })
        });

        console.log(`[TaskManager] ✓ Tareas guardadas correctamente`);
        return response;

    } catch (error) {
        console.error('[TaskManager] Error guardando tareas:', error);
        showToast('Error al guardar pendientes', 'error');
        throw error;
    }
}

/**
 * Cargar tareas desde el backend
 */
async function loadTasksFromBackend(patientId) {
    try {
        window.taskManagerState.isLoading = true;

        console.log(`[TaskManager] Cargando tareas del paciente ${patientId}...`);

        const response = await apiRequest(`/patients/${patientId}/admission/tasks`);

        // La respuesta es un array de registros de tareas
        // Buscamos el más reciente que tenga formato JSON válido
        if (response && response.length > 0) {
            for (let taskRecord of response) {
                if (taskRecord.task && taskRecord.task.trim() !== '') {
                    try {
                        const parsed = JSON.parse(taskRecord.task);

                        // Verificar si tiene la estructura nueva
                        if (parsed.tasks && Array.isArray(parsed.tasks)) {
                            window.taskManagerState.tasks = parsed.tasks;
                            console.log(`[TaskManager] ✓ ${parsed.tasks.length} tareas cargadas`);
                            window.taskManagerState.isLoading = false;
                            return;
                        }
                    } catch (e) {
                        // No es JSON válido, continuar buscando
                        continue;
                    }
                }
            }
        }

        // Si llegamos aquí, no hay tareas o no tienen el formato correcto
        window.taskManagerState.tasks = [];
        console.log(`[TaskManager] No hay tareas previas, iniciando vacío`);

    } catch (error) {
        console.error('[TaskManager] Error cargando tareas:', error);
        window.taskManagerState.tasks = [];
        showToast('Error al cargar pendientes', 'error');
    } finally {
        window.taskManagerState.isLoading = false;
    }
}

// ========================================
// FUNCIONES DE RENDERIZADO
// ========================================

/**
 * Renderizar lista completa de tareas
 */
function renderTaskList(patientId) {
    const container = document.getElementById(`task-list-${patientId}`);

    if (!container) {
        console.warn(`[TaskManager] Container task-list-${patientId} no encontrado`);
        return;
    }

    const tasks = window.taskManagerState.tasks;

    // Si no hay tareas, dejar vacío (no mostrar mensaje)
    if (tasks.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Renderizar cada tarea
    const tasksHtml = tasks.map(task => renderTaskItem(task, patientId)).join('');

    container.innerHTML = tasksHtml;

    // Actualizar contador de tareas
    const countBadge = document.getElementById(`task-count-${patientId}`);
    if (countBadge) {
        const pendingCount = tasks.filter(t => !t.completed).length;
        countBadge.textContent = pendingCount;
    }

    console.log(`[TaskManager] ${tasks.length} tareas renderizadas`);
}

/**
 * Renderizar un item de tarea individual
 */
function renderTaskItem(task, patientId) {
    const isCompleted = task.completed;
    const checkboxIcon = isCompleted ? '☑' : '☐';
    const completedClass = isCompleted ? 'task-completed' : '';

    // Formatear fechas
    const createdDate = formatTaskDate(task.createdAt);
    const completedInfo = task.completedAt
        ? `<div class="task-completed-info">
             ✓ Completada: ${formatTaskDate(task.completedAt)} por ${task.completedBy}
           </div>`
        : '';

    // Renderizar controles de audio según estado
    let audioControls = '';
    if (task.audioNote && task.audioNote.url) {
        // Tiene audio guardado - mostrar reproductor compacto
        const duration = formatDuration(task.audioNote.duration);
        audioControls = `
            <div class="task-audio-player">
                <button class="task-audio-play-btn"
                        id="play-btn-${task.id}"
                        onclick="playTaskAudio('${task.id}')"
                        title="Reproducir nota de voz">
                    <span style="font-size: 14px;">►</span> ${duration}
                </button>
                <button class="task-audio-delete-btn"
                        onclick="deleteTaskAudio('${task.id}', ${patientId})"
                        title="Eliminar nota de voz">
                    ✕
                </button>
            </div>
        `;
    } else if (!isCompleted) {
        // Sin audio y no completada - mostrar botón para grabar
        audioControls = `
            <button class="task-audio-record-btn"
                    onclick="recordTaskAudio('${task.id}', ${patientId})"
                    title="Agregar nota de voz">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                </svg>
            </button>
        `;
    }

    return `
        <div class="task-item ${completedClass}" data-task-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTaskComplete('${task.id}', ${patientId})">
                ${checkboxIcon}
            </div>
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    ${createdDate} - ${escapeHtml(task.createdBy)}
                </div>
                ${completedInfo}
                ${audioControls}
            </div>
            <div class="task-actions">
                <button class="task-delete-btn"
                        onclick="deleteTask('${task.id}', ${patientId})"
                        title="Eliminar pendiente">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * Formatear duración de audio en formato m:ss
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========================================
// FUNCIONES UI - MODALES Y DIÁLOGOS
// ========================================

/**
 * Mostrar modal para crear nueva tarea
 */
function showNewTaskModal(patientId) {
    // Limpiar estado de audio previo
    cleanupNewTaskAudio();

    const modalHtml = `
        <div id="newTaskModal" class="modal active" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 700px !important; width: 90% !important; padding: 2rem;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                    Nuevo Pendiente
                </h3>
                <label for="newTaskText" style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-secondary); font-size: 14px;">
                    Descripción del pendiente:
                </label>
                <textarea
                    id="newTaskText"
                    rows="4"
                    placeholder="Ej: Ajustar dosis de medicamento según evolución"
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px; margin-bottom: 1rem;"
                    autofocus
                ></textarea>

                <!-- Sección de audio -->
                <div class="new-task-audio-section" id="newTaskAudioSection">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-secondary); font-size: 14px;">
                        Nota de voz (opcional):
                    </label>
                    <div id="newTaskAudioControls">
                        <button type="button" class="btn-record-new-task" onclick="startNewTaskRecording()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                            </svg>
                            Agregar nota de voz
                        </button>
                    </div>
                </div>

                <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" onclick="closeNewTaskModal()" class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button type="button" onclick="confirmCreateTask(${patientId})" class="btn btn-primary">
                        Crear Pendiente
                    </button>
                </div>
            </div>
        </div>
    `;

    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Focus en textarea
    setTimeout(() => {
        document.getElementById('newTaskText')?.focus();
    }, 100);
}

/**
 * Cerrar modal de nueva tarea
 */
function closeNewTaskModal() {
    // Limpiar estado de audio temporal
    cleanupNewTaskAudio();

    const modal = document.getElementById('newTaskModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Confirmar creación de tarea
 */
async function confirmCreateTask(patientId) {
    const textarea = document.getElementById('newTaskText');
    const text = textarea?.value.trim();
    const hasAudio = window.newTaskAudioState.audioBlob !== null;

    // Validar que haya texto O audio
    if (!text && !hasAudio) {
        showToast('Debe agregar descripción o nota de voz', 'error');
        return;
    }

    // Usar texto o placeholder si solo hay audio
    const taskText = text || '🎤 Nota de voz';

    // Crear tarea
    const newTask = createTask(taskText, patientId);

    // Si hay audio grabado, subirlo
    if (hasAudio && newTask) {
        try {
            await uploadTaskAudio(
                newTask.id,
                patientId,
                window.newTaskAudioState.audioBlob,
                window.newTaskAudioState.duration
            );
        } catch (error) {
            console.error('[TaskManager] Error al subir audio:', error);
            // La tarea se creó, solo falló el audio
        }
    }

    // Limpiar estado de audio (sin cerrar modal aún)
    if (window.newTaskAudioState.audioUrl) {
        URL.revokeObjectURL(window.newTaskAudioState.audioUrl);
    }
    window.newTaskAudioState.audioBlob = null;
    window.newTaskAudioState.audioUrl = null;
    window.newTaskAudioState.duration = 0;

    // Cerrar modal
    closeNewTaskModal();

    // Mostrar confirmación
    showToast('Pendiente creado', 'success');
}

// ========================================
// FUNCIONES DE GRABACIÓN PARA MODAL DE NUEVA TAREA
// ========================================

/**
 * Iniciar grabación de audio para nueva tarea
 */
async function startNewTaskRecording() {
    try {
        console.log('[TaskManager] Iniciando grabación para nueva tarea');

        // Verificar que no haya otra grabación en curso
        if (window.newTaskAudioState.recorder && window.newTaskAudioState.recorder.state === 'recording') {
            showToast('Ya hay una grabación en curso', 'error');
            return;
        }

        // Solicitar permiso de micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Crear MediaRecorder
        const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });

        window.newTaskAudioState.recorder = recorder;
        window.newTaskAudioState.stream = stream;
        window.newTaskAudioState.audioChunks = [];
        window.newTaskAudioState.recordingStartTime = Date.now();

        // Eventos del recorder
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                window.newTaskAudioState.audioChunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            console.log('[TaskManager] Grabación de nueva tarea detenida');

            // Detener el stream del micrófono
            stream.getTracks().forEach(track => track.stop());

            // Procesar audio grabado
            const audioBlob = new Blob(window.newTaskAudioState.audioChunks, { type: 'audio/webm' });
            const duration = Math.floor((Date.now() - window.newTaskAudioState.recordingStartTime) / 1000);

            // Guardar en estado
            window.newTaskAudioState.audioBlob = audioBlob;
            window.newTaskAudioState.duration = duration;
            window.newTaskAudioState.audioUrl = URL.createObjectURL(audioBlob);

            console.log(`[TaskManager] Audio grabado: ${duration}s, ${(audioBlob.size / 1024).toFixed(2)}KB`);

            // Mostrar reproductor de preview
            showNewTaskAudioPreview();
        };

        // Iniciar grabación
        recorder.start();

        // Actualizar UI para mostrar estado de grabación
        showNewTaskRecordingUI();

        // Iniciar contador de tiempo
        startNewTaskRecordingTimer();

        console.log('[TaskManager] ✓ Grabación iniciada');

    } catch (error) {
        console.error('[TaskManager] Error al iniciar grabación:', error);

        if (error.name === 'NotAllowedError') {
            showToast('Permiso de micrófono denegado', 'error');
        } else {
            showToast('Error al iniciar grabación', 'error');
        }
    }
}

/**
 * Detener grabación de nueva tarea
 */
function stopNewTaskRecording() {
    if (!window.newTaskAudioState.recorder) {
        console.warn('[TaskManager] No hay grabación activa');
        return;
    }

    console.log('[TaskManager] Deteniendo grabación...');

    // Detener recorder
    if (window.newTaskAudioState.recorder.state === 'recording') {
        window.newTaskAudioState.recorder.stop();
    }

    // Detener contador
    stopNewTaskRecordingTimer();

    console.log('[TaskManager] ✓ Grabación detenida');
}

/**
 * Cancelar grabación sin guardar
 */
function cancelNewTaskRecording() {
    console.log('[TaskManager] Cancelando grabación...');

    // Detener stream del micrófono
    if (window.newTaskAudioState.stream) {
        window.newTaskAudioState.stream.getTracks().forEach(track => track.stop());
    }

    // Detener recorder sin guardar
    if (window.newTaskAudioState.recorder && window.newTaskAudioState.recorder.state === 'recording') {
        const recorder = window.newTaskAudioState.recorder;
        recorder.onstop = () => {
            console.log('[TaskManager] Grabación cancelada - no se guarda');
        };
        recorder.stop();
    }

    // Detener contador
    stopNewTaskRecordingTimer();

    // Limpiar estado parcialmente (mantener el modal abierto)
    window.newTaskAudioState.audioChunks = [];
    window.newTaskAudioState.recorder = null;
    window.newTaskAudioState.stream = null;
    window.newTaskAudioState.recordingStartTime = null;

    // Volver a mostrar botón de grabación
    showNewTaskInitialAudioUI();

    showToast('Grabación cancelada', 'info');
}

/**
 * Eliminar audio grabado
 */
function deleteNewTaskAudio() {
    console.log('[TaskManager] Eliminando audio grabado');

    // Revocar URL temporal
    if (window.newTaskAudioState.audioUrl) {
        URL.revokeObjectURL(window.newTaskAudioState.audioUrl);
    }

    // Limpiar estado de audio
    window.newTaskAudioState.audioBlob = null;
    window.newTaskAudioState.duration = 0;
    window.newTaskAudioState.audioUrl = null;

    // Volver a mostrar botón de grabación
    showNewTaskInitialAudioUI();

    showToast('Audio eliminado', 'info');
}

/**
 * Reproducir/Pausar preview del audio grabado
 */
function playNewTaskAudio() {
    if (!window.newTaskAudioState.audioUrl) {
        console.warn('[TaskManager] No hay audio para reproducir');
        return;
    }

    const playBtn = document.getElementById('newTaskAudioPlayBtn');

    // Si ya hay un audio reproduciéndose
    if (window.newTaskAudioState.previewAudio) {
        if (!window.newTaskAudioState.previewAudio.paused) {
            window.newTaskAudioState.previewAudio.pause();
            if (playBtn) playBtn.innerHTML = '► Reproducir';
            return;
        } else {
            window.newTaskAudioState.previewAudio.play();
            if (playBtn) playBtn.innerHTML = '⏸ Pausar';
            return;
        }
    }

    // Crear nuevo elemento de audio
    const audio = new Audio(window.newTaskAudioState.audioUrl);
    window.newTaskAudioState.previewAudio = audio;

    audio.play();
    if (playBtn) playBtn.innerHTML = '⏸ Pausar';

    audio.onended = () => {
        if (playBtn) playBtn.innerHTML = '► Reproducir';
    };
}

/**
 * Limpiar todo el estado de audio temporal
 */
function cleanupNewTaskAudio() {
    // Revocar URL temporal
    if (window.newTaskAudioState.audioUrl) {
        URL.revokeObjectURL(window.newTaskAudioState.audioUrl);
    }

    // Detener preview si está reproduciéndose
    if (window.newTaskAudioState.previewAudio) {
        window.newTaskAudioState.previewAudio.pause();
        window.newTaskAudioState.previewAudio = null;
    }

    // Detener stream si está activo
    if (window.newTaskAudioState.stream) {
        window.newTaskAudioState.stream.getTracks().forEach(t => t.stop());
    }

    // Detener recorder si está activo
    if (window.newTaskAudioState.recorder && window.newTaskAudioState.recorder.state === 'recording') {
        window.newTaskAudioState.recorder.stop();
    }

    // Detener timer
    stopNewTaskRecordingTimer();

    // Resetear estado
    window.newTaskAudioState = {
        recorder: null,
        stream: null,
        audioBlob: null,
        duration: 0,
        audioChunks: [],
        recordingStartTime: null,
        recordingInterval: null,
        audioUrl: null
    };
}

// ========================================
// FUNCIONES UI PARA GRABACIÓN EN MODAL
// ========================================

/**
 * Mostrar UI inicial (botón de grabación)
 */
function showNewTaskInitialAudioUI() {
    const container = document.getElementById('newTaskAudioControls');
    if (!container) return;

    container.innerHTML = `
        <button type="button" class="btn-record-new-task" onclick="startNewTaskRecording()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
            </svg>
            Agregar nota de voz
        </button>
    `;
}

/**
 * Mostrar UI de grabación activa
 */
function showNewTaskRecordingUI() {
    const container = document.getElementById('newTaskAudioControls');
    if (!container) return;

    container.innerHTML = `
        <div class="new-task-recording-active">
            <span class="new-task-recording-indicator"></span>
            <span class="new-task-recording-timer" id="newTaskRecordingTime">0:00</span>
            <button type="button" class="btn btn-danger" onclick="stopNewTaskRecording()" style="padding: 6px 12px; font-size: 0.9em;">
                ⏹️ Detener
            </button>
            <button type="button" class="btn btn-secondary" onclick="cancelNewTaskRecording()" style="padding: 6px 12px; font-size: 0.9em;">
                ✖️ Cancelar
            </button>
        </div>
    `;
}

/**
 * Mostrar reproductor de preview
 */
function showNewTaskAudioPreview() {
    const container = document.getElementById('newTaskAudioControls');
    if (!container) return;

    const duration = formatDuration(window.newTaskAudioState.duration);

    container.innerHTML = `
        <div class="new-task-audio-preview">
            <button type="button" class="btn-play-new-task" id="newTaskAudioPlayBtn" onclick="playNewTaskAudio()">
                ► Reproducir
            </button>
            <span class="new-task-audio-duration">${duration}</span>
            <button type="button" class="btn-delete-new-task" onclick="deleteNewTaskAudio()" title="Eliminar audio">
                🗑️
            </button>
        </div>
    `;
}

/**
 * Iniciar contador de tiempo de grabación
 */
function startNewTaskRecordingTimer() {
    const timerElement = document.getElementById('newTaskRecordingTime');
    if (!timerElement) return;

    let seconds = 0;

    window.newTaskAudioState.recordingInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

        // Límite de 5 minutos
        if (seconds >= 300) {
            stopNewTaskRecording();
            showToast('Tiempo máximo de grabación alcanzado (5 min)', 'info');
        }
    }, 1000);
}

/**
 * Detener contador de tiempo
 */
function stopNewTaskRecordingTimer() {
    if (window.newTaskAudioState.recordingInterval) {
        clearInterval(window.newTaskAudioState.recordingInterval);
        window.newTaskAudioState.recordingInterval = null;
    }
}

// ========================================
// FUNCIONES HELPER
// ========================================

/**
 * Formatear fecha para mostrar
 */
function formatTaskDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Formato: 18/11/2025 10:30
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================
window.initTaskManager = initTaskManager;
window.createTask = createTask;
window.toggleTaskComplete = toggleTaskComplete;
window.deleteTask = deleteTask;
window.showNewTaskModal = showNewTaskModal;
window.closeNewTaskModal = closeNewTaskModal;
window.confirmCreateTask = confirmCreateTask;
window.renderTaskList = renderTaskList;
window.saveTasksToBackend = saveTasksToBackend;

// Funciones de grabación para modal de nueva tarea
window.startNewTaskRecording = startNewTaskRecording;
window.stopNewTaskRecording = stopNewTaskRecording;
window.cancelNewTaskRecording = cancelNewTaskRecording;
window.deleteNewTaskAudio = deleteNewTaskAudio;
window.playNewTaskAudio = playNewTaskAudio;
window.cleanupNewTaskAudio = cleanupNewTaskAudio;

console.log('[TaskManager] ✓ Módulo cargado');
