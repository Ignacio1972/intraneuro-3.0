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
            'patientBedInput': extractedData.bed
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
                    <h3>📋 Datos Extraídos - Revisar antes de confirmar</h3>

                    <div class="ocr-extracted-fields">
                        ${this.renderExtractedFields(result.extracted, result.confidence)}
                    </div>

                    ${result.warnings && result.warnings.length > 0 ? `
                        <div class="ocr-warnings" style="background: #FFF3CD; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                            <h4 style="color: #856404; margin-bottom: 0.5rem;">⚠️ Advertencias:</h4>
                            ${result.warnings.map(w => `
                                <p style="color: #856404; margin: 0.25rem 0;">
                                    <strong>${w.field}:</strong> ${w.message}
                                </p>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="ocr-info" style="background: #D1ECF1; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                        <p style="color: #0C5460; margin: 0; font-size: 0.9rem;">
                            ℹ️ Los campos de <strong>Diagnóstico</strong> y <strong>Servicio</strong> deben completarse manualmente después de confirmar.
                        </p>
                    </div>

                    <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button type="button" onclick="OCRIntegration.cancelOCR()" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                        <button type="button" onclick="OCRIntegration.confirmOCRData()" class="btn btn-primary">
                            ✅ Confirmar y Rellenar Formulario
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
            birthDate: 'Fecha de Nacimiento',
            prevision: 'Previsión',
            admissionDate: 'Fecha de Ingreso',
            bed: 'Cama',
            attendingDoctor: 'Médico Tratante'
        };

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #f8f9fa;"><th style="padding: 0.5rem; text-align: left;">Campo</th><th style="padding: 0.5rem; text-align: left;">Valor</th><th style="padding: 0.5rem; text-align: center;">Confianza</th></tr></thead>';
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

    static confirmOCRData() {
        if (this.currentOCRData) {
            this.fillFormFromOCR(this.currentOCRData);
            this.closePreviewModal();

            // Ocultar sección OCR y mostrar formulario
            const ocrSection = document.getElementById('ocrUploadSection');
            const formSection = document.getElementById('admissionForm');

            if (ocrSection) ocrSection.style.display = 'none';
            if (formSection) formSection.style.display = 'block';

            // Cambiar texto del toggle
            const toggleBtn = document.getElementById('ocrToggleBtn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '📸 Volver a OCR';
                toggleBtn.classList.add('active');
            }

            // Mostrar mensaje de éxito
            if (typeof showToast === 'function') {
                showToast('Formulario pre-llenado con datos del OCR. Por favor, revisar y completar campos faltantes.', 'success');
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
