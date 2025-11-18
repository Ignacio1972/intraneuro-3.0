# 🏗️ Propuesta de Arquitectura Modular para Modal de Pacientes

## Situación Actual
El modal de pacientes está creciendo con múltiples funcionalidades:
- ✅ Información básica editable
- ✅ Sistema de notas de texto
- ✅ Dropdown de servicio
- 🔄 **Futuro:** Sistema de audio tipo WhatsApp
- 🔄 **Futuro:** Archivos adjuntos
- 🔄 **Futuro:** Historial médico expandido

## 🚀 Arquitectura Propuesta

### 1. Estructura Modular

```javascript
// patient-modal-v2.js
const PatientModalV2 = {
    // Registro de componentes
    components: {
        // Componentes actuales
        basicInfo: {
            id: 'basic-info',
            title: 'Información Básica',
            icon: '👤',
            order: 1,
            render: (patient) => BasicInfoComponent.render(patient),
            onInit: (patient) => BasicInfoComponent.init(patient),
            editable: true
        },

        service: {
            id: 'service',
            title: 'Servicio Hospitalario',
            icon: '🏥',
            order: 2,
            render: (patient) => ServiceComponent.render(patient),
            onInit: (patient) => ServiceComponent.init(patient),
            editable: true
        },

        textNotes: {
            id: 'text-notes',
            title: 'Notas y Observaciones',
            icon: '📝',
            order: 3,
            render: (patient) => TextNotesComponent.render(patient),
            onInit: (patient) => TextNotesComponent.init(patient),
            editable: true
        },

        // Componente FUTURO de audio
        audioNotes: {
            id: 'audio-notes',
            title: 'Notas de Voz',
            icon: '🎙️',
            order: 4,
            render: (patient) => AudioNotesComponent.render(patient),
            onInit: (patient) => AudioNotesComponent.init(patient),
            editable: true,
            enabled: false // Activar cuando esté listo
        }
    },

    // Renderizar modal completo
    render(patientId) {
        const patient = patients.find(p => p.id === patientId);

        // Obtener componentes activos y ordenados
        const activeComponents = Object.values(this.components)
            .filter(c => c.enabled !== false)
            .sort((a, b) => a.order - b.order);

        // Construir HTML del modal
        let modalHTML = `
            <div class="patient-modal-v2">
                <div class="modal-header">
                    <h2>${patient.name}</h2>
                    <div class="modal-tabs">
                        ${this.renderTabs(activeComponents)}
                    </div>
                </div>
                <div class="modal-body">
                    ${this.renderContent(activeComponents, patient)}
                </div>
            </div>
        `;

        return modalHTML;
    },

    // Sistema de tabs para navegación
    renderTabs(components) {
        return components.map(c => `
            <button class="modal-tab" data-tab="${c.id}">
                ${c.icon} ${c.title}
            </button>
        `).join('');
    },

    // Renderizar contenido de componentes
    renderContent(components, patient) {
        return components.map(c => `
            <div class="modal-section" data-section="${c.id}">
                ${c.render(patient)}
            </div>
        `).join('');
    }
};
```

### 2. Componente de Audio (Futuro)

```javascript
// components/audio-notes-component.js
const AudioNotesComponent = {
    render(patient) {
        return `
            <div class="audio-notes-container">
                <!-- Grabador estilo WhatsApp -->
                <div class="audio-recorder">
                    <button class="record-btn" data-patient="${patient.id}">
                        <span class="mic-icon">🎤</span>
                        <span class="record-time" style="display:none">0:00</span>
                    </button>
                </div>

                <!-- Lista de audios -->
                <div class="audio-list">
                    ${this.renderAudioList(patient.audioNotes || [])}
                </div>
            </div>
        `;
    },

    renderAudioList(audioNotes) {
        return audioNotes.map(note => `
            <div class="audio-note">
                <div class="audio-player">
                    <button class="play-btn" data-audio="${note.id}">▶️</button>
                    <div class="audio-waveform">
                        <canvas id="waveform-${note.id}"></canvas>
                    </div>
                    <span class="audio-duration">${note.duration}</span>
                </div>
                <div class="audio-meta">
                    <span class="audio-author">${note.author}</span>
                    <span class="audio-date">${formatDate(note.createdAt)}</span>
                </div>
            </div>
        `).join('');
    },

    init(patient) {
        // Inicializar Web Audio API
        this.setupAudioRecorder(patient.id);
        // Cargar audios existentes
        this.loadAudioNotes(patient.id);
    },

    setupAudioRecorder(patientId) {
        // Configurar MediaRecorder API
        // Estilo WhatsApp: mantener presionado para grabar
    }
};
```

## 📊 Ventajas de Esta Arquitectura

### 1. **Modularidad**
- Cada componente es independiente
- Fácil agregar/quitar funcionalidades
- Sin afectar otros componentes

### 2. **Escalabilidad**
- Agregar audio = nuevo componente
- Agregar archivos = nuevo componente
- Sin tocar código existente

### 3. **Mantenibilidad**
- Cada componente en su archivo
- Responsabilidad única
- Testing aislado

### 4. **Performance**
- Lazy loading de componentes
- Solo cargar lo necesario
- Componentes async

## 🔧 Plan de Implementación

### Fase 1: Refactoring Base (1-2 días)
1. Crear estructura modular
2. Migrar componentes existentes
3. Mantener compatibilidad

### Fase 2: Sistema de Audio (3-5 días)
1. Implementar MediaRecorder API
2. Backend para almacenar audios
3. UI estilo WhatsApp
4. Reproductor de audio

### Fase 3: Optimizaciones (1-2 días)
1. Lazy loading
2. Caching
3. Compresión de audio

## 💾 Consideraciones de Backend

### Para Audio necesitarás:
```sql
-- Tabla para notas de audio
CREATE TABLE audio_notes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    admission_id INTEGER REFERENCES admissions(id),
    audio_url VARCHAR(500),
    duration INTEGER, -- segundos
    transcript TEXT, -- transcripción opcional
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints:
- `POST /api/patients/:id/audio` - Subir audio
- `GET /api/patients/:id/audio` - Listar audios
- `DELETE /api/audio/:id` - Eliminar audio
- `GET /api/audio/:id/stream` - Streaming de audio

## 🎯 Conclusión

**Recomendación:** SÍ refactorizar ANTES de agregar audio porque:

1. **Complejidad creciente** - El modal ya tiene mucho código
2. **Mejor UX** - Tabs o secciones colapsables
3. **Mantenimiento** - Más fácil debuggear
4. **Futuro** - Preparado para más features

Sin refactorizar, el modal se volverá un "spaghetti code" difícil de mantener.

---
**Tiempo estimado:** 5-8 días para refactoring completo + audio
**Prioridad:** Alta si planeas agregar más features
**ROI:** Alto - ahorro de tiempo futuro