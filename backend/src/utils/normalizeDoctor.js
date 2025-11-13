// Utilidad para normalizar nombres de médicos
// Sistema: INTRANEURO

/**
 * Normaliza el nombre de un médico para mantener consistencia
 * @param {string} name - Nombre del médico a normalizar
 * @returns {string} - Nombre normalizado
 */
function normalizeDoctorName(name) {
    if (!name || typeof name !== 'string') {
        return 'Sistema';
    }
    
    // Eliminar espacios al inicio y final
    let normalized = name.trim();
    
    // Si está vacío después de trim, retornar valor por defecto
    if (!normalized) {
        return 'Sistema';
    }
    
    // Normalizar espacios múltiples a uno solo primero
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Convertir todo a minúsculas
    normalized = normalized.toLowerCase();
    
    // Capitalizar solo la primera letra de cada palabra
    normalized = normalized.split(' ').map(word => {
        if (word.length === 0) return word;
        // Capitalizar primera letra manteniendo el resto en minúsculas
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    // Corregir preposiciones y artículos comunes en español
    const corrections = {
        ' De ': ' de ',
        ' Del ': ' del ',
        ' La ': ' la ',
        ' Las ': ' las ',
        ' Los ': ' los ',
        ' El ': ' el ',
        ' Y ': ' y ',
        ' E ': ' e ',
        ' O ': ' o ',
        ' U ': ' u '
    };
    
    // Aplicar correcciones
    for (const [wrong, correct] of Object.entries(corrections)) {
        normalized = normalized.replace(new RegExp(wrong, 'g'), correct);
    }
    
    // Casos especiales conocidos (mantener consistencia con datos existentes)
    const knownCorrections = {
        'Andres De La Cerda': 'Andrés de la Cerda',
        'Andrés De La Cerda': 'Andrés de la Cerda',
        'Andres de la Cerda': 'Andrés de la Cerda',
        'Nicolas Rebolledo': 'Nicolás Rebolledo'
    };
    
    // Verificar si coincide con algún caso conocido
    for (const [variant, correct] of Object.entries(knownCorrections)) {
        if (normalized.toLowerCase() === variant.toLowerCase()) {
            return correct;
        }
    }
    
    // Retornar el nombre normalizado
    return normalized;
}

module.exports = { normalizeDoctorName };