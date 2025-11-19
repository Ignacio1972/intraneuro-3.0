// patient-voice-notes.js - Sistema de Notas de Voz para Pacientes
// INTRANEURO - Sistema de Gestión Hospitalaria

// ========================================
// ESTADO GLOBAL
// ========================================
window.patientVoiceNotesState = {
    recorder: null,
    recordingPatientId: null,
    audioChunks: [],
    recordingStartTime: null,
    recordingInterval: null,
    currentAudio: null,
    currentPlayingNoteId: null
};

// ========================================
// FUNCIONES DE GESTIÓN DE NOTAS
// ========================================

/**
 * Inicializar sistema de notas de voz para un paciente
 */
async function initPatientVoiceNotes(patientId) {
    console.log(`[PatientVoiceNotes] Inicializando para paciente ${patientId}`);
    await loadPatientVoiceNotes(patientId);
}

/**
 * Cargar notas de voz desde el backend
 */
async function loadPatientVoiceNotes(patientId) {
    try {
        console.log(`[PatientVoiceNotes] Cargando notas del paciente ${patientId}...`);

        const response = await apiRequest(`/patients/${patientId}/voice-notes`);

        if (response && response.voiceNotes && Array.isArray(response.voiceNotes)) {
            renderVoiceNotesList(patientId, response.voiceNotes);
        } else {
            renderVoiceNotesList(patientId, []);
        }

    } catch (error) {
        console.error('[PatientVoiceNotes] Error cargando notas:', error);
        renderVoiceNotesList(patientId, []);
    }
}

/**
 * Guardar notas de voz en el backend
 */
async function savePatientVoiceNotes(patientId, voiceNotes) {
    try {
        console.log(`[PatientVoiceNotes] Guardando ${voiceNotes.length} notas...`);

        const response = await apiRequest(`/patients/${patientId}/voice-notes`, {
            method: 'POST',
            body: JSON.stringify({ voiceNotes })
        });

        console.log(`[PatientVoiceNotes] ✓ Notas guardadas correctamente`);
        return response;

    } catch (error) {
        console.error('[PatientVoiceNotes] Error guardando notas:', error);
        showToast('Error al guardar notas de voz', 'error');
        throw error;
    }
}

// ========================================
// FUNCIONES DE GRABACIÓN
// ========================================

/**
 * Iniciar grabación de nota de voz
 */
async function startRecordingVoiceNote(patientId) {
    try {
        console.log(`[PatientVoiceNotes] Iniciando grabación para paciente ${patientId}`);

        // Verificar que no haya otra grabación en curso
        if (window.patientVoiceNotesState.recorder && window.patientVoiceNotesState.recorder.state === 'recording') {
            showToast('Ya hay una grabación en curso', 'error');
            return;
        }

        // Solicitar permiso de micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Crear MediaRecorder
        const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });

        window.patientVoiceNotesState.recorder = recorder;
        window.patientVoiceNotesState.recordingPatientId = patientId;
        window.patientVoiceNotesState.audioChunks = [];
        window.patientVoiceNotesState.recordingStartTime = Date.now();

        // Eventos del recorder
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                window.patientVoiceNotesState.audioChunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            console.log('[PatientVoiceNotes] Grabación detenida');

            // Detener el stream del micrófono
            stream.getTracks().forEach(track => track.stop());

            // Procesar audio grabado
            const audioBlob = new Blob(window.patientVoiceNotesState.audioChunks, { type: 'audio/webm' });
            const duration = Math.floor((Date.now() - window.patientVoiceNotesState.recordingStartTime) / 1000);

            console.log(`[PatientVoiceNotes] Audio grabado: ${duration}s, ${(audioBlob.size / 1024).toFixed(2)}KB`);

            // Subir audio al servidor
            await uploadPatientVoiceNote(patientId, audioBlob, duration);

            // Limpiar estado
            window.patientVoiceNotesState.audioChunks = [];
            window.patientVoiceNotesState.recordingPatientId = null;
            window.patientVoiceNotesState.recordingStartTime = null;
        };

        // Iniciar grabación
        recorder.start();

        // Actualizar UI para mostrar estado de grabación
        showRecordingVoiceNoteUI(patientId);

        // Iniciar contador de tiempo
        startVoiceNoteRecordingTimer(patientId);

        console.log('[PatientVoiceNotes] ✓ Grabación iniciada');

    } catch (error) {
        console.error('[PatientVoiceNotes] Error al iniciar grabación:', error);

        if (error.name === 'NotAllowedError') {
            showToast('Permiso de micrófono denegado', 'error');
        } else {
            showToast('Error al iniciar grabación', 'error');
        }
    }
}

/**
 * Detener grabación de nota de voz
 */
function stopRecordingVoiceNote() {
    if (!window.patientVoiceNotesState.recorder) {
        console.warn('[PatientVoiceNotes] No hay grabación activa');
        return;
    }

    console.log('[PatientVoiceNotes] Deteniendo grabación...');

    // Detener recorder
    if (window.patientVoiceNotesState.recorder.state === 'recording') {
        window.patientVoiceNotesState.recorder.stop();
    }

    // Detener contador
    stopVoiceNoteRecordingTimer();

    console.log('[PatientVoiceNotes] ✓ Grabación detenida');
}

