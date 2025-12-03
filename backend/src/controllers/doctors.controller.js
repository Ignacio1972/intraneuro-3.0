// Controller: Doctors Catalog
// Gestión del catálogo de médicos tratantes

const { Doctor } = require('../models');
const { Op } = require('sequelize');

// GET /api/doctors - Listar todos los médicos activos
exports.getAll = async (req, res) => {
    try {
        const { active = 'true', limit = 100 } = req.query;

        const doctors = await Doctor.findAll({
            where: {
                is_active: active === 'true'
            },
            order: [
                ['frequency_count', 'DESC'],
                ['name', 'ASC']
            ],
            limit: parseInt(limit)
        });

        res.json(doctors);
    } catch (error) {
        console.error('Error obteniendo médicos:', error);
        res.status(500).json({ error: 'Error al obtener médicos' });
    }
};

// GET /api/doctors/search?q=texto - Buscar médicos
exports.search = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = q.trim();

        // Búsqueda con ILIKE (case-insensitive)
        const doctors = await Doctor.findAll({
            where: {
                name: {
                    [Op.iLike]: `%${searchTerm}%`
                },
                is_active: true
            },
            order: [
                ['frequency_count', 'DESC'],
                ['name', 'ASC']
            ],
            limit: 20
        });

        res.json(doctors);
    } catch (error) {
        console.error('Error buscando médicos:', error);
        res.status(500).json({ error: 'Error al buscar médicos' });
    }
};

// POST /api/doctors - Crear nuevo médico
exports.create = async (req, res) => {
    try {
        const { name, specialty = 'Neurología' } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const normalizedName = normalizeName(name.trim());

        // Verificar si ya existe (case-insensitive)
        const existing = await Doctor.findOne({
            where: {
                name: {
                    [Op.iLike]: normalizedName
                }
            }
        });

        if (existing) {
            // Si ya existe pero está inactivo, reactivarlo
            if (!existing.is_active) {
                await existing.update({
                    is_active: true,
                    frequency_count: existing.frequency_count + 1
                });

                return res.json({
                    doctor: existing,
                    message: 'Médico reactivado exitosamente'
                });
            }

            // Si ya existe y está activo
            return res.status(409).json({
                error: 'Este médico ya existe',
                doctor: existing
            });
        }

        // Crear nuevo médico
        const doctor = await Doctor.create({
            name: normalizedName,
            specialty,
            frequency_count: 0
        });

        console.log(`[Doctors] ✅ Nuevo médico creado: ${normalizedName}`);

        res.status(201).json({
            doctor,
            message: 'Médico creado exitosamente'
        });

    } catch (error) {
        console.error('Error creando médico:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Este médico ya existe' });
        }

        res.status(500).json({ error: 'Error al crear médico' });
    }
};

// PUT /api/doctors/:id/increment - Incrementar contador de uso
exports.incrementUsage = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }

        await doctor.update({
            frequency_count: doctor.frequency_count + 1
        });

        res.json({
            success: true,
            frequency_count: doctor.frequency_count
        });

    } catch (error) {
        console.error('Error incrementando uso:', error);
        res.status(500).json({ error: 'Error al actualizar médico' });
    }
};

// DELETE /api/doctors/:id - Desactivar médico (soft delete)
exports.deactivate = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }

        await doctor.update({
            is_active: false
        });

        console.log(`[Doctors] ⚠️ Médico desactivado: ${doctor.name}`);

        res.json({
            success: true,
            message: 'Médico desactivado exitosamente'
        });

    } catch (error) {
        console.error('Error desactivando médico:', error);
        res.status(500).json({ error: 'Error al desactivar médico' });
    }
};

// PUT /api/doctors/:id - Actualizar médico
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, specialty, is_active } = req.body;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = normalizeName(name.trim());
        }
        if (specialty !== undefined) {
            updateData.specialty = specialty;
        }
        if (is_active !== undefined) {
            updateData.is_active = is_active;
        }

        await doctor.update(updateData);

        res.json({
            doctor,
            message: 'Médico actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando médico:', error);
        res.status(500).json({ error: 'Error al actualizar médico' });
    }
};

// GET /api/doctors/:id - Obtener médico por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findByPk(id);

        if (!doctor) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }

        res.json(doctor);

    } catch (error) {
        console.error('Error obteniendo médico:', error);
        res.status(500).json({ error: 'Error al obtener médico' });
    }
};

// Función auxiliar para normalizar nombres
function normalizeName(name) {
    if (!name) return '';

    // Normalizar espacios múltiples
    let normalized = name.replace(/\s+/g, ' ').trim();

    // Capitalizar primera letra de cada palabra
    normalized = normalized.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');

    // Corregir preposiciones en español
    const corrections = {
        ' De ': ' de ',
        ' Del ': ' del ',
        ' La ': ' la ',
        ' Las ': ' las ',
        ' Los ': ' los ',
        ' El ': ' el ',
        ' Y ': ' y '
    };

    for (const [wrong, correct] of Object.entries(corrections)) {
        normalized = normalized.replace(new RegExp(wrong, 'g'), correct);
    }

    return normalized;
}
