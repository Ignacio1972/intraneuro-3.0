// Controller: Diagnosis Catalog
// Gestión del catálogo de diagnósticos

const { Diagnosis } = require('../models');
const { Op } = require('sequelize');

// GET /api/diagnosis - Listar todos los diagnósticos activos
exports.getAll = async (req, res) => {
    try {
        const { limit = 100, active = 'true' } = req.query;

        const diagnoses = await Diagnosis.findAll({
            where: {
                is_active: active === 'true'
            },
            order: [
                ['frequency_count', 'DESC'],
                ['description', 'ASC']
            ],
            limit: parseInt(limit)
        });

        res.json(diagnoses);
    } catch (error) {
        console.error('Error obteniendo diagnósticos:', error);
        res.status(500).json({ error: 'Error al obtener diagnósticos' });
    }
};

// GET /api/diagnosis/search?q=texto - Buscar diagnósticos
exports.search = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = q.trim();

        // Búsqueda con ILIKE (case-insensitive)
        const diagnoses = await Diagnosis.findAll({
            where: {
                description: {
                    [Op.iLike]: `%${searchTerm}%`
                },
                is_active: true
            },
            order: [
                ['frequency_count', 'DESC'],
                ['description', 'ASC']
            ],
            limit: 20
        });

        res.json(diagnoses);
    } catch (error) {
        console.error('Error buscando diagnósticos:', error);
        res.status(500).json({ error: 'Error al buscar diagnósticos' });
    }
};

// POST /api/diagnosis - Crear nuevo diagnóstico
exports.create = async (req, res) => {
    try {
        const { description, category = 'Neurología' } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({ error: 'La descripción es requerida' });
        }

        // Verificar si ya existe (case-insensitive)
        const existing = await Diagnosis.findOne({
            where: {
                description: {
                    [Op.iLike]: description.trim()
                }
            }
        });

        if (existing) {
            // Si ya existe, incrementar frecuencia y devolverlo
            await existing.update({
                frequency_count: existing.frequency_count + 1,
                is_active: true
            });

            return res.json({
                diagnosis: existing,
                message: 'Diagnóstico ya existía, frecuencia incrementada'
            });
        }

        // Crear nuevo diagnóstico
        const diagnosis = await Diagnosis.create({
            description: description.trim(),
            category,
            frequency_count: 1
        });

        // Generar código automático
        await diagnosis.update({
            code: `DIAG${String(diagnosis.id).padStart(4, '0')}`
        });

        res.status(201).json({
            diagnosis,
            message: 'Diagnóstico creado exitosamente'
        });

    } catch (error) {
        console.error('Error creando diagnóstico:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Este diagnóstico ya existe' });
        }

        res.status(500).json({ error: 'Error al crear diagnóstico' });
    }
};

// PUT /api/diagnosis/:id/increment - Incrementar contador de uso
exports.incrementUsage = async (req, res) => {
    try {
        const { id } = req.params;

        const diagnosis = await Diagnosis.findByPk(id);

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnóstico no encontrado' });
        }

        await diagnosis.update({
            frequency_count: diagnosis.frequency_count + 1
        });

        res.json({
            success: true,
            frequency_count: diagnosis.frequency_count
        });

    } catch (error) {
        console.error('Error incrementando uso:', error);
        res.status(500).json({ error: 'Error al actualizar diagnóstico' });
    }
};

// GET /api/diagnosis/:id - Obtener un diagnóstico por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const diagnosis = await Diagnosis.findByPk(id);

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnóstico no encontrado' });
        }

        res.json(diagnosis);

    } catch (error) {
        console.error('Error obteniendo diagnóstico:', error);
        res.status(500).json({ error: 'Error al obtener diagnóstico' });
    }
};

// PUT /api/diagnosis/:id - Actualizar diagnóstico
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, category, is_active } = req.body;

        const diagnosis = await Diagnosis.findByPk(id);

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnóstico no encontrado' });
        }

        await diagnosis.update({
            description: description || diagnosis.description,
            category: category || diagnosis.category,
            is_active: is_active !== undefined ? is_active : diagnosis.is_active
        });

        res.json({
            diagnosis,
            message: 'Diagnóstico actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando diagnóstico:', error);
        res.status(500).json({ error: 'Error al actualizar diagnóstico' });
    }
};
