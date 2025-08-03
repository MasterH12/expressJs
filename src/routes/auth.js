const { Router } = require("express");
const { login, register, getProfile } = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/auth");

const router = Router();

/**
 * @route POST /auth/login
 * @desc Login de usuario
 * @access Public
 */
router.post("/login", login);

/**
 * @route POST /auth/register
 * @desc Registro de usuario
 * @access Public
 */
router.post("/register", register);

/**
 * @route GET /auth/profile
 * @desc Obtener perfil del usuario autenticado
 * @access Private
 */
router.get("/profile", authenticateToken, getProfile);

module.exports = router;