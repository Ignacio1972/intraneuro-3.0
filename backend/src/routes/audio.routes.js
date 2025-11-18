// Rutas para Notas de Audio
// Sistema INTRANEURO - Gestión Hospitalaria
// Fecha: 2025-11-15

const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audio.controller');
const { uploadAudio, validateAudioUpload, handleMulterError } = require('../middleware/upload.middleware');
const authenticateToken = require('../middleware/auth.middleware');

// Wrapper para manejar errores de Multer
const uploadWithErrorHandling = (req, res, next) => {
    uploadAudio(req, res, (err) => {
        if (err) {
            // Manejar errores de Multer
            if (err.code === 'FILE_TOO_LARGE') {
                return res.status(413).json({
                    success: false,
                    error: 'El archivo es demasiado grande. Máximo 10MB permitido.'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    error: 'Solo se permite un archivo por solicitud.'
                });
            }
            return res.status(400).json({
                success: false,
                error: err.message || 'Error al procesar el archivo'
            });
        }
        next();
    });
};

// POST /api/audio - Subir nuevo audio
router.post('/',
    authenticateToken,
    uploadWithErrorHandling,
    validateAudioUpload,
    audioController.create
);

// GET /api/audio/admission/:admissionId - Listar audios de una admisión
router.get('/admission/:admissionId', authenticateToken, audioController.getByAdmission);

// GET /api/audio/admission/:admissionId/stats - Estadísticas de audios
router.get('/admission/:admissionId/stats', authenticateToken, audioController.getStats);

// GET /api/audio/:id - Obtener un audio específico
router.get('/:id', authenticateToken, audioController.getById);

// PATCH /api/audio/:id/important - Marcar como importante
router.patch('/:id/important', authenticateToken, audioController.toggleImportant);

// PATCH /api/audio/:id/followup - Marcar para seguimiento
router.patch('/:id/followup', authenticateToken, audioController.toggleFollowup);

// PATCH /api/audio/:id/tags - Actualizar tags médicos
router.patch('/:id/tags', authenticateToken, audioController.updateTags);

// DELETE /api/audio/:id - Soft delete
router.delete('/:id', authenticateToken, audioController.softDelete);

// POST /api/audio/:id/restore - Restaurar nota eliminada
router.post('/:id/restore', authenticateToken, audioController.restore);

// DELETE /api/audio/:id/permanent - Hard delete (solo admin)
router.delete('/:id/permanent', authenticateToken, audioController.hardDelete);

module.exports = router;