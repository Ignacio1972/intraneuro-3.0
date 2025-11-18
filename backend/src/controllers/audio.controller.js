// Controlador de Notas de Audio
// Sistema INTRANEURO - Gestión Hospitalaria
// Fecha: 2025-11-15

const fs = require('fs').promises;
const path = require('path');
const { AudioNote, Admission } = require('../models');

class AudioController {
    // Crear nueva nota de audio
    async create(req, res) {
        try {
            const { admission_id, duration_seconds, note_type = 'clinical', confidentiality_level = 'normal' } = req.body;
            const file = req.file;
            const user = req.user; // Desde middleware de auth

            // Validar que existe la admisión
            const admission = await Admission.findByPk(admission_id);
            if (!admission) {
                // Eliminar archivo subido si no existe la admisión
                if (file && file.path) {
                    await fs.unlink(file.path).catch(console.error);
                }
                return res.status(404).json({
                    success: false,
                    error: 'Admisión no encontrada'
                });
            }

            // Extraer información del usuario y su rol
            const created_by = user.username || user.name || 'Usuario';
            const created_by_role = user.role || 'staff';

            // Obtener IP y user agent para auditoría
            const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const user_agent = req.headers['user-agent'];

            // Crear registro en BD
            // Guardar la ruta relativa (sin /var/www/intraneuro-dev)
            const relativePath = file.path.replace('/var/www/intraneuro-dev/', '');

            const audioNote = await AudioNote.create({
                admission_id,
                filename: file.filename,
                original_filename: file.originalname,
                file_path: relativePath,  // Usar ruta relativa
                file_size: file.size,
                mime_type: file.mimetype,
                duration_seconds: parseInt(duration_seconds),
                note_type,
                confidentiality_level,
                created_by,
                created_by_role,
                ip_address,
                user_agent
            });

            // Responder con datos del audio creado
            res.status(201).json({
                success: true,
                data: {
                    id: audioNote.id,
                    url: audioNote.getPublicUrl(),
                    duration: audioNote.getFormattedDuration(),
                    duration_seconds: audioNote.duration_seconds,
                    note_type: audioNote.note_type,
                    created_at: audioNote.created_at,
                    created_by: audioNote.created_by,
                    created_by_role: audioNote.created_by_role
                }
            });

        } catch (error) {
            console.error('Error creating audio note:', error);

            // Limpiar archivo si hubo error
            if (req.file && req.file.path) {
                await fs.unlink(req.file.path).catch(console.error);
            }

            res.status(500).json({
                success: false,
                error: 'Error al guardar nota de audio',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Listar audios de una admisión
    async getByAdmission(req, res) {
        try {
            const { admissionId } = req.params;
            const { include_deleted = false, note_type, important_only = false } = req.query;
            const user = req.user;

            // Construir condiciones de búsqueda
            const where = {
                admission_id: admissionId
            };

            // Filtrar por estado de eliminación
            if (!include_deleted || include_deleted === 'false') {
                where.is_deleted = false;
            }

            // Filtrar por tipo de nota
            if (note_type) {
                where.note_type = note_type;
            }

            // Filtrar solo importantes
            if (important_only === 'true') {
                where.is_important = true;
            }

            // Obtener notas de audio
            const audioNotes = await AudioNote.findAll({
                where,
                order: [['created_at', 'DESC']],
                attributes: {
                    exclude: ['file_path', 'ip_address', 'user_agent']
                }
            });

            // Filtrar por permisos de confidencialidad
            const filteredNotes = audioNotes.filter(note => note.canBeAccessedBy(user));

            // Formatear respuesta
            const formatted = filteredNotes.map(note => note.toSafeJSON());

            res.json({
                success: true,
                count: formatted.length,
                data: formatted
            });

        } catch (error) {
            console.error('Error fetching audio notes:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener notas de audio'
            });
        }
    }

    // Obtener una nota de audio específica
    async getById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;

            const audioNote = await AudioNote.findByPk(id);

            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            // Verificar permisos
            if (!audioNote.canBeAccessedBy(user)) {
                return res.status(403).json({
                    success: false,
                    error: 'No tiene permisos para acceder a esta nota'
                });
            }

            res.json({
                success: true,
                data: audioNote.toSafeJSON()
            });

        } catch (error) {
            console.error('Error getting audio note:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener nota de audio'
            });
        }
    }

