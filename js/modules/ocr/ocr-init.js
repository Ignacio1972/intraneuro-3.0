/**
 * OCR Initialization
 * Responsabilidad: Inicializar sistema OCR cuando se abre el modal de ingreso
 */

(function() {
    'use strict';

    let ocrUploaderInstance = null;

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
        // ✨ NUEVO: Activar cámara directamente sin mostrar página intermedia

        // Inicializar uploader si no existe (silenciosamente, sin mostrar UI)
        if (!ocrUploaderInstance) {
            // Crear contenedor temporal oculto si no existe
            let ocrSection = document.getElementById('ocrUploadSection');
            if (!ocrSection) {
                ocrSection = document.createElement('div');
                ocrSection.id = 'ocrUploadSection';
                ocrSection.style.display = 'none';
                document.body.appendChild(ocrSection);
            }

            ocrUploaderInstance = new window.OCRUploader();
            ocrUploaderInstance.initialize('ocrUploadSection');

            // Configurar callback para preview
            ocrUploaderInstance.onPreview((result) => {
                window.OCRIntegration.showPreviewModal(result);
            });

            // Hacer disponible globalmente para debugging
            window.ocrUploaderInstance = ocrUploaderInstance;

            console.log('[OCR] Uploader inicializado (modo directo)');
        }

        // Activar cámara directamente
        console.log('[OCR] Abriendo cámara directamente...');
        ocrUploaderInstance.openCamera();
    }

    // Resetear al cerrar el modal
    const closeButtons = document.querySelectorAll('#admissionModal .close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', resetOCRMode);
    });

    function resetOCRMode() {
        // Resetear uploader si existe
        if (ocrUploaderInstance) {
            ocrUploaderInstance.reset();
            console.log('[OCR] Uploader reseteado al cerrar modal');
        }
    }

    // Exportar para uso externo si es necesario
    window.OCRInit = {
        reset: resetOCRMode
    };

})();
