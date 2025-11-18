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
        showToast('La tarea no puede estar vacía', 'error');
        return null;
    }

    const newTask = {
        id: generateTaskId(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser(),
        completed: false,
        completedAt: null,
        completedBy: null,
        audioNote: null
    };

    // Agregar a la lista de tareas
    window.taskManagerState.tasks.unshift(newTask); // Agregar al inicio

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
    if (!confirm(`¿Eliminar tarea "${task.text}"?`)) {
        return;
    }

    // Si tiene audio, eliminar archivo (TO-DO: implementar endpoint)
    if (task.audioNote && task.audioNote.url) {
        // deleteAudioFile(task.audioNote.url);
        console.log(`[TaskManager] Audio asociado a eliminar: ${task.audioNote.url}`);
    }

    // Eliminar de la lista
    window.taskManagerState.tasks.splice(taskIndex, 1);

    console.log(`[TaskManager] Tarea ${taskId} eliminada`);

    // Guardar en backend
    saveTasksToBackend(patientId);

    // Re-renderizar lista
    renderTaskList(patientId);

    showToast('Tarea eliminada', 'success');
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
        showToast('Error al guardar tareas', 'error');
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
        showToast('Error al cargar tareas', 'error');
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

    // Si no hay tareas, mostrar mensaje vacío
    if (tasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <p style="font-size: 2em; margin-bottom: 10px;">📋</p>
                <p style="font-size: 1.1em; font-weight: 500; margin-bottom: 5px;">No hay tareas pendientes</p>
                <p style="font-size: 0.9em;">Crea una nueva tarea usando el botón superior</p>
            </div>
        `;
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

    // Renderizar audio si existe
    const audioSection = task.audioNote
        ? `<button class="task-audio-play-btn"
                   onclick="playTaskAudio('${task.id}')"
                   title="Reproducir nota de voz">
                ▶️ ${formatDuration(task.audioNote.duration)}
           </button>
           <button class="task-audio-delete-btn"
                   onclick="deleteTaskAudio('${task.id}', ${patientId})"
                   title="Eliminar audio">
                🗑️
           </button>`
        : `<button class="task-audio-record-btn"
                   onclick="recordTaskAudio('${task.id}', ${patientId})"
                   title="Grabar nota de voz">
                🎙️ Grabar
           </button>`;

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
            </div>
            <div class="task-actions">
                ${audioSection}
                <button class="task-delete-btn"
                        onclick="deleteTask('${task.id}', ${patientId})"
                        title="Eliminar tarea">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// ========================================
// FUNCIONES UI - MODALES Y DIÁLOGOS
// ========================================

/**
 * Mostrar modal para crear nueva tarea
 */
function showNewTaskModal(patientId) {
    const modalHtml = `
        <div id="newTaskModal" class="modal active" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Nueva Tarea Pendiente</h3>
                    <button class="close-modal" onclick="closeNewTaskModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <label for="newTaskText" style="display: block; margin-bottom: 8px; font-weight: 500;">
                        Descripción de la tarea:
                    </label>
                    <textarea
                        id="newTaskText"
                        rows="4"
                        placeholder="Ej: Ajustar dosis de medicamento según evolución"
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px;"
                        autofocus
                    ></textarea>
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeNewTaskModal()" class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button onclick="confirmCreateTask(${patientId})" class="btn btn-primary">
                        Crear Tarea
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
    const modal = document.getElementById('newTaskModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Confirmar creación de tarea
 */
function confirmCreateTask(patientId) {
    const textarea = document.getElementById('newTaskText');
    const text = textarea?.value.trim();

    if (!text) {
        showToast('La descripción no puede estar vacía', 'error');
        return;
    }

    // Crear tarea
    createTask(text, patientId);

    // Cerrar modal
    closeNewTaskModal();

    // Mostrar confirmación
    showToast('Tarea creada correctamente', 'success');
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
 * Formatear duración de audio en segundos a mm:ss
 */
function formatDuration(seconds) {
    if (!seconds) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, '0')}`;
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

console.log('[TaskManager] ✓ Módulo cargado');
