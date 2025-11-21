/**
 * OCR Routes
 * Endpoints para extracción de datos desde imágenes
 */

const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocr.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadOCRImage, cleanupAfterProcessing } = require('../middleware/image-upload.middleware');

// POST /api/ocr/extract - Extraer datos de paciente desde imagen
router.post('/extract',
    authMiddleware, // Requiere autenticación
    uploadOCRImage, // Manejo de upload de imagen
    cleanupAfterProcessing, // Limpieza automática después de procesar
    ocrController.extractPatientData
);

// GET /api/ocr/health - Verificar que OCR service esté disponible
router.get('/health',
    authMiddleware,
    ocrController.checkOCRHealth
);

module.exports = router;
