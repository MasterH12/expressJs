// Validaciones para usuarios

/**
 * Valida los datos de un usuario
 * @param {Object} userData - Datos del usuario a validar
 * @param {string} userData.name - Nombre del usuario
 * @param {string} userData.email - Email del usuario
 * @returns {Array} Array de errores de validación
 */
function validateUserData(userData) {
    const { name, email } = userData;
    const errors = [];

    // Validar name
    if (!name) {
        errors.push("El campo 'name' es requerido");
    } else if (typeof name !== 'string' || name.trim() === '') {
        errors.push("El campo 'name' debe ser una cadena de texto no vacía");
    }

    // Validar email
    if (!email) {
        errors.push("El campo 'email' es requerido");
    } else if (typeof email !== 'string' || !email.includes('@')) {
        errors.push("El campo 'email' debe ser una dirección de correo válida");
    }

    return errors;
}



/**
 * Valida que un ID de URL sea válido
 * @param {string} urlId - ID de la URL como string
 * @returns {Object} Objeto con isValid y parsedId o error
 */
function validateUrlId(urlId) {
    const parsedId = parseInt(urlId);
    
    if (isNaN(parsedId)) {
        return {
            isValid: false,
            error: "El ID en la URL debe ser un número válido"
        };
    }

    return {
        isValid: true,
        parsedId: parsedId
    };
}

module.exports = {
    validateUserData,
    validateUrlId
};