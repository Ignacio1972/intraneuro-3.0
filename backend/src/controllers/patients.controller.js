// Importar desde index.js para usar las asociaciones correctas
const { Patient, Admission, Observation, PendingTask, TimelineEvent, sequelize } = require('../models');
const { Op } = require('sequelize');
const { normalizeDoctorName } = require('../utils/normalizeDoctor');

// Obtener paciente público (SIN autenticación) para compartir - CORREGIDO
exports.getPublicPatient = async (req, res) => {
    try {
        const patientId = req.params.id;
        
        // Busqueda simple sin includes complejos
        const patient = await Patient.findOne({
            where: { id: patientId }
        });
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Buscar admisión activa por separado
        const admission = await Admission.findOne({
            where: { 
                patient_id: patientId,
                status: 'active'
            }
        });
        
        let observations = '';
        let pendingTasks = '';
        
        if (admission) {
            // Buscar la última observación
            const lastObservation = await Observation.findOne({
                where: { admission_id: admission.id },
                order: [['created_at', 'DESC']]
            });
            
            if (lastObservation) {
                observations = lastObservation.observation || '';
            }
            
            // Buscar la tarea pendiente más reciente (no todas)
            const lastTask = await PendingTask.findOne({
                where: { 
                    admission_id: admission.id,
                    status: 'pending'
                },
                order: [['created_at', 'DESC']]
            });
            
            if (lastTask) {
                // Solo usar la tarea más reciente, limpiar saltos de línea múltiples
                pendingTasks = lastTask.task
                    .replace(/\n{2,}/g, '. ') // Reemplazar múltiples saltos de línea con punto
                    .replace(/\n/g, '. ') // Reemplazar saltos de línea simples con punto
                    .replace(/\.\s*\./g, '.') // Evitar puntos dobles
                    .trim();
            }
        }
        
        // Formatear respuesta con datos completos
        const publicData = {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            rut: patient.rut,
            prevision: patient.prevision,
            bed: admission?.bed || 'Sin asignar',
            admissionDate: admission?.admission_date,
            diagnosis: admission?.diagnosis_code,
            diagnosisText: admission?.diagnosis_text,
            diagnosisDetails: admission?.diagnosis_details || '',
            admittedBy: admission?.admitted_by,
            status: admission ? 'active' : 'inactive',
            observations: observations,
            pendingTasks: pendingTasks
        };
        
        res.json(publicData);
        
    } catch (error) {
        console.error('Error obteniendo datos completos:', error.message);
        res.status(500).json({ error: 'Error al obtener paciente' });
    }
};

