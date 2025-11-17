/**
 * CLINICAL CHAT MODULE - Sistema de Chat Clínico tipo WhatsApp
 * Sistema INTRANEURO - Gestión Hospitalaria
 *
 * Uso:
 *   const chat = new ClinicalChat(patientId, admissionId);
 *   chat.init(containerElement);
 */

class ClinicalChat {
    constructor(patientId, admissionId) {
        this.patientId = patientId;
        this.admissionId = admissionId;
        this.currentTab = 'historia';
        this.messages = {
            historia: [],
            tareas: []
        };
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStartTime = null;
        this.recordingInterval = null;
        this.currentAudio = null;
        this.container = null;
    }

    // ========== INITIALIZATION ==========

    async init(containerElement) {
        this.container = containerElement;
        this.render();
        await this.loadMessages();
        this.attachEventListeners();
        console.log(`✅ Chat inicializado para paciente ${this.patientId}`);
    }

    render() {
        this.container.innerHTML = `
            <div class="clinical-chat-container">
                <!-- Tabs -->
                <div class="clinical-chat-tabs">
                    <button class="clinical-chat-tab active" data-tab="historia">
                        📋 Historia Clínica
                    </button>
                    <button class="clinical-chat-tab" data-tab="tareas">
                        ✅ Tareas Pendientes
                    </button>
                </div>

                <!-- Messages Area -->
                <div class="clinical-chat-messages" id="clinicalChatMessages-${this.patientId}">
                    <p class="clinical-chat-loading">Cargando mensajes...</p>
                </div>

                <!-- Input Area -->
                <div class="clinical-chat-input-area">
                    <div class="clinical-chat-input-wrapper" id="clinicalInputWrapper-${this.patientId}">
                        <textarea
                            class="clinical-chat-input"
                            id="clinicalChatInput-${this.patientId}"
                            placeholder="Escribe una nota..."
                            rows="1"
                        ></textarea>
                    </div>

                    <!-- Recording indicator -->
                    <div class="clinical-recording-indicator" id="clinicalRecordingIndicator-${this.patientId}" style="display: none;">
                        <div class="clinical-recording-dot"></div>
                        <span class="clinical-recording-time" id="clinicalRecordingTime-${this.patientId}">0:00</span>
                        <button class="clinical-recording-cancel" id="clinicalRecordingCancel-${this.patientId}">Cancelar</button>
                    </div>

                    <!-- Mic/Send button -->
                    <button class="clinical-chat-btn clinical-mic-btn" id="clinicalMicBtn-${this.patientId}" title="Grabar audio">
                        🎤
                    </button>
                    <button class="clinical-chat-btn clinical-send-btn" id="clinicalSendBtn-${this.patientId}" style="display: none;" title="Enviar">
                        ➤
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Tabs
        this.container.querySelectorAll('.clinical-chat-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Input
        const input = this.container.querySelector(`#clinicalChatInput-${this.patientId}`);
        input.addEventListener('input', () => this.handleInputChange());
        input.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Buttons
        const micBtn = this.container.querySelector(`#clinicalMicBtn-${this.patientId}`);
        const sendBtn = this.container.querySelector(`#clinicalSendBtn-${this.patientId}`);
        const cancelBtn = this.container.querySelector(`#clinicalRecordingCancel-${this.patientId}`);

        micBtn.addEventListener('click', () => this.toggleRecording());
        sendBtn.addEventListener('click', () => this.sendMessage());
        cancelBtn.addEventListener('click', () => this.cancelRecording());
    }

