// task-audio.js - Sistema de Audio para Tareas
// INTRANEURO - Sistema de Gestión Hospitalaria

// ========================================
// ESTADO GLOBAL
// ========================================
window.taskAudioState = {
    recorder: null,
    recordingTaskId: null,
    audioChunks: [],
    recordingStartTime: null,
    recordingInterval: null,
    currentAudio: null,  // Para controlar reproducción
    currentPlayingTaskId: null  // Para saber qué tarea está reproduciendo
};

// ========================================
// FUNCIONES DE GRABACIÓN
// ========================================

/**
 * Iniciar grabación de audio para una tarea
 */
async function recordTaskAudio(taskId, patientId) {
    try {
        console.log(`[TaskAudio] Iniciando grabación para tarea ${taskId}`);

        // Verificar que no haya otra grabación en curso
        if (window.taskAudioState.recorder && window.taskAudioState.recorder.state === 'recording') {
            showToast('Ya hay una grabación en curso', 'error');
            return;
        }

        // Solicitar permiso de micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Crear MediaRecorder
        const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });

        window.taskAudioState.recorder = recorder;
        window.taskAudioState.recordingTaskId = taskId;
        window.taskAudioState.audioChunks = [];
        window.taskAudioState.recordingStartTime = Date.now();

        // Eventos del recorder
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                window.taskAudioState.audioChunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            console.log('[TaskAudio] Grabación detenida');

            // Detener el stream del micrófono
            stream.getTracks().forEach(track => track.stop());

            // Procesar audio grabado
            const audioBlob = new Blob(window.taskAudioState.audioChunks, { type: 'audio/webm' });
            const duration = Math.floor((Date.now() - window.taskAudioState.recordingStartTime) / 1000);

            console.log(`[TaskAudio] Audio grabado: ${duration}s, ${(audioBlob.size / 1024).toFixed(2)}KB`);

            // Subir audio al servidor
            await uploadTaskAudio(taskId, patientId, audioBlob, duration);

            // Limpiar estado
            window.taskAudioState.audioChunks = [];
            window.taskAudioState.recordingTaskId = null;
            window.taskAudioState.recordingStartTime = null;
        };

        // Iniciar grabación
        recorder.start();

        // Actualizar UI para mostrar estado de grabación
        showRecordingUI(taskId, patientId);

        // Iniciar contador de tiempo
        startRecordingTimer(taskId);

        console.log('[TaskAudio] ✓ Grabación iniciada');

    } catch (error) {
        console.error('[TaskAudio] Error al iniciar grabación:', error);

        if (error.name === 'NotAllowedError') {
            showToast('Permiso de micrófono denegado', 'error');
        } else {
            showToast('Error al iniciar grabación', 'error');
        }
    }
}

/**
 * Detener grabación de audio
 */
function stopTaskAudioRecording() {
    if (!window.taskAudioState.recorder) {
        console.warn('[TaskAudio] No hay grabación activa');
        return;
    }

    console.log('[TaskAudio] Deteniendo grabación...');

    // Detener recorder
    if (window.taskAudioState.recorder.state === 'recording') {
        window.taskAudioState.recorder.stop();
    }

    // Detener contador
    stopRecordingTimer();

    console.log('[TaskAudio] ✓ Grabación detenida');
}

/**
 * Cancelar grabación sin guardar
 */
function cancelTaskAudioRecording(taskId, patientId) {
    console.log('[TaskAudio] Cancelando grabación...');

    // Detener recorder sin guardar
    if (window.taskAudioState.recorder && window.taskAudioState.recorder.state === 'recording') {
        const recorder = window.taskAudioState.recorder;

        // Remover evento onstop temporal para evitar upload
        recorder.onstop = () => {
            // Detener stream
            if (recorder.stream) {
                recorder.stream.getTracks().forEach(track => track.stop());
            }
        };

        recorder.stop();
    }

    // Limpiar estado
    window.taskAudioState.audioChunks = [];
    window.taskAudioState.recordingTaskId = null;
    window.taskAudioState.recordingStartTime = null;
    window.taskAudioState.recorder = null;

    // Detener contador
    stopRecordingTimer();

    // Volver a renderizar para ocultar UI de grabación
    renderTaskList(patientId);

    showToast('Grabación cancelada', 'info');
}

