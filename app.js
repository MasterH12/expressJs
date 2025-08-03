require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fs = require("fs");
const path = require("path");
const usersFile = path.join(__dirname, "users.json");
const { validateUserData, validateUrlId } = require("./utils/validations");

const app = express();

// Importar middlewares
const loggerMiddleware = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const { authenticateToken, requireRole, optionalAuth, generateToken } = require('./middlewares/auth');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar el middleware de logger para todas las rutas
app.use(loggerMiddleware);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send(`
        <h1> Curso de Express.js V3</h1>
        <p> Esto es un server corriendo en el puerto ${PORT} </p>
    `);
});

app.get("/users/:id", (req, res) => {
    const userId = req.params.id;
    res.json({
        id: userId,
        message: `Usuario con ID: ${userId}`
    });
});

app.get("/search", (req, res) => {
    const termino = req.query.termino || "no especificado";
    const categoria = req.query.categoria || "Todas";

    res.json({
        termino: termino,
        categoria: categoria,
        message: `Búsqueda realizada - Término: ${termino}, Categoría: ${categoria}`
    });
});

app.post("/form", (req, res) => {
    const nombre = req.body.nombre || "anonimo";
    const email = req.body.email || "no especificado";

    res.json({
        mensaje: "datos recibidos",
        data: {
            nombre: nombre,
            email: email
        }
    });
});

app.post("/api/data", (req, res) => {
    // Verificar si el objeto está vacío
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: "no se ha recibido informacion"
        });
    }

    // Si hay datos, devolver status 201 con los datos recibidos
    res.status(201).json({
        mensaje: "datos recibidos",
        data: req.body
    });
});

app.get("/users", (req, res) => {
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({
                error: "Error leyendo el archivo de usuarios",
                details: err.message
            });
        }

        try {
            const users = JSON.parse(data);
            res.json(users);
        } catch (parseErr) {
            res.status(500).json({
                error: "Error parseando el archivo JSON",
                details: parseErr.message
            });
        }
    });
});

app.post("/users", (req, res) => {
    const { name, email } = req.body;

    // Usar validaciones externas - POST ya no requiere ID
    const errors = validateUserData({ name, email });

    // Si hay errores de validación, devolver error 422
    if (errors.length > 0) {
        return res.status(422).json({
            error: "Datos mal formateados",
            errores: errors
        });
    }

    // Leer el archivo actual de usuarios
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({
                error: "Error leyendo el archivo de usuarios",
                details: err.message
            });
        }

        try {
            const users = JSON.parse(data);

            // Generar automáticamente el siguiente ID disponible
            const newId = users.length === 0 ? 1 : Math.max(...users.map(user => user.id)) + 1;

            // Crear el nuevo usuario con ID generado automáticamente
            const newUser = { id: newId, name, email };
            users.push(newUser);

            // Escribir el archivo actualizado
            fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    return res.status(500).json({
                        error: "Error escribiendo el archivo de usuarios",
                        details: writeErr.message
                    });
                }

                // Devolver el usuario creado con status 201
                res.status(201).json(newUser);
            });

        } catch (parseErr) {
            res.status(500).json({
                error: "Error parseando el archivo JSON",
                details: parseErr.message
            });
        }
    });
});

app.put("/users/:id", (req, res) => {
    const { name, email } = req.body;

    // Validar que el ID de la URL sea válido usando validaciones externas
    const urlValidation = validateUrlId(req.params.id);
    if (!urlValidation.isValid) {
        return res.status(422).json({
            error: "Datos mal formateados",
            errores: [urlValidation.error]
        });
    }

    const urlId = urlValidation.parsedId;

    // Usar validaciones externas - PUT no requiere ID en el body
    const errors = validateUserData({ name, email });

    // Si hay errores de validación, devolver error 422
    if (errors.length > 0) {
        return res.status(422).json({
            error: "Datos mal formateados",
            errores: errors
        });
    }

    // Leer el archivo actual de usuarios
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({
                error: "Error leyendo el archivo de usuarios",
                details: err.message
            });
        }

        try {
            const users = JSON.parse(data);

            // Buscar el usuario a modificar
            const userIndex = users.findIndex(user => user.id === urlId);
            if (userIndex === -1) {
                return res.status(404).json({
                    error: "Usuario no encontrado",
                    message: `No existe un usuario con ID: ${urlId}`
                });
            }

            // Actualizar el usuario usando el ID de la URL
            const updatedUser = { id: urlId, name, email };
            users[userIndex] = updatedUser;

            // Escribir el archivo actualizado
            fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    return res.status(500).json({
                        error: "Error escribiendo el archivo de usuarios",
                        details: writeErr.message
                    });
                }

                // Devolver el usuario modificado con status 201
                res.status(201).json(updatedUser);
            });

        } catch (parseErr) {
            res.status(500).json({
                error: "Error parseando el archivo JSON",
                details: parseErr.message
            });
        }
    });
});

