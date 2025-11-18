// Sistema simplificado de Notas de Audio
// INTRANEURO - Gestión Hospitalaria
// Versión simplificada para debugging

const SimpleAudioNotes = {
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    startTime: null,
    currentAdmissionId: null,

    // Configurar botón de forma simplificada
    setupButton(patientId, admissionId) {
        console.log(`[SimpleAudio] Configurando para paciente ${patientId}, admission ${admissionId}`);

        this.currentAdmissionId = admissionId;
        const btn = document.getElementById(`recordBtn-${patientId}`);

        if (!btn) {
            console.error('[SimpleAudio] Botón no encontrado');
            return;
        }

        // Limpiar eventos previos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        const button = document.getElementById(`recordBtn-${patientId}`);

        // Timer para auto-detener después de tiempo máximo
        let maxDurationTimer = null;

        // Función toggle para iniciar/detener
        const toggleRecording = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Si NO está grabando, INICIAR
            if (!this.isRecording) {
                console.log('[SimpleAudio] Iniciando grabación...');

                try {
                    // Solicitar micrófono
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('[SimpleAudio] Micrófono obtenido');

                    // Configurar MediaRecorder
                    this.mediaRecorder = new MediaRecorder(stream);
                    this.audioChunks = [];
                    this.isRecording = true;
                    this.startTime = Date.now();

                    this.mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            this.audioChunks.push(event.data);
                        }
                    };

                    this.mediaRecorder.onstop = () => {
                        console.log('[SimpleAudio] Grabación detenida, procesando...');
                        this.processRecording(patientId);
                    };

                    // Iniciar grabación
                    this.mediaRecorder.start();

                    // Cambiar visual del botón
                    button.style.background = '#ef4444';
                    button.style.animation = 'pulse 1.5s infinite';
                    button.innerHTML = '⏹️ Detener Grabación';

                    // Timer visual
                    const timeDisplay = document.getElementById(`recordTime-${patientId}`);
                    if (timeDisplay) {
                        timeDisplay.style.display = 'block';
                        timeDisplay.style.color = '#ef4444';
                        this.updateTimer(timeDisplay);
                    }

                    console.log('[SimpleAudio] Grabación iniciada');

                    // Auto-detener después de 5 minutos
                    maxDurationTimer = setTimeout(() => {
                        console.log('[SimpleAudio] Tiempo máximo alcanzado (5 min)');
                        this.stopRecording(patientId);
                        alert('Grabación detenida: Límite de 5 minutos alcanzado');
                    }, 300000); // 5 minutos

                } catch (error) {
                    console.error('[SimpleAudio] Error:', error);
                    this.isRecording = false;
                    alert('Error al acceder al micrófono: ' + error.message);
                }
            }
            // Si está grabando, DETENER
            else {
                console.log('[SimpleAudio] Deteniendo grabación...');

                if (maxDurationTimer) {
                    clearTimeout(maxDurationTimer);
                }

                this.stopRecording(patientId);
            }
        };

        // Configurar SOLO evento click
        button.addEventListener('click', toggleRecording);

        // Estilo CSS para animación pulse
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

        console.log('[SimpleAudio] Botón configurado con click toggle');
    },

    // Detener grabación
    stopRecording(patientId) {
        if (!this.isRecording || !this.mediaRecorder) {
            console.log('[SimpleAudio] No hay grabación activa');
            return;
        }

        console.log('[SimpleAudio] Deteniendo grabación...');
        this.isRecording = false;

        // Detener MediaRecorder
        if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Detener stream
        if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        // Restaurar botón
        const button = document.getElementById(`recordBtn-${patientId}`);
        if (button) {
            button.style.background = '#3b82f6';
            button.style.animation = 'none';
            button.innerHTML = '🎤 Click para Grabar';
        }

        // Ocultar timer
        const timeDisplay = document.getElementById(`recordTime-${patientId}`);
        if (timeDisplay) {
            timeDisplay.style.display = 'none';
        }
    },

    // Procesar grabación completada
    async processRecording(patientId) {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        console.log(`[SimpleAudio] Procesando grabación de ${duration} segundos`);

        if (duration < 1) {
            alert('Grabación muy corta (mínimo 1 segundo)');
            return;
        }

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log(`[SimpleAudio] Blob creado, tamaño: ${audioBlob.size} bytes`);

        // Crear FormData
        const formData = new FormData();
        formData.append('audio', audioBlob, `audio_${Date.now()}.webm`);
        formData.append('admission_id', this.currentAdmissionId);
        formData.append('duration_seconds', duration);
        formData.append('note_type', 'clinical');

        try {
            console.log('[SimpleAudio] Enviando audio al servidor...');

            const response = await fetch('/api/audio', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            console.log('[SimpleAudio] Respuesta del servidor:', data);

            if (response.ok && data.success) {
                alert('✅ Audio guardado correctamente');
                this.loadAudios(patientId);
            } else {
                throw new Error(data.error || 'Error al guardar');
            }

        } catch (error) {
            console.error('[SimpleAudio] Error al enviar:', error);
            alert('❌ Error al guardar audio: ' + error.message);
        }
    },

    // Cargar lista de audios
    async loadAudios(patientId) {
        if (!this.currentAdmissionId) return;

        try {
            const response = await fetch(`/api/audio/admission/${this.currentAdmissionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            console.log('[SimpleAudio] Audios cargados:', data);

            if (response.ok && data.success) {
                this.renderAudioList(data.data, patientId);
            }

        } catch (error) {
            console.error('[SimpleAudio] Error cargando audios:', error);
        }
    },

    // Renderizar lista
    renderAudioList(audioNotes, patientId) {
        const audioList = document.getElementById(`audioList-${patientId}`);
        if (!audioList) return;

        const audioCount = document.getElementById(`audioCount-${patientId}`);
        if (audioCount) {
            audioCount.textContent = `Audios: ${audioNotes.length}`;
        }

        if (audioNotes.length === 0) {
            audioList.innerHTML = '<p style="color: #666;">No hay notas de voz aún</p>';
            return;
        }

        audioList.innerHTML = audioNotes.map(audio => {
            const url = this.fixAudioUrl(audio.url);
            return `
                <div style="background: white; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #ddd;">
                    <audio controls style="width: 100%;">
                        <source src="${url}" type="audio/webm">
                        Tu navegador no soporta audio.
                    </audio>
                    <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                        ${audio.created_by} - ${new Date(audio.created_at).toLocaleString()}
                        (${audio.duration})
                    </div>
                </div>
            `;
        }).join('');
    },

    // Corregir URL del audio
    fixAudioUrl(url) {
        // Si ya es URL completa, usarla
        if (url.startsWith('http')) {
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
            return `/uploads/audio/${year}/${month}/${filename}`;
        }

        // Si ya tiene la estructura correcta, devolverla
        return url;
    },

    // Timer visual
    updateTimer(element) {
        if (!this.isRecording) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        element.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (this.isRecording) {
            setTimeout(() => this.updateTimer(element), 100);
        }
    }
};

// Hacer disponible globalmente
window.SimpleAudioNotes = SimpleAudioNotes;