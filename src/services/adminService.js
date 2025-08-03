const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Servicio para obtener todos los bloques de tiempo con filtros y paginación
 * @param {Object} filters - Filtros de búsqueda
 * @param {Object} pagination - Configuración de paginación
 * @returns {Object} Bloques de tiempo y metadatos de paginación
 */
const getAllTimeBlocks = async (filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const { date, available } = filters;
    const skip = (page - 1) * limit;

    // Construir filtros de Prisma
    const where = {};
    
    console.log("date: ", date);

    // Filtrar por fecha si se proporciona
    if (date) {
        const filterDate = new Date(date);
        if (isNaN(filterDate.getTime())) {
            throw {
                statusCode: 400,
                error: "Fecha inválida",
                message: "El parámetro date debe ser una fecha válida"
            };
        }
        
        const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
        
        console.log("startOfDay", startOfDay);
        console.log("endOfDay", endOfDay);

        where.startTime = {
            gte: startOfDay,
            lte: endOfDay
        };
    }

    // Filtrar por disponibilidad
    if (available === 'true') {
        where.appointments = {
            none: {}
        };
    } else if (available === 'false') {
        where.appointments = {
            some: {}
        };
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [timeBlocks, total] = await Promise.all([
        prisma.timeBlock.findMany({
            where,
            include: {
                appointments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        appointments: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            },
            skip: parseInt(skip),
            take: parseInt(limit)
        }),
        prisma.timeBlock.count({ where })
    ]);

    return {
        timeBlocks,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Servicio para obtener un bloque de tiempo por ID
 * @param {number} id - ID del bloque de tiempo
 * @returns {Object} Bloque de tiempo con detalles
 */
const getTimeBlockById = async (id) => {
    if (!id || isNaN(parseInt(id))) {
        throw {
            statusCode: 400,
            error: "ID inválido",
            message: "El ID debe ser un número válido"
        };
    }

    const timeBlock = await prisma.timeBlock.findUnique({
        where: { id: parseInt(id) },
        include: {
            appointments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    appointments: true
                }
            }
        }
    });

    if (!timeBlock) {
        throw {
            statusCode: 404,
            error: "Bloque de tiempo no encontrado",
            message: `No existe un bloque de tiempo con ID: ${id}`
        };
    }

    return timeBlock;
};

/**
 * Servicio para crear un nuevo bloque de tiempo
 * @param {Object} timeBlockData - Datos del bloque de tiempo
 * @returns {Object} Bloque de tiempo creado
 */
const createTimeBlock = async (timeBlockData) => {
    const { startTime, endTime } = timeBlockData;

    // Validar datos requeridos
    if (!startTime || !endTime) {
        throw {
            statusCode: 400,
            error: "Datos requeridos",
            message: "startTime y endTime son requeridos"
        };
    }

    // Convertir a objetos Date
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw {
            statusCode: 400,
            error: "Fechas inválidas",
            message: "startTime y endTime deben ser fechas válidas"
        };
    }

    // Validar que endTime sea posterior a startTime
    if (end <= start) {
        throw {
            statusCode: 400,
            error: "Rango de tiempo inválido",
            message: "endTime debe ser posterior a startTime"
        };
    }

    // Verificar que no haya conflictos con bloques existentes
    const conflictingBlock = await findConflictingTimeBlock(start, end);
    
    if (conflictingBlock) {
        throw {
            statusCode: 409,
            error: "Conflicto de horario",
            message: "Ya existe un bloque de tiempo que se superpone con el horario especificado",
            conflictingBlock: {
                id: conflictingBlock.id,
                startTime: conflictingBlock.startTime,
                endTime: conflictingBlock.endTime
            }
        };
    }

    const newTimeBlock = await prisma.timeBlock.create({
        data: {
            startTime: start,
            endTime: end
        },
        include: {
            _count: {
                select: {
                    appointments: true
                }
            }
        }
    });

    return newTimeBlock;
};

/**
 * Servicio para actualizar un bloque de tiempo
 * @param {number} id - ID del bloque de tiempo
 * @param {Object} updateData - Datos a actualizar
 * @returns {Object} Bloque de tiempo actualizado
 */
