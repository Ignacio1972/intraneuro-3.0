const router = require('express').Router();
const patientsController = require('../controllers/patients.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadTaskAudio, validateTaskAudioUpload, handleMulterError } = require('../middleware/task-audio-upload.middleware');
const { uploadVoiceNote, validateVoiceNoteUpload, handleMulterError: handleVoiceNoteError } = require('../middleware/voice-note-upload.middleware');

// Ruta pública para compartir fichas (SIN autenticación)
router.get('/public/:id', patientsController.getPublicPatient);

// Pacientes - SIN el prefijo /patients porque ya está en index.js
// IMPORTANTE: Rutas específicas ANTES que rutas con parámetros
router.get('/active', authMiddleware, patientsController.getActivePatients);
router.get('/archived', authMiddleware, patientsController.getArchivedPatients);
router.get('/search', authMiddleware, patientsController.searchByRut);
router.post('/', authMiddleware, patientsController.createPatient);

// Rutas para acceder por admissionId directamente (para pacientes archivados)
router.get('/admission/:admissionId/observations', authMiddleware, patientsController.getObservationsByAdmission);
router.put('/admission/:admissionId', authMiddleware, patientsController.updateArchivedAdmission);

// Rutas existentes por patientId
router.get('/:id/history', authMiddleware, patientsController.getPatientHistory);
router.get('/:id/voice-notes', authMiddleware, patientsController.getPatientVoiceNotes);
router.delete('/:id/voice-notes/:noteId', authMiddleware, patientsController.deletePatientVoiceNote);
router.get('/:id/admission/observations', authMiddleware, patientsController.getObservations);
router.post('/:id/admission/observations', authMiddleware, patientsController.createObservation);
router.get('/:id/admission/tasks', authMiddleware, patientsController.getAdmissionTasks);
router.post('/:id/admission/tasks', authMiddleware, patientsController.createTask);
router.put('/:id/admission', authMiddleware, patientsController.updateActiveAdmission);
router.put('/:id/discharge', authMiddleware, patientsController.updateDischarge);
router.put('/:id/bed', authMiddleware, patientsController.updateBed);
router.put('/:id/service', authMiddleware, patientsController.updateService);
router.put('/:id/prevision', authMiddleware, patientsController.updatePrevision);
router.put('/:id/admittedBy', authMiddleware, patientsController.updateAdmittedBy);
router.put('/:id/diagnosis-details', authMiddleware, patientsController.updateDiagnosisDetails);

// Ruta para upload de audios de tareas
router.post('/upload-task-audio', authMiddleware, uploadTaskAudio, validateTaskAudioUpload, handleMulterError, (req, res) => {
    try {
        const { patientId, taskId, duration } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió archivo'
            });
        }

        // Construir URL relativa del archivo
        const fileUrl = `/uploads/tasks/${file.filename}`;

        console.log(`[TaskAudio] Audio subido: ${fileUrl} (${duration}s, ${(file.size / 1024).toFixed(2)}KB)`);

        res.json({
            success: true,
            url: fileUrl,
            filename: file.filename,
            size: file.size,
            duration: duration,
            patientId: patientId,
            taskId: taskId
        });

    } catch (error) {
        console.error('[TaskAudio] Error en upload:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar audio'
        });
    }
});

// Ruta para upload de notas de voz (debe estar ANTES de /:id genérico)
router.post('/upload-voice-note', authMiddleware, uploadVoiceNote, validateVoiceNoteUpload, handleVoiceNoteError, patientsController.uploadPatientVoiceNote);

router.put('/:id', authMiddleware, patientsController.updatePatient);
router.delete('/:id', authMiddleware, patientsController.deletePatient);
router.get('/:id', authMiddleware, patientsController.getPatientById); // Esta DEBE ir al final

module.exports = router;