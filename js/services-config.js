// services-config.js - Configuración global de servicios hospitalarios
// Centraliza la definición de servicios para uso en todo el sistema

// Definición global de servicios
window.HOSPITAL_SERVICES_CONFIG = {
    UCI: {
        label: 'UCI',
        color: '#dc2626',
        icon: '🏥',
        fullName: 'Unidad de Cuidados Intensivos'
    },
    UTI: {
        label: 'UTI',
        color: '#ea580c',
        icon: '⚕️',
        fullName: 'Unidad de Terapia Intermedia'
    },
    MQ: {
        label: 'MQ',
        color: '#2563eb',
        icon: '🔬',
        fullName: 'Médico Quirúrgico'
    },
    Urgencias: {
        label: 'Urgencias',
        color: '#ca8a04',
        icon: '🚨',
        fullName: 'Servicio de Urgencias'
    },
    Interconsulta: {
        label: 'IC',
        color: '#16a34a',
        icon: '📋',
        fullName: 'Interconsulta'
    }
};

// Funciones helper globales
window.getServiceConfig = function(serviceKey) {
    return window.HOSPITAL_SERVICES_CONFIG[serviceKey] || null;
};

window.getServiceBadgeHTML = function(serviceKey) {
    const service = window.HOSPITAL_SERVICES_CONFIG[serviceKey];
    if (!service) return '<span style="color: #999;">Sin servicio</span>';

    return `
        <span style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: ${service.color}15;
            color: ${service.color};
            border: 1px solid ${service.color}40;
        ">
            ${service.icon} ${service.label}
        </span>
    `;
};

console.log('[ServicesConfig] Configuración de servicios cargada:', Object.keys(window.HOSPITAL_SERVICES_CONFIG).join(', '));