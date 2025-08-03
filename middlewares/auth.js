const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clave secreta para JWT (debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

/**
 * Middleware de autenticación JWT
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        // Si no hay token, devolver error 401
        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                message: 'Debes proporcionar un token de autenticación válido'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar el usuario en la base de datos para verificar que aún existe
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        // Si el usuario no existe, el token es inválido
        if (!user) {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El usuario asociado al token no existe'
            });
        }

        // Agregar la información del usuario al objeto request
        req.user = user;
        req.token = token;

        // Continuar con el siguiente middleware
        next();

    } catch (error) {
        // Manejar diferentes tipos de errores JWT
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El token proporcionado no es válido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                message: 'El token ha expirado, por favor inicia sesión nuevamente'
            });
        }

        // Para otros errores, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Middleware para verificar roles específicos
 * @param {string|Array} allowedRoles - Rol o array de roles permitidos
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // Asegurar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado',
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }

        // Convertir a array si es un string
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Verificar si el usuario tiene uno de los roles permitidos
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
                userRole: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            if (user) {
                req.user = user;
                req.token = token;
            }
        }

        // Continuar independientemente de si hay token o no
        next();

    } catch (error) {
        // En autenticación opcional, ignorar errores de token y continuar
        next();
    }
};

/**
 * Función helper para generar tokens JWT
 * @param {Object} user - Objeto usuario
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    // Token expira en 24 horas
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

/**
 * Función helper para verificar tokens
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    authenticateToken,
    requireRole,
    optionalAuth,
    generateToken,
    verifyToken,
    JWT_SECRET
};