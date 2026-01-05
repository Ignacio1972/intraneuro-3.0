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
    Interconsulta: { label: 'IC', color: '#16a34a', icon: '📋' }
  };

  // Variable global para guardar el servicio seleccionado
  let selectedService = null;

  // Inicializar módulo cuando el DOM esté listo
  function init() {
    addServiceFieldsToForm();
    addServiceFilterToDashboard();
  }

  // 1. Agregar campos de servicio al formulario de admisión
  function addServiceFieldsToForm() {
    const diagnosisGroup = document.querySelector('.diagnosis-group');
    if (!diagnosisGroup) return;

    // Crear otros servicios (todos menos Urgencias)
    const otherServices = Object.keys(SERVICES).filter(key => key !== 'Urgencias');

    const serviceHTML = `
      <div class="service-selector-container">
        <label>🏥 Servicio Hospitalario</label>
        <div class="service-selector">
          <!-- Botón de Urgencias -->
          <button type="button" id="btnUrgencias" class="btn-urgencias-primary" data-service="Urgencias">
            <span class="icon">🚨</span>
            <span>Urgencias</span>
          </button>

          <!-- Dropdown de otros servicios -->
          <div class="service-dropdown-wrapper">
            <button type="button" id="btnOtherServices" class="btn-other-services">
              <span id="otherServicesLabel">Hospitalización</span>
              <span class="arrow">▼</span>
            </button>
            <div id="serviceDropdownMenu" class="service-dropdown-menu">
              ${otherServices.map(key => `
                <div class="service-dropdown-item" data-service="${key}">
                  <span class="icon">${SERVICES[key].icon}</span>
                  <span class="label">${SERVICES[key].label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="form-group bed-group" style="margin-top: 12px;">
        <label>🛏️ Número de Cama</label>
        <input
          type="text"
          id="patientBedInput"
          placeholder="Ej: 12A, 5B, etc."
        >
      </div>
    `;

    diagnosisGroup.insertAdjacentHTML('afterend', serviceHTML);

    // Configurar event listeners después de insertar el HTML
    setupServiceEventListeners();
  }

  // Configurar event listeners para el selector de servicios
  function setupServiceEventListeners() {
    const btnUrgencias = document.getElementById('btnUrgencias');
    const btnOtherServices = document.getElementById('btnOtherServices');
    const otherServicesLabel = document.getElementById('otherServicesLabel');
    const dropdownMenu = document.getElementById('serviceDropdownMenu');
    const dropdownItems = document.querySelectorAll('.service-dropdown-item');

    // Click en botón de Urgencias
    if (btnUrgencias) {
      btnUrgencias.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle selection
        if (selectedService === 'Urgencias') {
          // Deseleccionar
          selectedService = null;
          this.classList.remove('selected');
        } else {
          // Seleccionar Urgencias
          selectedService = 'Urgencias';
          this.classList.add('selected');

          // Deseleccionar otros
          btnOtherServices.classList.remove('selected');
          btnOtherServices.classList.remove('active');
          dropdownMenu.classList.remove('show');
          dropdownItems.forEach(item => item.classList.remove('selected'));
          otherServicesLabel.textContent = 'Hospitalización';
        }
      });
    }

    // Click en botón de otros servicios (toggle dropdown)
    if (btnOtherServices) {
      btnOtherServices.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        this.classList.toggle('active');
        dropdownMenu.classList.toggle('show');
      });
    }

    // Click en items del dropdown
    dropdownItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const service = this.dataset.service;

        // Si ya está seleccionado, deseleccionar
        if (selectedService === service) {
          selectedService = null;
          this.classList.remove('selected');
          btnOtherServices.classList.remove('selected');
          btnOtherServices.classList.remove('active');
          dropdownMenu.classList.remove('show');
          otherServicesLabel.textContent = 'Hospitalización';
          return;
        }

        // Seleccionar nuevo servicio
        selectedService = service;

        // Deseleccionar botón de Urgencias
        if (btnUrgencias) btnUrgencias.classList.remove('selected');

        // Actualizar UI del dropdown
        dropdownItems.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');

        // Mostrar servicio seleccionado en el botón
        const serviceConfig = SERVICES[service];
        otherServicesLabel.textContent = serviceConfig.icon + ' ' + serviceConfig.label;
        btnOtherServices.classList.add('selected');

        // Cerrar dropdown
        btnOtherServices.classList.remove('active');
        dropdownMenu.classList.remove('show');
      });
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.service-dropdown-wrapper')) {
        if (btnOtherServices) btnOtherServices.classList.remove('active');
        if (dropdownMenu) dropdownMenu.classList.remove('show');
      }
    });
  }

  // 2. Agregar filtro de servicio al dashboard
  function addServiceFilterToDashboard() {
    const doctorFilter = document.getElementById('doctorFilter');
    if (!doctorFilter) return;

    // Verificar si ya existe el filtro
    if (document.getElementById('serviceFilter')) return;

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

  // Manejar filtro por servicio (funciona con tarjetas Y tabla)
  function handleServiceFilter(event) {
    const selectedServiceFilter = event.target.value;

    // Buscar tanto tarjetas como filas de tabla
    const cards = document.querySelectorAll('.patient-card');
    const rows = document.querySelectorAll('tr[data-patient-id]');

    // Combinar ambos en un solo array
    const allElements = [...cards, ...rows];

    allElements.forEach(element => {
      const elementService = element.dataset.service;

      if (!selectedServiceFilter) {
        // Mostrar todos
        element.style.display = '';
        return;
      }

      // Filtrar por servicio seleccionado
      if (elementService === selectedServiceFilter) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });

    // Actualizar contador
    updatePatientCount();
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
    return {
      service: selectedService || null
    };
  }

  // Limpiar formulario
  function clearForm() {
    selectedService = null;

    // Limpiar UI
    const btnUrgencias = document.getElementById('btnUrgencias');
    const btnOtherServices = document.getElementById('btnOtherServices');
    const otherServicesLabel = document.getElementById('otherServicesLabel');
    const dropdownMenu = document.getElementById('serviceDropdownMenu');
    const dropdownItems = document.querySelectorAll('.service-dropdown-item');

    if (btnUrgencias) btnUrgencias.classList.remove('selected');
    if (btnOtherServices) {
      btnOtherServices.classList.remove('active');
      btnOtherServices.classList.remove('selected');
    }
    if (dropdownMenu) dropdownMenu.classList.remove('show');
    if (otherServicesLabel) otherServicesLabel.textContent = 'Hospitalización';

    dropdownItems.forEach(item => item.classList.remove('selected'));
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