// Obtener tareas pendientes de una admisión
exports.getAdmissionTasks = async (req, res) => {
    try {
        const patientId = req.params.id;
        
        // Buscar la admisión activa del paciente
        const admission = await Admission.findOne({
            where: { 
                patient_id: patientId,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión no encontrada' });
        }
        
        // Obtener tareas de esa admisión
        const tasks = await PendingTask.findAll({
            where: { admission_id: admission.id },
            order: [['created_at', 'ASC']]
        });
        
        res.json(tasks);
        
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error al obtener tareas pendientes' });
    }
};

// Crear nueva tarea
exports.createTask = async (req, res) => {
    try {
        const patientId = req.params.id;
        const { task, created_by } = req.body;
        const author = created_by || req.user?.full_name || 'Sistema';

        // Validar datos - permitir string vacío para borrar
        if (task === null || task === undefined) {
            return res.status(400).json({ error: 'La tarea es requerida' });
        }

        // Buscar admisión activa del paciente
        let admission = await Admission.findOne({
            where: {
                patient_id: patientId,
                status: 'active'
            }
        });

        // Si no existe admisión activa, crear una automáticamente
        if (!admission) {
            console.log(`Creando admisión automática para paciente ${patientId}`);
            admission = await Admission.create({
                patient_id: patientId,
                admission_date: new Date(),
                status: 'active',
                auto_created: true,  // Flag para identificar admisiones auto-creadas
                created_by: author
            });
            console.log(`Admisión creada con ID: ${admission.id}`);
        }

        // Buscar si ya existe una tarea para esta admisión (mantener solo una)
        let existingTask = await PendingTask.findOne({
            where: { admission_id: admission.id },
            order: [['created_at', 'DESC']]
        });

        if (existingTask) {
            // Actualizar la tarea existente
            existingTask.task = task ? task.trim() : '';
            existingTask.created_by = author;
            await existingTask.save();
            res.status(200).json(existingTask);
        } else {
            // Crear nueva tarea solo si no existe
            const newTask = await PendingTask.create({
                admission_id: admission.id,
                task: task ? task.trim() : '',
                created_by: author
            });
            res.status(201).json(newTask);
        }
        
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error al crear tarea pendiente' });
    }
};

// Listar pacientes activos
exports.getActivePatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'active' },
                required: true
            }],
            order: [[{ model: Admission, as: 'admissions' }, 'admission_date', 'DESC']]
        });
        
        // Formatear respuesta para coincidir con frontend
        const formattedPatients = patients.map(p => {
            const admission = p.admissions[0];
            return {
                id: p.id,
                admissionId: admission.id,
                name: p.name,
                age: p.age,
                rut: p.rut,
                prevision: p.prevision,
                bed: admission.bed || 'Sin asignar',
                admissionDate: admission.admission_date,
                diagnosis: admission.diagnosis_code,
                diagnosisText: admission.diagnosis_text,
                diagnosisDetails: admission.diagnosis_details,
                admittedBy: admission.admitted_by,
                status: 'active',
                daysInHospital: calculateDays(admission.admission_date),
                scheduledDischarge: admission.scheduled_discharge,
                service: admission.service || null
            };
        });
        
        res.json(formattedPatients);
    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener detalle de paciente
exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const patient = await Patient.findByPk(id, {
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'active' },
                required: false
            }]
        });
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        res.json(patient);
    } catch (error) {
        console.error('Error obteniendo paciente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Crear paciente con admisión
exports.createPatient = async (req, res) => {
    
    let transaction;
    
    try {
        transaction = await sequelize.transaction();
        
        const {
            name, age = 0, rut = '', prevision = '', bed,
            admissionDate, diagnosis, diagnosisText,
            diagnosisDetails = '', admittedBy = 'Sistema',
            service
        } = req.body;

        console.log('Datos recibidos - Cama:', bed || 'Sin asignar');

        // Buscar si existe paciente con ese RUT
        let patient = null;
        if (rut && rut.trim() !== '') {
            patient = await Patient.findOne({
                where: { rut },
                transaction
            });

            // Si existe, verificar que no tenga admisión activa
            if (patient) {
                const existingActiveAdmission = await Admission.findOne({
                    where: {
                        patient_id: patient.id,
                        status: 'active'
                    },
                    transaction
                });

                if (existingActiveAdmission) {
                    await transaction.rollback();
                    return res.status(400).json({
                        error: 'El paciente ya tiene una admisión activa',
                        message: `El paciente ${patient.name} con RUT ${rut} ya está ingresado`
                    });
                }
            }
        }

        // Si no existe, crear
        if (!patient) {
            const patientData = {
                name: name || 'Sin nombre',
                age: age || 0,
                rut: rut || null,
                prevision: prevision || null
            };

            patient = await Patient.create(patientData, { transaction });
            console.log(`Nuevo paciente creado: ID ${patient.id}, RUT: ${rut}`);
        } else {
            console.log(`Paciente existente encontrado: ID ${patient.id}, RUT: ${rut}`);
        }

        // Crear admisión
        // Usar el texto del diagnóstico para ambos campos
        const diagnosisValue = diagnosis || diagnosisText || 'Evaluación pendiente';
        const admissionData = {
            patient_id: patient.id,
            admission_date: admissionDate || new Date(),
            bed: bed || 'Sin asignar',
            diagnosis_code: diagnosisValue,  // Ahora usa el texto directo
            diagnosis_text: diagnosisValue,  // Mismo valor para consistencia
            diagnosis_details: diagnosisDetails || '',
            admitted_by: normalizeDoctorName(admittedBy) || 'Sistema',
            status: 'active',
            service: service || null
        };
        
        const admission = await Admission.create(admissionData, { transaction });
        
        await transaction.commit();
        
        // Convertir a JSON simple para evitar referencias circulares
        const patientJSON = patient.toJSON();
        const admissionJSON = admission.toJSON();
        
        
        res.status(201).json({
            patient: patientJSON,
            admission: admissionJSON,
            message: 'Paciente ingresado correctamente'
        });
        
    } catch (error) {
        console.error('Error creando paciente:', error.message);
        console.error('Error completo:', error);
        
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
            }
        }
        
        res.status(500).json({ 
            error: error.message || 'Error al crear paciente',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Función auxiliar
function calculateDays(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Buscar por RUT
exports.searchByRut = async (req, res) => {
    try {
        const { rut } = req.query;
        
        const patient = await Patient.findOne({
            where: { rut },
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'discharged' },
                required: false,
                order: [['discharge_date', 'DESC']]
            }]
        });
        
        if (!patient) {
            return res.json({ found: false });
        }
        
        res.json({
            found: true,
            patient,
            previousAdmissions: patient.admissions || []
        });
        
    } catch (error) {
        console.error('Error buscando paciente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar alta programada o procesar egreso completo
exports.updateDischarge = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            scheduledDischarge,
            dischargeDate,
            // ranking, // Campo eliminado del sistema
            dischargeDiagnosis,
            dischargeDetails,
            deceased,
            dischargedBy
        } = req.body;

        console.log('[updateDischarge] Procesando egreso para paciente:', id);
        console.log('[updateDischarge] Datos recibidos:', { dischargeDate, dischargeDiagnosis, dischargeDetails, deceased, dischargedBy });

        // Buscar admisión activa del paciente
        const admission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });

        if (!admission) {
            console.log('[updateDischarge] No se encontró admisión activa para paciente:', id);
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }

        console.log('[updateDischarge] Admisión encontrada:', admission.id, 'Status actual:', admission.status);
        
        // Si solo es actualización de alta programada
        if (scheduledDischarge !== undefined && !dischargeDate) {
            admission.scheduled_discharge = scheduledDischarge;
            await admission.save({ transaction });
        } 
        // Si es egreso completo
        else if (dischargeDate) {
            console.log('[updateDischarge] Procesando egreso completo...');
            admission.discharge_date = dischargeDate;
            admission.discharge_diagnosis = dischargeDiagnosis;
            admission.discharge_details = dischargeDetails;
            // admission.ranking = ranking; // Campo eliminado
            admission.deceased = deceased;
            admission.discharged_by = normalizeDoctorName(dischargedBy) || 'Sistema';
            admission.scheduled_discharge = false;
            admission.status = 'discharged';

            console.log('[updateDischarge] Guardando cambios - Nuevo status:', admission.status);
            await admission.save({ transaction });
            console.log('[updateDischarge] Cambios guardados exitosamente');
        }

        await transaction.commit();
        console.log('[updateDischarge] Transacción confirmada');

        res.json({
            success: true,
            scheduledDischarge: admission.scheduled_discharge,
            status: admission.status
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error actualizando discharge:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar cama de paciente
exports.updateBed = async (req, res) => {
    try {
        const { id } = req.params;
        const { bed } = req.body;

        // Buscar admisión activa
        const admission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });

        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }

        admission.bed = bed || 'Sin asignar';
        await admission.save();

        res.json({
            success: true,
            bed: admission.bed
        });

    } catch (error) {
        console.error('Error actualizando cama:', error);
        res.status(500).json({ error: 'Error al actualizar cama' });
    }
};

// Actualizar servicio del paciente
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service } = req.body;

        // Buscar admisión activa
        const admission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });

        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }

        admission.service = service || null;
        await admission.save();

        res.json({
            success: true,
            service: admission.service
        });

    } catch (error) {
        console.error('Error actualizando servicio:', error);
        res.status(500).json({ error: 'Error al actualizar servicio' });
    }
};

