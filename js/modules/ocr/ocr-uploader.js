/**
 * OCR Uploader Module
 * Responsabilidad: UI de captura/upload de imagen y comunicación con API
 */

class OCRUploader {
    constructor() {
        this.selectedFile = null;
        this.previewCallback = null;
        this.loadingElement = null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[OCR] Contenedor ${containerId} no encontrado`);
            return;
        }

        container.innerHTML = `
            <div class="ocr-upload-zone">
                <div class="ocr-upload-instructions">
                    <h4>📸 Capturar foto del monitor</h4>
                    <p>Toma una foto clara del monitor con los datos del paciente o sube una imagen desde tu galería.</p>
                </div>

                <input type="file"
                       id="ocrImageInput"
                       accept="image/*"
                       capture="environment"
                       style="display: none;">

                <div class="ocr-buttons">
                    <button type="button" id="ocrCaptureBtn" class="btn btn-primary">
                        📸 Capturar Foto
                    </button>

                    <button type="button" id="ocrUploadBtn" class="btn btn-secondary">
                        📁 Subir desde Galería
                    </button>
                </div>

                <div id="ocrPreviewSection" style="display: none; margin-top: 1rem;">
                    <img id="ocrImagePreview" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 2px solid #ddd;">
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
                        <button type="button" id="ocrProcessBtn" class="btn btn-success">
                            🔄 Procesar Imagen
                        </button>
                        <button type="button" id="ocrCancelBtn" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>

                <div id="ocrLoadingSection" style="display: none; text-align: center; padding: 2rem;">
                    <div class="spinner"></div>
                    <p>Procesando imagen con OCR...</p>
                    <small>Esto puede tomar unos segundos</small>
                </div>
            </div>
        `;

        this.attachEventListeners();
        console.log('[OCR Uploader] Inicializado correctamente');
    }

    attachEventListeners() {
        const captureBtn = document.getElementById('ocrCaptureBtn');
        const uploadBtn = document.getElementById('ocrUploadBtn');
        const imageInput = document.getElementById('ocrImageInput');
        const processBtn = document.getElementById('ocrProcessBtn');
        const cancelBtn = document.getElementById('ocrCancelBtn');

        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                imageInput.setAttribute('capture', 'environment');
                imageInput.click();
            });
        }

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                imageInput.removeAttribute('capture');
                imageInput.click();
            });
        }

        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                this.handleImageSelect(e.target.files[0]);
            });
        }

        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processImage();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.reset();
            });
        }
    }

    async handleImageSelect(file) {
        if (!file) {
            console.log('[OCR] No se recibió archivo');
            return;
        }

        console.log('[OCR] Archivo recibido:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toISOString()
        });

        // ✨ MOSTRAR LOADING INMEDIATAMENTE
        this.showLoadingScreen();

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            console.error('[OCR] Tipo de archivo inválido:', file.type);
            this.hideLoadingScreen();
            this.showError('Formato no válido. Solo se permiten imágenes JPEG, PNG o WEBP.');
            return;
        }

        console.log('[OCR] Tipo de archivo válido, procesando...');

        // ✨ CAMBIO: Comprimir ANTES de validar tamaño (celulares modernos pueden tener fotos >5MB)
        const compressedFile = await this.compressImageIfNeeded(file);

        // Validar tamaño DESPUÉS de comprimir (5MB max para el servidor)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (compressedFile.size > maxSize) {
            console.error('[OCR] Archivo demasiado grande después de compresión:', compressedFile.size);
            this.hideLoadingScreen();
            this.showError(`La imagen sigue siendo muy grande (${(compressedFile.size / 1024 / 1024).toFixed(1)}MB). Intenta con una imagen de menor resolución.`);
            return;
        }

        console.log('[OCR] Validaciones pasadas correctamente');

        this.selectedFile = compressedFile;
        console.log('[OCR] Imagen lista para procesar:', compressedFile.name, 'Tamaño final:', compressedFile.size);

        // ✨ NUEVO: Procesamiento automático al seleccionar imagen
        console.log('[OCR] Iniciando procesamiento automático...');
        this.processImage();
    }

    async processImage() {
        if (!this.selectedFile) {
            this.showError('No hay imagen seleccionada');
            return;
        }

        // Ya no llamamos showLoading() aquí porque se llama desde handleImageSelect()

        try {
            const formData = new FormData();
            formData.append('image', this.selectedFile);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            console.log('[OCR] Enviando imagen al servidor...');
            console.log('[OCR] Archivo:', this.selectedFile.name, 'Tipo:', this.selectedFile.type, 'Tamaño:', this.selectedFile.size);

            const response = await fetch('/api/ocr/extract', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('[OCR] Response status:', response.status);
            console.log('[OCR] Response headers:', response.headers.get('content-type'));

            // Intentar leer la respuesta como texto primero para debugging
            const responseText = await response.text();
            console.log('[OCR] Response text (primeros 500 chars):', responseText.substring(0, 500));

            // Intentar parsear como JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('[OCR] Error parseando JSON:', parseError);
                console.error('[OCR] Respuesta completa:', responseText);
                throw new Error(`Error del servidor: respuesta no es JSON válido. Status: ${response.status}`);
            }

            if (!response.ok || !result.success) {
                throw new Error(result.error || result.details || 'Error procesando imagen');
            }

            console.log('[OCR] Datos extraídos exitosamente:', result);

            // Callback con datos extraídos
            if (this.previewCallback) {
                this.previewCallback(result);
            }

            this.hideLoadingScreen();

        } catch (error) {
            console.error('[OCR] Error completo:', error);
            console.error('[OCR] Error stack:', error.stack);
            this.hideLoadingScreen();

            // DEBUGGING: Mostrar alert en móvil
            const errorMsg = `ERROR OCR:\n${error.message}\n\nStack:\n${error.stack}`;
            alert(errorMsg);

            this.showError(error.message || 'Error al procesar imagen');
        }
    }

    onPreview(callback) {
        this.previewCallback = callback;
    }

    openCamera() {
        const imageInput = document.getElementById('ocrImageInput');
        if (imageInput) {
            imageInput.setAttribute('capture', 'environment');
            imageInput.click();
            console.log('[OCR] Abriendo cámara...');
        }
    }

    reset() {
        this.selectedFile = null;

        const imageInput = document.getElementById('ocrImageInput');
        const previewSection = document.getElementById('ocrPreviewSection');

        if (imageInput) imageInput.value = '';
        if (previewSection) previewSection.style.display = 'none';

        console.log('[OCR] Uploader reseteado');
    }

    showLoadingScreen() {
        // Ocultar formulario de ingreso
        const admissionForm = document.getElementById('admissionForm');
        if (admissionForm) admissionForm.style.display = 'none';

        // Ocultar botón OCR
        const ocrToggleSection = document.querySelector('.ocr-toggle-section');
        if (ocrToggleSection) ocrToggleSection.style.display = 'none';

        // Mostrar loading a pantalla completa en el modal
        let loadingOverlay = document.getElementById('ocrFullScreenLoading');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'ocrFullScreenLoading';
            loadingOverlay.className = 'ocr-fullscreen-loading';
            loadingOverlay.innerHTML = `
                <div class="ocr-loading-content">
                    <div class="spinner"></div>
                    <p>Procesando imagen con OCR...</p>
                    <small>Esto puede tomar unos segundos</small>
                </div>
            `;
            const modalContent = document.querySelector('#admissionModal .modal-content');
            if (modalContent) {
                modalContent.appendChild(loadingOverlay);
            }
        }
        loadingOverlay.style.display = 'flex';
    }

    hideLoadingScreen() {
        const loadingOverlay = document.getElementById('ocrFullScreenLoading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        // Mostrar formulario nuevamente (por si hay error)
        const admissionForm = document.getElementById('admissionForm');
        if (admissionForm) admissionForm.style.display = 'block';

        // Mostrar botón OCR nuevamente
        const ocrToggleSection = document.querySelector('.ocr-toggle-section');
        if (ocrToggleSection) ocrToggleSection.style.display = 'block';
    }

    showLoading() {
        const previewSection = document.getElementById('ocrPreviewSection');
        const loadingSection = document.getElementById('ocrLoadingSection');

        if (previewSection) previewSection.style.display = 'none';
        if (loadingSection) loadingSection.style.display = 'block';
    }

    hideLoading() {
        const loadingSection = document.getElementById('ocrLoadingSection');
        if (loadingSection) loadingSection.style.display = 'none';
    }

    showError(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(`Error: ${message}`);
        }
    }

    /**
     * Comprime la imagen si es necesario
     * - Imágenes <2MB: sin compresión
     * - Imágenes 2-5MB: compresión estándar (maxWidth 2048, quality 0.85)
     * - Imágenes 5-10MB: compresión media (maxWidth 1800, quality 0.75)
     * - Imágenes >10MB: compresión agresiva (maxWidth 1600, quality 0.65)
     * @param {File} file - El archivo de imagen original
     * @returns {Promise<File>} - El archivo comprimido o el original si no requiere compresión
     */
    async compressImageIfNeeded(file) {
        const fileSizeMB = file.size / 1024 / 1024;

        // Si la imagen es menor a 2MB, no comprimir
        if (fileSizeMB < 2) {
            console.log(`[OCR] Imagen de ${fileSizeMB.toFixed(2)}MB no requiere compresión`);
            return file;
        }

        // Determinar nivel de compresión según tamaño
        let maxWidth, quality;
        if (fileSizeMB > 10) {
            // Imágenes muy grandes (>10MB): compresión agresiva
            maxWidth = 1600;
            quality = 0.65;
            console.log(`[OCR] Imagen de ${fileSizeMB.toFixed(2)}MB - Aplicando compresión AGRESIVA`);
        } else if (fileSizeMB > 5) {
            // Imágenes grandes (5-10MB): compresión media
            maxWidth = 1800;
            quality = 0.75;
            console.log(`[OCR] Imagen de ${fileSizeMB.toFixed(2)}MB - Aplicando compresión MEDIA`);
        } else {
            // Imágenes moderadas (2-5MB): compresión estándar
            maxWidth = 2048;
            quality = 0.85;
            console.log(`[OCR] Imagen de ${fileSizeMB.toFixed(2)}MB - Aplicando compresión ESTÁNDAR`);
        }

        try {
            return await this.compressImage(file, maxWidth, quality);
        } catch (error) {
            console.error('[OCR] Error al comprimir imagen, usando original:', error);
            // Fallback: si falla la compresión, usar la imagen original
            return file;
        }
    }

    /**
     * Comprime una imagen usando Canvas API
     * @param {File} file - El archivo de imagen a comprimir
     * @param {number} maxWidth - Ancho máximo en píxeles (default: 2048)
     * @param {number} quality - Calidad de compresión JPEG (0.0 a 1.0, default: 0.85)
     * @returns {Promise<File>} - El archivo comprimido
     */
    async compressImage(file, maxWidth = 2048, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    try {
                        // Crear canvas
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Calcular nuevo tamaño manteniendo proporción
                        let width = img.width;
                        let height = img.height;

                        // Solo redimensionar si es más grande que maxWidth
                        if (width > maxWidth) {
                            const ratio = maxWidth / width;
                            width = maxWidth;
                            height = Math.floor(height * ratio);
                        }

                        console.log(`[OCR] Redimensionando de ${img.width}x${img.height} a ${width}x${height}`);

                        // Configurar canvas con nuevo tamaño
                        canvas.width = width;
                        canvas.height = height;

                        // Dibujar imagen redimensionada
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convertir a blob comprimido
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error('Error al generar blob de imagen'));
                                return;
                            }

                            // Crear nuevo archivo con el blob comprimido
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });

                            const compressionRatio = ((1 - (compressedFile.size / file.size)) * 100).toFixed(1);
                            console.log(`[OCR] Compresión exitosa: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (reducción del ${compressionRatio}%)`);

                            resolve(compressedFile);
                        }, 'image/jpeg', quality);

                    } catch (error) {
                        console.error('[OCR] Error en proceso de compresión:', error);
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Error al cargar imagen para compresión'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Error al leer archivo para compresión'));
            };

            reader.readAsDataURL(file);
        });
    }
}

// Hacer disponible globalmente
window.OCRUploader = OCRUploader;
