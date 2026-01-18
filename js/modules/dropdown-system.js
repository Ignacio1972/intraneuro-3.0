/**
 * Sistema Unificado de Dropdowns para INTRANEURO
 * Versión: 3.0.0
 * Fecha: 2025-12-19
 *
 * Este módulo reemplaza todas las implementaciones anteriores de dropdowns
 * y proporciona una solución simple, robusta y confiable.
 *
 * v3.0.0 - Nueva estructura jerárquica de diagnósticos con categorías y campos de texto libre
 * v2.1.0 - Agregado dropdown de médicos tratantes con administración integrada
 */

(function() {
    'use strict';

    // ===========================================
    // CONFIGURACIÓN DE DATOS
    // ===========================================

    const PREVISIONES = [
        'Fonasa',
        'Isapre Banmédica',
        'Isapre Consalud',
        'Isapre Cruz Blanca',
        'Isapre Colmena',
        'Isapre Vida Tres',
        'Isapre Nueva Masvida',
        'Particular',
        'Sin previsión'
    ];

    // ===========================================
    // API PÚBLICA
    // ===========================================

    const DropdownSystem = {
        // Versión del sistema
        version: '4.0.0'
    };

    // ===========================================
    // ESTRUCTURA JERÁRQUICA DE DIAGNÓSTICOS
    // ===========================================

    const DIAGNOSTICOS_JERARQUICOS = {
        cerebrovasculares: {
            id: 'cerebrovasculares',
            label: 'I) Cerebrovasculares',
            icon: '🧠',
            options: [
                { value: 'ACV isquémico - ATE', label: 'ACV isquémico - ATE' },
                { value: 'ACV isquémico - Embólico', label: 'ACV isquémico - Embólico' },
                { value: 'ACV isquémico - Lacunar', label: 'ACV isquémico - Lacunar' },
                { value: 'ACV isquémico - Otro', label: 'ACV isquémico - Otro' },
                { value: 'HIC - Hipertensiva', label: 'HIC - Hipertensiva' },
                { value: 'HIC - Amiloidea', label: 'HIC - Amiloidea' },
                { value: 'HIC - Otra', label: 'HIC - Otra' },
                { value: 'HSA - Aneurismática', label: 'HSA - Aneurismática' },
                { value: 'HSA - No aneurismática', label: 'HSA - No aneurismática' },
                { value: 'TIA', label: 'TIA' },
                { value: 'Trombosis Venosa Cerebral', label: 'Trombosis Venosa Cerebral' }
            ]
        },
        convulsivos: {
            id: 'convulsivos',
            label: 'II) Convulsivos',
            icon: '⚡',
            options: [
                { value: 'Crisis secundaria', label: 'Crisis secundaria' },
                { value: 'Epilepsia Focal', label: 'Epilepsia Focal' },
                { value: 'Epilepsia Generalizada', label: 'Epilepsia Generalizada' },
                { value: 'Síndrome Epiléptico', label: 'Síndrome Epiléptico' }
            ]
        },
        degenerativas: {
            id: 'degenerativas',
            label: 'III) Degenerativas',
            icon: '🔬',
            options: [
                { value: 'Parkinson', label: 'Parkinson' },
                { value: 'Demencia - E.A', label: 'Demencia - E.A' },
                { value: 'Demencia - Lewy', label: 'Demencia - Lewy' },
                { value: 'Demencia - DFT', label: 'Demencia - DFT' },
                { value: 'Demencia - C-J', label: 'Demencia - C-J' },
                { value: 'Demencia - Otra', label: 'Demencia - Otra' }
            ]
        },
        inflamatoria: {
            id: 'inflamatoria',
            label: 'IV) Inflamatoria',
            icon: '🔥',
            options: [
                { value: 'Meningitis bacteriana', label: 'Meningitis bacteriana' },
                { value: 'Meningitis Viral', label: 'Meningitis Viral' },
                { value: 'Meningitis líquido claro', label: 'Meningitis líquido claro' },
                { value: 'Encefalitis', label: 'Encefalitis', requiresInput: true, inputLabel: 'Causa' },
                { value: 'Mielitis', label: 'Mielitis', requiresInput: true, inputLabel: 'Causa' }
            ]
        },
        desmielinizantes: {
            id: 'desmielinizantes',
            label: 'V) Desmielinizantes',
            icon: '🩺',
            options: [
                { value: 'Esclerosis Múltiple', label: 'Esclerosis Múltiple' },
                { value: 'NMO', label: 'NMO' },
                { value: 'MOG', label: 'MOG' },
                { value: 'EAI', label: 'EAI' }
            ]
        },
        trauma: {
            id: 'trauma',
            label: 'VI) Trauma',
            icon: '🚨',
            options: [
                { value: 'TEC simple', label: 'TEC simple' },
                { value: 'TEC complicado - Lesión axonal difusa', label: 'TEC complicado - Lesión axonal difusa' },
                { value: 'TEC complicado - Hematoma epidural', label: 'TEC complicado - Hematoma epidural' },
                { value: 'TEC complicado - Hematoma subdural', label: 'TEC complicado - Hematoma subdural' }
            ]
        },
        tumor: {
            id: 'tumor',
            label: 'VII) Tumor',
            icon: '🎯',
            options: [
                { value: 'Glioblastoma', label: 'Glioblastoma' },
                { value: 'Astrocitoma', label: 'Astrocitoma' },
                { value: 'Meningioma', label: 'Meningioma' },
                { value: 'Schwannoma', label: 'Schwannoma' },
                { value: 'Metástasis', label: 'Metástasis' },
                { value: 'Tumor - Otro', label: 'Tumor - Otro' }
            ]
        },
        neuromuscular: {
            id: 'neuromuscular',
            label: 'VIII) Neuromuscular',
            icon: '💪',
            options: [
                { value: 'Miastenia Gravis', label: 'Miastenia Gravis' },
                { value: 'Síndrome Guillain-Barré', label: 'Síndrome Guillain-Barré' },
                { value: 'PNP', label: 'PNP', requiresInput: true, inputLabel: 'Causa' },
                { value: 'ELA', label: 'ELA' }
            ]
        },
        cefaleas: {
            id: 'cefaleas',
            label: 'IX) Cefaleas',
            icon: '🤕',
            options: [
                { value: 'Migraña', label: 'Migraña' },
                { value: 'Cefalea tensional', label: 'Cefalea tensional' },
                { value: 'Cefalea por sobreuso', label: 'Cefalea por sobreuso' },
                { value: 'Cefalea en racimos', label: 'Cefalea en racimos' }
            ]
        },
        tnf: {
            id: 'tnf',
            label: 'X) TNF',
            icon: '🧩',
            options: [
                { value: 'Trastorno Neurológico Funcional', label: 'Trastorno Neurológico Funcional' }
            ]
        }
    };

    // ===========================================
    // CLASE DIAGNOSIS ACCORDION MODAL
    // ===========================================

    class DiagnosisAccordionModal {
        constructor(config) {
            this.currentValue = config.currentValue || '';
            this.onSelect = config.onSelect || null;
            this.onCancel = config.onCancel || null;

            this.modalId = `diagnosis-accordion-modal-${Date.now()}`;
            this.selectedValue = '';
            this.selectedCategory = null;
            this.expandedCategory = null;
            this.inputValue = ''; // Para campos con requiresInput

            this.init();
        }

        init() {
            // Estilos ahora en css/dropdown-system.css
            this.render();
            this.setupEvents();

            // Auto-expandir categoría del valor actual
            if (this.currentValue) {
                this.expandCategoryForValue(this.currentValue);
            }
        }

        findCategoryForValue(value) {
            // Buscar en qué categoría está el valor
            for (const [key, category] of Object.entries(DIAGNOSTICOS_JERARQUICOS)) {
                for (const opt of category.options) {
                    if (opt.value === value || (opt.requiresInput && value.startsWith(opt.value + ':'))) {
                        return key;
                    }
                }
            }
            return null;
        }

        expandCategoryForValue(value) {
            const categoryKey = this.findCategoryForValue(value);
            if (categoryKey) {
                this.expandedCategory = categoryKey;
                this.selectedValue = value;

                // Verificar si es un campo con input
                const category = DIAGNOSTICOS_JERARQUICOS[categoryKey];
                for (const opt of category.options) {
                    if (opt.requiresInput && value.startsWith(opt.value + ':')) {
                        this.inputValue = value.substring(opt.value.length + 1).trim();
                        this.selectedValue = opt.value;
                        break;
                    }
                }
            }
        }

        // Estilos movidos a css/dropdown-system.css

        render() {
            // Remover modal existente si hay
            const existing = document.getElementById(this.modalId);
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = this.modalId;
            overlay.className = 'diagnosis-accordion-overlay';

            // Construir HTML del acordeón
            let categoriesHTML = '';
            for (const [key, category] of Object.entries(DIAGNOSTICOS_JERARQUICOS)) {
                const isExpanded = this.expandedCategory === key;

                let optionsHTML = '';
                for (const opt of category.options) {
                    const isSelected = this.selectedValue === opt.value;
                    optionsHTML += `
                        <div class="accordion-option ${isSelected ? 'selected' : ''}"
                             data-value="${opt.value}"
                             data-requires-input="${opt.requiresInput || false}"
                             data-input-label="${opt.inputLabel || ''}">
                            <div class="accordion-option-radio"></div>
                            <span class="accordion-option-label">${opt.label}${opt.requiresInput ? ' (especificar)' : ''}</span>
                        </div>
                        ${opt.requiresInput ? `
                            <div class="accordion-input-container ${isSelected ? 'visible' : ''}" data-for="${opt.value}">
                                <label class="accordion-input-label">${opt.inputLabel || 'Especificar'}:</label>
                                <input type="text" class="accordion-input"
                                       placeholder="Escriba aquí..."
                                       value="${isSelected ? this.inputValue : ''}"
                                       data-for="${opt.value}">
                            </div>
                        ` : ''}
                    `;
                }

                categoriesHTML += `
                    <div class="accordion-category ${isExpanded ? 'expanded' : ''}" data-category="${key}">
                        <div class="accordion-category-header">
                            <span class="accordion-category-label">${category.label}</span>
                            <span class="accordion-category-count">(${category.options.length})</span>
                            <span class="accordion-category-arrow">▶</span>
                        </div>
                        <div class="accordion-category-options">
                            ${optionsHTML}
                        </div>
                    </div>
                `;
            }

            // Indicador de valor actual
            let currentValueHTML = '';
            if (this.currentValue) {
                currentValueHTML = `
                    <div class="accordion-current-value">
                        <span class="accordion-current-value-icon">✓</span>
                        <span class="accordion-current-value-text">
                            <span class="accordion-current-value-label">Actual:</span> ${this.currentValue}
                        </span>
                    </div>
                `;
            }

            overlay.innerHTML = `
                <div class="diagnosis-accordion-modal">
                    <div class="diagnosis-accordion-header">
                        <h3>Seleccionar Diagnóstico</h3>
                        <button type="button" class="diagnosis-accordion-close">&times;</button>
                    </div>
                    ${currentValueHTML}
                    <div class="diagnosis-accordion-body">
                        ${categoriesHTML}
                        <div class="accordion-other-section">
                            <label class="accordion-other-label">Otro diagnóstico:</label>
                            <input type="text" class="accordion-other-input"
                                   placeholder="Escriba un diagnóstico no listado...">
                        </div>
                    </div>
                    <div class="diagnosis-accordion-footer">
                        <button type="button" class="accordion-btn accordion-btn-cancel">Cancelar</button>
                        <button type="button" class="accordion-btn accordion-btn-confirm">Confirmar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
        }

        setupEvents() {
            const overlay = document.getElementById(this.modalId);
            if (!overlay) return;

            const modal = overlay.querySelector('.diagnosis-accordion-modal');
            const closeBtn = overlay.querySelector('.diagnosis-accordion-close');
            const cancelBtn = overlay.querySelector('.accordion-btn-cancel');
            const confirmBtn = overlay.querySelector('.accordion-btn-confirm');
            const otherInput = overlay.querySelector('.accordion-other-input');

            // Cerrar al hacer clic en overlay (fuera del modal)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });

            // Cerrar con botón X
            closeBtn.addEventListener('click', () => this.close());

            // Cancelar
            cancelBtn.addEventListener('click', () => this.close());

            // Confirmar
            confirmBtn.addEventListener('click', () => this.confirm());

            // Cerrar con ESC
            this.escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.escHandler);

            // Toggle categorías
            overlay.querySelectorAll('.accordion-category-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    const category = header.closest('.accordion-category');
                    const categoryKey = category.dataset.category;

                    // Si ya está expandida, colapsar
                    if (category.classList.contains('expanded')) {
                        category.classList.remove('expanded');
                        this.expandedCategory = null;
                    } else {
                        // Colapsar todas y expandir esta
                        overlay.querySelectorAll('.accordion-category').forEach(c => {
                            c.classList.remove('expanded');
                        });
                        category.classList.add('expanded');
                        this.expandedCategory = categoryKey;
                    }
                });
            });

            // Seleccionar opción
            overlay.querySelectorAll('.accordion-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const value = option.dataset.value;
                    const requiresInput = option.dataset.requiresInput === 'true';

                    // Deseleccionar todas
                    overlay.querySelectorAll('.accordion-option').forEach(o => {
                        o.classList.remove('selected');
                    });
                    overlay.querySelectorAll('.accordion-input-container').forEach(c => {
                        c.classList.remove('visible');
                    });

                    // Seleccionar esta
                    option.classList.add('selected');
                    this.selectedValue = value;

                    // Limpiar input "otro"
                    otherInput.value = '';

                    // Mostrar campo de texto si es necesario
                    if (requiresInput) {
                        const inputContainer = overlay.querySelector(`.accordion-input-container[data-for="${value}"]`);
                        if (inputContainer) {
                            inputContainer.classList.add('visible');
                            const input = inputContainer.querySelector('.accordion-input');
                            if (input) {
                                input.focus();
                            }
                        }
                    }
                });
            });

            // Input de campos específicos (Encefalitis, Mielitis, PNP)
            overlay.querySelectorAll('.accordion-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    this.inputValue = e.target.value;
                });

                // Prevenir que el clic cierre el acordeón
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            });

            // Input "otro diagnóstico"
            otherInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    // Deseleccionar opciones del acordeón
                    overlay.querySelectorAll('.accordion-option').forEach(o => {
                        o.classList.remove('selected');
                    });
                    overlay.querySelectorAll('.accordion-input-container').forEach(c => {
                        c.classList.remove('visible');
                    });
                    this.selectedValue = '';
                    this.inputValue = '';
                }
            });

            otherInput.addEventListener('focus', () => {
                // Deseleccionar opciones del acordeón al escribir otro
                overlay.querySelectorAll('.accordion-option').forEach(o => {
                    o.classList.remove('selected');
                });
                overlay.querySelectorAll('.accordion-input-container').forEach(c => {
                    c.classList.remove('visible');
                });
                this.selectedValue = '';
                this.inputValue = '';
            });
        }

        getValue() {
            const overlay = document.getElementById(this.modalId);
            if (!overlay) return '';

            const otherInput = overlay.querySelector('.accordion-other-input');

            // Si hay texto en "otro diagnóstico"
            if (otherInput && otherInput.value.trim()) {
                return otherInput.value.trim();
            }

            // Si hay una opción seleccionada
            if (this.selectedValue) {
                // Verificar si requiere input adicional
                const selectedOption = overlay.querySelector(`.accordion-option[data-value="${this.selectedValue}"]`);
                if (selectedOption && selectedOption.dataset.requiresInput === 'true') {
                    const inputContainer = overlay.querySelector(`.accordion-input-container[data-for="${this.selectedValue}"]`);
                    if (inputContainer) {
                        const input = inputContainer.querySelector('.accordion-input');
                        if (input && input.value.trim()) {
                            return `${this.selectedValue}: ${input.value.trim()}`;
                        }
                    }
                    return this.selectedValue;
                }
                return this.selectedValue;
            }

            return '';
        }

        confirm() {
            const value = this.getValue();

            if (this.onSelect) {
                this.onSelect(value);
            }

            this.destroy();
        }

        close() {
            if (this.onCancel) {
                this.onCancel();
            }
            this.destroy();
        }

        destroy() {
            if (this.escHandler) {
                document.removeEventListener('keydown', this.escHandler);
            }

            const overlay = document.getElementById(this.modalId);
            if (overlay) {
                overlay.remove();
            }
        }
    }

    // Agregar al API público
    DropdownSystem.showDiagnosisAccordion = function(config = {}) {
        return new DiagnosisAccordionModal(config);
    };

    DropdownSystem.getDiagnosisCategories = function() {
        return DIAGNOSTICOS_JERARQUICOS;
    };

    // Modal simple para selección de previsión
    DropdownSystem.showPrevisionSelector = function(config = {}) {
        const modalId = 'prevision-selector-modal-' + Date.now();
        const previsiones = PREVISIONES;

        // Crear overlay y modal
        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'dropdown-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

        const modal = document.createElement('div');
        modal.className = 'dropdown-modal-content';
        modal.style.cssText = 'background:#fff;border-radius:8px;max-width:400px;width:90%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.3);';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = `
            <h3 style="margin:0;font-size:18px;color:#333;">Seleccionar Previsión</h3>
            <button id="${modalId}-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;line-height:1;">&times;</button>
        `;

        // Body con opciones
        const body = document.createElement('div');
        body.style.cssText = 'padding:16px 20px;overflow-y:auto;flex:1;';

        let optionsHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';
        previsiones.forEach(prev => {
            const isSelected = config.currentValue === prev;
            optionsHtml += `
                <button class="prevision-option" data-value="${prev}" style="
                    padding:12px 16px;
                    border:1px solid ${isSelected ? '#007bff' : '#ddd'};
                    border-radius:6px;
                    background:${isSelected ? '#e7f1ff' : '#fff'};
                    cursor:pointer;
                    text-align:left;
                    font-size:14px;
                    transition:all 0.2s;
                ">${prev}</button>
            `;
        });
        optionsHtml += '</div>';
        body.innerHTML = optionsHtml;

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 20px;border-top:1px solid #e0e0e0;display:flex;justify-content:flex-end;gap:10px;';
        footer.innerHTML = `
            <button id="${modalId}-cancel" style="padding:8px 16px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">Cancelar</button>
        `;

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event handlers
        const closeModal = () => {
            overlay.remove();
            if (config.onCancel) config.onCancel();
        };

        document.getElementById(`${modalId}-close`).onclick = closeModal;
        document.getElementById(`${modalId}-cancel`).onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        // Selección de opción
        body.querySelectorAll('.prevision-option').forEach(btn => {
            btn.onmouseover = () => {
                if (!btn.dataset.value || btn.dataset.value !== config.currentValue) {
                    btn.style.background = '#f5f5f5';
                }
            };
            btn.onmouseout = () => {
                if (!btn.dataset.value || btn.dataset.value !== config.currentValue) {
                    btn.style.background = '#fff';
                }
            };
            btn.onclick = () => {
                const value = btn.dataset.value;
                overlay.remove();
                if (config.onSelect) config.onSelect(value);
            };
        });

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    };

    // Modal con botones para selección de médico tratante
    DropdownSystem.showDoctorSelector = async function(config = {}) {
        const modalId = 'doctor-selector-modal-' + Date.now();

        // Cargar médicos desde API
        let doctors = [];
        try {
            if (typeof apiRequest === 'function') {
                const response = await apiRequest('/doctors');
                doctors = Array.isArray(response) ? response : [];
            }
        } catch (error) {
            console.error('[DoctorSelector] Error cargando médicos:', error);
        }

        // Crear overlay y modal
        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'dropdown-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

        const modal = document.createElement('div');
        modal.className = 'dropdown-modal-content';
        modal.style.cssText = 'background:#fff;border-radius:8px;max-width:450px;width:90%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.3);';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = `
            <h3 style="margin:0;font-size:18px;color:#333;">Seleccionar Médico Tratante</h3>
            <button id="${modalId}-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;line-height:1;">&times;</button>
        `;

        // Body con opciones
        const body = document.createElement('div');
        body.style.cssText = 'padding:16px 20px;overflow-y:auto;flex:1;max-height:400px;';

        let optionsHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';

        // Opciones de médicos existentes
        if (doctors.length === 0) {
            optionsHtml += '<p style="color:#999;text-align:center;padding:20px 0;">No hay médicos registrados</p>';
        } else {
            doctors.forEach(doc => {
                const isSelected = config.currentValue === doc.name;
                optionsHtml += `
                    <button class="doctor-option" data-value="${doc.name}" style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        padding:12px 16px;
                        border:1px solid ${isSelected ? '#007bff' : '#ddd'};
                        border-radius:6px;
                        background:${isSelected ? '#e7f1ff' : '#fff'};
                        cursor:pointer;
                        text-align:left;
                        font-size:14px;
                        transition:all 0.2s;
                    ">
                        <span style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:18px;">👨‍⚕️</span>
                            <span>${doc.name}</span>
                        </span>
                        ${doc.frequency_count ? `<span style="color:#999;font-size:12px;">${doc.frequency_count} pacientes</span>` : ''}
                    </button>
                `;
            });
        }

        // Separador visual
        optionsHtml += '<div style="border-top:1px solid #eee;margin:12px 0;"></div>';

        // Botones de acción
        optionsHtml += `
            <button id="${modalId}-add" class="doctor-action-btn" style="
                display:flex;
                align-items:center;
                gap:10px;
                padding:12px 16px;
                border:1px dashed #28a745;
                border-radius:6px;
                background:#f8fff8;
                cursor:pointer;
                text-align:left;
                font-size:14px;
                color:#28a745;
                transition:all 0.2s;
            ">
                <span style="font-size:18px;">➕</span>
                <span>Agregar nuevo médico...</span>
            </button>
            <button id="${modalId}-manage" class="doctor-action-btn" style="
                display:flex;
                align-items:center;
                gap:10px;
                padding:12px 16px;
                border:1px dashed #6c757d;
                border-radius:6px;
                background:#f8f9fa;
                cursor:pointer;
                text-align:left;
                font-size:14px;
                color:#6c757d;
                transition:all 0.2s;
            ">
                <span style="font-size:18px;">⚙️</span>
                <span>Administrar lista de médicos...</span>
            </button>
        `;
        optionsHtml += '</div>';
        body.innerHTML = optionsHtml;

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 20px;border-top:1px solid #e0e0e0;display:flex;justify-content:flex-end;gap:10px;';
        footer.innerHTML = `
            <button id="${modalId}-cancel" style="padding:8px 16px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">Cancelar</button>
        `;

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event handlers
        const closeModal = () => {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
            if (config.onCancel) config.onCancel();
        };

        document.getElementById(`${modalId}-close`).onclick = closeModal;
        document.getElementById(`${modalId}-cancel`).onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        // Selección de médico
        body.querySelectorAll('.doctor-option').forEach(btn => {
            btn.onmouseover = () => {
                if (btn.dataset.value !== config.currentValue) {
                    btn.style.background = '#f5f5f5';
                    btn.style.borderColor = '#bbb';
                }
            };
            btn.onmouseout = () => {
                if (btn.dataset.value !== config.currentValue) {
                    btn.style.background = '#fff';
                    btn.style.borderColor = '#ddd';
                }
            };
            btn.onclick = () => {
                const value = btn.dataset.value;
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
                if (config.onSelect) config.onSelect(value);
            };
        });

        // Botón agregar nuevo médico
        document.getElementById(`${modalId}-add`).onclick = async () => {
            const name = prompt('Ingrese el nombre del nuevo médico tratante:');

            if (!name || name.trim() === '') {
                return;
            }

            try {
                const response = await apiRequest('/doctors', {
                    method: 'POST',
                    body: JSON.stringify({ name: name.trim() })
                });

                if (response.doctor) {
                    if (typeof showToast === 'function') {
                        showToast(`Médico "${response.doctor.name}" agregado correctamente`);
                    }

                    // Cerrar modal actual y devolver el nuevo médico
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                    if (config.onSelect) config.onSelect(response.doctor.name);
                }
            } catch (error) {
                console.error('[DoctorSelector] Error agregando médico:', error);
                if (typeof showToast === 'function') {
                    showToast('Error al agregar médico: ' + (error.message || 'Error desconocido'), 'error');
                }
            }
        };

        // Botón administrar lista
        document.getElementById(`${modalId}-manage`).onclick = async () => {
            // Cerrar este modal
            overlay.remove();
            document.removeEventListener('keydown', escHandler);

            // Mostrar modal de administración
            await DropdownSystem.showDoctorManagement({
                onClose: () => {
                    // Reabrir selector después de administrar
                    DropdownSystem.showDoctorSelector(config);
                }
            });
        };

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        document.addEventListener('keydown', escHandler);
    };

    // Modal de administración de médicos
    DropdownSystem.showDoctorManagement = async function(config = {}) {
        const modalId = 'doctor-management-modal-' + Date.now();

        // Cargar médicos desde API
        let doctors = [];
        try {
            if (typeof apiRequest === 'function') {
                const response = await apiRequest('/doctors');
                doctors = Array.isArray(response) ? response : [];
            }
        } catch (error) {
            console.error('[DoctorManagement] Error cargando médicos:', error);
        }

        // Crear overlay y modal
        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'dropdown-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10001;';

        const modal = document.createElement('div');
        modal.className = 'dropdown-modal-content';
        modal.style.cssText = 'background:#fff;border-radius:8px;max-width:450px;width:90%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.3);';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = `
            <h3 style="margin:0;font-size:18px;color:#333;">⚙️ Administrar Médicos</h3>
            <button id="${modalId}-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;line-height:1;">&times;</button>
        `;

        // Body con lista de médicos
        const body = document.createElement('div');
        body.style.cssText = 'padding:16px 20px;overflow-y:auto;flex:1;max-height:350px;';

        let listHtml = '';
        if (doctors.length === 0) {
            listHtml = '<p style="color:#999;text-align:center;padding:20px 0;">No hay médicos registrados</p>';
        } else {
            listHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';
            doctors.forEach(doc => {
                listHtml += `
                    <div class="doctor-item" style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:12px 16px;
                        border:1px solid #eee;
                        border-radius:6px;
                        background:#fafafa;
                    ">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:16px;">👨‍⚕️</span>
                            <span style="font-weight:500;">${doc.name}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="color:#999;font-size:12px;">${doc.frequency_count || 0} pacientes</span>
                            <button class="delete-doctor-btn" data-doctor-id="${doc.id}" data-doctor-name="${doc.name}"
                                style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:18px;padding:4px;"
                                title="Eliminar médico">🗑️</button>
                        </div>
                    </div>
                `;
            });
            listHtml += '</div>';
        }
        body.innerHTML = listHtml;

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 20px;border-top:1px solid #e0e0e0;display:flex;justify-content:space-between;gap:10px;';
        footer.innerHTML = `
            <button id="${modalId}-add" style="padding:10px 16px;border:1px solid #28a745;border-radius:4px;background:#28a745;color:#fff;cursor:pointer;font-size:14px;">➕ Agregar Médico</button>
            <button id="${modalId}-done" style="padding:10px 16px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;">Cerrar</button>
        `;

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event handlers
        const closeModal = () => {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
            if (config.onClose) config.onClose();
        };

        document.getElementById(`${modalId}-close`).onclick = closeModal;
        document.getElementById(`${modalId}-done`).onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        // Botón agregar
        document.getElementById(`${modalId}-add`).onclick = async () => {
            const name = prompt('Ingrese el nombre del nuevo médico tratante:');

            if (!name || name.trim() === '') {
                return;
            }

            try {
                const response = await apiRequest('/doctors', {
                    method: 'POST',
                    body: JSON.stringify({ name: name.trim() })
                });

                if (response.doctor) {
                    if (typeof showToast === 'function') {
                        showToast(`Médico "${response.doctor.name}" agregado correctamente`);
                    }

                    // Recargar modal
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                    await DropdownSystem.showDoctorManagement(config);
                }
            } catch (error) {
                console.error('[DoctorManagement] Error agregando médico:', error);
                if (typeof showToast === 'function') {
                    showToast('Error al agregar médico', 'error');
                }
            }
        };

        // Eventos de eliminar
        body.querySelectorAll('.delete-doctor-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const doctorId = e.target.dataset.doctorId;
                const doctorName = e.target.dataset.doctorName;

                if (!confirm(`¿Está seguro que desea eliminar a "${doctorName}" de la lista?`)) {
                    return;
                }

                try {
                    await apiRequest(`/doctors/${doctorId}`, { method: 'DELETE' });

                    if (typeof showToast === 'function') {
                        showToast(`Médico "${doctorName}" eliminado correctamente`);
                    }

                    // Recargar modal
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                    await DropdownSystem.showDoctorManagement(config);
                } catch (error) {
                    console.error('[DoctorManagement] Error eliminando médico:', error);
                    if (typeof showToast === 'function') {
                        showToast('Error al eliminar médico', 'error');
                    }
                }
            };
        });

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        document.addEventListener('keydown', escHandler);
    };

    // Modal simple para selección de servicio hospitalario
    DropdownSystem.showServiceSelector = function(config = {}) {
        const modalId = 'service-selector-modal-' + Date.now();

        // Configuración de servicios con colores
        const servicios = [
            { value: 'Urgencias', label: 'Urgencias', icon: '🚨', color: '#ca8a04' },
            { value: 'UCI', label: 'UCI', icon: '🏥', color: '#dc2626' },
            { value: 'UTI', label: 'UTI', icon: '⚕️', color: '#ea580c' },
            { value: 'MQ', label: 'MQ', icon: '🔬', color: '#2563eb' },
            { value: 'Interconsulta', label: 'Interconsulta', icon: '📋', color: '#16a34a' }
        ];

        // Crear overlay y modal
        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'dropdown-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

        const modal = document.createElement('div');
        modal.className = 'dropdown-modal-content';
        modal.style.cssText = 'background:#fff;border-radius:8px;max-width:400px;width:90%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.3);';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = `
            <h3 style="margin:0;font-size:18px;color:#333;">Seleccionar Servicio</h3>
            <button id="${modalId}-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;line-height:1;">&times;</button>
        `;

        // Body con opciones
        const body = document.createElement('div');
        body.style.cssText = 'padding:16px 20px;overflow-y:auto;flex:1;';

        let optionsHtml = '<div style="display:flex;flex-direction:column;gap:10px;">';
        servicios.forEach(serv => {
            const isSelected = config.currentValue === serv.value;
            optionsHtml += `
                <button class="service-option" data-value="${serv.value}" style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding:14px 18px;
                    border:2px solid ${isSelected ? serv.color : '#ddd'};
                    border-radius:8px;
                    background:${isSelected ? serv.color + '15' : '#fff'};
                    cursor:pointer;
                    text-align:left;
                    font-size:15px;
                    font-weight:${isSelected ? '600' : '500'};
                    color:${isSelected ? serv.color : '#333'};
                    transition:all 0.2s;
                ">
                    <span style="font-size:20px;">${serv.icon}</span>
                    <span>${serv.label}</span>
                </button>
            `;
        });
        optionsHtml += '</div>';
        body.innerHTML = optionsHtml;

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'padding:16px 20px;border-top:1px solid #e0e0e0;display:flex;justify-content:flex-end;gap:10px;';
        footer.innerHTML = `
            <button id="${modalId}-cancel" style="padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;">Cancelar</button>
        `;

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event handlers
        const closeModal = () => {
            overlay.remove();
            if (config.onCancel) config.onCancel();
        };

        document.getElementById(`${modalId}-close`).onclick = closeModal;
        document.getElementById(`${modalId}-cancel`).onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        // Selección de opción
        body.querySelectorAll('.service-option').forEach(btn => {
            const servConfig = servicios.find(s => s.value === btn.dataset.value);

            btn.onmouseover = () => {
                if (btn.dataset.value !== config.currentValue) {
                    btn.style.borderColor = servConfig.color;
                    btn.style.background = servConfig.color + '10';
                }
            };
            btn.onmouseout = () => {
                if (btn.dataset.value !== config.currentValue) {
                    btn.style.borderColor = '#ddd';
                    btn.style.background = '#fff';
                }
            };
            btn.onclick = () => {
                const value = btn.dataset.value;
                overlay.remove();
                if (config.onSelect) config.onSelect(value);
            };
        });

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    };

    // ===========================================
    // INICIALIZACIÓN
    // ===========================================

    // NOTA: Los estilos están ahora en css/dropdown-system.css
    // Asegúrese de incluir ese archivo CSS en los HTML que usen dropdowns

    // Exponer API global
    window.DropdownSystem = DropdownSystem;

    // Log de inicialización
    console.log('[DropdownSystem] v3.1.0 - Sistema de dropdowns con acordeón inicializado');

})();