const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Login - MODIFICADO PARA SOLO CLAVE
exports.login = async (req, res) => {
    try {
        // Aceptar tanto { username, password } como { accessCode }
        const { username, password, accessCode } = req.body;
        const finalPassword = password || accessCode;
        const finalUsername = username || 'sistema';
        
        console.log('Login attempt - Username:', finalUsername, 'Password/Code:', finalPassword);
        
        // Validar entrada
        if (!finalPassword) {
            return res.status(400).json({ 
                error: 'Clave de acceso requerida' 
            });
        }
        
        // Buscar el usuario
        const user = await User.findOne({ where: { username: finalUsername } });
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Sistema no configurado. Contacte al administrador.' 
            });
        }
        
        // Comparación temporal directa (sin bcrypt para desarrollo)
        const isValidPassword = (finalPassword === user.password);
        
        if (!isValidPassword) {
            console.log('Password comparison failed. Expected:', user.password, 'Got:', finalPassword);
            return res.status(401).json({ 
                error: 'Clave de acceso incorrecta' 
            });
        }
        
        // Generar token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                full_name: user.full_name,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Verificar token
exports.verifyToken = async (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user 
    });
};
