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

            // Leer el archivo de credenciales para obtener el project_id
            const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            const projectId = credentials.project_id;

            console.log(`[OCR] Inicializando con proyecto: ${projectId}`);
            console.log(`[OCR] Usando credenciales: ${keyPath}`);

            // IMPORTANTE: Eliminar cualquier variable de entorno de credenciales por defecto
            // para forzar el uso explícito del archivo de credenciales
            delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
            delete process.env.GCLOUD_PROJECT;

            // Crear cliente con credenciales explícitas
            this.client = new vision.ImageAnnotatorClient({
                keyFilename: keyPath,
                projectId: projectId,
                credentials: credentials
            });

            this.initialized = true;
            console.log(`✅ OCR Service inicializado correctamente con proyecto ${projectId}`);
        } catch (error) {
            console.error('❌ Error inicializando OCR Service:', error.message);
            throw error;
        }
    }

    async extractText(imagePath) {
        try {
            await this.initialize();

            console.log(`[OCR] Procesando imagen con documentTextDetection: ${imagePath}`);

            // Usar documentTextDetection para mejor reconocimiento de documentos/pantallas
            const request = {
                image: { source: { filename: imagePath } },
                imageContext: { languageHints: ['es'] }
            };

            const [result] = await this.client.documentTextDetection(request);
            const fullTextAnnotation = result.fullTextAnnotation;

            if (!fullTextAnnotation || !fullTextAnnotation.text) {
                throw new Error('No se detectó texto en la imagen');
            }

            const fullText = fullTextAnnotation.text;

            console.log(`[OCR] Texto extraído (${fullText.length} caracteres)`);

            // Extraer bloques estructurados con confianza real
            const blocks = this.extractStructuredBlocks(fullTextAnnotation);
            const confidence = this.calculateOverallConfidence(fullTextAnnotation);

            console.log(`[OCR] ${blocks.length} bloques extraídos, confianza general: ${(confidence * 100).toFixed(1)}%`);

            return {
                fullText,
                blocks,
                confidence
            };
        } catch (error) {
            console.error('[OCR] Error extrayendo texto:', error);
            throw new Error(`Error en OCR: ${error.message}`);
        }
    }

    extractStructuredBlocks(fullTextAnnotation) {
        const blocks = [];

        if (!fullTextAnnotation.pages) return blocks;

        for (const page of fullTextAnnotation.pages) {
            if (!page.blocks) continue;

            for (const block of page.blocks) {
                const blockText = [];
                const wordConfidences = [];

                if (!block.paragraphs) continue;

                for (const paragraph of block.paragraphs) {
                    if (!paragraph.words) continue;

                    for (const word of paragraph.words) {
                        const wordText = word.symbols
                            ? word.symbols.map(s => s.text).join('')
                            : '';
                        if (wordText) {
                            blockText.push(wordText);
                            if (word.confidence != null) {
                                wordConfidences.push(word.confidence);
                            }
                        }
                    }
                }

                if (blockText.length > 0) {
                    const avgConfidence = wordConfidences.length > 0
                        ? wordConfidences.reduce((a, b) => a + b, 0) / wordConfidences.length
                        : 0;

                    blocks.push({
                        text: blockText.join(' '),
                        confidence: avgConfidence,
                        boundingBox: block.boundingBox || null
                    });
                }
            }
        }

        return blocks;
    }

    calculateOverallConfidence(fullTextAnnotation) {
        if (!fullTextAnnotation || !fullTextAnnotation.pages) return 0;

        const allConfidences = [];

        for (const page of fullTextAnnotation.pages) {
            if (!page.blocks) continue;
            for (const block of page.blocks) {
                if (!block.paragraphs) continue;
                for (const paragraph of block.paragraphs) {
                    if (!paragraph.words) continue;
                    for (const word of paragraph.words) {
                        if (word.confidence != null) {
                            allConfidences.push(word.confidence);
                        }
                    }
                }
            }
        }

        if (allConfidences.length === 0) return 0.70;

        return allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
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
