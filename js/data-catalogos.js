// data-catalogos.js - INTRANEURO Catálogos y Datos Estáticos

// Mapping de diagnósticos - Actualizado Noviembre 2025
const diagnosisMapping = {
    // Diagnósticos neurológicos actuales
    'ACV': 'ACV',
    'ACV isquémico': 'ACV isquémico',
    'ACV isquémico insular izquierdo': 'ACV isquémico insular izquierdo',
    'ACV isquémico insular derecho': 'ACV isquémico insular derecho',
    'ACV trombolisis': 'ACV trombolisis',
    'ACV trombolizado': 'ACV trombolizado',
    'ACV múltiple': 'ACV múltiple',
    'Infarto Cerebral': 'Infarto Cerebral',
    'Hidrocefalia': 'Hidrocefalia',
    'Síndrome convulsivo': 'Síndrome convulsivo',
    'Crisis epiléptica': 'Crisis epiléptica',
    'Vértigo - Cefalea': 'Vértigo - Cefalea',
    'HIC MAV': 'HIC MAV',
    'HSA': 'HSA',
    'EAI': 'EAI',
    'Síndrome Serotoninérgico': 'Síndrome Serotoninérgico',
    'Hemorragia Intracerebral': 'Hemorragia Intracerebral',
    'Guillan Barre': 'Guillan Barre',

    // Diagnósticos antiguos (mantener por compatibilidad con registros históricos)
    'ACV Isquémico': 'ACV Isquémico',
    'ACV Hemorrágico': 'ACV Hemorrágico',
    'Epilepsia': 'Epilepsia',
    'Crisis Convulsiva': 'Crisis Convulsiva',
    'Cefalea': 'Cefalea',
    'Migraña': 'Migraña',
    'Demencia tipo Alzheimer': 'Demencia tipo Alzheimer',
    'Demencia Vascular': 'Demencia Vascular',
    'Enfermedad de Parkinson': 'Enfermedad de Parkinson',
    'Esclerosis Múltiple': 'Esclerosis Múltiple',
    'Neuropatía Periférica': 'Neuropatía Periférica',
    'Síndrome de Guillain-Barré': 'Síndrome de Guillain-Barré',
    'Meningitis': 'Meningitis',
    'Encefalitis': 'Encefalitis',
    'Tumor Cerebral': 'Tumor Cerebral',
    'Traumatismo Craneoencefálico': 'Traumatismo Craneoencefálico',
    'Vértigo': 'Vértigo',
    'Miastenia Gravis': 'Miastenia Gravis',
    'Esclerosis Lateral Amiotrófica': 'Esclerosis Lateral Amiotrófica',

    // Códigos psiquiátricos antiguos (mantener por compatibilidad)
    'F32.1': 'Episodio depresivo moderado',
    'F41.1': 'Trastorno de ansiedad generalizada',
    'F20.0': 'Esquizofrenia paranoide',
    'F31.1': 'Trastorno bipolar, episodio maníaco',
    'F10.2': 'Dependencia del alcohol',
    'F43.1': 'Trastorno de estrés post-traumático',
    'F60.3': 'Trastorno límite de la personalidad',
    'F84.0': 'Autismo infantil',
    'F90.0': 'Trastorno por déficit de atención con hiperactividad',
    'F50.0': 'Anorexia nerviosa',
    'F00': 'Demencia en enfermedad de Alzheimer'
};

// Descripciones de la Escala de Rankin
const rankinDescriptions = {
    0: 'Sin síntomas',
    1: 'Sin incapacidad significativa',
    2: 'Incapacidad leve',
    3: 'Incapacidad moderada',
    4: 'Incapacidad moderadamente severa',
    5: 'Incapacidad severa',
    6: 'Muerte'
};

// Opciones de diagnóstico de egreso
const dischargeOptions = [
    { value: '', text: 'Seleccione...' },
    { value: 'alta', text: 'Alta médica' },
    { value: 'F32.1', text: 'Episodio depresivo moderado' },
    { value: 'F41.1', text: 'Trastorno de ansiedad generalizada' },
    { value: 'F20.0', text: 'Esquizofrenia paranoide' },
    { value: 'F31.1', text: 'Trastorno bipolar' },
    { value: 'F10.2', text: 'Dependencia del alcohol' },
    { value: 'other', text: 'Otro...' }
];

// Colores para badges y estados
const statusColors = {
    active: '#28a745',
    discharged: '#6c757d',
    scheduled: '#007bff',
    deceased: '#dc3545'
};

// Mensajes del sistema
const systemMessages = {
    dischargeSuccess: 'Egreso procesado correctamente',
    scheduledSuccess: 'Alta programada para hoy',
    scheduledRemoved: 'Alta programada cancelada',
    errorGeneric: 'Error al procesar la solicitud',
    errorAuth: 'Por favor ingrese su nombre completo',
    confirmDischarge: '¿Está seguro de procesar el egreso?'
};

// Función helper para obtener texto del diagnóstico
function getDiagnosisText(code) {
    return diagnosisMapping[code] || code;
}

// Función helper para obtener descripción de Rankin
function getRankinDescription(score) {
    return rankinDescriptions[score] || 'No especificado';
}

// Exportar para uso global
window.catalogos = {
    diagnosis: diagnosisMapping,
    rankin: rankinDescriptions,
    dischargeOptions: dischargeOptions,
    colors: statusColors,
    messages: systemMessages,
    // Funciones helper
    getDiagnosisText,
    getRankinDescription
};