/**
 * OCR Initialization
 * Responsabilidad: Inicializar sistema OCR cuando se abre el modal de ingreso
 */

(function() {
    'use strict';

    let ocrUploaderInstance = null;
    let isOCRMode = false;

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        initializeOCRToggle();
    });

    function initializeOCRToggle() {
        const toggleBtn = document.getElementById('ocrToggleBtn');
        if (!toggleBtn) {
            console.log('[OCR Init] Botón toggle no encontrado, reintentando...');
            setTimeout(initializeOCRToggle, 500);
            return;
        }

        toggleBtn.addEventListener('click', handleOCRToggle);
        console.log('[OCR Init] ✅ Toggle OCR inicializado');
    }

    function handleOCRToggle() {
        const ocrSection = document.getElementById('ocrUploadSection');
        const formSection = document.getElementById('admissionForm');
        const toggleBtn = document.getElementById('ocrToggleBtn');

        if (!isOCRMode) {
            // Activar modo OCR
            isOCRMode = true;

            if (ocrSection) ocrSection.style.display = 'block';
            if (formSection) formSection.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.innerHTML = '✏️ Ingreso Manual';
                toggleBtn.classList.add('active');
            }

            // Inicializar uploader si no existe
            if (!ocrUploaderInstance) {
                ocrUploaderInstance = new window.OCRUploader();
                ocrUploaderInstance.initialize('ocrUploadSection');

                // Configurar callback para preview
                ocrUploaderInstance.onPreview((result) => {
                    window.OCRIntegration.showPreviewModal(result);
                });

                // Hacer disponible globalmente para debugging
                window.ocrUploaderInstance = ocrUploaderInstance;
            }

            console.log('[OCR] Modo OCR activado');
        } else {
            // Volver a modo manual
            isOCRMode = false;

            if (ocrSection) ocrSection.style.display = 'none';
            if (formSection) formSection.style.display = 'block';
            if (toggleBtn) {
                toggleBtn.innerHTML = '📸 Ingresar desde Foto del Monitor';
                toggleBtn.classList.remove('active');
            }

            // Resetear uploader
            if (ocrUploaderInstance) {
                ocrUploaderInstance.reset();
            }

            console.log('[OCR] Modo manual activado');
        }
    }

    // Resetear al cerrar el modal
    const closeButtons = document.querySelectorAll('#admissionModal .close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', resetOCRMode);
    });

    function resetOCRMode() {
        if (isOCRMode) {
            isOCRMode = false;

            const ocrSection = document.getElementById('ocrUploadSection');
            const formSection = document.getElementById('admissionForm');
            const toggleBtn = document.getElementById('ocrToggleBtn');

            if (ocrSection) ocrSection.style.display = 'none';
            if (formSection) formSection.style.display = 'block';
            if (toggleBtn) {
                toggleBtn.innerHTML = '📸 Ingresar desde Foto del Monitor';
                toggleBtn.classList.remove('active');
            }

            if (ocrUploaderInstance) {
                ocrUploaderInstance.reset();
            }
        }
    }

    // Exportar para uso externo si es necesario
    window.OCRInit = {
        reset: resetOCRMode,
        isOCRMode: () => isOCRMode
    };

})();
