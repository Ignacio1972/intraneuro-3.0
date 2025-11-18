// Middleware de Upload para Notas de Audio
// Sistema INTRANEURO - Gestión Hospitalaria
// Fecha: 2025-11-15

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Configuración de storage para multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        // Crear estructura: uploads/audio/YYYY/MM/
        const uploadPath = path.join(
            __dirname,
            '../../../uploads/audio',
            String(year),
            month
        );

        // Crear directorios si no existen
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname) || '.webm';

        const filename = `audio_${timestamp}_${random}${ext}`;
        cb(null, filename);
    }
});

// Validación de archivos
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

    // También aceptar audio genérico para compatibilidad con navegadores
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten archivos de audio.`), false);
    }
};

// Configuración de Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB máximo
        files: 1 // Solo 1 archivo por request
    }
});

// Middleware de validación adicional
const validateAudioUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No se recibió archivo de audio'
        });
    }

    const { admission_id, duration_seconds } = req.body;

    if (!admission_id) {
        // Eliminar archivo subido si falla validación
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            success: false,
            error: 'admission_id es requerido'
        });
    }

    const duration = parseInt(duration_seconds);
    if (!duration || duration <= 0 || duration > 300) {
        // Eliminar archivo subido si falla validación
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            success: false,
            error: 'duration_seconds debe estar entre 1 y 300 segundos'
        });
    }

    // Convertir duration_seconds a número
    req.body.duration_seconds = duration;

    next();
};

// Middleware de manejo de errores de Multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                success: false,
                error: 'El archivo es demasiado grande. Máximo 10MB permitido.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Solo se permite un archivo por solicitud.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Campo de archivo inesperado.'
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
    uploadAudio: upload.single('audio'),
    validateAudioUpload,
    handleMulterError
};