    // ========== TAB SWITCHING ==========

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab UI
        this.container.querySelectorAll('.clinical-chat-tab').forEach(t => {
            if (t.dataset.tab === tab) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        // Update placeholder
        const input = this.container.querySelector(`#clinicalChatInput-${this.patientId}`);
        input.placeholder = tab === 'historia'
            ? 'Escribe una nota sobre la historia clínica...'
            : 'Escribe una tarea pendiente...';

        // Render messages
        this.renderMessages();
    }

    // ========== LOAD MESSAGES ==========

    async loadMessages() {
        try {
            await Promise.all([
                this.loadObservations(),
                this.loadTasks(),
                this.loadAudioNotes()
            ]);

            this.renderMessages();
        } catch (error) {
            console.error('Error cargando mensajes:', error);
            this.showError('Error al cargar los mensajes');
        }
    }

    async loadObservations() {
        try {
            const response = await this.apiRequest(`/patients/${this.patientId}/admission/observations`);
            const observations = Array.isArray(response) ? response : (response.observations || []);

            this.messages.historia = observations.map(obs => ({
                id: `obs-${obs.id}`,
                messageType: 'text',
                text: obs.observation,
                timestamp: new Date(obs.created_at).toLocaleString('es-CL'),
                author: obs.created_by || 'Sistema',
                type: 'received'
            }));
        } catch (error) {
            console.error('Error cargando observaciones:', error);
            this.messages.historia = [];
        }
    }

    async loadTasks() {
        try {
            const response = await this.apiRequest(`/patients/${this.patientId}/admission/tasks`);
            const tasks = Array.isArray(response) ? response : (response.tasks || []);

            this.messages.tareas = tasks.map(task => ({
                id: `task-${task.id}`,
                messageType: 'text',
                text: task.task,
                timestamp: new Date(task.created_at).toLocaleString('es-CL'),
                author: task.created_by || 'Sistema',
                type: 'received'
            }));
        } catch (error) {
            console.error('Error cargando tareas:', error);
            this.messages.tareas = [];
        }
    }

    async loadAudioNotes() {
        if (!this.admissionId) return;

        try {
            const response = await this.apiRequest(`/audio/admission/${this.admissionId}`);
            const audios = Array.isArray(response) ? response : (response.audios || response.data || []);

            audios.forEach(audio => {
                if (audio.is_deleted) return;

                const audioMessage = {
                    id: `audio-${audio.id}`,
                    messageType: 'audio',
                    audioUrl: audio.url || audio.file_path,
                    duration: this.formatDuration(audio.duration_seconds || 0),
                    timestamp: new Date(audio.created_at).toLocaleString('es-CL'),
                    author: audio.created_by || 'Sistema',
                    type: 'received'
                };

                if (audio.note_type === 'clinical') {
                    this.messages.historia.push(audioMessage);
                } else {
                    this.messages.tareas.push(audioMessage);
                }
            });

            // Sort by timestamp
            this.messages.historia.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            this.messages.tareas.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            console.error('Error cargando audios:', error);
        }
    }

    // ========== RENDER MESSAGES ==========

    renderMessages() {
        const container = this.container.querySelector(`#clinicalChatMessages-${this.patientId}`);
        const msgs = this.messages[this.currentTab] || [];

        if (msgs.length === 0) {
            const emptyText = this.currentTab === 'historia'
                ? 'No hay notas en la historia clínica'
                : 'No hay tareas pendientes';

            container.innerHTML = `
                <div class="clinical-chat-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>${emptyText}</p>
                    <small>Escribe tu primera nota o graba un audio</small>
                </div>
            `;
            return;
        }

        let html = '';
        let lastDate = '';

        msgs.forEach(msg => {
            // Date divider
            const msgDate = msg.timestamp.split(',')[0] || msg.timestamp.split(' ')[0];
            if (msgDate !== lastDate) {
                html += `
                    <div class="clinical-chat-date-divider">
                        <span>${this.formatDateDivider(msgDate)}</span>
                    </div>
                `;
                lastDate = msgDate;
            }

            // Message bubble
            const messageClass = msg.type === 'sent' ? 'sent' : '';

            if (msg.messageType === 'audio') {
                html += `
                    <div class="clinical-chat-message ${messageClass}">
                        <div class="clinical-chat-bubble clinical-audio-bubble">
                            <button class="clinical-audio-play-btn" data-audio-id="${msg.id}" data-audio-url="${msg.audioUrl}">▶</button>
                            <div class="clinical-audio-waveform">${this.generateWaveform()}</div>
                            <span class="clinical-audio-duration">${msg.duration}</span>
                            <div class="clinical-chat-message-time">
                                <span>${msg.author}</span>
                                <span>•</span>
                                <span>${this.formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="clinical-chat-message ${messageClass}">
                        <div class="clinical-chat-bubble">
                            <p class="clinical-chat-message-text">${this.escapeHtml(msg.text)}</p>
                            <div class="clinical-chat-message-time">
                                <span>${msg.author}</span>
                                <span>•</span>
                                <span>${this.formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;

        // Attach audio play listeners
        container.querySelectorAll('.clinical-audio-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.audioUrl;
                const id = e.target.dataset.audioId;
                this.playAudio(id, url, e.target);
            });
        });

        // Scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 10);
    }

    // ========== SEND MESSAGE ==========

    async sendMessage() {
        const input = this.container.querySelector(`#clinicalChatInput-${this.patientId}`);
        const text = input.value.trim();

        if (!text) return;

        try {
            const currentUser = this.getCurrentUser();

            // Save to backend
            if (this.currentTab === 'historia') {
                await this.apiRequest(`/patients/${this.patientId}/admission/observations`, {
                    method: 'POST',
                    body: JSON.stringify({
                        observation: text,
                        created_by: currentUser
                    })
                });
            } else {
                await this.apiRequest(`/patients/${this.patientId}/admission/tasks`, {
                    method: 'POST',
                    body: JSON.stringify({
                        task: text,
                        created_by: currentUser
                    })
                });
            }

            // Add to local state
            const newMessage = {
                id: `local-${Date.now()}`,
                messageType: 'text',
                text: text,
                timestamp: new Date().toLocaleString('es-CL'),
                author: currentUser,
                type: 'sent'
            };

            this.messages[this.currentTab].push(newMessage);

            // Clear input
            input.value = '';
            this.handleInputChange();

            // Re-render
            this.renderMessages();

            console.log('✅ Mensaje guardado');
        } catch (error) {
            console.error('Error guardando mensaje:', error);
            this.showError('Error al guardar el mensaje');
        }
    }

    // ========== AUDIO RECORDING ==========

    async toggleRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            await this.startRecording();
        } else {
            await this.stopRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const durationSeconds = Math.floor((Date.now() - this.recordingStartTime) / 1000);

                stream.getTracks().forEach(track => track.stop());

                try {
                    await this.saveAudioMessage(audioBlob, durationSeconds);
                } catch (error) {
                    console.error('Error guardando audio:', error);
                    this.showError('Error al guardar el audio');
                }
            };

            this.mediaRecorder.start();
            this.recordingStartTime = Date.now();

            // Update UI
            const micBtn = this.container.querySelector(`#clinicalMicBtn-${this.patientId}`);
            const inputWrapper = this.container.querySelector(`#clinicalInputWrapper-${this.patientId}`);
            const recordingIndicator = this.container.querySelector(`#clinicalRecordingIndicator-${this.patientId}`);

            micBtn.classList.add('recording');
            micBtn.textContent = '⏹️';
            inputWrapper.style.display = 'none';
            recordingIndicator.style.display = 'flex';

            // Start timer
            this.recordingInterval = setInterval(() => this.updateRecordingTime(), 1000);

        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            this.showError('No se pudo acceder al micrófono');
        }
    }

    async stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            clearInterval(this.recordingInterval);
            this.resetRecordingUI();
        }
    }

    cancelRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.audioChunks = [];
            this.mediaRecorder.stop();
            clearInterval(this.recordingInterval);
            this.resetRecordingUI();
        }
    }

    resetRecordingUI() {
        const micBtn = this.container.querySelector(`#clinicalMicBtn-${this.patientId}`);
        const inputWrapper = this.container.querySelector(`#clinicalInputWrapper-${this.patientId}`);
        const recordingIndicator = this.container.querySelector(`#clinicalRecordingIndicator-${this.patientId}`);

        micBtn.classList.remove('recording');
        micBtn.textContent = '🎤';
        inputWrapper.style.display = 'flex';
        recordingIndicator.style.display = 'none';
    }

    updateRecordingTime() {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const timeElement = this.container.querySelector(`#clinicalRecordingTime-${this.patientId}`);
        timeElement.textContent = this.formatDuration(elapsed);
    }

    async saveAudioMessage(audioBlob, durationSeconds) {
        const currentUser = this.getCurrentUser();
        const noteType = this.currentTab === 'historia' ? 'clinical' : 'general';

        const formData = new FormData();
        formData.append('audio', audioBlob, `audio-${Date.now()}.webm`);
        formData.append('admission_id', this.admissionId);
        formData.append('duration_seconds', Math.floor(durationSeconds));
        formData.append('created_by', currentUser);
        formData.append('note_type', noteType);

        await this.apiRequest('/audio', {
            method: 'POST',
            body: formData
        });

        // Reload messages
        await this.loadMessages();
    }

    // ========== AUDIO PLAYBACK ==========

    playAudio(id, url, button) {
        if (!url || url === 'null') return;

        // Stop current audio
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.container.querySelectorAll('.clinical-audio-play-btn').forEach(btn => {
                btn.textContent = '▶';
                btn.classList.remove('playing');
            });
        }

        // Play new audio
        const audio = new Audio(url);
        this.currentAudio = audio;

        audio.play();
        button.textContent = '⏸';
        button.classList.add('playing');

        audio.onended = () => {
            button.textContent = '▶';
            button.classList.remove('playing');
        };

        audio.onpause = () => {
            button.textContent = '▶';
            button.classList.remove('playing');
        };
    }

    // ========== UI HELPERS ==========

    handleInputChange() {
        const input = this.container.querySelector(`#clinicalChatInput-${this.patientId}`);
        const micBtn = this.container.querySelector(`#clinicalMicBtn-${this.patientId}`);
        const sendBtn = this.container.querySelector(`#clinicalSendBtn-${this.patientId}`);

        // Auto-resize
        input.style.height = 'auto';
        const newHeight = Math.min(input.scrollHeight, 120);
        input.style.height = newHeight + 'px';

        // Toggle buttons
        if (input.value.trim()) {
            micBtn.style.display = 'none';
            sendBtn.style.display = 'flex';
        } else {
            micBtn.style.display = 'flex';
            sendBtn.style.display = 'none';
        }
    }

    handleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    generateWaveform() {
        const bars = 20;
        let html = '';
        for (let i = 0; i < bars; i++) {
            const height = Math.random() * 60 + 20;
            html += `<div class="clinical-audio-bar" style="height: ${height}%"></div>`;
        }
        return html;
    }

    // ========== UTILITIES ==========

    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authenticated');

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch('/api' + endpoint, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.username || user.name || 'Usuario';
            } catch (e) {
                return 'Usuario';
            }
        }
        return 'Usuario';
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatDateDivider(dateStr) {
        const today = new Date().toLocaleDateString('es-CL');
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('es-CL');

        if (dateStr === today) return 'Hoy';
        if (dateStr === yesterday) return 'Ayer';
        return dateStr;
    }

    formatTime(timestamp) {
        if (timestamp.includes(',')) {
            const parts = timestamp.split(',');
            return parts[1] ? parts[1].trim().substring(0, 5) : timestamp;
        }
        if (timestamp.includes(' ')) {
            const parts = timestamp.split(' ');
            return parts[1] ? parts[1].substring(0, 5) : timestamp;
        }
        return timestamp;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }

    showError(message) {
        console.error(message);
        alert(message);
    }
}

// Export for use
window.ClinicalChat = ClinicalChat;

console.log('✅ clinical-chat.js loaded');
