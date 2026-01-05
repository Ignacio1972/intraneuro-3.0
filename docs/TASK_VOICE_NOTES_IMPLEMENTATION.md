# Implementación de Notas de Voz por Tarea Individual

**Documento Técnico - INTRANEURO**
**Versión:** 1.0
**Fecha:** 29 de Diciembre 2025
**Autor:** Claude Code
**Ambiente:** `/var/www/intraneuro-dev/`

---

## Resumen Ejecutivo

Este documento describe la implementación de notas de voz individuales para cada tarea pendiente en el sistema INTRANEURO. El análisis revela que **la infraestructura está 90% implementada** y solo requiere activación y ajustes menores en el frontend.

### Estado Actual

| Componente | Estado | Trabajo Requerido |
|------------|--------|-------------------|
| Backend - Middleware upload | ✅ Completo | Ninguno |
| Backend - Ruta API | ✅ Completo | Ninguno |
| Backend - Validaciones | ✅ Completo | Ninguno |
| Frontend - Módulo audio | ✅ Implementado | Descomentarlo |
| Frontend - UI botones | ❌ Falta | Agregar en renderTaskItem() |
| Frontend - CSS | ⚠️ Parcial | Agregar estilos audio |
| Estructura de datos | ✅ Soporta audioNote | Ninguno |

**Estimación de esfuerzo:** 2-4 horas de desarrollo

---

## 1. Arquitectura Actual

### 1.1 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS                           │
│  Tabla: pending_tasks                                           │
│  Campo: task (TEXT) → JSON stringificado                       │
│                                                                 │
│  {                                                              │
│    "tasks": [                                                   │
│      {                                                          │
│        "id": "task-1731934200000-abc123",                      │
│        "text": "Realizar examen de sangre",                    │
│        "completed": false,                                      │
│        "audioNote": {           ← YA SOPORTADO                 │
│          "url": "/uploads/tasks/task_xxx.webm",                │
│          "duration": 45                                         │
│        }                                                        │
│      }                                                          │
│    ]                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↑↓
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│                                                                 │
│  POST /api/patients/upload-task-audio                          │
│  ├── Middleware: task-audio-upload.middleware.js               │
│  ├── Validación: patientId, taskId, duration (1-300s)         │
│  ├── Storage: /uploads/tasks/task_{timestamp}_{random}.webm   │
│  └── Response: { success, url, duration }                      │
└─────────────────────────────────────────────────────────────────┘
                              ↑↓
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                                                                 │
│  js/modules/task-audio.js (425 líneas) ← COMENTADO            │
│  ├── recordTaskAudio(taskId, patientId)                        │
│  ├── stopTaskAudioRecording()                                  │
│  ├── playTaskAudio(taskId)                                     │
│  ├── deleteTaskAudio(taskId, patientId)                        │
│  └── uploadTaskAudio(taskId, patientId, blob, duration)       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Archivos Involucrados

```
/var/www/intraneuro-dev/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── task-audio-upload.middleware.js  ← COMPLETO (132 líneas)
│   │   ├── routes/
│   │   │   └── patients.routes.js               ← RUTA EXISTE (líneas 38-72)
│   │   └── controllers/
│   │       └── patients.controller.js           ← TAREAS (líneas 88-177)
│   └── uploads/
│       └── tasks/                               ← DIRECTORIO LISTO
│
├── js/
│   └── modules/
│       ├── task-manager.js                      ← MODIFICAR (443 líneas)
│       └── task-audio.js                        ← DESCOMENTARLO (425 líneas)
│
├── css/
│   └── task-manager.css                         ← AGREGAR ESTILOS (395 líneas)
│
└── index.html                                   ← DESCOMENTARLO (línea 363)
```

---

## 2. Estructura de Datos

### 2.1 Objeto Tarea Actual

```javascript
{
  id: "task-1731934200000-abc123",        // Generado: task-{timestamp}-{random}
  text: "Descripción de la tarea",
  createdAt: "2025-11-18T10:30:00.000Z",
  createdBy: "Dr. González",
  completed: false,
  completedAt: null,
  completedBy: null
}
```

### 2.2 Objeto Tarea con Audio (Propuesto)

```javascript
{
  id: "task-1731934200000-abc123",
  text: "Descripción de la tarea",
  createdAt: "2025-11-18T10:30:00.000Z",
  createdBy: "Dr. González",
  completed: false,
  completedAt: null,
  completedBy: null,

  // Nota de voz asociada a esta tarea específica
  audioNote: {
    id: "audio-1731934500000",              // ID único del audio
    url: "/uploads/tasks/task_1731934500000_a1b2c3d4.webm",
    duration: 45,                            // Segundos
    createdAt: "2025-11-18T10:35:00.000Z",
    createdBy: "Dr. González"
  }
}
```

### 2.3 Validaciones

| Campo | Tipo | Requerido | Límites |
|-------|------|-----------|---------|
| audioNote.url | string | Sí | Path relativo válido |
| audioNote.duration | number | Sí | 1-300 segundos |
| audioNote.createdAt | ISO 8601 | Sí | Fecha válida |
| audioNote.createdBy | string | Sí | No vacío |

---

## 3. Implementación Backend

### 3.1 Middleware Existente

**Archivo:** `backend/src/middleware/task-audio-upload.middleware.js`

```javascript
// Ya implementado - NO REQUIERE CAMBIOS
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../../uploads/tasks');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, `task_${timestamp}_${random}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'audio/webm', 'audio/wav', 'audio/mpeg',
        'audio/mp3', 'audio/mp4', 'audio/ogg'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido'), false);
    }
};

