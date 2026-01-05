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

    // Estructura jerárquica de diagnósticos neurológicos
    // - Líneas con ═══ son headers de categoría (disabled en el select)
    // - Opciones con __INPUT__ muestran campo de texto para especificar causa
    const DIAGNOSTICOS_NEUROLOGICOS = [
        // ═══════════════════════════════════════════
        // I) ENFERMEDADES CEREBROVASCULARES
        // ═══════════════════════════════════════════
        '═══ I) CEREBROVASCULARES ═══',
        'ACV isquémico - ATE',
        'ACV isquémico - Embólico',
        'ACV isquémico - Lacunar',
        'ACV isquémico - Otro',
        'HIC - Hipertensiva',
        'HIC - Amiloidea',
        'HIC - Otra',
        'HSA - Aneurismática',
        'HSA - No aneurismática',
        'TIA',
        'Trombosis Venosa Cerebral',

        // ═══════════════════════════════════════════
        // II) TRASTORNOS CONVULSIVOS
        // ═══════════════════════════════════════════
        '═══ II) CONVULSIVOS ═══',
        'Crisis secundaria',
        'Epilepsia Focal',
        'Epilepsia Generalizada',
        'Síndrome Epiléptico',

        // ═══════════════════════════════════════════
        // III) DEGENERATIVAS
        // ═══════════════════════════════════════════
        '═══ III) DEGENERATIVAS ═══',
        'Parkinson',
        'Demencia - E.A',
        'Demencia - Lewy',
        'Demencia - DFT',
        'Demencia - C-J',
        'Demencia - Otra',

        // ═══════════════════════════════════════════
        // IV) INFLAMATORIA
        // ═══════════════════════════════════════════
        '═══ IV) INFLAMATORIA ═══',
        'Meningitis bacteriana',
        'Meningitis Viral',
        'Meningitis líquido claro',
        'Encefalitis:__INPUT__',
        'Mielitis:__INPUT__',

        // ═══════════════════════════════════════════
        // V) DESMIELINIZANTES
        // ═══════════════════════════════════════════
        '═══ V) DESMIELINIZANTES ═══',
        'Esclerosis Múltiple',
        'NMO',
        'MOG',
        'EAI',

        // ═══════════════════════════════════════════
        // VI) TRAUMA
        // ═══════════════════════════════════════════
        '═══ VI) TRAUMA ═══',
        'TEC simple',
        'TEC complicado - Lesión axonal difusa',
        'TEC complicado - Hematoma epidural',
        'TEC complicado - Hematoma subdural',

        // ═══════════════════════════════════════════
        // VII) TUMOR
        // ═══════════════════════════════════════════
        '═══ VII) TUMOR ═══',
        'Glioblastoma',
        'Astrocitoma',
        'Meningioma',
        'Schwannoma',
        'Metástasis',
        'Tumor - Otro',

        // ═══════════════════════════════════════════
        // VIII) NEUROMUSCULAR
        // ═══════════════════════════════════════════
        '═══ VIII) NEUROMUSCULAR ═══',
        'Miastenia Gravis',
        'Síndrome Guillain-Barré',
        'PNP:__INPUT__',
        'ELA',

        // ═══════════════════════════════════════════
        // IX) CEFALEAS
        // ═══════════════════════════════════════════
        '═══ IX) CEFALEAS ═══',
        'Migraña',
        'Cefalea tensional',
        'Cefalea por sobreuso',
        'Cefalea en racimos',

        // ═══════════════════════════════════════════
        // X) TNF
        // ═══════════════════════════════════════════
        '═══ X) TNF ═══',
        'Trastorno Neurológico Funcional'
    ];

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

            // Opciones predefinidas con soporte para headers y campos __INPUT__
            this.options.forEach(opt => {
                const option = document.createElement('option');

                // Detectar headers de categoría (contienen ═══)
                if (opt.includes('═══')) {
                    option.value = '';
                    option.textContent = opt;
                    option.disabled = true;
                    option.className = 'category-header';
                    option.style.fontWeight = 'bold';
                    option.style.backgroundColor = '#f0f0f0';
                }
                // Detectar campos con input de texto libre (__INPUT__)
                else if (opt.includes(':__INPUT__')) {
                    const baseName = opt.replace(':__INPUT__', '');
                    option.value = `__input__:${baseName}`;
                    option.textContent = `${baseName}: (especificar)`;
                    option.className = 'input-option';
                }
                // Opción normal
                else {
                    option.value = opt;
                    option.textContent = opt;
                }

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

            // Contenedor para campo "otro" o campo de texto libre
            const otherContainer = document.createElement('div');
            otherContainer.id = this.otherId;
            otherContainer.className = 'other-container';
            otherContainer.style.display = 'none';
            otherContainer.style.marginTop = '10px';

            // Label dinámico para el campo de texto
            const inputLabel = document.createElement('label');
            inputLabel.id = `${this.otherInputId}_label`;
            inputLabel.style.display = 'block';
            inputLabel.style.marginBottom = '5px';
            inputLabel.style.fontWeight = '500';
            inputLabel.style.color = '#555';
            inputLabel.textContent = 'Especifique:';

            const otherInput = document.createElement('input');
            otherInput.type = 'text';
            otherInput.id = this.otherInputId;
            otherInput.className = 'other-input';
            otherInput.placeholder = `Escriba el ${this.type === 'diagnosis' ? 'diagnóstico' : 'tipo de previsión'}...`;

            otherContainer.appendChild(inputLabel);
            otherContainer.appendChild(otherInput);

            // Agregar al contenedor
            container.appendChild(select);
            container.appendChild(otherContainer);
        }

        setupEvents() {
            const select = document.getElementById(this.selectId);
            const otherContainer = document.getElementById(this.otherId);
            const otherInput = document.getElementById(this.otherInputId);
            const inputLabel = document.getElementById(`${this.otherInputId}_label`);

            if (!select) return;

            // Evento change del select
            select.addEventListener('change', () => {
                const value = select.value;

                // Campo "Otro" genérico
                if (value === '__other__') {
                    otherContainer.style.display = 'block';
                    otherInput.required = this.required;
                    otherInput.placeholder = 'Escriba el diagnóstico...';
                    if (inputLabel) inputLabel.textContent = 'Otro diagnóstico:';
                    otherInput.value = '';
                    otherInput.focus();
                }
                // Campo con texto libre específico (Encefalitis, Mielitis, PNP)
                else if (value.startsWith('__input__:')) {
                    const baseName = value.replace('__input__:', '');
                    otherContainer.style.display = 'block';
                    otherInput.required = this.required;
                    otherInput.placeholder = `Especifique causa de ${baseName}...`;
                    if (inputLabel) inputLabel.textContent = `${baseName} - Causa:`;
                    otherInput.value = '';
                    otherInput.focus();
                }
                // Opción normal
                else {
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
                    const value = select.value;
                    if ((value === '__other__' || value.startsWith('__input__:')) && this.onChange) {
                        this.onChange(this.getValue());
                    }
                });
            }
        }

        getValue() {
            const select = document.getElementById(this.selectId);
            const otherInput = document.getElementById(this.otherInputId);

            if (!select) return '';

            const value = select.value;

            // Campo "Otro" genérico
            if (value === '__other__' && otherInput) {
                return otherInput.value.trim();
            }

            // Campo con texto libre específico (Encefalitis, Mielitis, PNP)
            if (value.startsWith('__input__:') && otherInput) {
                const baseName = value.replace('__input__:', '');
                const inputValue = otherInput.value.trim();
                // Retorna formato: "Encefalitis: causa especificada"
                return inputValue ? `${baseName}: ${inputValue}` : baseName;
            }

            return value;
        }

        setValue(value) {
            const select = document.getElementById(this.selectId);
            const otherContainer = document.getElementById(this.otherId);
            const otherInput = document.getElementById(this.otherInputId);
            const inputLabel = document.getElementById(`${this.otherInputId}_label`);

            if (!select) return;

            // Verificar si el valor está en las opciones predefinidas (opción normal)
            if (this.options.includes(value)) {
                select.value = value;
                otherContainer.style.display = 'none';
                otherInput.value = '';
                return;
            }

            // Verificar si es un valor con formato "Diagnóstico: causa" (campos __INPUT__)
            const inputFields = ['Encefalitis', 'Mielitis', 'PNP'];
            for (const field of inputFields) {
                if (value && value.startsWith(`${field}:`)) {
                    // Extraer la causa después de ": "
                    const causa = value.substring(field.length + 1).trim();
                    select.value = `__input__:${field}`;
                    otherContainer.style.display = 'block';
                    otherInput.value = causa;
                    if (inputLabel) inputLabel.textContent = `${field} - Causa:`;
                    otherInput.placeholder = `Especifique causa de ${field}...`;
                    return;
                }
                // También manejar el caso donde solo está el nombre sin causa
                if (value === field) {
                    select.value = `__input__:${field}`;
                    otherContainer.style.display = 'block';
                    otherInput.value = '';
                    if (inputLabel) inputLabel.textContent = `${field} - Causa:`;
                    otherInput.placeholder = `Especifique causa de ${field}...`;
                    return;
                }
            }

            // Valor no encontrado en la lista o vacío: mostrar placeholder
            // El diagnóstico actual ya se muestra en el texto del modal,
            // así que el dropdown inicia en "Seleccione un diagnóstico"
            select.value = '';
            otherContainer.style.display = 'none';
            otherInput.value = '';
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
    // NOTA: Los estilos CSS fueron extraídos a css/dropdown-system.css
    // Asegúrese de incluir ese archivo en los HTML que usen este módulo
    // ===========================================

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
        version: '3.0.0'
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