app.delete("/users/:id", (req, res) => {
    // Validar que el ID de la URL sea válido usando validaciones externas
    const urlValidation = validateUrlId(req.params.id);
    if (!urlValidation.isValid) {
        return res.status(422).json({
            error: "Datos mal formateados",
            errores: [urlValidation.error]
        });
    }

    const urlId = urlValidation.parsedId;

    // Leer el archivo actual de usuarios
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({
                error: "Error leyendo el archivo de usuarios",
                details: err.message
            });
        }

        try {
            const users = JSON.parse(data);

            // Buscar el usuario a eliminar
            const userIndex = users.findIndex(user => user.id === urlId);
            if (userIndex === -1) {
                return res.status(404).json({
                    error: "Usuario no encontrado",
                    message: `No existe un usuario con ID: ${urlId}`
                });
            }

            // Guardar el usuario que se va a eliminar para devolverlo en la respuesta
            const deletedUser = users[userIndex];

            // Eliminar el usuario del array
            users.splice(userIndex, 1);

            // Escribir el archivo actualizado
            fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    return res.status(500).json({
                        error: "Error escribiendo el archivo de usuarios",
                        details: writeErr.message
                    });
                }

                // Devolver el usuario eliminado con status 200
                res.status(200).json({
                    message: "Usuario eliminado exitosamente",
                    deletedUser: deletedUser
                });
            });

        } catch (parseErr) {
            res.status(500).json({
                error: "Error parseando el archivo JSON",
                details: parseErr.message
            });
        }
    });
});

// Ruta de login para obtener token JWT
app.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validar que se proporcionen email y password
        if (!email || !password) {
            return res.status(400).json({
                error: "Datos requeridos",
                message: "Email y password son requeridos"
            });
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        // Verificar si el usuario existe
        if (!user) {
            return res.status(401).json({
                error: "Credenciales inválidas",
                message: "Email o password incorrectos"
            });
        }

        // Verificar password usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Credenciales inválidas",
                message: "Email o password incorrectos"
            });
        }

        // Generar token JWT
        const token = generateToken(user);

        // Respuesta exitosa con token
        res.json({
            message: "Login exitoso",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
});

// Ruta de registro de usuario (público)
app.post("/register", async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Validar datos básicos requeridos
        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Datos requeridos",
                message: "Nombre, email y password son requeridos"
            });
        }

        // Validar longitud mínima de password
        if (password.length < 6) {
            return res.status(400).json({
                error: "Password inválido",
                message: "El password debe tener al menos 6 caracteres"
            });
        }

        // Validar datos usando las validaciones existentes
        const errors = validateUserData({ name, email });

        // Si hay errores de validación, devolver error 422
        if (errors.length > 0) {
            return res.status(422).json({
                error: "Datos mal formateados",
                errores: errors
            });
        }

        // Validar rol (por defecto USER, solo ADMIN puede crear otros ADMIN)
        let userRole = 'USER';
        if (role) {
            if (!['USER', 'ADMIN'].includes(role)) {
                return res.status(400).json({
                    error: "Rol inválido",
                    message: "El rol debe ser USER o ADMIN"
                });
            }

            // Solo permitir crear ADMIN si ya eres ADMIN (esto requeriría autenticación)
            // Para registro público, siempre será USER
            if (role === 'ADMIN') {
                return res.status(403).json({
                    error: "Rol no permitido",
                    message: "No puedes registrarte como administrador"
                });
            }

            userRole = role;
        }

        // Verificar si el email ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Email ya existe",
                message: "Ya existe un usuario registrado con este email",
                field: "email"
            });
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

        // Respuesta exitosa con usuario creado y token
        res.status(201).json({
            message: "Usuario registrado exitosamente",
            user: newUser,
            token: token
        });

    } catch (error) {
        // Manejar errores específicos de Prisma
        if (error.code === 'P2002') {
            // Error de constraint único (email duplicado) - por si acaso
            return res.status(409).json({
                error: "Email ya existe",
                message: "Ya existe un usuario con este email",
                field: "email"
            });
        }

        // Para otros errores, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
});

