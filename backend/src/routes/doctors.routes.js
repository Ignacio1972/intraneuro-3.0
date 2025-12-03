// Routes: Doctors Catalog
// Rutas para gestión del catálogo de médicos tratantes

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Importar controlador
let doctorsController;
try {
    doctorsController = require('../controllers/doctors.controller');
    console.log('✅ doctorsController cargado correctamente');
} catch (error) {
    console.error('❌ Error cargando doctorsController:', error);
    doctorsController = {
        search: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        getAll: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        create: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        incrementUsage: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        update: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        deactivate: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        getById: (req, res) => res.status(500).json({ error: 'Controller no disponible' })
    };
}

// GET /api/doctors/search?q=texto - Buscar médicos
router.get('/search', authMiddleware, (req, res) => {
    return doctorsController.search(req, res);
});

// GET /api/doctors - Listar todos los médicos
router.get('/', authMiddleware, (req, res) => {
    return doctorsController.getAll(req, res);
});

// POST /api/doctors - Crear nuevo médico
router.post('/', authMiddleware, (req, res) => {
    return doctorsController.create(req, res);
});

// PUT /api/doctors/:id/increment - Incrementar uso
router.put('/:id/increment', authMiddleware, (req, res) => {
    return doctorsController.incrementUsage(req, res);
});

// PUT /api/doctors/:id - Actualizar médico
router.put('/:id', authMiddleware, (req, res) => {
    return doctorsController.update(req, res);
});

// DELETE /api/doctors/:id - Desactivar médico
router.delete('/:id', authMiddleware, (req, res) => {
    return doctorsController.deactivate(req, res);
});

// GET /api/doctors/:id - Obtener médico por ID
router.get('/:id', authMiddleware, (req, res) => {
    return doctorsController.getById(req, res);
});

module.exports = router;
