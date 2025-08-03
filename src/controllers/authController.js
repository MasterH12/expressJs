const authService = require("../services/authService");

/**
 * Controlador para login de usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Llamar al servicio de autenticación
        const result = await authService.authenticateUser(email, password);

        // Respuesta exitosa con token
        res.json({
            message: "Login exitoso",
            token: result.token,
            user: result.user
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message,
                ...(error.field && { field: error.field }),
                ...(error.errores && { errores: error.errores })
            });
        }

        // Manejar errores específicos de Prisma
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: "Email ya existe",
                message: "Ya existe un usuario con este email",
                field: "email"
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para registro de usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Llamar al servicio de registro
        const result = await authService.registerUser({
            name,
            email,
            password,
            role
        });

        // Respuesta exitosa con usuario creado y token
        res.status(201).json({
            message: "Usuario registrado exitosamente",
            user: result.user,
            token: result.token
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message,
                ...(error.field && { field: error.field }),
                ...(error.errores && { errores: error.errores })
            });
        }

        // Manejar errores específicos de Prisma
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: "Email ya existe",
                message: "Ya existe un usuario con este email",
                field: "email"
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para obtener perfil del usuario autenticado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getProfile = (req, res) => {
    res.json({
        message: "Perfil del usuario",
        user: req.user
    });
};

module.exports = {
    login,
    register,
    getProfile
};