// Actualizar previsión del paciente
exports.updatePrevision = async (req, res) => {
    try {
        const { id } = req.params;
        const { prevision } = req.body;

        console.log(`[updatePrevision] Actualizando previsión para paciente ID: ${id}`);
        console.log(`[updatePrevision] Nueva previsión: "${prevision}"`);

        // Buscar paciente
        const patient = await Patient.findByPk(id);
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Validar que la previsión sea una opción válida o permitir valores personalizados
        const validOptions = [
            'Fonasa',
            'Fonasa A',
            'Fonasa B',
            'Fonasa C',
            'Fonasa D',
            'Isapre Banmédica',
            'Isapre Colmena',
            'Isapre Consalud',
            'Isapre Cruz Blanca',
            'Isapre Nueva Masvida',
            'Isapre Vida Tres',
            'Isapre Esencial',
            'Particular',
            'Sin previsión',
            'Capredena',
            'Dipreca',
            'Otro',
            null,
            ''
        ];

        // Si no está en las opciones válidas pero es un string, aceptarlo como valor personalizado
        // Solo rechazar si es un tipo de dato inválido
        if (prevision && typeof prevision !== 'string') {
            return res.status(400).json({ error: 'Previsión debe ser un texto' });
        }
        
        // Guardar la previsión anterior para comparación
        const previsionAnterior = patient.prevision;

        patient.prevision = prevision || null;
        await patient.save();

        console.log(`[updatePrevision] Previsión anterior: "${previsionAnterior}"`);
        console.log(`[updatePrevision] Previsión guardada: "${patient.prevision}"`);
        console.log(`[updatePrevision] Paciente guardado exitosamente`);

        res.json({
            success: true,
            prevision: patient.prevision,
            message: `Previsión actualizada de "${previsionAnterior}" a "${patient.prevision}"`
        });
        
    } catch (error) {
        console.error('[updatePrevision] Error completo:', error);
        console.error('[updatePrevision] Error mensaje:', error.message);
        console.error('[updatePrevision] Error stack:', error.stack);

        // Enviar más detalles del error en desarrollo
        const errorResponse = {
            error: 'Error al actualizar previsión',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };

        res.status(500).json(errorResponse);
    }
};

// Actualizar médico tratante
exports.updateAdmittedBy = async (req, res) => {
    try {
        const { id } = req.params;
        const { admittedBy } = req.body;
        
        // Buscar admisión activa
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        admission.admitted_by = admittedBy || 'Sin asignar';
        await admission.save();
        
        res.json({ 
            success: true, 
            admittedBy: admission.admitted_by 
        });
        
    } catch (error) {
        console.error('Error actualizando médico tratante:', error);
        res.status(500).json({ error: 'Error al actualizar médico tratante' });
    }
};

// Actualizar descripción del diagnóstico
exports.updateDiagnosisDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosisDetails } = req.body;
        
        // Buscar admisión activa
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        admission.diagnosis_details = diagnosisDetails || '';
        await admission.save();
        
        res.json({ 
            success: true, 
            diagnosisDetails: admission.diagnosis_details 
        });
        
    } catch (error) {
        console.error('Error actualizando descripción del diagnóstico:', error);
        res.status(500).json({ error: 'Error al actualizar descripción' });
    }
};

