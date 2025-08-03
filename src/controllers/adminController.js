const adminService = require("../services/adminService");

/**
 * Controlador para obtener todos los bloques de tiempo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const getAllTimeBlocks = async (req, res, next) => {
    try {
        const { page, limit, date, available } = req.query;

        // Preparar filtros y paginación
        const filters = { date, available };
        const pagination = { page, limit };

        // Llamar al servicio
        const result = await adminService.getAllTimeBlocks(filters, pagination);

        res.json({
            message: "Bloques de tiempo obtenidos exitosamente",
            data: result.timeBlocks,
            pagination: result.pagination,
            requestedBy: req.user.name
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message,
                ...(error.conflictingBlock && { conflictingBlock: error.conflictingBlock }),
                ...(error.appointmentsCount && { appointmentsCount: error.appointmentsCount })
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para obtener un bloque de tiempo por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const getTimeBlockById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Llamar al servicio
        const timeBlock = await adminService.getTimeBlockById(id);

        res.json({
            message: "Bloque de tiempo obtenido exitosamente",
            data: timeBlock,
            requestedBy: req.user.name
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para crear un nuevo bloque de tiempo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const createTimeBlock = async (req, res, next) => {
    try {
        const { startTime, endTime } = req.body;

        // Llamar al servicio
        const newTimeBlock = await adminService.createTimeBlock({ startTime, endTime });

        res.status(201).json({
            message: "Bloque de tiempo creado exitosamente",
            data: newTimeBlock,
            createdBy: req.user.name
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message,
                ...(error.conflictingBlock && { conflictingBlock: error.conflictingBlock })
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para actualizar un bloque de tiempo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const updateTimeBlock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startTime, endTime } = req.body;

        // Llamar al servicio
        const updatedTimeBlock = await adminService.updateTimeBlock(id, { startTime, endTime });

        res.json({
            message: "Bloque de tiempo actualizado exitosamente",
            data: updatedTimeBlock,
            updatedBy: req.user.name
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message,
                ...(error.conflictingBlock && { conflictingBlock: error.conflictingBlock }),
                ...(error.appointmentsCount && { appointmentsCount: error.appointmentsCount })
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para eliminar un bloque de tiempo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const deleteTimeBlock = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Llamar al servicio
        const deletedBlock = await adminService.deleteTimeBlock(id);

        res.json({
            message: "Bloque de tiempo eliminado exitosamente",
            deletedBlock: deletedBlock,
            deletedBy: req.user.name
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message,
                ...(error.appointmentsCount && { appointmentsCount: error.appointmentsCount })
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

/**
 * Controlador para obtener estadísticas de bloques de tiempo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const getTimeBlockStats = async (req, res, next) => {
    try {
        // Llamar al servicio
        const stats = await adminService.getTimeBlockStats();

        res.json({
            message: "Estadísticas de bloques de tiempo",
            stats: stats.general,
            upcomingWeek: stats.upcomingWeek,
            accessedBy: req.user.name
        });

    } catch (error) {
        // Si el error tiene statusCode, es un error controlado del servicio
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.error,
                message: error.message
            });
        }

        // Para otros errores inesperados, pasar al error handler
        error.statusCode = 500;
        next(error);
    }
};

module.exports = {
    getAllTimeBlocks,
    getTimeBlockById,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    getTimeBlockStats
};