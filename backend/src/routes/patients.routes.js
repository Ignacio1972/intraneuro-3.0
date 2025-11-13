const router = require('express').Router();
const patientsController = require('../controllers/patients.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Ruta pública para compartir fichas (SIN autenticación)
router.get('/public/:id', patientsController.getPublicPatient);

// Pacientes - SIN el prefijo /patients porque ya está en index.js
// IMPORTANTE: Rutas específicas ANTES que rutas con parámetros
router.get('/active', authMiddleware, patientsController.getActivePatients);
router.get('/archived', authMiddleware, patientsController.getArchivedPatients);
router.get('/search', authMiddleware, patientsController.searchByRut);
router.post('/', authMiddleware, patientsController.createPatient);

// Rutas para acceder por admissionId directamente (para pacientes archivados)
router.get('/admission/:admissionId/observations', authMiddleware, patientsController.getObservationsByAdmission);
router.put('/admission/:admissionId', authMiddleware, patientsController.updateArchivedAdmission);

// Rutas existentes por patientId
router.get('/:id/history', authMiddleware, patientsController.getPatientHistory);
router.get('/:id/admission/observations', authMiddleware, patientsController.getObservations);
router.post('/:id/admission/observations', authMiddleware, patientsController.createObservation);
router.get('/:id/admission/tasks', authMiddleware, patientsController.getAdmissionTasks);
router.post('/:id/admission/tasks', authMiddleware, patientsController.createTask);
router.put('/:id/admission', authMiddleware, patientsController.updateActiveAdmission);
router.put('/:id/discharge', authMiddleware, patientsController.updateDischarge);
router.put('/:id/bed', authMiddleware, patientsController.updateBed);
router.put('/:id/prevision', authMiddleware, patientsController.updatePrevision);
router.put('/:id/admittedBy', authMiddleware, patientsController.updateAdmittedBy);
router.put('/:id/diagnosis-details', authMiddleware, patientsController.updateDiagnosisDetails);
router.put('/:id', authMiddleware, patientsController.updatePatient);
router.delete('/:id', authMiddleware, patientsController.deletePatient);
router.get('/:id', authMiddleware, patientsController.getPatientById); // Esta DEBE ir al final

module.exports = router;