    // Soft delete
    async softDelete(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;

            const audioNote = await AudioNote.findByPk(id);
            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            // Verificar si ya está eliminada
            if (audioNote.is_deleted) {
                return res.status(400).json({
                    success: false,
                    error: 'La nota ya fue eliminada'
                });
            }

            // Soft delete
            audioNote.is_deleted = true;
            audioNote.deleted_at = new Date();
            audioNote.deleted_by = user.username || user.name;
            await audioNote.save();

            res.json({
                success: true,
                message: 'Nota de audio eliminada correctamente'
            });

        } catch (error) {
            console.error('Error deleting audio note:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar nota de audio'
            });
        }
    }

    // Restaurar nota eliminada
    async restore(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;

            // Solo admins pueden restaurar
            if (user.role !== 'admin' && user.role !== 'doctor') {
                return res.status(403).json({
                    success: false,
                    error: 'No tiene permisos para restaurar notas'
                });
            }

            const audioNote = await AudioNote.findByPk(id);
            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            // Verificar si está eliminada
            if (!audioNote.is_deleted) {
                return res.status(400).json({
                    success: false,
                    error: 'La nota no está eliminada'
                });
            }

            // Restaurar
            audioNote.is_deleted = false;
            audioNote.deleted_at = null;
            audioNote.deleted_by = null;
            await audioNote.save();

            res.json({
                success: true,
                message: 'Nota de audio restaurada correctamente'
            });

        } catch (error) {
            console.error('Error restoring audio note:', error);
            res.status(500).json({
                success: false,
                error: 'Error al restaurar nota de audio'
            });
        }
    }

    // Hard delete (solo para admins, limpieza definitiva)
    async hardDelete(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;

            // Verificar que sea admin
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'No autorizado. Solo administradores pueden eliminar permanentemente.'
                });
            }

            const audioNote = await AudioNote.findByPk(id);
            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            // Eliminar archivo físico
            try {
                // Convertir ruta relativa a absoluta para el filesystem
                const absolutePath = audioNote.file_path.startsWith('/var/www/intraneuro-dev')
                    ? audioNote.file_path
                    : `/var/www/intraneuro-dev${audioNote.file_path.startsWith('/') ? '' : '/'}${audioNote.file_path}`;

                await fs.unlink(absolutePath);
            } catch (err) {
                console.error('Error deleting file:', err);
                // Continuar aunque falle el borrado del archivo
            }

            // Eliminar de BD
            await audioNote.destroy({ force: true });

            res.json({
                success: true,
                message: 'Nota de audio eliminada permanentemente'
            });

        } catch (error) {
            console.error('Error hard deleting audio note:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar permanentemente nota de audio'
            });
        }
    }

    // Marcar como importante
    async toggleImportant(req, res) {
        try {
            const { id } = req.params;

            const audioNote = await AudioNote.findByPk(id);
            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            audioNote.is_important = !audioNote.is_important;
            await audioNote.save();

            res.json({
                success: true,
                data: {
                    id: audioNote.id,
                    is_important: audioNote.is_important
                }
            });

        } catch (error) {
            console.error('Error toggling important:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar nota'
            });
        }
    }

    // Marcar para seguimiento
    async toggleFollowup(req, res) {
        try {
            const { id } = req.params;

            const audioNote = await AudioNote.findByPk(id);
            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            audioNote.requires_followup = !audioNote.requires_followup;
            await audioNote.save();

            res.json({
                success: true,
                data: {
                    id: audioNote.id,
                    requires_followup: audioNote.requires_followup
                }
            });

        } catch (error) {
            console.error('Error toggling followup:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar nota'
            });
        }
    }

    // Actualizar tags médicos
    async updateTags(req, res) {
        try {
            const { id } = req.params;
            const { tags } = req.body;

            if (!Array.isArray(tags)) {
                return res.status(400).json({
                    success: false,
                    error: 'Los tags deben ser un array'
                });
            }

            const audioNote = await AudioNote.findByPk(id);
            if (!audioNote) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota de audio no encontrada'
                });
            }

            audioNote.medical_tags = tags;
            await audioNote.save();

            res.json({
                success: true,
                data: {
                    id: audioNote.id,
                    medical_tags: audioNote.medical_tags
                }
            });

        } catch (error) {
            console.error('Error updating tags:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar tags'
            });
        }
    }

    // Obtener estadísticas
    async getStats(req, res) {
        try {
            const { admissionId } = req.params;

            const stats = await AudioNote.findOne({
                where: {
                    admission_id: admissionId,
                    is_deleted: false
                },
                attributes: [
                    [AudioNote.sequelize.fn('COUNT', AudioNote.sequelize.col('id')), 'total_notes'],
                    [AudioNote.sequelize.fn('SUM', AudioNote.sequelize.col('duration_seconds')), 'total_duration'],
                    [AudioNote.sequelize.fn('COUNT', AudioNote.sequelize.literal(
                        "CASE WHEN is_important = true THEN 1 END"
                    )), 'important_notes'],
                    [AudioNote.sequelize.fn('COUNT', AudioNote.sequelize.literal(
                        "CASE WHEN requires_followup = true THEN 1 END"
                    )), 'followup_required']
                ]
            });

            res.json({
                success: true,
                data: {
                    total_notes: parseInt(stats.dataValues.total_notes) || 0,
                    total_duration_seconds: parseInt(stats.dataValues.total_duration) || 0,
                    important_notes: parseInt(stats.dataValues.important_notes) || 0,
                    followup_required: parseInt(stats.dataValues.followup_required) || 0
                }
            });

        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas'
            });
        }
    }
}

module.exports = new AudioController();