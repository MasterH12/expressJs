const { Router } = require("express");
const {
    getAllTimeBlocks,
    getTimeBlockById,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    getTimeBlockStats
} = require("../controllers/adminController");
const { authenticateToken, requireRole } = require("../middlewares/auth");

const router = Router();

// Aplicar autenticación y verificación de rol ADMIN a todas las rutas
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

/**
 * @route GET /admin/timeblocks
 * @desc Obtener todos los bloques de tiempo con paginación y filtros
 * @access Admin Only
 * @query page - Número de página (default: 1)
 * @query limit - Elementos por página (default: 10)
 * @query date - Filtrar por fecha (YYYY-MM-DD)
 * @query available - Filtrar por disponibilidad (true/false)
 */
router.get("/timeblocks", getAllTimeBlocks);

/**
 * @route GET /admin/timeblocks/stats
 * @desc Obtener estadísticas de bloques de tiempo
 * @access Admin Only
 */
router.get("/timeblocks/stats", getTimeBlockStats);

/**
 * @route GET /admin/timeblocks/:id
 * @desc Obtener un bloque de tiempo específico por ID
 * @access Admin Only
 */
router.get("/timeblocks/:id", getTimeBlockById);

/**
 * @route POST /admin/timeblocks
 * @desc Crear un nuevo bloque de tiempo
 * @access Admin Only
 * @body startTime - Fecha y hora de inicio (ISO string)
 * @body endTime - Fecha y hora de fin (ISO string)
 */
router.post("/timeblocks", createTimeBlock);

/**
 * @route PUT /admin/timeblocks/:id
 * @desc Actualizar un bloque de tiempo existente
 * @access Admin Only
 * @body startTime - Nueva fecha y hora de inicio (opcional)
 * @body endTime - Nueva fecha y hora de fin (opcional)
 */
router.put("/timeblocks/:id", updateTimeBlock);

/**
 * @route DELETE /admin/timeblocks/:id
 * @desc Eliminar un bloque de tiempo
 * @access Admin Only
 * @note Solo se pueden eliminar bloques sin citas asociadas
 */
router.delete("/timeblocks/:id", deleteTimeBlock);

module.exports = router;