const uploadTaskAudio = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }  // 10 MB
}).single('audio');

const validateTaskAudioUpload = (req, res, next) => {
    const { patientId, taskId, duration } = req.body;

    if (!patientId) {
        return res.status(400).json({ error: 'patientId requerido' });
    }
    if (!taskId) {
        return res.status(400).json({ error: 'taskId requerido' });
    }
    if (!duration || duration < 1 || duration > 300) {
        return res.status(400).json({ error: 'Duración inválida (1-300s)' });
    }
    next();
};

module.exports = { uploadTaskAudio, validateTaskAudioUpload, handleMulterError };
```

### 3.2 Ruta Existente

**Archivo:** `backend/src/routes/patients.routes.js` (líneas 38-72)

```javascript
// Ya implementado - NO REQUIERE CAMBIOS
router.post('/upload-task-audio',
    authMiddleware,
    uploadTaskAudio,
    validateTaskAudioUpload,
    handleMulterError,
    (req, res) => {
        try {
            const { patientId, taskId, duration } = req.body;
            const audioUrl = `/uploads/tasks/${req.file.filename}`;

            res.json({
                success: true,
                url: audioUrl,
                duration: parseInt(duration),
                taskId,
                patientId
            });
        } catch (error) {
            res.status(500).json({ error: 'Error al guardar audio' });
        }
    }
);
```

### 3.3 Endpoint para Eliminar Audio (AGREGAR)

**Archivo:** `backend/src/routes/patients.routes.js`

```javascript
// AGREGAR después de la línea 72
router.delete('/task-audio/:filename', authMiddleware, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../../uploads/tasks', filename);

        // Verificar que el archivo existe
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Audio eliminado' });
        } else {
            res.status(404).json({ error: 'Archivo no encontrado' });
        }
    } catch (error) {
        console.error('Error eliminando audio:', error);
        res.status(500).json({ error: 'Error al eliminar audio' });
    }
});
```

---

## 4. Implementación Frontend

### 4.1 Paso 1: Activar Módulo de Audio

**Archivo:** `index.html` (línea 363)

```html
<!-- ANTES (comentado) -->
<!-- <script src="js/modules/task-audio.js?v=1"></script> -->

