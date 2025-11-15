// Routes: Diagnosis Catalog
// Rutas para gestión del catálogo de diagnósticos

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Importar funciones del controlador directamente
let diagnosisController;
try {
    diagnosisController = require('../controllers/diagnosis.controller');
    console.log('✅ diagnosisController cargado correctamente');
} catch (error) {
    console.error('❌ Error cargando diagnosisController:', error);
    diagnosisController = {
        search: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        getAll: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        create: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        incrementUsage: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        update: (req, res) => res.status(500).json({ error: 'Controller no disponible' }),
        getById: (req, res) => res.status(500).json({ error: 'Controller no disponible' })
    };
}

// Definir rutas con handlers inline para evitar problemas de referencia
// GET /api/diagnosis/search?q=texto - Buscar diagnósticos
router.get('/search', authMiddleware, (req, res) => {
    return diagnosisController.search(req, res);
});

// GET /api/diagnosis - Listar todos los diagnósticos
router.get('/', authMiddleware, (req, res) => {
    return diagnosisController.getAll(req, res);
});

// POST /api/diagnosis - Crear nuevo diagnóstico
router.post('/', authMiddleware, (req, res) => {
    return diagnosisController.create(req, res);
});

// PUT /api/diagnosis/:id/increment - Incrementar uso
router.put('/:id/increment', authMiddleware, (req, res) => {
    return diagnosisController.incrementUsage(req, res);
});

// PUT /api/diagnosis/:id - Actualizar diagnóstico
router.put('/:id', authMiddleware, (req, res) => {
    return diagnosisController.update(req, res);
});

// GET /api/diagnosis/:id - Obtener diagnóstico por ID
router.get('/:id', authMiddleware, (req, res) => {
    return diagnosisController.getById(req, res);
});

module.exports = router;