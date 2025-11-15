// Integración del módulo de servicios con el sistema existente
// Responsabilidad: Conectar ServicesModule con ingreso.js y pacientes

(function() {
  'use strict';

  // Esperar a que el DOM y el módulo de servicios estén listos
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof ServicesModule === 'undefined') {
      console.error('ServicesModule no está cargado');
      return;
    }

    // Inicializar el módulo de servicios
    ServicesModule.init();

    // Interceptar el submit del formulario para agregar datos de servicio
    interceptAdmissionForm();

    console.log('✅ Integración de Servicios activa');
  });

  // Interceptar el formulario de admisión
  function interceptAdmissionForm() {
    const admissionForm = document.getElementById('admissionForm');
    if (!admissionForm) return;

    // Guardar el handler original si existe
    const originalSubmit = admissionForm.onsubmit;

    // Agregar listener para enriquecer los datos ANTES del submit
    admissionForm.addEventListener('submit', function(e) {
      // No prevenimos el evento, solo agregamos datos
      enrichFormDataWithService();
    }, true); // Usar capture phase para ejecutar ANTES

    // También hook en el cierre del modal para limpiar
    const modal = document.getElementById('admissionModal');
    if (modal) {
      const closeBtn = modal.querySelector('.close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          ServicesModule.clearForm();
        });
      }
    }
  }

  // Enriquecer los datos del formulario con servicio
  function enrichFormDataWithService() {
    const serviceData = ServicesModule.getFormData();

    // Crear campo hidden temporal para que ingreso.js lo capture
    let serviceHidden = document.getElementById('admissionServiceHidden');

    if (!serviceHidden) {
      serviceHidden = document.createElement('input');
      serviceHidden.type = 'hidden';
      serviceHidden.id = 'admissionServiceHidden';
      document.getElementById('admissionForm').appendChild(serviceHidden);
    }

    serviceHidden.value = serviceData.service || '';
  }

  // Interceptar apiRequest para agregar service a los POST de patients
  if (typeof window.apiRequest !== 'undefined') {
    const originalApiRequest = window.apiRequest;

    window.apiRequest = async function(endpoint, options = {}) {
      // Si es un POST a /patients, agregar datos de servicio
      if (endpoint === '/patients' && options.method === 'POST' && options.body) {
        try {
          const data = JSON.parse(options.body);
          const serviceData = {
            service: document.getElementById('admissionServiceHidden')?.value || null
          };

          // Agregar a los datos
          data.service = serviceData.service;

          options.body = JSON.stringify(data);
        } catch (e) {
          console.warn('No se pudieron agregar datos de servicio:', e);
        }
      }

      return originalApiRequest(endpoint, options);
    };
  }

  console.log('✅ Integración de Servicios cargada');
})();
