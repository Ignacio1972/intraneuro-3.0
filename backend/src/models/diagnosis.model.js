// Model: Diagnosis Catalog
// Tabla: diagnosis_catalog

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Diagnosis = sequelize.define('Diagnosis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Código autogenerado DIAGXXXX'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      comment: 'Descripción del diagnóstico'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Neurología',
      comment: 'Categoría del diagnóstico'
    },
    frequency_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Contador de veces que se ha usado'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si el diagnóstico está activo'
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
    tableName: 'diagnosis_catalog',
    timestamps: false, // Manejamos created_at/updated_at manualmente
    indexes: [
      {
        name: 'idx_diagnosis_description',
        fields: ['description']
      },
      {
        name: 'idx_diagnosis_frequency',
        fields: ['frequency_count']
      },
      {
        name: 'idx_diagnosis_active',
        fields: ['is_active']
      }
    ]
  });

  return Diagnosis;
};
