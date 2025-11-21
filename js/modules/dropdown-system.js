/**
 * Sistema Unificado de Dropdowns para INTRANEURO
 * Versión: 2.0.0
 * Fecha: 2025-11-13
 *
 * Este módulo reemplaza todas las implementaciones anteriores de dropdowns
 * y proporciona una solución simple, robusta y confiable.
 */

(function() {
    'use strict';

    // ===========================================
    // CONFIGURACIÓN DE DATOS
    // ===========================================

    const DIAGNOSTICOS_NEUROLOGICOS = [
        'ACV',
        'ACV isquémico',
        'ACV isquémico insular izquierdo',
        'ACV isquémico insular derecho',
        'ACV trombolisis',
        'ACV trombolizado',
        'ACV múltiple',
        'Infarto Cerebral',
        'Hidrocefalia',
        'Síndrome convulsivo',
        'Crisis epiléptica',
        'Vértigo - Cefalea',
        'HIC MAV',
        'HSA',
        'EAI',
        'Síndrome Serotoninérgico',
        'Hemorragia Intracerebral',
        'Guillan Barre'
    ];

    const PREVISIONES = [
        'Fonasa A',
        'Fonasa B',
        'Fonasa C',
        'Fonasa D',
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
    // CLASE DROPDOWN
    // ===========================================

    class Dropdown {
        constructor(config) {
            this.type = config.type; // 'diagnosis' o 'prevision'
            this.containerId = config.containerId;
            this.required = config.required !== false;
            this.currentValue = config.currentValue || '';
            this.onChange = config.onChange || null;
            this.placeholder = config.placeholder || this.getDefaultPlaceholder();
            this.options = config.options || this.getDefaultOptions();
            this.allowOther = config.allowOther !== false;

            // IDs únicos para esta instancia
            this.instanceId = `dropdown_${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.selectId = `select_${this.instanceId}`;
            this.otherId = `other_${this.instanceId}`;
            this.otherInputId = `input_${this.instanceId}`;

            this.init();
        }

        getDefaultPlaceholder() {
            return this.type === 'diagnosis'
                ? '-- Seleccione un diagnóstico --'
                : '-- Seleccione previsión --';
        }

        getDefaultOptions() {
            return this.type === 'diagnosis' ? DIAGNOSTICOS_NEUROLOGICOS : PREVISIONES;
        }

        init() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error(`[DropdownSystem] Contenedor ${this.containerId} no encontrado`);
                return;
            }

            // Limpiar contenedor
            container.innerHTML = '';

            // Crear estructura HTML
            this.render(container);

            // Configurar eventos
            this.setupEvents();

            // Establecer valor inicial si existe
            if (this.currentValue) {
                this.setValue(this.currentValue);
            }
        }

        render(container) {
            // Crear select principal
            const select = document.createElement('select');
            select.id = this.selectId;
            select.className = `intraneuro-dropdown ${this.type}-dropdown`;
            select.required = this.required;

            // Opción placeholder
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = this.placeholder;
            select.appendChild(placeholderOption);

            // Opciones predefinidas
            this.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });

            // Opción "Otro" si está permitida
            if (this.allowOther) {
                const otherOption = document.createElement('option');
                otherOption.value = '__other__';
                otherOption.textContent = `── Otro ${this.type === 'diagnosis' ? 'diagnóstico' : ''} ──`;
                otherOption.className = 'other-option';
                select.appendChild(otherOption);
            }

            // Contenedor para campo "otro"
            const otherContainer = document.createElement('div');
            otherContainer.id = this.otherId;
            otherContainer.className = 'other-container';
            otherContainer.style.display = 'none';
            otherContainer.style.marginTop = '10px';

            const otherInput = document.createElement('input');
            otherInput.type = 'text';
            otherInput.id = this.otherInputId;
            otherInput.className = 'other-input';
            otherInput.placeholder = `Escriba el ${this.type === 'diagnosis' ? 'diagnóstico' : 'tipo de previsión'}...`;

            otherContainer.appendChild(otherInput);

            // Agregar al contenedor
            container.appendChild(select);
            container.appendChild(otherContainer);
        }

        setupEvents() {
            const select = document.getElementById(this.selectId);
            const otherContainer = document.getElementById(this.otherId);
            const otherInput = document.getElementById(this.otherInputId);

            if (!select) return;

            // Evento change del select
            select.addEventListener('change', () => {
                if (select.value === '__other__') {
                    otherContainer.style.display = 'block';
                    otherInput.required = this.required;
                    otherInput.focus();
                } else {
                    otherContainer.style.display = 'none';
                    otherInput.required = false;
                    otherInput.value = '';
                }

                // Callback onChange
                if (this.onChange) {
                    this.onChange(this.getValue());
                }
            });

            // Evento input del campo otro
            if (otherInput) {
                otherInput.addEventListener('input', () => {
                    if (select.value === '__other__' && this.onChange) {
                        this.onChange(this.getValue());
                    }
                });
            }
        }

        getValue() {
            const select = document.getElementById(this.selectId);
            const otherInput = document.getElementById(this.otherInputId);

            if (!select) return '';

            if (select.value === '__other__' && otherInput) {
                return otherInput.value.trim();
            }

            return select.value;
        }

        setValue(value) {
            const select = document.getElementById(this.selectId);
            const otherContainer = document.getElementById(this.otherId);
            const otherInput = document.getElementById(this.otherInputId);

            if (!select) return;

            // Verificar si el valor está en las opciones predefinidas
            if (this.options.includes(value)) {
                select.value = value;
                otherContainer.style.display = 'none';
                otherInput.value = '';
            } else if (value && this.allowOther) {
                // Es un valor personalizado
                select.value = '__other__';
                otherContainer.style.display = 'block';
                otherInput.value = value;
            } else {
                // Valor vacío
                select.value = '';
                otherContainer.style.display = 'none';
                otherInput.value = '';
            }
        }

        validate() {
            const value = this.getValue();
            return !this.required || (value && value.length > 0);
        }

        clear() {
            this.setValue('');
        }

        destroy() {
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '';
            }
        }
    }

    // ===========================================
    // ESTILOS CSS
    // ===========================================

    function injectStyles() {
        if (document.getElementById('dropdown-system-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'dropdown-system-styles';
        styles.textContent = `
            /* Estilos para dropdowns de INTRANEURO */
            .intraneuro-dropdown {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                font-family: inherit;
                background-color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                outline: none;
            }

            .intraneuro-dropdown:hover {
                border-color: #4CAF50;
            }

            .intraneuro-dropdown:focus {
                border-color: #4CAF50;
                box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
            }

            .intraneuro-dropdown:disabled {
                background-color: #f5f5f5;
                cursor: not-allowed;
                opacity: 0.6;
            }

            .intraneuro-dropdown option.other-option {
                font-weight: bold;
                background-color: #f9f9f9;
                padding: 10px;
            }

            .other-container {
                animation: slideDown 0.3s ease-out;
            }

            .other-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                font-family: inherit;
                transition: all 0.3s ease;
                outline: none;
            }

            .other-input:focus {
                border-color: #4CAF50;
                box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Estilos específicos para modales */
            .modal .intraneuro-dropdown,
            .modal .other-input {
                background-color: #fff;
                color: #333;
            }
        `;

        document.head.appendChild(styles);
    }

    // ===========================================
    // API PÚBLICA
    // ===========================================

    const DropdownSystem = {
        // Crear dropdown de diagnóstico
        createDiagnosisDropdown: function(config = {}) {
            config.type = 'diagnosis';
            return new Dropdown(config);
        },

        // Crear dropdown de previsión
        createPrevisionDropdown: function(config = {}) {
            config.type = 'prevision';
            return new Dropdown(config);
        },

        // Crear dropdown genérico
        createDropdown: function(config) {
            return new Dropdown(config);
        },

        // Obtener listas de opciones
        getDiagnosisOptions: function() {
            return [...DIAGNOSTICOS_NEUROLOGICOS];
        },

        getPrevisionOptions: function() {
            return [...PREVISIONES];
        },

        // Versión del sistema
        version: '2.0.0'
    };

    // ===========================================
    // INICIALIZACIÓN
    // ===========================================

    // Inyectar estilos cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }

    // Exponer API global
    window.DropdownSystem = DropdownSystem;

    // Log de inicialización
    console.log('[DropdownSystem] v2.0.0 - Sistema de dropdowns inicializado correctamente');

})();