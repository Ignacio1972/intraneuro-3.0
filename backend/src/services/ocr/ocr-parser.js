/**
 * OCR Parser - Extrae campos estructurados del texto OCR
 * Responsabilidad: Parsear texto → datos estructurados de pacientes
 */

class OCRParser {
    parsePatientData(ocrText) {
        console.log('[Parser] Procesando texto OCR...');

        const data = {
            name: this.extractName(ocrText),
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
            'INGRESO', 'EGRESO', 'ADMISION', 'ADMISIÓN'
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
                    return name;
                }
            }
        }

        return null;
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
        // Previsiones de salud chilenas
        const previsiones = [
            'FONASA', 'ISAPRE', 'CAPREDENA', 'DIPRECA',
            'PARTICULAR', 'BANMEDICA', 'CONSALUD', 'CRUZ BLANCA',
            'COLMENA', 'VIDA TRES', 'MAS VIDA', 'NUEVA MASVIDA'
        ];

        for (const prevision of previsiones) {
            const regex = new RegExp(prevision, 'i');
            if (regex.test(text)) {
                return prevision;
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
