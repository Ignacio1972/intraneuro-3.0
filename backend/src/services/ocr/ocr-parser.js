/**
 * OCR Parser - Extrae campos estructurados del texto OCR
 * Responsabilidad: Parsear texto → datos estructurados de pacientes
 */

class OCRParser {
    parsePatientData(ocrText, blocks) {
        console.log('[Parser] Procesando texto OCR...');

        // Intentar extracción por bloques primero, fallback a regex
        const nameFromBlocks = blocks ? this.extractNameFromBlocks(blocks) : null;

        const data = {
            name: nameFromBlocks || this.extractName(ocrText),
            rut: this.extractRUT(ocrText),
            age: this.extractAge(ocrText),
            prevision: this.extractPrevision(ocrText),
            admissionDate: this.extractAdmissionDate(ocrText),
            bed: this.extractBed(ocrText)
        };

        const confidence = this.calculateConfidence(data, ocrText);
        const warnings = this.generateWarnings(data, confidence);
        const missingFields = this.getMissingFields(data);

        console.log('[Parser] Datos extraídos:', data);
        console.log('[Parser] Confianza:', confidence);

        return {
            data,
            confidence,
            warnings,
            needsReview: warnings.map(w => w.field),
            missingFields
        };
    }

    extractName(text) {
        // Textos que NO son nombres de pacientes (filtrar)
        const textosProhibidos = [
            'LEY DE URGENCIA', 'LEY URGENCIA', 'URGENCIA',
            'HOSPITALIZACION', 'HOSPITALIZACIÓN', 'HOSPITALIZACION INTEGRAL',
            'FICHA CLINICA', 'FICHA CLÍNICA', 'DATOS PACIENTE',
            'INGRESO', 'EGRESO', 'ADMISION', 'ADMISIÓN',
            'CONVENCIONAL', 'CONVENCIONA', 'TIPO PACIENTE', 'PROCEDENCIA'
        ];

        // Buscar nombre después de etiquetas comunes
        const patterns = [
            /(?:Nombre|Paciente|Titular)[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?=\n|RUT|Edad|Sexo|$)/i,
            /^([A-ZÁÉÍÓÚÑ\s]{10,50})$/m // Línea con solo mayúsculas (probable nombre)
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let name = match[1].trim();

                // Limpiar textos prohibidos del nombre
                for (const prohibido of textosProhibidos) {
                    name = name.replace(new RegExp(prohibido, 'gi'), '').trim();
                }

                // Filtrar si es muy corto, contiene números, o ES un texto prohibido
                const esProhibido = textosProhibidos.some(p =>
                    name.toUpperCase() === p || name.toUpperCase().includes(p)
                );

                if (name.length >= 10 && !/\d/.test(name) && !esProhibido) {
                    return this.cleanName(name);
                }
            }
        }

