/**
 * BaseComponent - Clase base abstracta para componentes del modal
 * Todos los componentes del modal deben heredar de esta clase
 *
 * @author IntraNeuro Dev Team
 * @version 3.0.0-modular
 */

class ModalComponent {
    /**
     * Constructor base
     * @param {string} containerId - ID del elemento DOM donde se montará el componente
     * @param {Object} patientData - Datos del paciente actual
     */
    constructor(containerId, patientData) {
        this.containerId = containerId;
        this.patientData = patientData;
        this.isRendered = false;
        this.eventHandlers = new Map();

        console.log(`[${this.constructor.name}] Instanciado para paciente ${patientData?.id || 'N/A'}`);
    }

    /**
     * Renderiza el HTML del componente
     * DEBE ser implementado por las subclases
     * @returns {string} HTML del componente
     */
    render() {
        throw new Error(`${this.constructor.name} must implement render() method`);
    }

    /**
     * Monta el componente en el DOM
     * Llama a render() y attachEventListeners()
     */
    mount() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`[${this.constructor.name}] Container ${this.containerId} not found`);
            return;
        }

        container.innerHTML = this.render();
        this.attachEventListeners();
        this.isRendered = true;

        console.log(`[${this.constructor.name}] Mounted successfully`);
    }

    /**
     * Adjunta event listeners después del renderizado
     * Puede ser sobrescrito por subclases
     */
    attachEventListeners() {
        // Implementar en subclases si necesario
    }

    /**
     * Actualiza el componente con nuevos datos
     * @param {Object} newData - Nuevos datos del paciente
     */
    update(newData) {
        console.log(`[${this.constructor.name}] Updating with new data`);
        this.patientData = newData;

        if (this.isRendered) {
            this.mount(); // Re-render
        }
    }

    /**
     * Limpia el componente antes de destruirlo
     */
    destroy() {
        console.log(`[${this.constructor.name}] Destroying...`);

        // Limpiar event listeners
        this.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        this.eventHandlers.clear();

        // Limpiar HTML
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }

        this.isRendered = false;
    }

    /**
     * Emite un evento personalizado
     * @param {string} eventName - Nombre del evento (ej: 'patient:discharged')
     * @param {Object} data - Datos del evento
     */
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
        console.log(`[${this.constructor.name}] Event emitted: ${eventName}`, data);
    }

    /**
     * Registra un event listener para limpieza posterior
     * @param {Element} element - Elemento DOM
     * @param {string} event - Tipo de evento
     * @param {Function} callback - Función callback
     */
    addEventListener(element, event, callback) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, callback);
            this.eventHandlers.set(element, { event, callback });
        }
    }

    // ====== HELPERS COMPARTIDOS ======

    /**
     * Formatea una fecha a DD/MM/YYYY
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Muestra un mensaje toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'info'
     */
    showToast(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[Toast ${type}] ${message}`);
        }
    }

    /**
     * Valida un campo según reglas
     * @param {any} value - Valor a validar
     * @param {Object} rules - Reglas de validación
     * @returns {Object} { valid: boolean, error: string }
     */
    validateField(value, rules = {}) {
        if (rules.required && !value) {
            return { valid: false, error: 'Este campo es requerido' };
        }

        if (rules.minLength && value.length < rules.minLength) {
            return { valid: false, error: `Mínimo ${rules.minLength} caracteres` };
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return { valid: false, error: `Máximo ${rules.maxLength} caracteres` };
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            return { valid: false, error: rules.patternMessage || 'Formato inválido' };
        }

        return { valid: true, error: null };
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Formatea un número con separadores de miles
     * @param {number} num - Número a formatear
     * @returns {string} Número formateado
     */
    formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        return num.toLocaleString('es-CL');
    }
}

console.log('[BaseComponent] Loaded successfully');
