// data-catalogos.js - INTRANEURO Catálogos y Datos Estáticos

// Mapping de diagnósticos - Actualizado Diciembre 2025
// Estructura jerárquica con categorías: Cerebrovasculares, Convulsivos, Degenerativas, etc.
const diagnosisMapping = {
    // ═══════════════════════════════════════════
    // I) CEREBROVASCULARES
    // ═══════════════════════════════════════════
    'ACV isquémico - ATE': 'ACV isquémico - ATE',
    'ACV isquémico - Embólico': 'ACV isquémico - Embólico',
    'ACV isquémico - Lacunar': 'ACV isquémico - Lacunar',
    'ACV isquémico - Otro': 'ACV isquémico - Otro',
    'HIC - Hipertensiva': 'HIC - Hipertensiva',
    'HIC - Amiloidea': 'HIC - Amiloidea',
    'HIC - Otra': 'HIC - Otra',
    'HSA - Aneurismática': 'HSA - Aneurismática',
    'HSA - No aneurismática': 'HSA - No aneurismática',
    'TIA': 'TIA',
    'Trombosis Venosa Cerebral': 'Trombosis Venosa Cerebral',

    // ═══════════════════════════════════════════
    // II) CONVULSIVOS
    // ═══════════════════════════════════════════
    'Crisis secundaria': 'Crisis secundaria',
    'Epilepsia Focal': 'Epilepsia Focal',
    'Epilepsia Generalizada': 'Epilepsia Generalizada',
    'Síndrome Epiléptico': 'Síndrome Epiléptico',

    // ═══════════════════════════════════════════
    // III) DEGENERATIVAS
    // ═══════════════════════════════════════════
    'Parkinson': 'Parkinson',
    'Demencia - E.A': 'Demencia - Enfermedad de Alzheimer',
    'Demencia - Lewy': 'Demencia - Cuerpos de Lewy',
    'Demencia - DFT': 'Demencia - Frontotemporal',
    'Demencia - C-J': 'Demencia - Creutzfeldt-Jakob',
    'Demencia - Otra': 'Demencia - Otra',

    // ═══════════════════════════════════════════
    // IV) INFLAMATORIA
    // ═══════════════════════════════════════════
    'Meningitis bacteriana': 'Meningitis bacteriana',
    'Meningitis Viral': 'Meningitis Viral',
    'Meningitis líquido claro': 'Meningitis líquido claro',
    // Encefalitis y Mielitis: valores dinámicos con causa especificada

    // ═══════════════════════════════════════════
    // V) DESMIELINIZANTES
    // ═══════════════════════════════════════════
    'Esclerosis Múltiple': 'Esclerosis Múltiple',
    'NMO': 'Neuromielitis Óptica',
    'MOG': 'Enfermedad por anticuerpos anti-MOG',
    'EAI': 'Encefalitis Autoinmune',

    // ═══════════════════════════════════════════
    // VI) TRAUMA
    // ═══════════════════════════════════════════
    'TEC simple': 'TEC simple',
    'TEC complicado - Lesión axonal difusa': 'TEC complicado - Lesión axonal difusa',
    'TEC complicado - Hematoma epidural': 'TEC complicado - Hematoma epidural',
    'TEC complicado - Hematoma subdural': 'TEC complicado - Hematoma subdural',

    // ═══════════════════════════════════════════
    // VII) TUMOR
    // ═══════════════════════════════════════════
    'Glioblastoma': 'Glioblastoma',
    'Astrocitoma': 'Astrocitoma',
    'Meningioma': 'Meningioma',
    'Schwannoma': 'Schwannoma',
    'Metástasis': 'Metástasis cerebral',
    'Tumor - Otro': 'Tumor - Otro',

    // ═══════════════════════════════════════════
    // VIII) NEUROMUSCULAR
    // ═══════════════════════════════════════════
    'Miastenia Gravis': 'Miastenia Gravis',
    'Síndrome Guillain-Barré': 'Síndrome Guillain-Barré',
    // PNP: valor dinámico con causa especificada
    'ELA': 'Esclerosis Lateral Amiotrófica',

    // ═══════════════════════════════════════════
    // IX) CEFALEAS
    // ═══════════════════════════════════════════
    'Migraña': 'Migraña',
    'Cefalea tensional': 'Cefalea tensional',
    'Cefalea por sobreuso': 'Cefalea por sobreuso de medicamentos',
    'Cefalea en racimos': 'Cefalea en racimos',

    // ═══════════════════════════════════════════
    // X) TNF
    // ═══════════════════════════════════════════
    'Trastorno Neurológico Funcional': 'Trastorno Neurológico Funcional',

    // ═══════════════════════════════════════════
    // DIAGNÓSTICOS ANTIGUOS (compatibilidad con registros históricos)
    // ═══════════════════════════════════════════
    'ACV': 'ACV',
    'ACV isquémico': 'ACV isquémico',
    'ACV isquémico insular izquierdo': 'ACV isquémico insular izquierdo',
    'ACV isquémico insular derecho': 'ACV isquémico insular derecho',
    'ACV trombolisis': 'ACV trombolisis',
    'ACV trombolizado': 'ACV trombolizado',
    'ACV múltiple': 'ACV múltiple',
    'ACV Isquémico': 'ACV Isquémico',
    'ACV Hemorrágico': 'ACV Hemorrágico',
    'Infarto Cerebral': 'Infarto Cerebral',
    'Hidrocefalia': 'Hidrocefalia',
    'Síndrome convulsivo': 'Síndrome convulsivo',
    'Crisis epiléptica': 'Crisis epiléptica',
    'Crisis Convulsiva': 'Crisis Convulsiva',
    'Epilepsia': 'Epilepsia',
    'Vértigo - Cefalea': 'Vértigo - Cefalea',
    'Vértigo': 'Vértigo',
    'Cefalea': 'Cefalea',
    'HIC MAV': 'HIC MAV',
    'HSA': 'HSA',
    'Síndrome Serotoninérgico': 'Síndrome Serotoninérgico',
    'Hemorragia Intracerebral': 'Hemorragia Intracerebral',
    'Guillan Barre': 'Síndrome Guillain-Barré',
    'Síndrome de Guillain-Barré': 'Síndrome Guillain-Barré',
    'Demencia tipo Alzheimer': 'Demencia - E.A',
    'Demencia Vascular': 'Demencia Vascular',
    'Enfermedad de Parkinson': 'Parkinson',
    'Neuropatía Periférica': 'Neuropatía Periférica',
    'Meningitis': 'Meningitis',
    'Encefalitis': 'Encefalitis',
    'Tumor Cerebral': 'Tumor Cerebral',
    'Traumatismo Craneoencefálico': 'TEC simple',

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