        return null;
    }

    extractNameFromBlocks(blocks) {
        if (!blocks || blocks.length === 0) return null;

        const labelPatterns = /^(nombre|paciente|titular|nombre\s+paciente|nombre\s+y\s+apellido)/i;

        const textosProhibidos = [
            'LEY DE URGENCIA', 'LEY URGENCIA', 'URGENCIA',
            'HOSPITALIZACION', 'HOSPITALIZACIÓN', 'HOSPITALIZACION INTEGRAL',
            'FICHA CLINICA', 'FICHA CLÍNICA', 'DATOS PACIENTE',
            'INGRESO', 'EGRESO', 'ADMISION', 'ADMISIÓN',
            'CONVENCIONAL', 'CONVENCIONA', 'TIPO PACIENTE', 'PROCEDENCIA'
        ];

        for (let i = 0; i < blocks.length; i++) {
            const blockText = blocks[i].text.trim();

            // Check if this block contains a label like "Nombre"
            if (labelPatterns.test(blockText)) {
                // The name might be in the same block after the label
                const inlineMatch = blockText.match(/(?:nombre|paciente|titular)[:\s]+(.+)/i);
                if (inlineMatch && inlineMatch[1]) {
                    const candidate = this.cleanName(inlineMatch[1].trim());
                    if (this.isValidName(candidate, textosProhibidos)) {
                        console.log(`[Parser] Nombre encontrado en bloque (inline): "${candidate}"`);
                        return candidate;
                    }
                }

                // Or in the next block(s)
                for (let j = i + 1; j < Math.min(i + 3, blocks.length); j++) {
                    const candidate = this.cleanName(blocks[j].text.trim());
                    if (this.isValidName(candidate, textosProhibidos)) {
                        console.log(`[Parser] Nombre encontrado en bloque siguiente: "${candidate}"`);
                        return candidate;
                    }
                }
            }
        }

        return null;
    }

    isValidName(text, textosProhibidos) {
        if (!text || text.length < 5) return false;
        if (/\d/.test(text)) return false;

        const upper = text.toUpperCase();
        for (const prohibido of textosProhibidos) {
            if (upper === prohibido || upper.includes(prohibido)) return false;
        }

        // Must have at least 2 words (first + last name)
        const words = text.trim().split(/\s+/);
        if (words.length < 2) return false;

        return true;
    }

    // Limpiar nombre: truncar en palabras que indican fin del nombre
    cleanName(text) {
        if (!text) return null;

        // Palabras que indican que el nombre terminó
        const delimiters = ['RUT', 'EDAD', 'SEXO', 'FECHA', 'FONO', 'DIRECCION', 'DIRECCIÓN', 'ASEGURADOR', 'PREVISION', 'PREVISIÓN'];

        let cleaned = text.trim();

        for (const delimiter of delimiters) {
            const idx = cleaned.toUpperCase().indexOf(delimiter);
            if (idx > 0) {
                cleaned = cleaned.substring(0, idx).trim();
            }
        }

        return cleaned;
    }

    extractRUT(text) {
        // RUT chileno: X.XXX.XXX-X o XXXXXXXX-X
        const patterns = [
            /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/,
            /(\d{7,8}-[\dkK])/
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const rut = match[1];
                if (this.validateRUT(rut)) {
                    return rut;
                }
            }
        }

        return null;
    }

    extractAge(text) {
        // Buscar edad: "70 AÑOS", "70 años 8 meses", etc.
        const patterns = [
            /(\d+)\s*AÑOS?/i,
            /Edad[:\s]+(\d+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const age = parseInt(match[1]);
                if (age > 0 && age < 120) {
                    return age;
                }
            }
        }

        return null;
    }

    extractPrevision(text) {
        // Mapeo de términos OCR a valores del PrevisionModal
        const previsionMap = {
            'FONASA': 'Fonasa',
            'BANMEDICA': 'Isapre Banmédica',
            'BANMÉDICA': 'Isapre Banmédica',
            'COLMENA': 'Isapre Colmena',
            'CONSALUD': 'Isapre Consalud',
            'CRUZ BLANCA': 'Isapre Cruz Blanca',
            'CRUZBLANCA': 'Isapre Cruz Blanca',
            'NUEVA MASVIDA': 'Isapre Nueva Masvida',
            'NUEVAMASVIDA': 'Isapre Nueva Masvida',
            'MAS VIDA': 'Isapre Nueva Masvida',
            'MASVIDA': 'Isapre Nueva Masvida',
            'VIDA TRES': 'Isapre Vida Tres',
            'VIDA TRE': 'Isapre Vida Tres',
            'VIDATRES': 'Isapre Vida Tres',
            'VIDATRE': 'Isapre Vida Tres',
            'ESENCIAL': 'Isapre Esencial',
            'PARTICULAR': 'Particular',
            'CONVENIO': 'Convenio',
            'CAPREDENA': 'Fonasa',
            'DIPRECA': 'Fonasa'
        };

        // 1. Buscar por etiqueta ASEGURADOR/PLAN o ASEGURADOR
        const aseguradorPatterns = [
            /ASEGURADOR\s*\/?\s*PLAN[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?=\n|FECHA|FAMILIAR|PROCEDENCIA|$)/i,
            /ASEGURADOR[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?=\n|FECHA|FAMILIAR|PROCEDENCIA|PLAN|$)/i,
            /PREVISI[OÓ]N[:\s]+([A-ZÁÉÍÓÚÑ\s]+?)(?=\n|$)/i
        ];

        for (const pattern of aseguradorPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let value = match[1].trim().toUpperCase();

                // Si es Fonasa, truncar en "/" (ej: "FONASA/TRAMO B" → "FONASA")
                if (value.includes('FONASA')) {
                    return 'Fonasa';
                }

                // Buscar en el mapeo
                for (const [key, mapped] of Object.entries(previsionMap)) {
                    if (value.includes(key)) {
                        return mapped;
                    }
                }

                // Si contiene ISAPRE pero no matcheó, intentar extraer el nombre
                if (value.includes('ISAPRE')) {
                    const isapre = value.replace('ISAPRE', '').trim();
                    for (const [key, mapped] of Object.entries(previsionMap)) {
                        if (isapre.includes(key) || key.includes(isapre)) {
                            return mapped;
                        }
                    }
                }
            }
        }

        // 2. Fallback: buscar términos sueltos en el texto
        for (const [key, mapped] of Object.entries(previsionMap)) {
            const regex = new RegExp(key, 'i');
            if (regex.test(text)) {
                // Si es Fonasa con algo después, solo retornar Fonasa
                if (key === 'FONASA') {
                    return 'Fonasa';
                }
                return mapped;
            }
        }

        return null;
    }

    extractAdmissionDate(text) {
        // Buscar fechas cerca de "Ingreso", "Admisión", etc.
        const match = text.match(/(?:Ingreso|Admisi[oó]n|Fecha)[:\s]+(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i);
        if (match) {
            const [_, day, month, year] = match;
            if (parseInt(day) <= 31 && parseInt(month) <= 12) {
                return `${day}/${month}/${year}`;
            }
        }

        // Si no hay contexto, buscar todas las fechas y elegir la MÁS RECIENTE
        // (La fecha de ingreso será reciente, la de nacimiento será antigua)
        const dates = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g);
        if (dates && dates.length > 0) {
            const today = new Date();
            let closestDate = null;
            let closestDiff = Infinity;

            for (const dateStr of dates) {
                const normalized = dateStr.replace(/-/g, '/');
                const [day, month, year] = normalized.split('/').map(Number);

                // Validar fecha
                if (day > 31 || month > 12 || year < 1900) continue;

                const date = new Date(year, month - 1, day);
                const diff = Math.abs(today - date);

                // Elegir la fecha más cercana a hoy
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestDate = normalized;
                }
            }

            return closestDate;
        }

        return null;
    }

    extractBed(text) {
        // Camas: formato "IA252", "1A23", etc.
        const patterns = [
            /(?:Cama|Pieza|Habitaci[oó]n)[:\s]+([A-Z0-9]+)/i,
            /\b([A-Z]{1,2}\d{2,3})\b/, // Formato: IA252, A12, etc.
            /\bPIEZA\s*([A-Z0-9]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const bed = match[1].toUpperCase();
                // Validar que no sea un RUT o fecha
                if (!/^\d{7,}/.test(bed) && bed.length <= 6) {
                    return bed;
                }
            }
        }

        return null;
    }

    validateRUT(rut) {
        // Validación básica de formato RUT chileno
        if (!rut) return false;

        // Eliminar puntos y guión
        const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
        if (cleanRut.length < 8) return false;

        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1).toUpperCase();

        // Validar que el cuerpo sean solo números
        if (!/^\d+$/.test(body)) return false;

        // Calcular dígito verificador
        let sum = 0;
        let multiplier = 2;

        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }

        const expectedDV = 11 - (sum % 11);
        const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

        return dv === calculatedDV;
    }

    calculateConfidence(data, fullText) {
        const confidence = {};

        for (const [field, value] of Object.entries(data)) {
            if (!value) {
                confidence[field] = 0;
            } else {
                confidence[field] = this.getFieldConfidence(field, value, fullText);
            }
        }

        return confidence;
    }

    getFieldConfidence(field, value, fullText) {
        switch (field) {
            case 'rut':
                return this.validateRUT(value) ? 0.98 : 0.70;

            case 'age':
                return (value > 0 && value < 120) ? 0.95 : 0.50;

            case 'name':
                // Mayor confianza si está todo en mayúsculas y sin números
                const isUpperCase = value === value.toUpperCase();
                const hasNoNumbers = !/\d/.test(value);
                return (isUpperCase && hasNoNumbers) ? 0.92 : 0.75;

            case 'bed':
                // Confianza media para camas (formato puede variar)
                return /^[A-Z]{1,2}\d{2,3}$/.test(value) ? 0.88 : 0.65;

            case 'admissionDate':
                // Validar formato de fecha
                const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                return dateRegex.test(value) ? 0.90 : 0.60;

            case 'prevision':
                return 0.85; // Confianza alta si se encontró en la lista

            default:
                return value ? 0.80 : 0;
        }
    }

    generateWarnings(data, confidence) {
        const warnings = [];
        const threshold = 0.90;

        for (const [field, conf] of Object.entries(confidence)) {
            if (conf > 0 && conf < threshold) {
                warnings.push({
                    field,
                    message: `Confianza baja (${(conf * 100).toFixed(0)}%) - revisar manualmente`,
                    value: data[field]
                });
            }
        }

        return warnings;
    }

    getMissingFields(data) {
        const requiredFields = ['name', 'admissionDate'];
        const missing = [];

        for (const field of requiredFields) {
            if (!data[field]) {
                missing.push(field);
            }
        }

        // Campos que siempre se ingresan manualmente
        missing.push('diagnosis', 'service');

        return missing;
    }
}

module.exports = new OCRParser();
