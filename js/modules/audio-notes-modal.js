// Sistema de Notas de Audio para Modal de Paciente
// INTRANEURO - Gestión Hospitalaria
// Versión adaptada para integración en modal
// Fecha: 2025-11-15

const AudioNotesModal = {
    currentPatientId: null,
    currentAdmissionId: null,
    mediaRecorder: null,
    audioChunks: [],
    startTime: null,
    recordTimer: null,
    maxDuration: 300, // 5 minutos
    isRecording: false,
    currentAudioElement: null,
    currentAudioId: null,

    // Método mejorado que recibe el admissionId directamente
    async initWithPatientData(patientId, admissionId) {
        console.log('Inicializando audio con datos:', { patientId, admissionId });
        this.currentPatientId = patientId;

        if (admissionId) {
            this.currentAdmissionId = admissionId;
            console.log('Admission ID configurado:', this.currentAdmissionId);

            this.setupRecordButton(patientId);
            await this.loadAudioNotes();
        } else {
            console.warn('No se proporcionó admission_id, intentando obtenerlo del API');
            await this.fetchAdmissionId(patientId);
        }
    },

    // Inicializar para un paciente específico (método original, mantenido por compatibilidad)
    async init(patientId) {
        console.log('Inicializando audio para paciente:', patientId);
        this.currentPatientId = patientId;

        // Obtener admission_id del paciente
        try {
            // Buscar el paciente en el array global
            const patient = window.patients?.find(p => p.id === patientId);

            // El backend envía 'admissionId' como parte del objeto patient
            if (patient) {
                // Intentar obtener el admissionId de diferentes fuentes posibles
                const admissionId = patient.admissionId ||
                                  patient.admission_id ||
                                  patient.currentAdmissionId ||
                                  (patient.admission ? patient.admission.id : null);

                if (admissionId) {
                    this.currentAdmissionId = admissionId;
                    console.log('Admission ID encontrado:', this.currentAdmissionId);

                    this.setupRecordButton(patientId);
                    await this.loadAudioNotes();
                } else {
                    console.warn('No se encontró admission_id para el paciente', patientId, patient);
                    // Intentar obtener el admission_id desde el backend
                    await this.fetchAdmissionId(patientId);
                }
            } else {
                console.warn('Paciente no encontrado en el array global', patientId);
            }
        } catch (error) {
            console.error('Error inicializando audio:', error);
        }
    },

    // Método auxiliar para obtener admission_id desde el backend si no está disponible
    async fetchAdmissionId(patientId) {
        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/patients/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.admissionId) {
                    this.currentAdmissionId = data.admissionId;
                    console.log('Admission ID obtenido desde API:', this.currentAdmissionId);

                    this.setupRecordButton(patientId);
                    await this.loadAudioNotes();
                }
            }
        } catch (error) {
            console.error('Error obteniendo admission_id desde API:', error);
        }
    },

    // Configurar botón de grabación específico del paciente
    setupRecordButton(patientId) {
        const recordBtn = document.getElementById(`recordBtn-${patientId}`);
        if (!recordBtn) {
            console.error('Botón de grabación no encontrado para paciente:', patientId);
            // Intentar encontrar el botón con un pequeño delay
            setTimeout(() => {
                const delayedBtn = document.getElementById(`recordBtn-${patientId}`);
                if (delayedBtn) {
                    console.log('Botón encontrado después del delay, configurando...');
                    this.setupRecordButton(patientId);
                }
            }, 200);
            return;
        }

        console.log('Configurando botón de grabación para paciente:', patientId);

        // Limpiar event listeners previos usando un nuevo approach
        const newBtn = recordBtn.cloneNode(true);
        recordBtn.parentNode.replaceChild(newBtn, recordBtn);
        const btn = document.getElementById(`recordBtn-${patientId}`);

        // Asegurar que el botón tenga el cursor correcto
        btn.style.cursor = 'pointer';

        // Timer para auto-detener después de tiempo máximo
        let maxDurationTimer = null;

        // SOLO evento click para toggle
        const toggleRecording = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Si NO está grabando, INICIAR
            if (!this.isRecording) {
                console.log('Click - iniciando grabación');
                await this.startRecording(patientId);

                // Auto-detener después de 5 minutos
                maxDurationTimer = setTimeout(() => {
                    console.log('Tiempo máximo alcanzado (5 min)');
                    this.stopRecording(patientId);
                    this.showToast('Grabación detenida: límite de 5 minutos', 'warning');
                }, 300000);
            }
            // Si está grabando, DETENER
            else {
                console.log('Click - deteniendo grabación');
                if (maxDurationTimer) {
                    clearTimeout(maxDurationTimer);
                }
                this.stopRecording(patientId);
            }
        };

        // Configurar SOLO evento click (sin mousedown, mouseup, mouseleave, etc.)
        btn.addEventListener('click', toggleRecording);

        console.log('Botón de grabación configurado exitosamente');
    },

    // Iniciar grabación
    async startRecording(patientId) {
        console.log('startRecording llamado para paciente:', patientId, 'isRecording:', this.isRecording);

        if (this.isRecording) {
            console.log('Ya está grabando, saliendo...');
            return;
        }

        // Verificar que tengamos admission_id
        if (!this.currentAdmissionId) {
            console.error('No hay admission_id configurado');
            this.showToast('Error: No se puede grabar sin admission_id', 'error');
            return;
        }

        try {
            console.log('Solicitando acceso al micrófono...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            console.log('Acceso al micrófono concedido');

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
                this.handleRecordingComplete(patientId);
            });

            this.mediaRecorder.start();

            // UI feedback
            const btn = document.getElementById(`recordBtn-${patientId}`);
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            btn.style.animation = 'pulse 1.5s infinite';
            btn.innerHTML = '⏹️ Detener Grabación';

            const recordTime = document.getElementById(`recordTime-${patientId}`);
            if (recordTime) {
                recordTime.style.display = 'block';
                recordTime.style.color = '#ef4444';
                recordTime.textContent = '0:00';
            }

            // Agregar animación pulse si no existe
            if (!document.getElementById('audio-pulse-style')) {
                const style = document.createElement('style');
                style.id = 'audio-pulse-style';
                style.innerHTML = `
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }

            // Timer
            this.recordTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                if (recordTime) {
                    recordTime.textContent = this.formatTime(elapsed);
                }

                if (elapsed >= this.maxDuration) {
                    this.stopRecording(patientId);
                    this.showToast('Grabación detenida: límite de 5 minutos', 'warning');
                }
            }, 100);

        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            this.showToast('No se pudo acceder al micrófono', 'error');
            this.isRecording = false;
        }
    },

    // Detener grabación
    stopRecording(patientId) {
        console.log('stopRecording llamado para paciente:', patientId, 'isRecording:', this.isRecording);

        if (!this.isRecording || !this.mediaRecorder) {
            console.log('No está grabando o no hay mediaRecorder, saliendo...');
            return;
        }

        this.isRecording = false;
        console.log('Deteniendo grabación...');

        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        clearInterval(this.recordTimer);

        // Detener stream
        if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        // UI feedback - restaurar botón
        const btn = document.getElementById(`recordBtn-${patientId}`);
        if (btn) {
            btn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            btn.style.animation = 'none';
            btn.innerHTML = '🎤 Click para Grabar';
        }

        const recordTime = document.getElementById(`recordTime-${patientId}`);
        if (recordTime) {
            recordTime.style.display = 'none';
        }
    },

    // Manejar grabación completada
    async handleRecordingComplete(patientId) {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        if (duration < 1) {
            this.showToast('Grabación muy corta (mínimo 1 segundo)', 'warning');
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
        formData.append('note_type', 'clinical');

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
                await this.loadAudioNotes();
            } else {
                throw new Error(data.error || 'Error al guardar audio');
            }

        } catch (error) {
            console.error('Error al subir audio:', error);
            this.showToast('Error al guardar audio', 'error');
        }
    },

    // Cargar notas de audio
    async loadAudioNotes() {
        if (!this.currentAdmissionId) return;

        try {
            const apiUrl = window.API_URL || '/api';
            const response = await fetch(`${apiUrl}/audio/admission/${this.currentAdmissionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.renderAudioList(data.data);

                // Actualizar contador
                const audioCount = document.getElementById(`audioCount-${this.currentPatientId}`);
                if (audioCount) {
                    audioCount.textContent = data.count || 0;
                }
            }

        } catch (error) {
            console.error('Error al cargar audios:', error);
        }
    },

    // Renderizar lista de audios
    renderAudioList(audioNotes) {
        const audioList = document.getElementById(`audioList-${this.currentPatientId}`);
        if (!audioList) return;

        if (audioNotes.length === 0) {
            audioList.innerHTML = '<p style="text-align: center; color: #94a3b8; font-style: italic;">No hay notas de voz aún</p>';
            return;
        }

        audioList.innerHTML = audioNotes.map(audio => `
            <div style="background: white; border-radius: 8px; padding: 10px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" data-audio-id="${audio.id}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button id="play-btn-${audio.id}"
                            onclick="AudioNotesModal.togglePlay('${this.getAudioUrl(audio.url)}', '${audio.id}')"
                            style="width: 36px; height: 36px; border-radius: 50%; border: none;
                                   background: #3b82f6; color: white; cursor: pointer; transition: all 0.2s;">
                        <span class="play-icon" style="display: inline-block;">▶️</span>
                        <span class="pause-icon" style="display: none;">⏸️</span>
                    </button>
                    <div style="flex: 1;">
                        <div style="font-size: 0.9em; color: #2c3e50;">
                            <strong>${audio.created_by}</strong>
                            ${audio.is_important ? '⭐' : ''}
                        </div>
                        <div style="font-size: 0.8em; color: #6b7280;">
                            ${this.formatDate(audio.created_at)} • ${audio.duration}
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        ${!audio.is_deleted ? `
                            <button onclick="AudioNotesModal.toggleImportant('${audio.id}')"
                                    style="background: none; border: none; cursor: pointer; font-size: 16px;"
                                    title="${audio.is_important ? 'Quitar importante' : 'Marcar importante'}">
                                ${audio.is_important ? '⭐' : '☆'}
                            </button>
                            <button onclick="AudioNotesModal.deleteAudio('${audio.id}')"
                                    style="background: none; border: none; cursor: pointer; font-size: 16px;"
                                    title="Eliminar">
                                🗑️
                            </button>
                        ` : '<span style="color: #ef4444; font-size: 0.8em;">Eliminado</span>'}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Reproducir/Pausar audio
    togglePlay(url, audioId) {
        const btn = document.getElementById(`play-btn-${audioId}`);
        if (!btn) return;

        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');

        // Si hay otro audio reproduciéndose, detenerlo y resetear su botón
        if (this.currentAudioElement && !this.currentAudioElement.paused && this.currentAudioId !== audioId) {
            this.currentAudioElement.pause();
            const prevBtn = document.getElementById(`play-btn-${this.currentAudioId}`);
            if (prevBtn) {
                const prevPlay = prevBtn.querySelector('.play-icon');
                const prevPause = prevBtn.querySelector('.pause-icon');
                if (prevPlay) prevPlay.style.display = 'inline-block';
                if (prevPause) prevPause.style.display = 'none';
            }
        }

        // Si es el mismo audio, solo pausar/reanudar
        if (this.currentAudioElement && this.currentAudioElement.src.includes(url)) {
            if (this.currentAudioElement.paused) {
                this.currentAudioElement.play();
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline-block';
            } else {
                this.currentAudioElement.pause();
                if (playIcon) playIcon.style.display = 'inline-block';
                if (pauseIcon) pauseIcon.style.display = 'none';
            }
            return;
        }

        // Crear nuevo audio
        this.currentAudioElement = new Audio(url);
        this.currentAudioId = audioId;

        // Cambiar icono a pause
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'inline-block';

        this.currentAudioElement.play();

        // Cuando termina el audio, volver a play
        this.currentAudioElement.addEventListener('ended', () => {
            if (playIcon) playIcon.style.display = 'inline-block';
            if (pauseIcon) pauseIcon.style.display = 'none';
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

            if (response.ok) {
                await this.loadAudioNotes();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },

    // Eliminar audio
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

            if (response.ok) {
                this.showToast('Audio eliminado', 'success');
                await this.loadAudioNotes();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },

    // Utilidades
    getAudioUrl(url) {
        // Si la URL ya es absoluta, devolverla tal cual
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Si la URL no tiene la estructura año/mes, agregarla
        if (!url.includes('/2025/') && !url.includes('/2024/')) {
            // Extraer el nombre del archivo
            const filename = url.split('/').pop();

            // Usar la fecha actual para construir la ruta
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');

            // Construir URL completa con año/mes
            url = `/uploads/audio/${year}/${month}/${filename}`;
        }

        // Para desarrollo local
        if (window.location.hostname === 'localhost' && window.API_URL && window.API_URL.includes('localhost')) {
            return `http://localhost:3001${url}`;
        }

        // Para dev.intraneurodavila.com o producción
        return url;
    },

    getSupportedMimeType() {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm';
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
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
    },

    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`);
        }
    }
};

// Hacer disponible globalmente
window.AudioNotesModal = AudioNotesModal;