// Obtener observaciones de una admisión
exports.getObservations = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar admisión activa del paciente
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        const observations = await Observation.findAll({
            where: { admission_id: admission.id },
            order: [['created_at', 'DESC']]
        });
        
        res.json(observations);
    } catch (error) {
        console.error('Error obteniendo observaciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Crear observación
exports.createObservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { observation, created_by } = req.body;

        // Validar datos - permitir string vacío para borrar
        if (observation === null || observation === undefined) {
            return res.status(400).json({ error: 'La observación es requerida' });
        }

        // Buscar admisión activa del paciente
        let admission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });

        // Si no existe admisión activa, crear una automáticamente
        if (!admission) {
            console.log(`Creando admisión automática para paciente ${id}`);
            admission = await Admission.create({
                patient_id: id,
                admission_date: new Date(),
                status: 'active',
                auto_created: true,  // Flag para identificar admisiones auto-creadas
                created_by: created_by || req.user?.full_name || 'Sistema'
            });
            console.log(`Admisión creada con ID: ${admission.id}`);
        }

        // Buscar si ya existe una observación para esta admisión (mantener solo una)
        let existingObservation = await Observation.findOne({
            where: { admission_id: admission.id },
            order: [['created_at', 'DESC']]
        });

        if (existingObservation) {
            // Actualizar la observación existente
            existingObservation.observation = observation ? observation.trim() : '';
            existingObservation.created_by = created_by || req.user?.full_name || 'Sistema';
            await existingObservation.save();
            res.status(200).json(existingObservation);
        } else {
            // Crear nueva observación solo si no existe
            const newObservation = await Observation.create({
                admission_id: admission.id,
                observation: observation ? observation.trim() : '',
                created_by: created_by || req.user?.full_name || 'Sistema'
            });
            res.status(201).json(newObservation);
        }
    } catch (error) {
        console.error('Error creando observación:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener pacientes archivados (dados de alta)
exports.getArchivedPatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'discharged' },
                required: true,
                order: [['discharge_date', 'DESC']]
            }],
            order: [[{ model: Admission, as: 'admissions' }, 'discharge_date', 'DESC']]
        });
        
        // Formatear respuesta para el frontend
        const formattedPatients = patients.map(patient => ({
            id: patient.id,
            name: patient.name,
            age: patient.age,
            rut: patient.rut,
            prevision: patient.prevision,
            admissions: patient.admissions.map(admission => ({
                admissionId: admission.id,
                admissionDate: admission.admission_date,
                dischargeDate: admission.discharge_date,
                diagnosis: admission.diagnosis_code,
                diagnosisText: admission.diagnosis_text,
                diagnosisDetails: admission.diagnosis_details,
                bed: admission.bed,
                admittedBy: admission.admitted_by, // Agregado: médico tratante
                // ranking: admission.ranking, // Campo eliminado
                dischargedBy: admission.discharged_by,
                deceased: admission.deceased
            }))
        }));
        
        res.json(formattedPatients);
    } catch (error) {
        console.error('Error obteniendo pacientes archivados:', error);
        res.status(500).json({ error: 'Error al obtener pacientes archivados' });
    }
};

// Obtener historial completo del paciente
exports.getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const patient = await Patient.findByPk(id, {
            include: [{
                model: Admission,
                as: 'admissions',
                order: [['admission_date', 'DESC']]
            }]
        });
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Formatear respuesta
        const formattedResponse = {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            rut: patient.rut,
    admissions: patient.admissions.map(admission => ({
    admissionId: admission.id,
    admissionDate: admission.admission_date,
    dischargeDate: admission.discharge_date,
    diagnosis: admission.diagnosis_code,
    diagnosisText: admission.diagnosis_text,
    diagnosisDetails: admission.diagnosis_details,
    dischargeDiagnosis: admission.discharge_diagnosis,
    dischargeDetails: admission.discharge_details,
    admittedBy: admission.admitted_by,
    bed: admission.bed,
    // ranking: admission.ranking, // Campo eliminado
    status: admission.status,
    dischargedBy: admission.discharged_by,
    deceased: admission.deceased
}))
        };
        
        res.json(formattedResponse);
    } catch (error) {
        console.error('Error obteniendo historial del paciente:', error);
        res.status(500).json({ error: 'Error al obtener historial del paciente' });
    }
};

// Reingresar paciente
exports.reAdmitPatient = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { readmittedBy } = req.body;
        
        // Verificar que el paciente existe
        const patient = await Patient.findByPk(id);
        if (!patient) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Verificar que no tenga una admisión activa
        const activeAdmission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });
        
        if (activeAdmission) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El paciente ya tiene una admisión activa' });
        }
        
        // Crear nueva admisión
        const newAdmission = await Admission.create({
            patient_id: id,
            admission_date: new Date(),
            bed: 'Sin asignar',
            diagnosis_code: 'Z00.0',
            diagnosis_text: 'Reingreso - Diagnóstico pendiente',
            diagnosis_details: 'Paciente reingresado, evaluación inicial pendiente',
            admitted_by: normalizeDoctorName(readmittedBy || req.user?.full_name) || 'Sistema',
            status: 'active'
        }, { transaction });
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'Paciente reingresado exitosamente',
            admissionId: newAdmission.id
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error reingresando paciente:', error);
        res.status(500).json({ error: 'Error al reingresar paciente' });
    }
};

