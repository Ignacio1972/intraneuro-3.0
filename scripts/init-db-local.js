// Script para inicializar la base de datos local
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Agregar node_modules del backend al path
const backendPath = path.join(__dirname, '../backend/node_modules');
require('module').Module._nodeModulePaths = function(from) {
    return [backendPath];
};

const { Sequelize } = require(path.join(__dirname, '../backend/node_modules/sequelize'));

async function initDatabase() {
    console.log('🚀 Inicializando base de datos local...');
    console.log('Base de datos:', process.env.DB_NAME);
    console.log('Puerto:', process.env.PORT);
    
    try {
        // Conectar a la BD
        const sequelize = new Sequelize(
            process.env.DB_NAME,
            process.env.DB_USER,
            process.env.DB_PASS,
            {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                dialect: 'postgres',
                logging: false
            }
        );

        // Verificar conexión
        await sequelize.authenticate();
        console.log('✅ Conexión a BD establecida');

        // Cargar modelos
        const models = require('../backend/src/models');
        
        // Sincronizar (crear tablas)
        await sequelize.sync({ force: true });
        console.log('✅ Tablas creadas');

        // Crear usuario de prueba
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('4321', 10);
        
        await models.User.create({
            username: 'sistema',
            password: hashedPassword,
            fullName: 'Usuario Sistema',
            role: 'admin',
            isActive: true
        });
        console.log('✅ Usuario de prueba creado (usuario: sistema, password: 4321)');

        // Crear algunos datos de ejemplo
        const patient = await models.Patient.create({
            name: 'Paciente Prueba',
            rut: '12345678-9',
            birthDate: '1980-01-01',
            phone: '912345678',
            address: 'Dirección de prueba',
            emergencyContact: 'Contacto de emergencia',
            emergencyPhone: '987654321'
        });
        console.log('✅ Paciente de prueba creado');

        // Crear admisión activa
        await models.Admission.create({
            patient_id: patient.id,
            admissionDate: new Date(),
            bed: '101',
            status: 'active',
            diagnosis: 'Diagnóstico de prueba',
            physician: 'Dr. Prueba'
        });
        console.log('✅ Admisión de prueba creada');

        console.log('\n✨ Base de datos inicializada correctamente');
        console.log('Puedes iniciar el servidor con: cd backend && npm start');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

initDatabase();