/**
 * Cancelar grabación sin guardar
 */
function cancelRecordingVoiceNote(patientId) {
    console.log('[PatientVoiceNotes] Cancelando grabación...');

    // Detener recorder sin guardar
    if (window.patientVoiceNotesState.recorder && window.patientVoiceNotesState.recorder.state === 'recording') {
        const recorder = window.patientVoiceNotesState.recorder;

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
    window.patientVoiceNotesState.audioChunks = [];
    window.patientVoiceNotesState.recordingPatientId = null;
    window.patientVoiceNotesState.recordingStartTime = null;
    window.patientVoiceNotesState.recorder = null;

    // Detener contador
    stopVoiceNoteRecordingTimer();

    // Restaurar UI
    hideRecordingVoiceNoteUI(patientId);

    showToast('Grabación cancelada', 'info');
}

// ========================================
// FUNCIONES DE REPRODUCCIÓN
// ========================================

/**
 * Reproducir nota de voz
 */
function playPatientVoiceNote(noteId, noteUrl) {
    console.log(`[PatientVoiceNotes] Reproduciendo nota: ${noteUrl}`);

    // Si ya hay un audio reproduciéndose para esta nota, pausarlo
    if (window.patientVoiceNotesState.currentAudio && window.patientVoiceNotesState.currentPlayingNoteId === noteId) {
        if (!window.patientVoiceNotesState.currentAudio.paused) {
            window.patientVoiceNotesState.currentAudio.pause();
            updateVoiceNotePlayButton(noteId, false);
            return;
        } else {
            // Reanudar audio pausado
            window.patientVoiceNotesState.currentAudio.play();
            updateVoiceNotePlayButton(noteId, true);
            return;
        }
    }

    // Detener audio previo si existe
    if (window.patientVoiceNotesState.currentAudio) {
        const prevNoteId = window.patientVoiceNotesState.currentPlayingNoteId;
        window.patientVoiceNotesState.currentAudio.pause();
        if (prevNoteId) {
            updateVoiceNotePlayButton(prevNoteId, false);
        }
    }

    // Crear nuevo elemento de audio
    const audio = new Audio(noteUrl);
    window.patientVoiceNotesState.currentAudio = audio;
    window.patientVoiceNotesState.currentPlayingNoteId = noteId;

    // Actualizar botón a pause
    updateVoiceNotePlayButton(noteId, true);

    // Reproducir
    audio.play().catch(error => {
        console.error('[PatientVoiceNotes] Error al reproducir audio:', error);
        showToast('Error al reproducir audio', 'error');
        updateVoiceNotePlayButton(noteId, false);
    });

    audio.onended = () => {
        console.log('[PatientVoiceNotes] Reproducción finalizada');
        updateVoiceNotePlayButton(noteId, false);
        window.patientVoiceNotesState.currentPlayingNoteId = null;
    };

    audio.onpause = () => {
        if (audio.currentTime === audio.duration || audio.currentTime === 0) {
            updateVoiceNotePlayButton(noteId, false);
        }
    };
}

/**
 * Actualizar botón de play/pause
 */
function updateVoiceNotePlayButton(noteId, isPlaying) {
    const button = document.querySelector(`[data-voice-note-id="${noteId}"] .voice-note-play-btn`);
    if (!button) return;

    if (isPlaying) {
        button.innerHTML = '⏸';
        button.title = 'Pausar';
    } else {
        button.innerHTML = '►';
        button.title = 'Reproducir';
    }
}

// ========================================
// FUNCIONES DE ELIMINACIÓN
// ========================================

/**
 * Eliminar nota de voz
 */
async function deletePatientVoiceNote(patientId, noteId) {
    if (!confirm('¿Eliminar esta nota de voz?')) {
        return;
    }

    try {
        console.log(`[PatientVoiceNotes] Eliminando nota ${noteId}`);

        const response = await apiRequest(`/patients/${patientId}/voice-notes/${noteId}`, {
            method: 'DELETE'
        });

        // Recargar lista
        await loadPatientVoiceNotes(patientId);

        showToast('Nota de voz eliminada', 'success');

    } catch (error) {
        console.error('[PatientVoiceNotes] Error eliminando nota:', error);
        showToast('Error al eliminar nota', 'error');
    }
}

// ========================================
// FUNCIONES DE UPLOAD
// ========================================

/**
 * Subir nota de voz al servidor
 */
async function uploadPatientVoiceNote(patientId, audioBlob, duration) {
    try {
        console.log(`[PatientVoiceNotes] Subiendo nota de voz...`);

        // Crear FormData
        const formData = new FormData();
        const filename = `patient-${patientId}-${Date.now()}.webm`;
        formData.append('audio', audioBlob, filename);
        formData.append('patientId', patientId);
        formData.append('duration', duration);
        formData.append('createdBy', getCurrentUser());

        // Subir al servidor
        const response = await fetch('/api/patients/upload-voice-note', {
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

        console.log('[PatientVoiceNotes] ✓ Nota de voz subida:', result);

        // Recargar lista de notas
        await loadPatientVoiceNotes(patientId);

        // Restaurar UI
        hideRecordingVoiceNoteUI(patientId);

        showToast('Nota de voz guardada correctamente', 'success');

    } catch (error) {
        console.error('[PatientVoiceNotes] Error subiendo nota:', error);
        showToast('Error al guardar nota de voz', 'error');

        // Restaurar UI en caso de error
        hideRecordingVoiceNoteUI(patientId);
    }
}

// ========================================
// FUNCIONES DE RENDERIZADO
// ========================================

/**
 * Renderizar lista de notas de voz
 */
function renderVoiceNotesList(patientId, voiceNotes) {
    const container = document.getElementById(`voice-notes-list-${patientId}`);
    if (!container) {
        console.warn(`[PatientVoiceNotes] Container voice-notes-list-${patientId} no encontrado`);
        return;
    }

    if (!voiceNotes || voiceNotes.length === 0) {
        // No mostrar mensaje cuando no hay notas - solo dejar vacío
        container.innerHTML = '';
        return;
    }

    // Renderizar cada nota
    const notesHtml = voiceNotes.map(note => renderVoiceNoteItem(note, patientId)).join('');
    container.innerHTML = notesHtml;

    console.log(`[PatientVoiceNotes] ${voiceNotes.length} notas renderizadas`);
}

/**
 * Renderizar una nota de voz individual
 */
function renderVoiceNoteItem(note, patientId) {
    const createdDate = formatVoiceNoteDate(note.createdAt);
    const duration = formatDuration(note.duration);

    return `
        <div class="voice-note-item" data-voice-note-id="${note.id}">
            <button class="voice-note-play-btn"
                    onclick="playPatientVoiceNote('${note.id}', '${note.url}')"
                    title="Reproducir">
                ►
            </button>
            <div class="voice-note-info">
                <div class="voice-note-waveform">
                    <div class="voice-note-duration">${duration}</div>
                </div>
                <div class="voice-note-meta">
                    ${createdDate} - ${escapeHtml(note.createdBy)}
                </div>
            </div>
            <button class="voice-note-delete-btn"
                    onclick="deletePatientVoiceNote(${patientId}, '${note.id}')"
                    title="Eliminar">
                🗑️
            </button>
        </div>
    `;
}

/**
 * Mostrar UI de grabación activa
 */
function showRecordingVoiceNoteUI(patientId) {
    const container = document.getElementById(`voice-notes-recording-${patientId}`);
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="voice-note-recording-indicator">
            <span class="recording-pulse">🔴</span>
            <span id="voice-note-recording-time-${patientId}" style="font-weight: 700; font-size: 1.1em;">0:00</span>
            <button onclick="stopRecordingVoiceNote()" style="padding: 8px 16px; font-size: 0.9em; margin-left: 10px; background: #25D366; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                ⏹️ Detener
            </button>
            <button onclick="cancelRecordingVoiceNote(${patientId})" style="padding: 8px 16px; font-size: 0.9em; background: #999; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                ✖️ Cancelar
            </button>
        </div>
    `;
}

/**
 * Ocultar UI de grabación
 */
function hideRecordingVoiceNoteUI(patientId) {
    const container = document.getElementById(`voice-notes-recording-${patientId}`);
    if (!container) return;

    container.style.display = 'none';
    container.innerHTML = '';
}

/**
 * Iniciar contador de tiempo de grabación
 */
function startVoiceNoteRecordingTimer(patientId) {
    const timerElement = document.getElementById(`voice-note-recording-time-${patientId}`);
    if (!timerElement) return;

    let seconds = 0;

    window.patientVoiceNotesState.recordingInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

        // Límite de 5 minutos
        if (seconds >= 300) {
            stopRecordingVoiceNote();
            showToast('Tiempo máximo de grabación alcanzado (5 min)', 'info');
        }
    }, 1000);
}

/**
 * Detener contador de tiempo
 */
function stopVoiceNoteRecordingTimer() {
    if (window.patientVoiceNotesState.recordingInterval) {
        clearInterval(window.patientVoiceNotesState.recordingInterval);
        window.patientVoiceNotesState.recordingInterval = null;
    }
}

// ========================================
// FUNCIONES HELPER
// ========================================

/**
 * Formatear fecha para mostrar
 */
function formatVoiceNoteDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formatear duración en segundos a formato mm:ss
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Obtener usuario actual de la sesión
 */
function getCurrentUser() {
    return sessionStorage.getItem('currentUser') || 'Usuario';
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
window.initPatientVoiceNotes = initPatientVoiceNotes;
window.startRecordingVoiceNote = startRecordingVoiceNote;
window.stopRecordingVoiceNote = stopRecordingVoiceNote;
window.cancelRecordingVoiceNote = cancelRecordingVoiceNote;
window.playPatientVoiceNote = playPatientVoiceNote;
window.deletePatientVoiceNote = deletePatientVoiceNote;

console.log('[PatientVoiceNotes] ✓ Módulo cargado');
