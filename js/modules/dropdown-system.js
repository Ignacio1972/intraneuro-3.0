/**
 * Sistema Unificado de Dropdowns para INTRANEURO
 * Versión: 2.1.0
 * Fecha: 2025-12-03
 *
 * Este módulo reemplaza todas las implementaciones anteriores de dropdowns
 * y proporciona una solución simple, robusta y confiable.
 *
 * v2.1.0 - Agregado dropdown de médicos tratantes con administración integrada
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

        // Crear dropdown de médicos tratantes (con administración integrada)
        createDoctorDropdown: function(config = {}) {
            return new DoctorDropdown(config);
        },

        // Versión del sistema
        version: '2.1.0'
    };

    // ===========================================
    // CLASE DOCTOR DROPDOWN (con administración)
    // ===========================================

    class DoctorDropdown {
        constructor(config) {
            this.containerId = config.containerId;
            this.required = config.required !== false;
            this.currentValue = config.currentValue || '';
            this.onChange = config.onChange || null;
            this.placeholder = config.placeholder || '-- Seleccione médico tratante --';
            this.doctors = []; // Se carga desde API

            // IDs únicos
            this.instanceId = `dropdown_doctor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.selectId = `select_${this.instanceId}`;

            this.init();
        }

        async init() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error(`[DoctorDropdown] Contenedor ${this.containerId} no encontrado`);
                return;
            }

            // Limpiar contenedor
            container.innerHTML = '<div style="padding: 10px; color: #666;">Cargando médicos...</div>';

            // Cargar médicos desde API
            await this.loadDoctors();

            // Renderizar
            this.render(container);

            // Eventos
            this.setupEvents();

            // Valor inicial
            if (this.currentValue) {
                this.setValue(this.currentValue);
            }
        }

        async loadDoctors() {
            try {
                if (typeof apiRequest === 'function') {
                    const response = await apiRequest('/doctors');
                    this.doctors = Array.isArray(response) ? response : [];
                } else {
                    console.warn('[DoctorDropdown] apiRequest no disponible');
                    this.doctors = [];
                }
            } catch (error) {
                console.error('[DoctorDropdown] Error cargando médicos:', error);
                this.doctors = [];
            }
        }

        render(container) {
            container.innerHTML = '';

            // Crear select principal
            const select = document.createElement('select');
            select.id = this.selectId;
            select.className = 'intraneuro-dropdown doctor-dropdown';
            select.required = this.required;

            // Opción placeholder
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = this.placeholder;
            select.appendChild(placeholderOption);

            // Opciones de médicos
            this.doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.name;
                option.textContent = doctor.name;
                select.appendChild(option);
            });

            // Separador visual
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '────────────────';
            select.appendChild(separator);

            // Opción: Agregar nuevo médico
            const addOption = document.createElement('option');
            addOption.value = '__add__';
            addOption.textContent = '➕ Agregar nuevo médico...';
            addOption.className = 'action-option';
            select.appendChild(addOption);

            // Opción: Administrar lista
            const manageOption = document.createElement('option');
            manageOption.value = '__manage__';
            manageOption.textContent = '⚙️ Administrar lista...';
            manageOption.className = 'action-option';
            select.appendChild(manageOption);

            container.appendChild(select);
        }

        setupEvents() {
            const select = document.getElementById(this.selectId);
            if (!select) return;

            select.addEventListener('change', async () => {
                const value = select.value;

                if (value === '__add__') {
                    // Resetear select mientras se muestra el modal
                    select.value = this.currentValue || '';
                    await this.showAddDoctorModal();
                } else if (value === '__manage__') {
                    // Resetear select mientras se muestra el modal
                    select.value = this.currentValue || '';
                    await this.showManageDoctorsModal();
                } else {
                    this.currentValue = value;
                    if (this.onChange) {
                        this.onChange(value);
                    }
                }
            });
        }

        async showAddDoctorModal() {
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
                    // Recargar lista y seleccionar el nuevo
                    await this.loadDoctors();
                    this.render(document.getElementById(this.containerId));
                    this.setupEvents();
                    this.setValue(response.doctor.name);

                    if (typeof showToast === 'function') {
                        showToast(`Médico "${response.doctor.name}" agregado correctamente`);
                    }

                    // Disparar onChange
                    if (this.onChange) {
                        this.onChange(response.doctor.name);
                    }
                }
            } catch (error) {
                console.error('[DoctorDropdown] Error agregando médico:', error);
                if (typeof showToast === 'function') {
                    showToast('Error al agregar médico: ' + (error.message || 'Error desconocido'), 'error');
                }
            }
        }

        async showManageDoctorsModal() {
            // Crear modal de administración
            const modalId = `manage-doctors-modal-${this.instanceId}`;

            // Remover si existe
            const existing = document.getElementById(modalId);
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal active';
            modal.style.zIndex = '10001';

            modal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; color: var(--text-primary);">⚙️ Médicos Tratantes</h3>
                        <button type="button" id="${modalId}-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999;">&times;</button>
                    </div>
                    <div id="${modalId}-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
                        ${this.doctors.length === 0 ? '<p style="color: #999; text-align: center;">No hay médicos registrados</p>' : ''}
                        ${this.doctors.map(doc => `
                            <div class="doctor-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #eee;">
                                <span style="flex: 1;">${doc.name}</span>
                                <span style="color: #999; font-size: 0.85rem; margin-right: 1rem;">${doc.frequency_count || 0} asignaciones</span>
                                <button type="button" class="delete-doctor-btn" data-doctor-id="${doc.id}" data-doctor-name="${doc.name}"
                                    style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.1rem;" title="Eliminar">🗑️</button>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" id="${modalId}-add" class="btn btn-primary" style="flex: 1;">
                            ➕ Agregar Médico
                        </button>
                        <button type="button" id="${modalId}-done" class="btn btn-secondary">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Eventos del modal
            document.getElementById(`${modalId}-close`).addEventListener('click', () => modal.remove());
            document.getElementById(`${modalId}-done`).addEventListener('click', () => modal.remove());

            document.getElementById(`${modalId}-add`).addEventListener('click', async () => {
                modal.remove();
                await this.showAddDoctorModal();
            });

            // Eventos de eliminar
            modal.querySelectorAll('.delete-doctor-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const doctorId = e.target.dataset.doctorId;
                    const doctorName = e.target.dataset.doctorName;

                    if (!confirm(`¿Está seguro que desea eliminar a "${doctorName}" de la lista?`)) {
                        return;
                    }

                    try {
                        await apiRequest(`/doctors/${doctorId}`, { method: 'DELETE' });

                        // Recargar lista
                        await this.loadDoctors();
                        this.render(document.getElementById(this.containerId));
                        this.setupEvents();

                        // Actualizar modal
                        modal.remove();
                        await this.showManageDoctorsModal();

                        if (typeof showToast === 'function') {
                            showToast(`Médico "${doctorName}" eliminado correctamente`);
                        }
                    } catch (error) {
                        console.error('[DoctorDropdown] Error eliminando médico:', error);
                        if (typeof showToast === 'function') {
                            showToast('Error al eliminar médico', 'error');
                        }
                    }
                });
            });

            // Cerrar con ESC
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }

        getValue() {
            const select = document.getElementById(this.selectId);
            if (!select) return this.currentValue || '';

            const value = select.value;
            // No retornar valores especiales
            if (value === '__add__' || value === '__manage__') {
                return this.currentValue || '';
            }
            return value;
        }

        setValue(value) {
            this.currentValue = value;
            const select = document.getElementById(this.selectId);
            if (!select) return;

            // Verificar si el valor está en las opciones
            const optionExists = Array.from(select.options).some(opt => opt.value === value);
            if (optionExists) {
                select.value = value;
            } else if (value) {
                // El valor no existe en la lista (caso raro)
                // Agregar temporalmente como opción
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.insertBefore(option, select.options[1]); // Después del placeholder
                select.value = value;
            }
        }

        validate() {
            const value = this.getValue();
            return !this.required || (value && value.length > 0);
        }

        clear() {
            this.setValue('');
        }

        async refresh() {
            await this.loadDoctors();
            this.render(document.getElementById(this.containerId));
            this.setupEvents();
            if (this.currentValue) {
                this.setValue(this.currentValue);
            }
        }
    }

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