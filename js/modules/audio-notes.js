// Sistema de Notas de Audio
// INTRANEURO - Gestión Hospitalaria
// Fecha: 2025-11-15

const AudioNotesSystem = {
    mediaRecorder: null,
    audioChunks: [],
    startTime: null,
    recordTimer: null,
    maxDuration: 300, // 5 minutos en segundos
    currentAdmissionId: null,
    isRecording: false,
    currentAudioElement: null,

    // Inicializar sistema para una admisión específica
    init(admissionId) {
        console.log('Inicializando sistema de audio para admisión:', admissionId);
        this.currentAdmissionId = admissionId;
        this.setupRecordButton();
        this.loadAudioNotes(admissionId);
        this.loadStats(admissionId);
    },

    // Configurar botón de grabación
    setupRecordButton() {
        const recordBtn = document.getElementById('recordBtn');
        if (!recordBtn) {
            console.error('Botón de grabación no encontrado');
            return;
        }

        // Limpiar event listeners previos
        const newBtn = recordBtn.cloneNode(true);
        recordBtn.parentNode.replaceChild(newBtn, recordBtn);

        const btn = document.getElementById('recordBtn');

        // Desktop: mousedown/mouseup
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startRecording();
        });

        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            if (this.isRecording) {
                this.stopRecording();
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });

        // Mobile: touchstart/touchend
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.isRecording) {
                this.stopRecording();
            }
        }, { passive: false });

        btn.addEventListener('touchcancel', () => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });
    },

    // Iniciar grabación
    async startRecording() {
        if (this.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Detectar el codec soportado
            const mimeType = this.getSupportedMimeType();

            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            this.audioChunks = [];
            this.startTime = Date.now();
            this.isRecording = true;

            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.handleRecordingComplete();
            });

            this.mediaRecorder.start();

            // UI feedback
            const btn = document.getElementById('recordBtn');
            btn.classList.add('recording');

            const recordTime = document.getElementById('recordTime');
            if (recordTime) {
                recordTime.style.display = 'inline-block';
                recordTime.textContent = '0:00';
            }

            // Mostrar indicador de grabación
            this.showRecordingIndicator(true);

            // Timer
            this.recordTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                if (recordTime) {
                    recordTime.textContent = this.formatTime(elapsed);
                }

                // Auto-stop si alcanza máximo
                if (elapsed >= this.maxDuration) {
                    this.stopRecording();
                    this.showToast('Grabación detenida: límite de 5 minutos alcanzado', 'warning');
                }
            }, 100);

        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            this.showToast('No se pudo acceder al micrófono. Verifica los permisos.', 'error');
            this.isRecording = false;
        }
    },

    // Detener grabación
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.isRecording = false;

        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        clearInterval(this.recordTimer);

        // Detener stream
        if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        // UI feedback
        const btn = document.getElementById('recordBtn');
        btn.classList.remove('recording');

        const recordTime = document.getElementById('recordTime');
        if (recordTime) {
            recordTime.style.display = 'none';
            recordTime.textContent = '0:00';
        }

        // Ocultar indicador de grabación
        this.showRecordingIndicator(false);
    },

    // Manejar grabación completada
    async handleRecordingComplete() {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        // Validar duración mínima
        if (duration < 1) {
            this.showToast('La grabación es demasiado corta (mínimo 1 segundo)', 'warning');
            return;
        }

        const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder.mimeType || 'audio/webm'
        });

        // Crear FormData
        const formData = new FormData();
        formData.append('audio', audioBlob, `audio_${Date.now()}.webm`);
        formData.append('admission_id', this.currentAdmissionId);
        formData.append('duration_seconds', duration);
        formData.append('note_type', 'clinical'); // Por defecto

        // Subir al servidor
        try {
            this.showToast('Guardando audio...', 'info');

            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('Audio guardado correctamente', 'success');
                this.loadAudioNotes(this.currentAdmissionId);
                this.loadStats(this.currentAdmissionId);
            } else {
                throw new Error(data.error || 'Error al guardar audio');
            }

        } catch (error) {
            console.error('Error al subir audio:', error);
            this.showToast('Error al guardar audio: ' + error.message, 'error');
        }
    },

    // Cargar notas de audio
    async loadAudioNotes(admissionId) {
        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/admission/${admissionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.renderAudioList(data.data);

                // Actualizar contador
                const audioCount = document.getElementById('audioCount');
                if (audioCount) {
                    audioCount.textContent = data.count;
                }
            }

        } catch (error) {
            console.error('Error al cargar audios:', error);
            this.showToast('Error al cargar notas de audio', 'error');
        }
    },

    // Cargar estadísticas
    async loadStats(admissionId) {
        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/admission/${admissionId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.updateStats(data.data);
            }

        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    },

    // Actualizar estadísticas en UI
    updateStats(stats) {
        const totalDuration = document.getElementById('audioTotalDuration');
        if (totalDuration) {
            const minutes = Math.floor(stats.total_duration_seconds / 60);
            const seconds = stats.total_duration_seconds % 60;
            totalDuration.textContent = `${minutes}m ${seconds}s total`;
        }

        const importantCount = document.getElementById('audioImportantCount');
        if (importantCount && stats.important_notes > 0) {
            importantCount.textContent = `${stats.important_notes} importantes`;
            importantCount.style.display = 'inline';
        }
    },

    // Renderizar lista de audios
    renderAudioList(audioNotes) {
        const audioList = document.getElementById('audioList');
        if (!audioList) return;

        if (audioNotes.length === 0) {
            audioList.innerHTML = '<p class="no-audio">No hay notas de voz aún</p>';
            return;
        }

        // Agrupar por fecha
        const groupedByDate = this.groupAudiosByDate(audioNotes);

        audioList.innerHTML = Object.entries(groupedByDate).map(([date, notes]) => `
            <div class="audio-date-group">
                <div class="audio-date-header">${date}</div>
                ${notes.map(audio => this.renderAudioNote(audio)).join('')}
            </div>
        `).join('');
    },

    // Renderizar una nota de audio individual
    renderAudioNote(audio) {
        const isDeleted = audio.is_deleted;
        const isImportant = audio.is_important;
        const requiresFollowup = audio.requires_followup;

        return `
            <div class="audio-note ${isDeleted ? 'deleted' : ''} ${isImportant ? 'important' : ''}"
                 data-id="${audio.id}">
                <div class="audio-main">
                    <button class="play-btn"
                            onclick="AudioNotesSystem.togglePlay('${this.getAudioUrl(audio.url)}', ${audio.id})"
                            ${isDeleted ? 'disabled' : ''}>
                        <span class="play-icon">▶️</span>
                        <span class="pause-icon" style="display:none">⏸️</span>
                    </button>

                    <div class="audio-info">
                        <div class="audio-meta">
                            <span class="audio-type ${audio.note_type}">${this.getNoteTypeLabel(audio.note_type)}</span>
                            <span class="audio-author">${audio.created_by}</span>
                            <span class="audio-time">${this.formatTime(audio.created_at)}</span>
                        </div>
                        <div class="audio-waveform">
                            <div class="waveform-progress" data-audio-id="${audio.id}"></div>
                        </div>
                        <div class="audio-duration">${audio.duration}</div>
                    </div>
                </div>

                <div class="audio-actions">
                    ${!isDeleted ? `
                        <button class="btn-action ${isImportant ? 'active' : ''}"
                                onclick="AudioNotesSystem.toggleImportant(${audio.id})"
                                title="Marcar como importante">
                            ${isImportant ? '⭐' : '☆'}
                        </button>
                        <button class="btn-action ${requiresFollowup ? 'active' : ''}"
                                onclick="AudioNotesSystem.toggleFollowup(${audio.id})"
                                title="Requiere seguimiento">
                            🔔
                        </button>
                        <button class="btn-action btn-delete"
                                onclick="AudioNotesSystem.deleteAudio(${audio.id})"
                                title="Eliminar">
                            🗑️
                        </button>
                    ` : `
                        <span class="deleted-label">Eliminado</span>
                        <button class="btn-action btn-restore"
                                onclick="AudioNotesSystem.restoreAudio(${audio.id})"
                                title="Restaurar">
                            ↩️
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    // Reproducir/Pausar audio
    togglePlay(url, audioId) {
        const btn = document.querySelector(`[data-id="${audioId}"] .play-btn`);
        if (!btn) return;

        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');

        // Si hay un audio reproduciéndose, detenerlo
        if (this.currentAudioElement && !this.currentAudioElement.paused) {
            this.currentAudioElement.pause();
            const prevBtn = document.querySelector('.play-btn.playing');
            if (prevBtn) {
                prevBtn.classList.remove('playing');
                const prevPlay = prevBtn.querySelector('.play-icon');
                const prevPause = prevBtn.querySelector('.pause-icon');
                if (prevPlay) prevPlay.style.display = 'inline-block';
                if (prevPause) prevPause.style.display = 'none';
            }
        }

        // Si es el mismo audio, solo pausar
        if (this.currentAudioElement && this.currentAudioElement.src.includes(url)) {
            if (this.currentAudioElement.paused) {
                this.currentAudioElement.play();
                btn.classList.add('playing');
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline-block';
            } else {
                this.currentAudioElement.pause();
                btn.classList.remove('playing');
                if (playIcon) playIcon.style.display = 'inline-block';
                if (pauseIcon) pauseIcon.style.display = 'none';
            }
            return;
        }

        // Crear nuevo audio
        this.currentAudioElement = new Audio(url);
        btn.classList.add('playing');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'inline-block';

        this.currentAudioElement.play();

        // Actualizar progreso
        const progressBar = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (progressBar) {
            this.currentAudioElement.addEventListener('timeupdate', () => {
                const progress = (this.currentAudioElement.currentTime / this.currentAudioElement.duration) * 100;
                progressBar.style.width = `${progress}%`;
            });
        }

        // Cuando termina
        this.currentAudioElement.addEventListener('ended', () => {
            btn.classList.remove('playing');
            if (playIcon) playIcon.style.display = 'inline-block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        });
    },

    // Marcar como importante
    async toggleImportant(audioId) {
        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/${audioId}/important`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.loadAudioNotes(this.currentAdmissionId);
                this.loadStats(this.currentAdmissionId);
                this.showToast(data.data.is_important ? 'Marcado como importante' : 'Desmarcado como importante', 'success');
            }

        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error al actualizar', 'error');
        }
    },

    // Marcar para seguimiento
    async toggleFollowup(audioId) {
        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/${audioId}/followup`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.loadAudioNotes(this.currentAdmissionId);
                this.showToast(data.data.requires_followup ? 'Marcado para seguimiento' : 'Seguimiento removido', 'success');
            }

        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error al actualizar', 'error');
        }
    },

    // Eliminar audio (soft delete)
    async deleteAudio(audioId) {
        if (!confirm('¿Eliminar esta nota de voz?')) return;

        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/${audioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('Audio eliminado', 'success');
                this.loadAudioNotes(this.currentAdmissionId);
                this.loadStats(this.currentAdmissionId);
            }

        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error al eliminar', 'error');
        }
    },

    // Restaurar audio
    async restoreAudio(audioId) {
        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/${audioId}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('Audio restaurado', 'success');
                this.loadAudioNotes(this.currentAdmissionId);
                this.loadStats(this.currentAdmissionId);
            } else {
                this.showToast(data.error || 'Error al restaurar', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error al restaurar', 'error');
        }
    },

    // Utilidades
    getAudioUrl(url) {
        // En desarrollo local con localhost, agregar el host del servidor
        if (window.location.hostname === 'localhost' && window.API_URL && window.API_URL.includes('localhost')) {
            return `http://localhost:3001${url}`;
        }
        // Para dev.intraneurodavila.com y producción, usar URL relativa
        return url;
    },

    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm'; // Fallback
    },

    formatTime(input) {
        if (typeof input === 'number') {
            // Es duración en segundos
            const mins = Math.floor(input / 60);
            const secs = input % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            // Es fecha
            const date = new Date(input);
            const now = new Date();
            const diff = now - date;
            const hours = diff / (1000 * 60 * 60);

            if (hours < 24) {
                return date.toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return date.toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit'
                });
            }
        }
    },

    groupAudiosByDate(audioNotes) {
        const groups = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        audioNotes.forEach(audio => {
            const date = new Date(audio.created_at).toDateString();
            let label = date;

            if (date === today) {
                label = 'Hoy';
            } else if (date === yesterday) {
                label = 'Ayer';
            } else {
                label = new Date(audio.created_at).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                });
            }

            if (!groups[label]) {
                groups[label] = [];
            }
            groups[label].push(audio);
        });

        return groups;
    },

    getNoteTypeLabel(type) {
        const labels = {
            'clinical': 'Clínica',
            'nursing': 'Enfermería',
            'therapy': 'Terapia',
            'general': 'General'
        };
        return labels[type] || type;
    },

    showRecordingIndicator(show) {
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    },

    showToast(message, type = 'info') {
        // Usar función global si existe, o console.log como fallback
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`);
        }
    }
};

// Hacer disponible globalmente
window.AudioNotesSystem = AudioNotesSystem;