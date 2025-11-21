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

    handleImageSelect(file) {
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showError('Formato no válido. Solo se permiten imágenes JPEG, PNG o WEBP.');
            return;
        }

        // Validar tamaño (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showError('La imagen es demasiado grande. Tamaño máximo: 5MB');
            return;
        }

        /* ═════════════════════════════════════════════════════════════════
         * PREVIEW MANUAL - Deshabilitado para procesamiento automático
         * Para reactivar: descomentar este bloque y eliminar this.processImage()
         * ═════════════════════════════════════════════════════════════════
        // Preview de la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('ocrImagePreview');
            const previewSection = document.getElementById('ocrPreviewSection');

            if (preview && previewSection) {
                preview.src = e.target.result;
                previewSection.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        ═════════════════════════════════════════════════════════════════ */

        this.selectedFile = file;
        console.log('[OCR] Imagen seleccionada:', file.name);

        // ✨ NUEVO: Procesamiento automático al seleccionar imagen
        console.log('[OCR] Iniciando procesamiento automático...');
        this.processImage();
    }

    async processImage() {
        if (!this.selectedFile) {
            this.showError('No hay imagen seleccionada');
            return;
        }

        this.showLoading();

        try {
            const formData = new FormData();
            formData.append('image', this.selectedFile);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            console.log('[OCR] Enviando imagen al servidor...');

            const response = await fetch('/api/ocr/extract', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error procesando imagen');
            }

            console.log('[OCR] Datos extraídos exitosamente:', result);

            // Callback con datos extraídos
            if (this.previewCallback) {
                this.previewCallback(result);
            }

            this.hideLoading();

        } catch (error) {
            console.error('[OCR] Error:', error);
            this.hideLoading();
            this.showError(error.message || 'Error al procesar imagen');
        }
    }

    onPreview(callback) {
        this.previewCallback = callback;
    }

    reset() {
        this.selectedFile = null;

        const imageInput = document.getElementById('ocrImageInput');
        const previewSection = document.getElementById('ocrPreviewSection');

        if (imageInput) imageInput.value = '';
        if (previewSection) previewSection.style.display = 'none';

        console.log('[OCR] Uploader reseteado');
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
}

// Hacer disponible globalmente
window.OCRUploader = OCRUploader;