const updateTimeBlock = async (id, updateData) => {
    const { startTime, endTime } = updateData;

    if (!id || isNaN(parseInt(id))) {
        throw {
            statusCode: 400,
            error: "ID inválido",
            message: "El ID debe ser un número válido"
        };
    }

    // Verificar que el bloque existe
    const existingBlock = await prisma.timeBlock.findUnique({
        where: { id: parseInt(id) },
        include: {
            appointments: true
        }
    });

    if (!existingBlock) {
        throw {
            statusCode: 404,
            error: "Bloque de tiempo no encontrado",
            message: `No existe un bloque de tiempo con ID: ${id}`
        };
    }

    // Verificar si tiene citas asociadas
    if (existingBlock.appointments.length > 0) {
        throw {
            statusCode: 400,
            error: "No se puede modificar",
            message: "No se puede modificar un bloque de tiempo que tiene citas asociadas",
            appointmentsCount: existingBlock.appointments.length
        };
    }

    // Validar y preparar datos de actualización
    const prismaUpdateData = {};
    
    if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
            throw {
                statusCode: 400,
                error: "Fecha inválida",
                message: "startTime debe ser una fecha válida"
            };
        }
        prismaUpdateData.startTime = start;
    }

    if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
            throw {
                statusCode: 400,
                error: "Fecha inválida",
                message: "endTime debe ser una fecha válida"
            };
        }
        prismaUpdateData.endTime = end;
    }

    // Validar rango de tiempo final
    const finalStartTime = prismaUpdateData.startTime || existingBlock.startTime;
    const finalEndTime = prismaUpdateData.endTime || existingBlock.endTime;

    if (finalEndTime <= finalStartTime) {
        throw {
            statusCode: 400,
            error: "Rango de tiempo inválido",
            message: "endTime debe ser posterior a startTime"
        };
    }

    // Verificar conflictos con otros bloques (excluyendo el actual)
    if (prismaUpdateData.startTime || prismaUpdateData.endTime) {
        const conflictingBlock = await findConflictingTimeBlock(
            finalStartTime, 
            finalEndTime, 
            parseInt(id)
        );
        
        if (conflictingBlock) {
            throw {
                statusCode: 409,
                error: "Conflicto de horario",
                message: "La actualización causaría un conflicto con otro bloque de tiempo",
                conflictingBlock: {
                    id: conflictingBlock.id,
                    startTime: conflictingBlock.startTime,
                    endTime: conflictingBlock.endTime
                }
            };
        }
    }

    const updatedTimeBlock = await prisma.timeBlock.update({
        where: { id: parseInt(id) },
        data: prismaUpdateData,
        include: {
            _count: {
                select: {
                    appointments: true
                }
            }
        }
    });

    return updatedTimeBlock;
};

/**
 * Servicio para eliminar un bloque de tiempo
 * @param {number} id - ID del bloque de tiempo
 * @returns {Object} Información del bloque eliminado
 */
const deleteTimeBlock = async (id) => {
    if (!id || isNaN(parseInt(id))) {
        throw {
            statusCode: 400,
            error: "ID inválido",
            message: "El ID debe ser un número válido"
        };
    }

    // Verificar que el bloque existe
    const existingBlock = await prisma.timeBlock.findUnique({
        where: { id: parseInt(id) },
        include: {
            appointments: true
        }
    });

    if (!existingBlock) {
        throw {
            statusCode: 404,
            error: "Bloque de tiempo no encontrado",
            message: `No existe un bloque de tiempo con ID: ${id}`
        };
    }

    // Verificar si tiene citas asociadas
    if (existingBlock.appointments.length > 0) {
        throw {
            statusCode: 400,
            error: "No se puede eliminar",
            message: "No se puede eliminar un bloque de tiempo que tiene citas asociadas",
            appointmentsCount: existingBlock.appointments.length
        };
    }

    await prisma.timeBlock.delete({
        where: { id: parseInt(id) }
    });

    return {
        id: existingBlock.id,
        startTime: existingBlock.startTime,
        endTime: existingBlock.endTime
    };
};

/**
 * Servicio para obtener estadísticas de bloques de tiempo
 * @returns {Object} Estadísticas completas
 */