// Obtener observaciones por admissionId
exports.getObservationsByAdmission = async (req, res) => {
    try {
        const { admissionId } = req.params;
        
        const observations = await Observation.findAll({
            where: { admission_id: admissionId },
            order: [['created_at', 'DESC']]
        });
        
        res.json(observations);
    } catch (error) {
        console.error('Error obteniendo observaciones:', error);
        res.status(500).json({ error: 'Error al obtener observaciones' });
    }
};

// Actualizar datos del paciente
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, rut, age, service } = req.body;

        const patient = await Patient.findByPk(id);

        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Actualizar solo campos enviados del paciente
        if (name !== undefined) patient.name = name;
        if (rut !== undefined) patient.rut = rut;
        if (age !== undefined) patient.age = age;

        await patient.save();

        // Si se envió el campo service, actualizar la admisión activa
        if (service !== undefined) {
            const admission = await Admission.findOne({
                where: {
                    patient_id: id,
                    status: 'active'
                }
            });

            if (admission) {
                admission.service = service;
                await admission.save();
            }
        }
        
        res.json({
            success: true,
            patient
        });
        
    } catch (error) {
        console.error('Error actualizando paciente:', error);
        res.status(500).json({ error: 'Error al actualizar paciente' });
    }
};  // ← ESTA LLAVE FALTABA

// Actualizar admisión activa (fecha de ingreso y diagnóstico)
exports.updateActiveAdmission = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            admission_date,
            diagnosis_code,
            diagnosis_text,
            service,
            admitted_by
        } = req.body;

        // Buscar admisión activa del paciente
        const admission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });

        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }

        // Actualizar solo campos enviados
        if (admission_date !== undefined) admission.admission_date = admission_date;
        if (diagnosis_code !== undefined) admission.diagnosis_code = diagnosis_code;
        if (diagnosis_text !== undefined) admission.diagnosis_text = diagnosis_text;
        if (service !== undefined) admission.service = service;
        if (admitted_by !== undefined) admission.admitted_by = admitted_by;
        
        await admission.save();
        
        res.json({
            success: true,
            admission
        });
        
    } catch (error) {
        console.error('Error actualizando admisión activa:', error);
        res.status(500).json({ error: 'Error al actualizar admisión' });
    }
};

// Actualizar admisión archivada
exports.updateArchivedAdmission = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { 
            admission_date,
            diagnosis_code,
            diagnosis_text,
            admitted_by,
            bed
        } = req.body;
        
        const admission = await Admission.findByPk(admissionId);
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión no encontrada' });
        }
        
        // Actualizar solo campos enviados
        if (admission_date !== undefined) admission.admission_date = admission_date;
        if (diagnosis_code !== undefined) admission.diagnosis_code = diagnosis_code;
        if (diagnosis_text !== undefined) admission.diagnosis_text = diagnosis_text;
        if (admitted_by !== undefined) admission.admitted_by = admitted_by;
        if (bed !== undefined) admission.bed = bed;
        
        await admission.save();
        
        res.json({
            success: true,
            admission
        });
        
    } catch (error) {
        console.error('Error actualizando admisión:', error);
        res.status(500).json({ error: 'Error al actualizar admisión' });
    }
};

// Eliminar paciente completo
// Eliminar paciente completo - VERSIÓN SIMPLE
exports.deletePatient = async (req, res) => {
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        
        // Buscar paciente
        const patient = await Patient.findByPk(id, { transaction });
        if (!patient) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Borrar todo con queries SQL directas para evitar problemas
        await sequelize.query(
            `DELETE FROM observations WHERE admission_id IN (SELECT id FROM admissions WHERE patient_id = :patientId)`,
            { replacements: { patientId: id }, transaction }
        );
        
        await sequelize.query(
            `DELETE FROM pending_tasks WHERE admission_id IN (SELECT id FROM admissions WHERE patient_id = :patientId)`,
            { replacements: { patientId: id }, transaction }
        );
        
        // Intentar borrar timeline_events solo si existe
        try {
            await sequelize.query(
                `DELETE FROM timeline_events WHERE admission_id IN (SELECT id FROM admissions WHERE patient_id = :patientId)`,
                { replacements: { patientId: id }, transaction }
            );
        } catch (e) {
            // Ignorar si no existe
        }
        
        await sequelize.query(
            `DELETE FROM admissions WHERE patient_id = :patientId`,
            { replacements: { patientId: id }, transaction }
        );
        
        await sequelize.query(
            `DELETE FROM patients WHERE id = :patientId`,
            { replacements: { patientId: id }, transaction }
        );
        
        await transaction.commit();
        
        console.log(`✅ Paciente ${id} eliminado correctamente con SQL directo`);
        res.json({ message: 'Paciente eliminado correctamente' });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error eliminando paciente:', error);
        res.status(500).json({ error: 'Error al eliminar paciente' });
    }
};

