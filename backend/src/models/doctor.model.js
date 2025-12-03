// Model: Doctor Catalog
// Tabla: doctors
// Catálogo de médicos tratantes para evitar duplicados

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Doctor = sequelize.define('Doctor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: 'Nombre completo del médico'
        },
        specialty: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'Neurología',
            comment: 'Especialidad médica'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Si el médico está activo en el sistema'
        },
        frequency_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Contador de veces asignado como médico tratante'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }
    }, {
        tableName: 'doctors',
        timestamps: false, // Manejamos created_at/updated_at manualmente
        indexes: [
            {
                name: 'idx_doctors_name',
                fields: ['name']
            },
            {
                name: 'idx_doctors_active',
                fields: ['is_active']
            },
            {
                name: 'idx_doctors_frequency',
                fields: ['frequency_count']
            }
        ]
    });

    return Doctor;
};
