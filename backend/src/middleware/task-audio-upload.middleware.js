// Middleware de Upload para Audios de Tareas
// Sistema INTRANEURO - Gestión Hospitalaria

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Configuración de storage para audios de tareas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Crear estructura: uploads/tasks/
        const uploadPath = path.join(
            __dirname,
            '../../../uploads/tasks'
        );

        // Crear directorio si no existe
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname) || '.webm';

        const filename = `task_${timestamp}_${random}${ext}`;
        cb(null, filename);
    }
});

// Validación de archivos de audio
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'audio/webm',
        'audio/wav',
        'audio/mpeg',
        'audio/mp3',
        'audio/mp4',
        'audio/ogg',
        'audio/x-m4a'
    ];

    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten archivos de audio.`), false);
    }
};

// Configuración de Multer para tareas
const uploadTaskAudio = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB máximo
        files: 1
    }
});

// Middleware de validación para audios de tareas
const validateTaskAudioUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No se recibió archivo de audio'
        });
    }

    const { patientId, taskId, duration } = req.body;

    // Validar patientId
    if (!patientId) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            success: false,
            error: 'patientId es requerido'
        });
    }

    // Validar taskId
    if (!taskId) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            success: false,
            error: 'taskId es requerido'
        });
    }

    // Validar duration
    const durationNum = parseInt(duration);
    if (!durationNum || durationNum <= 0 || durationNum > 300) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            success: false,
            error: 'duration debe estar entre 1 y 300 segundos'
        });
    }

    req.body.duration = durationNum;

    next();
};

// Middleware de manejo de errores
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                success: false,
                error: 'El archivo es demasiado grande. Máximo 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Error de carga: ${err.message}`
        });
    } else if (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Error al procesar el archivo'
        });
    }
    next();
};

module.exports = {
    uploadTaskAudio: uploadTaskAudio.single('audio'),
    validateTaskAudioUpload,
    handleMulterError
};