// ========================================
// NOTAS DE VOZ PARA PACIENTES
// ========================================

/**
 * Obtener notas de voz de un paciente
 * GET /api/patients/:id/voice-notes
 */
exports.getPatientVoiceNotes = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findByPk(id, {
            attributes: ['id', 'name', 'voice_notes']
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        const voiceNotes = patient.voice_notes || [];

        console.log(`[VoiceNotes] Paciente ${id}: ${voiceNotes.length} notas`);

        res.json({
            success: true,
            voiceNotes: voiceNotes
        });

    } catch (error) {
        console.error('[VoiceNotes] Error obteniendo notas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener notas de voz'
        });
    }
};

/**
 * Subir nota de voz de un paciente
 * POST /api/patients/upload-voice-note
 */
exports.uploadPatientVoiceNote = async (req, res) => {
    try {
        const { patientId, duration, createdBy } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió archivo'
            });
        }

        // Buscar paciente
        const patient = await Patient.findByPk(patientId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Construir URL relativa del archivo
        const fileUrl = `/uploads/voice-notes/${file.filename}`;

        // Crear nueva nota de voz
        const newNote = {
            id: `vn_${Date.now()}`,
            url: fileUrl,
            duration: parseInt(duration),
            createdAt: new Date().toISOString(),
            createdBy: createdBy
        };

        // Obtener notas existentes
        const currentNotes = patient.voice_notes || [];

        // Agregar nueva nota al inicio
        const updatedNotes = [newNote, ...currentNotes];

        // Actualizar paciente
        await patient.update({
            voice_notes: updatedNotes
        });

        console.log(`[VoiceNotes] ✓ Audio subido: ${fileUrl} (${duration}s, ${(file.size / 1024).toFixed(2)}KB) - Paciente ${patientId}`);

        res.json({
            success: true,
            note: newNote,
            url: fileUrl,
            filename: file.filename,
            size: file.size,
            duration: duration
        });

    } catch (error) {
        console.error('[VoiceNotes] Error subiendo nota:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar nota de voz'
        });
    }
};

/**
 * Eliminar nota de voz de un paciente
 * DELETE /api/patients/:id/voice-notes/:noteId
 */
exports.deletePatientVoiceNote = async (req, res) => {
    try {
        const { id, noteId } = req.params;

        const patient = await Patient.findByPk(id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        const currentNotes = patient.voice_notes || [];

        // Filtrar para eliminar la nota
        const updatedNotes = currentNotes.filter(note => note.id !== noteId);

        if (currentNotes.length === updatedNotes.length) {
            return res.status(404).json({
                success: false,
                error: 'Nota de voz no encontrada'
            });
        }

        // Actualizar paciente
        await patient.update({
            voice_notes: updatedNotes
        });

        console.log(`[VoiceNotes] ✓ Nota ${noteId} eliminada del paciente ${id}`);

        res.json({
            success: true,
            message: 'Nota de voz eliminada correctamente'
        });

        // TODO: Eliminar archivo físico del servidor si es necesario
        // const fs = require('fs');
        // const path = require('path');
        // const noteToDelete = currentNotes.find(note => note.id === noteId);
        // if (noteToDelete && noteToDelete.url) {
        //     const filePath = path.join(__dirname, '../../..', noteToDelete.url);
        //     fs.unlinkSync(filePath);
        // }

    } catch (error) {
        console.error('[VoiceNotes] Error eliminando nota:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar nota de voz'
        });
    }
};