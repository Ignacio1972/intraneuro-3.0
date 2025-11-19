// Módulo: Gestión de Servicios y Unidades
// Responsabilidad: Manejar selección y visualización de servicios hospitalarios

(function() {
  'use strict';

  // Configuración de servicios
  const SERVICES = {
    UCI: { label: 'UCI', color: '#dc2626', icon: '🏥' },
    UTI: { label: 'UTI', color: '#ea580c', icon: '⚕️' },
    MQ: { label: 'MQ', color: '#2563eb', icon: '🔬' },
    Urgencias: { label: 'Urgencias', color: '#ca8a04', icon: '🚨' },
    Interconsulta: { label: 'Interconsulta', color: '#16a34a', icon: '📋' }
  };

  // Inicializar módulo cuando el DOM esté listo
  function init() {
    addServiceFieldsToForm();
    addServiceFilterToDashboard();
    // enhancePatientCards() ya no es necesario - renderPatientCard ya incluye todo
  }

  // 1. Agregar campos de servicio al formulario de admisión
  function addServiceFieldsToForm() {
    const diagnosisGroup = document.querySelector('.diagnosis-group');
    if (!diagnosisGroup) return;

    const serviceHTML = `
      <div class="form-group service-group" style="margin-top: 16px;">
        <label>🏥 Servicio Hospitalario</label>
        <select id="admissionService" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
          <option value="">Sin especificar</option>
          ${Object.keys(SERVICES).map(key =>
            `<option value="${key}">${SERVICES[key].icon} ${SERVICES[key].label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group bed-group" style="margin-top: 12px;">
        <label>🛏️ Número de Cama</label>
        <input
          type="text"
          id="patientBedInput"
          placeholder="Ej: 12A, 5B, etc."
          style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          "
        >
      </div>
    `;

    diagnosisGroup.insertAdjacentHTML('afterend', serviceHTML);
  }

  // 2. Agregar filtro de servicio al dashboard
  function addServiceFilterToDashboard() {
    const doctorFilter = document.getElementById('doctorFilter');
    if (!doctorFilter) return;

    const serviceFilter = document.createElement('select');
    serviceFilter.id = 'serviceFilter';
    serviceFilter.className = 'btn-tool filter-select';
    serviceFilter.style.marginLeft = '8px';

    serviceFilter.innerHTML = `
      <option value="">Servicios</option>
      ${Object.keys(SERVICES).map(key =>
        `<option value="${key}">${SERVICES[key].icon} ${SERVICES[key].label}</option>`
      ).join('')}
    `;

    serviceFilter.addEventListener('change', handleServiceFilter);
    doctorFilter.parentNode.insertBefore(serviceFilter, doctorFilter.nextSibling);
  }

  // 3. Nota: renderPatientCard en pacientes-ui.js ahora maneja los badges y data attributes directamente
  // Ya no es necesario interceptar la función

  // Manejar filtro por servicio (funciona con tarjetas Y tabla)
  function handleServiceFilter(event) {
    const selectedService = event.target.value;

    // Buscar tanto tarjetas como filas de tabla
    const cards = document.querySelectorAll('.patient-card');
    const rows = document.querySelectorAll('tr[data-patient-id]');

    // Combinar ambos en un solo array
    const allElements = [...cards, ...rows];

    allElements.forEach(element => {
      const elementService = element.dataset.service;

      if (!selectedService) {
        // Mostrar todos
        element.style.display = '';
        return;
      }

      // Filtrar por servicio seleccionado
      if (elementService === selectedService) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });

    // Actualizar contador
    updatePatientCount();

    // Log para debugging
    console.log(`Filtro de servicio: ${selectedService || 'todos'}`);
    console.log(`Elementos visibles: ${allElements.filter(el => el.style.display !== 'none').length}`);
  }

  // Actualizar contador de pacientes visibles
  function updatePatientCount() {
    // Contar elementos visibles (tarjetas o filas)
    const visibleCards = document.querySelectorAll('.patient-card:not([style*="display: none"])');
    const visibleRows = document.querySelectorAll('tr[data-patient-id]:not([style*="display: none"])');
    const totalVisible = visibleCards.length + visibleRows.length;

    const countElement = document.querySelector('.patients-count');
    if (countElement) {
      countElement.textContent = `${totalVisible} paciente${totalVisible !== 1 ? 's' : ''}`;
    }
  }

  // Obtener datos del formulario (para integración con ingreso.js)
  function getFormData() {
    const serviceSelect = document.getElementById('admissionService');

    return {
      service: serviceSelect ? serviceSelect.value || null : null
    };
  }

  // Limpiar formulario
  function clearForm() {
    const serviceSelect = document.getElementById('admissionService');

    if (serviceSelect) serviceSelect.value = '';
  }

  // Exponer API pública
  window.ServicesModule = {
    init,
    getFormData,
    clearForm,
    SERVICES
  };

  console.log('✅ Módulo de Servicios cargado');
})();