const getTimeBlockStats = async () => {
    // Ejecutar consultas en paralelo para mejor rendimiento
    const [totalBlocks, occupiedBlocks] = await Promise.all([
        prisma.timeBlock.count(),
        prisma.timeBlock.count({
            where: {
                appointments: {
                    some: {}
                }
            }
        })
    ]);

    const availableBlocks = totalBlocks - occupiedBlocks;

    // Estadísticas para los próximos 7 días
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingBlocks = await prisma.timeBlock.findMany({
        where: {
            startTime: {
                gte: today,
                lte: nextWeek
            }
        },
        include: {
            _count: {
                select: {
                    appointments: true
                }
            }
        },
        orderBy: {
            startTime: 'asc'
        }
    });

    return {
        general: {
            total: totalBlocks,
            occupied: occupiedBlocks,
            available: availableBlocks,
            occupancyRate: totalBlocks > 0 ? ((occupiedBlocks / totalBlocks) * 100).toFixed(1) : 0
        },
        upcomingWeek: {
            totalBlocks: upcomingBlocks.length,
            availableBlocks: upcomingBlocks.filter(block => block._count.appointments === 0).length,
            occupiedBlocks: upcomingBlocks.filter(block => block._count.appointments > 0).length
        }
    };
};

/**
 * Función helper para encontrar bloques de tiempo en conflicto
 * @param {Date} startTime - Hora de inicio
 * @param {Date} endTime - Hora de fin
 * @param {number} excludeId - ID a excluir de la búsqueda (para actualizaciones)
 * @returns {Object|null} Bloque en conflicto o null
 */
const findConflictingTimeBlock = async (startTime, endTime, excludeId = null) => {
    const where = {
        OR: [
            // Caso 1: El nuevo bloque empieza durante un bloque existente
            {
                AND: [
                    { startTime: { lte: startTime } },
                    { endTime: { gt: startTime } }
                ]
            },
            // Caso 2: El nuevo bloque termina durante un bloque existente
            {
                AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gte: endTime } }
                ]
            },
            // Caso 3: El nuevo bloque contiene completamente a un bloque existente
            {
                AND: [
                    { startTime: { gte: startTime } },
                    { endTime: { lte: endTime } }
                ]
            }
        ]
    };

    // Excluir un ID específico (útil para actualizaciones)
    if (excludeId) {
        where.id = {
            not: excludeId
        };
    }

    return await prisma.timeBlock.findFirst({ where });
};

/**
 * Servicio para validar si un bloque de tiempo está disponible
 * @param {number} timeBlockId - ID del bloque de tiempo
 * @returns {boolean} True si está disponible, false si no
 */
const isTimeBlockAvailable = async (timeBlockId) => {
    const timeBlock = await prisma.timeBlock.findUnique({
        where: { id: parseInt(timeBlockId) },
        include: {
            _count: {
                select: {
                    appointments: true
                }
            }
        }
    });

    if (!timeBlock) {
        throw {
            statusCode: 404,
            error: "Bloque de tiempo no encontrado",
            message: `No existe un bloque de tiempo con ID: ${timeBlockId}`
        };
    }

    return timeBlock._count.appointments === 0;
};

/**
 * Servicio para obtener bloques de tiempo disponibles en un rango de fechas
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {Array} Bloques de tiempo disponibles
 */
const getAvailableTimeBlocksInRange = async (startDate, endDate) => {
    if (!startDate || !endDate) {
        throw {
            statusCode: 400,
            error: "Fechas requeridas",
            message: "startDate y endDate son requeridos"
        };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw {
            statusCode: 400,
            error: "Fechas inválidas",
            message: "startDate y endDate deben ser fechas válidas"
        };
    }

    if (end <= start) {
        throw {
            statusCode: 400,
            error: "Rango de fechas inválido",
            message: "endDate debe ser posterior a startDate"
        };
    }

    return await prisma.timeBlock.findMany({
        where: {
            startTime: {
                gte: start,
                lte: end
            },
            appointments: {
                none: {}
            }
        },
        orderBy: {
            startTime: 'asc'
        },
        include: {
            _count: {
                select: {
                    appointments: true
                }
            }
        }
    });
};

module.exports = {
    getAllTimeBlocks,
    getTimeBlockById,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    getTimeBlockStats,
    findConflictingTimeBlock,
    isTimeBlockAvailable,
    getAvailableTimeBlocksInRange
};