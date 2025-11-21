/**
 * Image Upload Middleware
 * Responsabilidad: Manejo seguro de uploads de imágenes para OCR
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.OCR_UPLOAD_DIR || '/var/www/intraneuro-dev/uploads/ocr-temp';

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `ocr-${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos: solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido. Solo JPEG, PNG o WEBP.'), false);
    }
};

// Configurar multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.OCR_MAX_FILE_SIZE) || 5242880 // 5MB por defecto
    }
});

// Middleware para upload single
const uploadOCRImage = upload.single('image');

// Middleware de limpieza automática de archivos temporales
const cleanupOldFiles = () => {
    const uploadDir = process.env.OCR_UPLOAD_DIR || '/var/www/intraneuro-dev/uploads/ocr-temp';
    const maxAge = 3600000; // 1 hora en milisegundos

    if (!fs.existsSync(uploadDir)) return;

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('[OCR Cleanup] Error leyendo directorio:', err);
            return;
        }

        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(uploadDir, file);

            fs.stat(filePath, (err, stats) => {
                if (err) return;

                const fileAge = now - stats.mtimeMs;

                if (fileAge > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`[OCR Cleanup] Error eliminando ${file}:`, err);
                        } else {
                            console.log(`[OCR Cleanup] Archivo antiguo eliminado: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

// Ejecutar limpieza cada hora
setInterval(cleanupOldFiles, 3600000);

// Limpieza inmediata al iniciar
cleanupOldFiles();

// Middleware para eliminar archivo después de procesar
const cleanupAfterProcessing = (req, res, next) => {
    const originalEnd = res.end;

    res.end = function(...args) {
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error('[OCR] Error eliminando archivo temporal:', err);
                } else {
                    console.log(`[OCR] Archivo temporal eliminado: ${req.file.filename}`);
                }
            });
        }

        originalEnd.apply(this, args);
    };

    next();
};

module.exports = {
    uploadOCRImage,
    cleanupAfterProcessing
};
