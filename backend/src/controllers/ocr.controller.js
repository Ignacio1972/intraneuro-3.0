/**
 * OCR Controller
 * Responsabilidad: Manejar requests de extracción de datos desde imágenes
 */

const ocrService = require('../services/ocr/ocr-service');
const ocrParser = require('../services/ocr/ocr-parser');

class OCRController {
    async extractPatientData(req, res) {
        try {
            console.log('[OCR Controller] Recibida solicitud de extracción');

            // Verificar que se subió una imagen
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se recibió ninguna imagen',
                    details: 'Debe enviar un archivo en el campo "image"'
                });
            }

            const imagePath = req.file.path;
            console.log(`[OCR Controller] Procesando imagen: ${imagePath}`);

            // Paso 1: Extraer texto con Google Vision
            let ocrResult;
            try {
                ocrResult = await ocrService.extractText(imagePath);
            } catch (error) {
                console.error('[OCR Controller] Error en OCR Service:', error);
                return res.status(500).json({
                    success: false,
                    error: 'No se pudo procesar la imagen',
                    details: error.message,
                    fallback: 'manual'
                });
            }

            // Paso 2: Parsear campos estructurados (con bloques para mejor extracción)
            const parsedData = ocrParser.parsePatientData(ocrResult.fullText, ocrResult.blocks);

            // Paso 3: Preparar respuesta
            const response = {
                success: true,
                extracted: parsedData.data,
                confidence: parsedData.confidence,
                warnings: parsedData.warnings,
                needsReview: parsedData.needsReview,
                missingFields: parsedData.missingFields,
                metadata: {
                    textLength: ocrResult.fullText.length,
                    blocksDetected: ocrResult.blocks.length,
                    overallConfidence: ocrResult.confidence
                }
            };

            console.log('[OCR Controller] Extracción exitosa');
            console.log(`[OCR Controller] Campos extraídos: ${Object.keys(parsedData.data).filter(k => parsedData.data[k]).length}/8`);

            return res.status(200).json(response);

        } catch (error) {
            console.error('[OCR Controller] Error no manejado:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Error procesando solicitud'
            });
        }
    }

    async checkOCRHealth(req, res) {
        try {
            const health = await ocrService.checkHealth();

            return res.status(200).json({
                success: true,
                health
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Error verificando health del servicio OCR',
                details: error.message
            });
        }
    }
}

module.exports = new OCRController();