<!-- DESPUÉS (activado) -->
<script src="js/modules/task-audio.js?v=2"></script>
```

### 4.2 Paso 2: Modificar renderTaskItem()

**Archivo:** `js/modules/task-manager.js`

**Ubicación:** Función `renderTaskItem()` (línea 286)

```javascript
// ANTES (sin audio)
function renderTaskItem(task, patientId) {
    const isCompleted = task.completed;
    const taskDate = new Date(task.createdAt).toLocaleDateString('es-CL');

    return `
        <div class="task-item ${isCompleted ? 'task-completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTaskComplete('${task.id}', ${patientId})">
                ${isCompleted ? '☑️' : '⬜'}
            </div>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    ${taskDate} - ${task.createdBy || 'Sistema'}
                    ${task.completedBy ? ` • Completada por ${task.completedBy}` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-delete-btn" onclick="deleteTask('${task.id}', ${patientId})" title="Eliminar">
                    🗑️
                </button>
            </div>
        </div>
    `;
}
```

```javascript
// DESPUÉS (con audio)
function renderTaskItem(task, patientId) {
    const isCompleted = task.completed;
    const taskDate = new Date(task.createdAt).toLocaleDateString('es-CL');

    // Renderizar controles de audio
    let audioControls = '';
    if (task.audioNote && task.audioNote.url) {
        // Tiene audio - mostrar reproductor
        const duration = formatAudioDuration(task.audioNote.duration);
        audioControls = `
            <div class="task-audio-player" data-task-id="${task.id}">
                <button class="task-audio-play-btn"
                        onclick="playTaskAudio('${task.id}', '${task.audioNote.url}')"
                        title="Reproducir nota de voz">
                    <span class="play-icon">▶</span>
                    <span class="audio-duration">${duration}</span>
                </button>
                <button class="task-audio-delete-btn"
                        onclick="deleteTaskAudio('${task.id}', ${patientId})"
                        title="Eliminar audio">
                    🗑️
                </button>
            </div>
        `;
    } else if (!isCompleted) {
        // No tiene audio y no está completada - mostrar botón grabar
        audioControls = `
            <button class="task-audio-record-btn"
                    onclick="startRecordingTaskAudio('${task.id}', ${patientId})"
                    title="Agregar nota de voz">
                🎤
            </button>
        `;
    }

    return `
        <div class="task-item ${isCompleted ? 'task-completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTaskComplete('${task.id}', ${patientId})">
                ${isCompleted ? '☑️' : '⬜'}
            </div>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    ${taskDate} - ${task.createdBy || 'Sistema'}
                    ${task.completedBy ? ` • Completada por ${task.completedBy}` : ''}
                </div>
                ${audioControls}
            </div>
            <div class="task-actions">
                <button class="task-delete-btn" onclick="deleteTask('${task.id}', ${patientId})" title="Eliminar">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// Función auxiliar para formatear duración
function formatAudioDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### 4.3 Paso 3: Agregar Indicador de Grabación

**Archivo:** `js/modules/task-manager.js`

Agregar después de `renderTaskItem()`:

```javascript
// Renderizar indicador de grabación activa
function renderTaskRecordingIndicator(taskId, patientId) {
    return `
        <div class="task-recording-indicator" id="task-recording-${taskId}">
            <div class="recording-pulse"></div>
            <span class="recording-time" id="task-recording-time-${taskId}">0:00</span>
            <div class="recording-controls">
                <button class="btn-stop-recording"
                        onclick="stopRecordingTaskAudio('${taskId}', ${patientId})">
                    ⏹️ Guardar
                </button>
                <button class="btn-cancel-recording"
                        onclick="cancelRecordingTaskAudio('${taskId}', ${patientId})">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
}
```

### 4.4 Paso 4: Modificar task-audio.js

**Archivo:** `js/modules/task-audio.js`

El archivo ya está implementado. Verificar que las funciones expuestas globalmente coincidan:

```javascript
// Al final del archivo, verificar exports globales
window.startRecordingTaskAudio = startRecordingTaskAudio;
window.stopRecordingTaskAudio = stopRecordingTaskAudio;
window.cancelRecordingTaskAudio = cancelRecordingTaskAudio;
window.playTaskAudio = playTaskAudio;
window.pauseTaskAudio = pauseTaskAudio;
window.deleteTaskAudio = deleteTaskAudio;
```

### 4.5 Paso 5: Actualizar Tarea con Audio

**Archivo:** `js/modules/task-audio.js`

Verificar/modificar la función `uploadTaskAudio()`:

```javascript
async function uploadTaskAudio(taskId, patientId, audioBlob, duration) {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'task-audio.webm');
        formData.append('patientId', patientId);
        formData.append('taskId', taskId);
        formData.append('duration', Math.round(duration));

        const token = localStorage.getItem('token');
        const response = await fetch('/api/patients/upload-task-audio', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir audio');
        }

        const result = await response.json();

        // Actualizar la tarea en el estado local
        const tasks = window.taskManagerState.tasks;
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex !== -1) {
            tasks[taskIndex].audioNote = {
                id: `audio-${Date.now()}`,
                url: result.url,
                duration: result.duration,
                createdAt: new Date().toISOString(),
                createdBy: window.currentUser?.name || 'Usuario'
            };

            // Guardar en backend
            await saveTasksToBackend(patientId);

            // Re-renderizar
            renderTaskList(patientId);

            showToast('Nota de voz guardada', 'success');
        }

        return result;

    } catch (error) {
        console.error('Error uploading task audio:', error);
        showToast('Error al guardar nota de voz', 'error');
        throw error;
    }
}
```

---

## 5. Estilos CSS

### 5.1 Agregar a task-manager.css

**Archivo:** `css/task-manager.css`

```css
/* ================================================
   NOTAS DE VOZ EN TAREAS
   ================================================ */

/* Contenedor del reproductor de audio */
.task-audio-player {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 6px 12px;
    background: linear-gradient(135deg, #dcf8c6 0%, #c5e1a5 100%);
    border-radius: 18px;
    border: 1px solid #a5d6a7;
}

/* Botón de reproducción */
.task-audio-play-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.task-audio-play-btn:hover {
    background: #43a047;
    transform: scale(1.02);
}

.task-audio-play-btn.playing {
    background: #ff9800;
}

.task-audio-play-btn.playing .play-icon::before {
    content: '⏸';
}

.play-icon {
    font-size: 12px;
}

.audio-duration {
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 12px;
}

/* Botón eliminar audio */
.task-audio-delete-btn {
    padding: 4px 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    font-size: 14px;
}

.task-audio-delete-btn:hover {
    opacity: 1;
}

/* Botón grabar (cuando no hay audio) */
.task-audio-record-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-top: 8px;
    background: #f5f5f5;
    border: 1px dashed #ccc;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
}

.task-audio-record-btn:hover {
    background: #e3f2fd;
    border-color: #2196f3;
    transform: scale(1.1);
}

/* Indicador de grabación activa */
.task-recording-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
    border-radius: 12px;
    border: 1px solid #ef9a9a;
    animation: recording-pulse 1.5s ease-in-out infinite;
}

@keyframes recording-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
}

.recording-pulse {
    width: 12px;
    height: 12px;
    background: #f44336;
    border-radius: 50%;
    animation: pulse-dot 1s ease-in-out infinite;
}

@keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
}

.recording-time {
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 14px;
    font-weight: 600;
    color: #c62828;
    min-width: 40px;
}

.recording-controls {
    display: flex;
    gap: 8px;
    margin-left: auto;
}

.btn-stop-recording,
.btn-cancel-recording {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-stop-recording {
    background: #4caf50;
    color: white;
}

.btn-stop-recording:hover {
    background: #43a047;
}

.btn-cancel-recording {
    background: #9e9e9e;
    color: white;
}

.btn-cancel-recording:hover {
    background: #757575;
}

/* Tarea completada - ocultar botón de grabar */
.task-completed .task-audio-record-btn {
    display: none;
}

/* Responsive */
@media (max-width: 480px) {
    .task-audio-player {
        flex-wrap: wrap;
        justify-content: center;
    }

    .task-recording-indicator {
        flex-wrap: wrap;
        justify-content: center;
    }

    .recording-controls {
        width: 100%;
        justify-content: center;
        margin-top: 8px;
    }
}
```

---

## 6. Flujo de Usuario

### 6.1 Grabar Nota de Voz en Tarea

```
┌──────────────────────────────────────────────────────────────┐
│  1. Usuario ve tarea pendiente sin audio                     │
│     [⬜] Realizar examen de sangre                          │
│     15/11/2025 - Dr. González                               │
│     [🎤]  ← Botón para agregar nota de voz                  │
└──────────────────────────────────────────────────────────────┘
                              ↓
                    Usuario hace clic en 🎤
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Solicitud de permiso de micrófono                        │
│     ┌─────────────────────────────────────┐                  │
│     │ 🎤 Permitir acceso al micrófono?   │                  │
│     │    [Permitir]  [Bloquear]          │                  │
│     └─────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
                              ↓
                    Usuario permite acceso
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Grabación en progreso                                    │
│     [⬜] Realizar examen de sangre                          │
│     15/11/2025 - Dr. González                               │
│     ┌────────────────────────────────────┐                   │
│     │ 🔴 0:15  [⏹️ Guardar] [❌ Cancelar]│                   │
│     └────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
                              ↓
              Usuario hace clic en "Guardar"
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Audio guardado - Reproductor visible                     │
│     [⬜] Realizar examen de sangre                          │
│     15/11/2025 - Dr. González                               │
│     ┌────────────────────┐                                   │
│     │ [▶ 0:45] [🗑️]     │  ← Reproductor de audio          │
│     └────────────────────┘                                   │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Reproducir Nota de Voz

```
Usuario hace clic en [▶ 0:45]
         ↓
Audio se reproduce
Botón cambia a [⏸ 0:45]
         ↓
Audio termina o usuario hace clic
         ↓
Botón vuelve a [▶ 0:45]
```

### 6.3 Eliminar Nota de Voz

```
Usuario hace clic en 🗑️
         ↓
┌─────────────────────────────────────┐
│ ¿Eliminar esta nota de voz?        │
│                                     │
│     [Cancelar]  [Eliminar]         │
└─────────────────────────────────────┘
         ↓
Usuario confirma
         ↓
- DELETE /api/patients/task-audio/{filename}
- task.audioNote = null
- saveTasksToBackend()
- Re-render lista
         ↓
Botón 🎤 aparece nuevamente
```

---

## 7. Manejo de Errores

### 7.1 Errores de Grabación

| Error | Causa | Manejo |
|-------|-------|--------|
| `NotAllowedError` | Permiso denegado | Toast: "Permiso de micrófono denegado" |
| `NotFoundError` | Sin micrófono | Toast: "No se encontró micrófono" |
| `NotReadableError` | Micrófono en uso | Toast: "El micrófono está en uso" |

### 7.2 Errores de Upload

| Error | Código | Manejo |
|-------|--------|--------|
| Archivo muy grande | 413 | Toast: "Audio muy largo (máx 5 min)" |
| Tipo no soportado | 400 | Toast: "Formato de audio no soportado" |
| Error de red | 500 | Toast: "Error de conexión" + reintentar |

### 7.3 Implementación

```javascript
async function handleRecordingError(error) {
    console.error('Recording error:', error);

    let message = 'Error al grabar audio';

    if (error.name === 'NotAllowedError') {
        message = 'Permiso de micrófono denegado. Por favor, permite el acceso en la configuración del navegador.';
    } else if (error.name === 'NotFoundError') {
        message = 'No se encontró ningún micrófono. Conecta un micrófono e intenta de nuevo.';
    } else if (error.name === 'NotReadableError') {
        message = 'El micrófono está siendo usado por otra aplicación.';
    }

    showToast(message, 'error');
    cleanupRecordingState();
}
```

---

## 8. Consideraciones de Rendimiento

### 8.1 Límites

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| Duración máxima | 5 minutos (300s) | Evitar archivos muy grandes |
| Tamaño máximo | 10 MB | Balance calidad/almacenamiento |
| Formato | WebM (Opus) | Mejor compresión, soporte universal |
| Notas por tarea | 1 | Simplicidad de UX |

### 8.2 Optimizaciones

```javascript
// Lazy loading de audio - no precargar todos los audios
function playTaskAudio(taskId, audioUrl) {
    // Crear elemento audio solo cuando se necesita
    if (!window.taskAudioElements) {
        window.taskAudioElements = {};
    }

    // Reusar o crear elemento
    if (!window.taskAudioElements[taskId]) {
        window.taskAudioElements[taskId] = new Audio(audioUrl);
    }

    const audio = window.taskAudioElements[taskId];
    audio.play();
}

// Limpiar audios no usados al cerrar modal
function cleanupTaskAudios() {
    if (window.taskAudioElements) {
        Object.values(window.taskAudioElements).forEach(audio => {
            audio.pause();
            audio.src = '';
        });
        window.taskAudioElements = {};
    }
}
```

---

## 9. Testing

### 9.1 Casos de Prueba

| # | Caso | Pasos | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Grabar audio | Clic 🎤 → Grabar 10s → Guardar | Audio aparece con duración |
| 2 | Cancelar grabación | Clic 🎤 → Grabar → Cancelar | Sin audio, botón 🎤 visible |
| 3 | Reproducir audio | Clic ▶ | Audio se reproduce |
| 4 | Pausar audio | Clic ⏸ durante reproducción | Audio se pausa |
| 5 | Eliminar audio | Clic 🗑️ → Confirmar | Audio eliminado, botón 🎤 visible |
| 6 | Completar tarea con audio | Marcar ☑️ | Audio sigue visible |
| 7 | Grabar sin permiso | Denegar micrófono | Toast de error |
| 8 | Grabar 5+ minutos | Grabar hasta límite | Auto-stop a 5 min |

### 9.2 Verificación de Archivos

```bash
# Verificar que los archivos se guarden correctamente
ls -la /var/www/intraneuro-dev/uploads/tasks/

# Verificar formato de nombres
# Esperado: task_1735500000000_a1b2c3d4.webm

# Verificar tamaño
du -h /var/www/intraneuro-dev/uploads/tasks/*
```

---

## 10. Checklist de Implementación

### Fase 1: Backend (Tiempo: 30 min)

- [ ] Verificar que middleware existe y funciona
- [ ] Agregar endpoint DELETE para eliminar archivo físico
- [ ] Probar upload con curl/Postman
- [ ] Reiniciar `pm2 restart intraneuro-api-dev`

### Fase 2: Frontend - Activación (Tiempo: 15 min)

- [ ] Descomentar `task-audio.js` en index.html
- [ ] Verificar que carga sin errores en consola
- [ ] Verificar que funciones están en window

### Fase 3: Frontend - UI (Tiempo: 1-2 horas)

- [ ] Modificar `renderTaskItem()` con controles de audio
- [ ] Agregar `renderTaskRecordingIndicator()`
- [ ] Agregar `formatAudioDuration()`
- [ ] Verificar integración con `task-audio.js`

### Fase 4: Estilos (Tiempo: 30 min)

- [ ] Agregar CSS de reproductor
- [ ] Agregar CSS de indicador grabación
- [ ] Agregar CSS responsive
- [ ] Probar en móvil

### Fase 5: Testing (Tiempo: 1 hora)

- [ ] Probar grabación completa
- [ ] Probar cancelación
- [ ] Probar reproducción
- [ ] Probar eliminación
- [ ] Probar en diferentes navegadores
- [ ] Probar manejo de errores

---

## 11. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Incompatibilidad navegador | Baja | Alto | Detectar soporte MediaRecorder |
| Archivos huérfanos en disco | Media | Bajo | Cron job de limpieza mensual |
| Grabación muy larga | Baja | Medio | Auto-stop a 5 minutos |
| Pérdida de audio en error de red | Media | Alto | Guardar en localStorage temporalmente |

---

## 12. Futuras Mejoras

1. **Transcripción automática** - Usar Whisper API para convertir audio a texto
2. **Múltiples notas por tarea** - Cambiar `audioNote` a `audioNotes[]`
3. **Waveform visual** - Mostrar forma de onda con WaveSurfer.js
4. **Compresión en cliente** - Reducir tamaño antes de upload
5. **Sincronización offline** - Guardar en IndexedDB si no hay conexión

---

## Apéndice A: Código Completo de Referencia

### A.1 Estado Global del Sistema de Audio

```javascript
// js/modules/task-audio.js - Estado global
window.taskAudioState = {
    recorder: null,              // MediaRecorder instance
    stream: null,                // MediaStream from getUserMedia
    audioChunks: [],             // Recorded data chunks
    recordingTaskId: null,       // Task being recorded
    recordingPatientId: null,    // Patient ID
    recordingStartTime: null,    // Start timestamp
    recordingInterval: null,     // Timer interval
    currentAudio: null,          // Currently playing Audio element
    currentPlayingTaskId: null   // Task ID being played
};
```

### A.2 Función Principal de Grabación

```javascript
async function startRecordingTaskAudio(taskId, patientId) {
    const state = window.taskAudioState;

    // Verificar grabación en curso
    if (state.recorder && state.recorder.state === 'recording') {
        showToast('Ya hay una grabación en curso', 'warning');
        return;
    }

    try {
        // Solicitar permiso de micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        state.stream = stream;
        state.recordingTaskId = taskId;
        state.recordingPatientId = patientId;
        state.audioChunks = [];
        state.recordingStartTime = Date.now();

        // Crear MediaRecorder
        state.recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        state.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                state.audioChunks.push(e.data);
            }
        };

        state.recorder.onstop = async () => {
            const duration = (Date.now() - state.recordingStartTime) / 1000;
            const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });

            // Limpiar stream
            state.stream.getTracks().forEach(track => track.stop());

            // Subir audio
            await uploadTaskAudio(taskId, patientId, audioBlob, duration);

            // Limpiar estado
            cleanupRecordingState();
        };

        // Iniciar grabación
        state.recorder.start();

        // Mostrar UI de grabación
        showRecordingUI(taskId, patientId);

        // Iniciar timer
        startRecordingTimer(taskId);

    } catch (error) {
        handleRecordingError(error);
    }
}
```

---

**Fin del Documento**

*Para preguntas o clarificaciones, revisar el código fuente en `/var/www/intraneuro-dev/`*