// Ruta de ejemplo para probar el error handler
app.get("/test-error", (req, res, next) => {
    // Crear un error intencional para probar
    const error = new Error("Este es un error de prueba");
    error.statusCode = 500;
    next(error); // Pasar el error al error handler
});

// Ruta protegida - Solo usuarios autenticados pueden ver la lista de usuarios
app.get("/db-users", authenticateToken, async (req, res, next) => {
    try {
        // Obtener todos los usuarios desde la base de datos usando Prisma
        const users = await prisma.user.findMany({
            orderBy: {
                id: 'asc'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
                // No incluir password por seguridad
            }
        });

        res.json({
            message: "Usuarios obtenidos exitosamente",
            count: users.length,
            data: users,
            requestedBy: req.user.name // Información del usuario que hizo la solicitud
        });
    } catch (error) {
        // Pasar el error al error handler
        error.statusCode = 500;
        next(error);
    }
});

// Ruta protegida - Solo administradores pueden crear usuarios
app.post("/db-users", authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Validar datos básicos
        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Datos requeridos",
                message: "Nombre, email y password son requeridos"
            });
        }

        // Validar datos usando las validaciones existentes
        const errors = validateUserData({ name, email });

        // Si hay errores de validación, devolver error 422
        if (errors.length > 0) {
            return res.status(422).json({
                error: "Datos mal formateados",
                errores: errors
            });
        }

        // Validar rol si se proporciona
        const userRole = role || 'USER';
        if (!['USER', 'ADMIN'].includes(userRole)) {
            return res.status(400).json({
                error: "Rol inválido",
                message: "El rol debe ser USER o ADMIN"
            });
        }

        // Validar longitud mínima de password
        if (password.length < 6) {
            return res.status(400).json({
                error: "Password inválido",
                message: "El password debe tener al menos 6 caracteres"
            });
        }

        // Hashear el password antes de guardarlo
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear el usuario en la base de datos usando Prisma
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

        // Devolver el usuario creado con status 201
        res.status(201).json({
            message: "Usuario creado exitosamente",
            data: newUser,
            createdBy: req.user.name
        });

    } catch (error) {
        // Manejar errores específicos de Prisma
        if (error.code === 'P2002') {
            // Error de constraint único (email duplicado)
            return res.status(409).json({
                error: "Email ya existe",
                message: "Ya existe un usuario con este email",
                field: "email"
            });
        }

        // Para otros errores, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
});

// Ruta para obtener perfil del usuario autenticado
app.get("/profile", authenticateToken, (req, res) => {
    res.json({
        message: "Perfil del usuario",
        user: req.user
    });
});

// Ruta solo para administradores
app.get("/admin/stats", authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const totalUsers = await prisma.user.count();
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        const userCount = await prisma.user.count({ where: { role: 'USER' } });

        res.json({
            message: "Estadísticas del sistema",
            stats: {
                totalUsers,
                adminCount,
                userCount,
                adminPercentage: ((adminCount / totalUsers) * 100).toFixed(1)
            },
            accessedBy: req.user.name
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
});

// Ruta con autenticación opcional
app.get("/public-info", optionalAuth, (req, res) => {
    const response = {
        message: "Información pública",
        data: {
            serverTime: new Date().toISOString(),
            version: "1.0.0"
        }
    };

    // Si el usuario está autenticado, agregar información adicional
    if (req.user) {
        response.personalizedMessage = `Hola ${req.user.name}, bienvenido de vuelta!`;
        response.userRole = req.user.role;
    }

    res.json(response);
});

// Middleware de manejo de errores (debe ir al final, después de todas las rutas)
app.use(errorHandler);

app.listen(PORT, () => {
    console.info("Aplicacion funcionando en puerto ", PORT);
});