// ========================================
// FUNCIONES DE REPRODUCCIÓN
// ========================================

/**
 * Reproducir audio de una tarea
 */
function playTaskAudio(taskId) {
    const task = window.taskManagerState.tasks.find(t => t.id === taskId);

    if (!task || !task.audioNote || !task.audioNote.url) {
        console.error('[TaskAudio] No hay audio para esta tarea');
        showToast('No hay audio disponible', 'error');
        return;
    }

    // Si ya hay un audio reproduciéndose para esta tarea, pausarlo
    if (window.taskAudioState.currentAudio && window.taskAudioState.currentPlayingTaskId === taskId) {
        if (!window.taskAudioState.currentAudio.paused) {
            window.taskAudioState.currentAudio.pause();
            updatePlayButton(taskId, false);
            return;
        } else {
            // Reanudar audio pausado
            window.taskAudioState.currentAudio.play();
            updatePlayButton(taskId, true);
            return;
        }
    }

    console.log(`[TaskAudio] Reproduciendo audio: ${task.audioNote.url}`);

    // Detener audio previo si existe
    if (window.taskAudioState.currentAudio) {
        const prevTaskId = window.taskAudioState.currentPlayingTaskId;
        window.taskAudioState.currentAudio.pause();
        if (prevTaskId) {
            updatePlayButton(prevTaskId, false);
        }
    }

    // Crear nuevo elemento de audio
    const audio = new Audio(task.audioNote.url);
    window.taskAudioState.currentAudio = audio;
    window.taskAudioState.currentPlayingTaskId = taskId;

    // Actualizar botón a pause
    updatePlayButton(taskId, true);

    // Reproducir
    audio.play().catch(error => {
        console.error('[TaskAudio] Error al reproducir audio:', error);
        showToast('Error al reproducir audio', 'error');
        updatePlayButton(taskId, false);
    });

    audio.onended = () => {
        console.log('[TaskAudio] Reproducción finalizada');
        updatePlayButton(taskId, false);
        window.taskAudioState.currentPlayingTaskId = null;
    };

    audio.onpause = () => {
        if (audio.currentTime === audio.duration || audio.currentTime === 0) {
            updatePlayButton(taskId, false);
        }
    };
}

/**
 * Actualizar botón de play/pause
 */
function updatePlayButton(taskId, isPlaying) {
    const button = document.getElementById(`play-btn-${taskId}`);
    if (!button) return;

    const task = window.taskManagerState.tasks.find(t => t.id === taskId);
    if (!task || !task.audioNote) return;

    if (isPlaying) {
        button.innerHTML = `<span style="font-size: 14px;">⏸</span> ${formatDuration(task.audioNote.duration)}`;
        button.title = 'Pausar nota de voz';
    } else {
        button.innerHTML = `<span style="font-size: 14px;">►</span> ${formatDuration(task.audioNote.duration)}`;
        button.title = 'Reproducir nota de voz';
    }
}

/**
 * Pausar audio en reproducción
 */
function pauseTaskAudio() {
    if (window.taskAudioState.currentAudio) {
        window.taskAudioState.currentAudio.pause();
        console.log('[TaskAudio] Audio pausado');
    }
}

// ========================================
// FUNCIONES DE ELIMINACIÓN
// ========================================

/**
 * Eliminar audio de una tarea
 */
async function deleteTaskAudio(taskId, patientId) {
    const task = window.taskManagerState.tasks.find(t => t.id === taskId);

    if (!task || !task.audioNote) {
        console.error('[TaskAudio] No hay audio para eliminar');
        return;
    }

    if (!confirm('¿Eliminar nota de voz?')) {
        return;
    }

    console.log(`[TaskAudio] Eliminando audio de tarea ${taskId}`);

    // Eliminar audioNote de la tarea
    task.audioNote = null;

    // Guardar cambios en backend
    await saveTasksToBackend(patientId);

    // Re-renderizar lista
    renderTaskList(patientId);

    showToast('Audio eliminado', 'success');

    // TODO: Eliminar archivo físico del servidor si es necesario
    // await deleteAudioFile(audioUrl);
}

