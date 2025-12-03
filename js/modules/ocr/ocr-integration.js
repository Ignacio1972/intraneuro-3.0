/**
 * OCR Integration
 * Responsabilidad: Integrar OCR con formulario existente de ingreso
 */

class OCRIntegration {
    static currentOCRData = null;

    static fillFormFromOCR(extractedData) {
        console.log('[OCR Integration] Pre-llenando formulario con datos:', extractedData);

        // Mapeo de campos OCR → campos del formulario
        const fieldMapping = {
            'patientName': extractedData.name,
            'patientRut': extractedData.rut,
            'patientAge': extractedData.age,
            'admissionDate': this.formatDateForInput(extractedData.admissionDate),
            // 'patientBedInput' - NO se mapea: la cama se asigna manualmente más adelante
            'patientPrevision': extractedData.prevision
        };

        // Rellenar campos del formulario
        for (const [fieldId, value] of Object.entries(fieldMapping)) {
            const input = document.getElementById(fieldId);
            if (input && value) {
                input.value = value;

                // Trigger change event para validaciones existentes
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));

                console.log(`[OCR] Campo ${fieldId} llenado con: ${value}`);
            }
        }

        // Nota: Prevision, médico tratante y diagnóstico se asignan desde el modal del paciente
        // después del ingreso, como lo hace el sistema actualmente

        console.log('[OCR] Formulario pre-llenado. Revisar y completar campos faltantes.');
    }

    static formatDateForInput(dateString) {
        if (!dateString) return null;

        // Convertir DD/MM/YYYY → YYYY-MM-DD (formato input type="date")
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        return null;
    }

    static showPreviewModal(result) {
        // Crear modal de preview
        const modalHTML = `
            <div class="ocr-preview-modal" id="ocrPreviewModal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="ocr-extracted-fields">
                        ${this.renderExtractedFields(result.extracted, result.confidence)}
                    </div>

                    <div class="modal-actions" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" onclick="OCRIntegration.confirmOCRData()" class="btn btn-primary">
                            ✅ Confirmar y Rellenar Formulario
                        </button>
                        <button type="button" onclick="OCRIntegration.cancelOCR()" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal en el body
        const existingModal = document.getElementById('ocrPreviewModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.currentOCRData = result.extracted;

        // Añadir event listener para cerrar con ESC
        document.addEventListener('keydown', this.handleEscKey);
    }

    static renderExtractedFields(data, confidence) {
        const fieldLabels = {
            name: 'Nombre',
            rut: 'RUT',
            age: 'Edad',
            prevision: 'Previsión',
            admissionDate: 'Fecha de Ingreso'
            // 'bed' - NO se muestra: la cama se asigna manualmente más adelante
        };

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<tbody>';

        for (const [field, label] of Object.entries(fieldLabels)) {
            const value = data[field];
            const conf = confidence[field] || 0;
            const icon = conf > 0.90 ? '✅' : conf > 0.70 ? '⚠️' : '❌';
            const color = conf > 0.90 ? '#27AE60' : conf > 0.70 ? '#F39C12' : '#E74C3C';

            html += `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 0.5rem; font-weight: 500;">${label}</td>
                    <td style="padding: 0.5rem;">${value || '<em style="color: #999;">No detectado</em>'}</td>
                    <td style="padding: 0.5rem; text-align: center;">
                        <span style="color: ${color};">${icon} ${(conf * 100).toFixed(0)}%</span>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table>';
        return html;
    }

    static async confirmOCRData() {
        if (!this.currentOCRData) return;

        try {
            console.log('[OCR Integration] Confirmando datos OCR y procesando ingreso automático...');

            // 1. Establecer flag para que handleAdmission() sepa que debe abrir modal del paciente
            window.OCR_AUTO_OPEN_MODAL = true;

            // 2. Llenar el formulario con los datos del OCR
            this.fillFormFromOCR(this.currentOCRData);
            this.closePreviewModal();

            // 3. Mostrar mensaje de procesamiento
            if (typeof showToast === 'function') {
                showToast('Procesando ingreso del paciente...', 'success');
            }

            // 4. Esperar un momento para que los campos se llenen correctamente
            await new Promise(resolve => setTimeout(resolve, 300));

            // 5. Obtener el formulario y disparar submit automático
            const admissionForm = document.getElementById('admissionForm');
            if (!admissionForm) {
                throw new Error('Formulario de ingreso no encontrado');
            }

            // 6. Disparar el submit - Esto ejecutará handleAdmission()
            const submitEvent = new Event('submit', {
                bubbles: true,
                cancelable: true
            });

            console.log('[OCR Integration] Enviando formulario automáticamente...');
            admissionForm.dispatchEvent(submitEvent);

            // Nota: El resto del flujo (crear paciente, cerrar modal, abrir ficha)
            // será manejado por handleAdmission() en ingreso.js

        } catch (error) {
            console.error('[OCR Integration] Error al procesar ingreso automático:', error);

            // Limpiar flag en caso de error
            window.OCR_AUTO_OPEN_MODAL = false;

            if (typeof showToast === 'function') {
                showToast(`Error: ${error.message}`, 'error');
            }

            // Fallback: mostrar formulario para corrección manual
            const ocrSection = document.getElementById('ocrUploadSection');
            const formSection = document.getElementById('admissionForm');

            if (ocrSection) ocrSection.style.display = 'none';
            if (formSection) formSection.style.display = 'block';

            const toggleBtn = document.getElementById('ocrToggleBtn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '📸 Volver a OCR';
                toggleBtn.classList.add('active');
            }
        }
    }

    static cancelOCR() {
        this.currentOCRData = null;
        this.closePreviewModal();

        // Resetear uploader
        if (window.ocrUploaderInstance) {
            window.ocrUploaderInstance.reset();
        }
    }

    static closePreviewModal() {
        const modal = document.getElementById('ocrPreviewModal');
        if (modal) modal.remove();

        document.removeEventListener('keydown', this.handleEscKey);
    }

    static handleEscKey = (e) => {
        if (e.key === 'Escape') {
            OCRIntegration.closePreviewModal();
        }
    }
}

// Hacer disponible globalmente
window.OCRIntegration = OCRIntegration;
