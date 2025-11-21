/**
 * OCR Service - Integración con Google Cloud Vision API
 * Responsabilidad: Extraer texto de imágenes médicas
 */

const vision = require('@google-cloud/vision');
const fs = require('fs');

class OCRService {
    constructor() {
        // Lazy initialization - solo crear cliente cuando se use
        this.client = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const keyPath = process.env.GOOGLE_VISION_KEY_PATH;

            if (!keyPath) {
                throw new Error('GOOGLE_VISION_KEY_PATH no está configurado en .env');
            }

            // Verificar que el archivo de credenciales existe
            if (!fs.existsSync(keyPath)) {
                throw new Error(`Archivo de credenciales no encontrado: ${keyPath}`);
            }

            this.client = new vision.ImageAnnotatorClient({
                keyFilename: keyPath
            });

            this.initialized = true;
            console.log('✅ OCR Service inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando OCR Service:', error.message);
            throw error;
        }
    }

    async extractText(imagePath) {
        try {
            await this.initialize();

            console.log(`[OCR] Procesando imagen: ${imagePath}`);

            // Realizar detección de texto
            const [result] = await this.client.textDetection(imagePath);
            const detections = result.textAnnotations;

            if (!detections || detections.length === 0) {
                throw new Error('No se detectó texto en la imagen');
            }

            // El primer elemento es el texto completo
            const fullText = detections[0].description;

            console.log(`[OCR] Texto extraído (${fullText.length} caracteres)`);

            // Retornar texto y bloques individuales
            return {
                fullText,
                blocks: detections.slice(1), // Bloques individuales con coordenadas
                confidence: this.calculateOverallConfidence(detections)
            };
        } catch (error) {
            console.error('[OCR] Error extrayendo texto:', error);
            throw new Error(`Error en OCR: ${error.message}`);
        }
    }

    calculateOverallConfidence(detections) {
        if (!detections || detections.length === 0) return 0;

        // Google Vision no devuelve confidence para text detection básico
        // Retornamos un valor alto si se detectó texto
        return detections.length > 10 ? 0.90 : 0.70;
    }

    async checkHealth() {
        try {
            await this.initialize();
            return {
                available: true,
                provider: 'Google Cloud Vision API',
                initialized: this.initialized
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                initialized: false
            };
        }
    }

    // Limpiar recursos si es necesario
    async cleanup() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.initialized = false;
            console.log('[OCR] Cliente cerrado correctamente');
        }
    }
}

// Exportar como singleton
module.exports = new OCRService();