// ========================================
// FUNCIONES DE UPLOAD
// ========================================

/**
 * Subir audio al servidor
 */
async function uploadTaskAudio(taskId, patientId, audioBlob, duration) {
    try {
        console.log(`[TaskAudio] Subiendo audio para tarea ${taskId}...`);

        // Crear FormData
        const formData = new FormData();
        const filename = `task-${taskId}-${Date.now()}.webm`;
        formData.append('audio', audioBlob, filename);
        formData.append('patientId', patientId);
        formData.append('taskId', taskId);
        formData.append('duration', duration);

        // Subir al servidor
        const response = await fetch('/api/patients/upload-task-audio', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();

        console.log('[TaskAudio] ✓ Audio subido:', result);

        // Actualizar tarea con URL del audio
        const task = window.taskManagerState.tasks.find(t => t.id === taskId);
        if (task) {
            task.audioNote = {
                url: result.url || `/uploads/tasks/${filename}`,
                duration: duration,
                createdAt: new Date().toISOString()
            };

            // Guardar en backend
            await saveTasksToBackend(patientId);

            // Re-renderizar lista
            renderTaskList(patientId);

            showToast('Audio guardado correctamente', 'success');
        }

    } catch (error) {
        console.error('[TaskAudio] Error subiendo audio:', error);
        showToast('Error al guardar audio', 'error');
    }
}

// ========================================
// FUNCIONES UI
// ========================================

/**
 * Mostrar UI de grabación activa
 */
function showRecordingUI(taskId, patientId) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskItem) return;

    const actionsDiv = taskItem.querySelector('.task-actions');
    if (!actionsDiv) return;

    // Reemplazar botones por controles de grabación
    actionsDiv.innerHTML = `
        <div class="task-recording-controls">
            <span class="task-recording-time" id="recording-time-${taskId}">0:00</span>
            <button class="btn btn-danger" onclick="stopTaskAudioRecording()" style="padding: 6px 12px; font-size: 0.9em;">
                ⏹️ Detener
            </button>
            <button class="btn btn-secondary" onclick="cancelTaskAudioRecording('${taskId}', ${patientId})" style="padding: 6px 12px; font-size: 0.9em;">
                ✖️ Cancelar
            </button>
        </div>
    `;

    // Agregar clase de grabación al item
    taskItem.classList.add('recording');
}

/**
 * Iniciar contador de tiempo de grabación
 */
function startRecordingTimer(taskId) {
    const timerElement = document.getElementById(`recording-time-${taskId}`);
    if (!timerElement) return;

    let seconds = 0;

    window.taskAudioState.recordingInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

        // Límite de 5 minutos
        if (seconds >= 300) {
            stopTaskAudioRecording();
            showToast('Tiempo máximo de grabación alcanzado (5 min)', 'info');
        }
    }, 1000);
}

/**
 * Detener contador de tiempo
 */
function stopRecordingTimer() {
    if (window.taskAudioState.recordingInterval) {
        clearInterval(window.taskAudioState.recordingInterval);
        window.taskAudioState.recordingInterval = null;
    }
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================
window.recordTaskAudio = recordTaskAudio;
window.stopTaskAudioRecording = stopTaskAudioRecording;
window.cancelTaskAudioRecording = cancelTaskAudioRecording;
window.playTaskAudio = playTaskAudio;
window.pauseTaskAudio = pauseTaskAudio;
window.deleteTaskAudio = deleteTaskAudio;
window.uploadTaskAudio = uploadTaskAudio;
window.updatePlayButton = updatePlayButton;

console.log('[TaskAudio] ✓ Módulo cargado');
