// Modelo Sequelize para Notas de Audio
// Sistema INTRANEURO - Gestión Hospitalaria
// Fecha: 2025-11-15

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AudioNote = sequelize.define('AudioNote', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    admission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'admissions',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    // Clasificación médica
    note_type: {
        type: DataTypes.ENUM('clinical', 'nursing', 'therapy', 'general'),
        defaultValue: 'clinical',
        allowNull: false
    },
    confidentiality_level: {
        type: DataTypes.ENUM('normal', 'sensitive', 'restricted'),
        defaultValue: 'normal'
    },
    // Información del archivo
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    original_filename: {
        type: DataTypes.STRING(255)
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 10485760 // 10MB máximo
        }
    },
    mime_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'audio/webm'
    },
    duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 300 // 5 minutos máximo
        }
    },
    // Auditoría médica
    created_by: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    created_by_role: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Transcripción (futuro)
    transcription_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    transcription_status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: true
    },
    // Soft delete
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deleted_by: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Marcadores médicos
    is_important: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requires_followup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    medical_tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: []
    },
    // Metadata adicional para auditoría
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'audio_notes',
    timestamps: true,
    underscored: true,
    paranoid: false, // Usamos soft delete manual
    indexes: [
        {
            fields: ['admission_id'],
            where: { is_deleted: false }
        },
        {
            fields: ['created_at'],
            order: [['created_at', 'DESC']]
        },
        {
            fields: ['note_type'],
            where: { is_deleted: false }
        },
        {
            fields: ['requires_followup'],
            where: { is_deleted: false, requires_followup: true }
        },
        {
            fields: ['is_important'],
            where: { is_deleted: false, is_important: true }
        },
        {
            fields: ['created_by']
        }
    ],
    hooks: {
        // Hook para soft delete
        beforeDestroy: async (instance) => {
            instance.is_deleted = true;
            instance.deleted_at = new Date();
            await instance.save();
            return false; // Previene hard delete
        }
    }
});

// Método de instancia para obtener URL pública
AudioNote.prototype.getPublicUrl = function() {
    // Si el file_path ya es relativo, simplemente agregar / al principio si no lo tiene
    if (this.file_path) {
        // Limpiar cualquier ruta absoluta residual
        let cleanPath = this.file_path;

        // Remover /var/www/intraneuro-dev si existe
        if (cleanPath.startsWith('/var/www/intraneuro-dev/')) {
            cleanPath = cleanPath.replace('/var/www/intraneuro-dev/', '');
        }

        // Asegurarnos de que empiece con /
        if (!cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }

        return cleanPath;
    }

    // Fallback: tratar de construir la URL con año y mes actuales
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `/uploads/audio/${year}/${month}/${this.filename}`;
};

// Método de instancia para formatear duración
AudioNote.prototype.getFormattedDuration = function() {
    const minutes = Math.floor(this.duration_seconds / 60);
    const seconds = this.duration_seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Método para verificar permisos de acceso según nivel de confidencialidad
AudioNote.prototype.canBeAccessedBy = function(user) {
    if (!user) return false;

    if (this.confidentiality_level === 'restricted') {
        // Solo doctores y admins pueden acceder a notas restringidas
        return user.role === 'doctor' || user.role === 'admin';
    }

    if (this.confidentiality_level === 'sensitive') {
        // Personal médico puede acceder a notas sensibles
        return ['doctor', 'nurse', 'admin'].includes(user.role);
    }

    // Notas normales pueden ser accedidas por todo el personal
    return true;
};

// Método para obtener información resumida (sin datos sensibles)
AudioNote.prototype.toSafeJSON = function() {
    return {
        id: this.id,
        url: this.getPublicUrl(),
        duration: this.getFormattedDuration(),
        duration_seconds: this.duration_seconds,
        note_type: this.note_type,
        created_by: this.created_by,
        created_by_role: this.created_by_role,
        created_at: this.created_at,
        is_important: this.is_important,
        requires_followup: this.requires_followup,
        medical_tags: this.medical_tags,
        is_deleted: this.is_deleted,
        deleted_at: this.deleted_at
    };
};

module.exports = AudioNote;