const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { validateUserData } = require("../utils/validations");
const { generateToken } = require("../middlewares/auth");

const prisma = new PrismaClient();

/**
 * Servicio para autenticar usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Password del usuario
 * @returns {Object} Resultado de la autenticación
 */
const authenticateUser = async (email, password) => {
    // Validar que se proporcionen email y password
    if (!email || !password) {
        throw {
            statusCode: 400,
            error: "Datos requeridos",
            message: "Email y password son requeridos"
        };
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    // Verificar si el usuario existe
    if (!user) {
        throw {
            statusCode: 401,
            error: "Credenciales inválidas",
            message: "Email o password incorrectos"
        };
    }

    // Verificar password usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw {
            statusCode: 401,
            error: "Credenciales inválidas",
            message: "Email o password incorrectos"
        };
    }

    // Generar token JWT
    const token = generateToken(user);

    // Retornar datos del usuario autenticado
    return {
        token: token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};

/**
 * Servicio para registrar nuevo usuario
 * @param {Object} userData - Datos del usuario a registrar
 * @returns {Object} Usuario registrado con token
 */
const registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    // Validar datos básicos requeridos
    if (!name || !email || !password) {
        throw {
            statusCode: 400,
            error: "Datos requeridos",
            message: "Nombre, email y password son requeridos"
        };
    }

    // Validar longitud mínima de password
    if (password.length < 6) {
        throw {
            statusCode: 400,
            error: "Password inválido",
            message: "El password debe tener al menos 6 caracteres"
        };
    }

    // Validar datos usando las validaciones existentes
    const errors = validateUserData({ name, email });

    // Si hay errores de validación, lanzar error 422
    if (errors.length > 0) {
        throw {
            statusCode: 422,
            error: "Datos mal formateados",
            errores: errors
        };
    }

    // Validar rol (por defecto USER, solo ADMIN puede crear otros ADMIN)
    let userRole = 'USER';
    if (role) {
        if (!['USER', 'ADMIN'].includes(role)) {
            throw {
                statusCode: 400,
                error: "Rol inválido",
                message: "El rol debe ser USER o ADMIN"
            };
        }

        // Solo permitir crear ADMIN si ya eres ADMIN (esto requeriría autenticación)
        // Para registro público, siempre será USER
        if (role === 'ADMIN') {
            throw {
                statusCode: 403,
                error: "Rol no permitido",
                message: "No puedes registrarte como administrador"
            };
        }

        userRole = role;
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
        where: { email: email }
    });

    if (existingUser) {
        throw {
            statusCode: 409,
            error: "Email ya existe",
            message: "Ya existe un usuario registrado con este email",
            field: "email"
        };
    }

    // Hashear el password antes de guardarlo
    const saltRounds = 12; // Número de rondas de salt (más alto = más seguro pero más lento)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario en la base de datos con password hasheado
    const newUser = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: hashedPassword, // Password hasheado con bcrypt
            role: userRole
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
            // No devolver password hasheado
        }
    });

    // Generar token JWT automáticamente para el nuevo usuario
    const token = generateToken(newUser);

    // Retornar usuario creado con token
    return {
        user: newUser,
        token: token
    };
};

/**
 * Servicio para verificar si un email ya existe
 * @param {string} email - Email a verificar
 * @returns {boolean} True si existe, false si no
 */
const emailExists = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email: email }
    });
    return !!user;
};

/**
 * Servicio para obtener usuario por ID
 * @param {number} userId - ID del usuario
 * @returns {Object} Datos del usuario
 */
const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
            // No incluir password
        }
    });

    if (!user) {
        throw {
            statusCode: 404,
            error: "Usuario no encontrado",
            message: "El usuario solicitado no existe"
        };
    }

    return user;
};

/**
 * Servicio para validar password
 * @param {string} password - Password a validar
 * @param {string} hashedPassword - Password hasheado de la base de datos
 * @returns {boolean} True si es válido, false si no
 */
const validatePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Servicio para hashear password
 * @param {string} password - Password a hashear
 * @returns {string} Password hasheado
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

module.exports = {
    authenticateUser,
    registerUser,
    emailExists,
    getUserById,
    validatePassword,
    hashPassword
};