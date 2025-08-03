const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const errorLogPath = path.join(logsDir, 'errors.log');

/**
 * Middleware de manejo de errores para Express
 * @param {Error} err - Objeto de error
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 */
const errorHandler = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Información del error
    const errorName = err.name || 'Error';
    const errorMessage = err.message || 'Error desconocido';
    const errorStack = err.stack || 'No stack trace available';

    // Determinar el código de estado
    let statusCode = err.statusCode || err.status || 500;

    // Función para filtrar datos sensibles
    const filterSensitiveData = (data) => {
        if (!data || typeof data !== 'object') return data;
        
        const dataCopy = { ...data };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'authorization'];
        
        sensitiveFields.forEach(field => {
            if (dataCopy[field]) {
                dataCopy[field] = '[FILTERED]';
            }
        });
        
        return dataCopy;
    };

    // Capturar datos de la solicitud según el método HTTP
    let requestData = '';
    
    switch (method.toUpperCase()) {
        case 'GET':
            // Para GET: capturar query parameters y route parameters
            const queryParams = req.query && Object.keys(req.query).length > 0 
                ? JSON.stringify(filterSensitiveData(req.query), null, 2) 
                : 'No query parameters';
            
            const routeParams = req.params && Object.keys(req.params).length > 0 
                ? JSON.stringify(req.params, null, 2) 
                : 'No route parameters';
            
            requestData = `Query Parameters: ${queryParams}\nRoute Parameters: ${routeParams}`;
            break;
            
        case 'POST':
        case 'PUT':
        case 'PATCH':
            // Para POST/PUT/PATCH: capturar body, query params y route params
            let bodyData = 'No body data';
            if (req.body && Object.keys(req.body).length > 0) {
                try {
                    bodyData = JSON.stringify(filterSensitiveData(req.body), null, 2);
                } catch (bodyErr) {
                    bodyData = 'Error parsing body data';
                }
            }
            
            const postQueryParams = req.query && Object.keys(req.query).length > 0 
                ? JSON.stringify(filterSensitiveData(req.query), null, 2) 
                : 'No query parameters';
            
            const postRouteParams = req.params && Object.keys(req.params).length > 0 
                ? JSON.stringify(req.params, null, 2) 
                : 'No route parameters';
            
            requestData = `Body: ${bodyData}\nQuery Parameters: ${postQueryParams}\nRoute Parameters: ${postRouteParams}`;
            break;
            
        case 'DELETE':
            // Para DELETE: capturar route parameters y query parameters
            const deleteQueryParams = req.query && Object.keys(req.query).length > 0 
                ? JSON.stringify(filterSensitiveData(req.query), null, 2) 
                : 'No query parameters';
            
            const deleteRouteParams = req.params && Object.keys(req.params).length > 0 
                ? JSON.stringify(req.params, null, 2) 
                : 'No route parameters';
            
            requestData = `Query Parameters: ${deleteQueryParams}\nRoute Parameters: ${deleteRouteParams}`;
            break;
            
        default:
            // Para otros métodos: capturar todo lo disponible
            const allQueryParams = req.query && Object.keys(req.query).length > 0 
                ? JSON.stringify(filterSensitiveData(req.query), null, 2) 
                : 'No query parameters';
            
            const allRouteParams = req.params && Object.keys(req.params).length > 0 
                ? JSON.stringify(req.params, null, 2) 
                : 'No route parameters';
            
            let allBodyData = 'No body data';
            if (req.body && Object.keys(req.body).length > 0) {
                try {
                    allBodyData = JSON.stringify(filterSensitiveData(req.body), null, 2);
                } catch (bodyErr) {
                    allBodyData = 'Error parsing body data';
                }
            }
            
            requestData = `Body: ${allBodyData}\nQuery Parameters: ${allQueryParams}\nRoute Parameters: ${allRouteParams}`;
            break;
    }

    // Crear mensaje de log detallado
    const errorLogMessage = `
=== ERROR LOG ===
Timestamp: ${timestamp}
Method: ${method}
URL: ${url}
IP: ${ip}
User-Agent: ${userAgent}
Request Data:
${requestData}
Error Name: ${errorName}
Error Message: ${errorMessage}
Status Code: ${statusCode}
Stack Trace:
${errorStack}
==================
`;

    // Escribir al archivo de log de errores
    fs.appendFile(errorLogPath, errorLogMessage, (logErr) => {
        if (logErr) {
            console.error('Error escribiendo al archivo de log de errores:', logErr);
        }
    });

    // También mostrar en consola para desarrollo
    console.error(`[ERROR] ${method} ${url} - ${statusCode} - ${errorName}: ${errorMessage}`);
    console.error('Stack:', errorStack);

    // Respuesta al cliente basada en el tipo de error
    if (res.headersSent) {
        // Si ya se enviaron headers, delegar al manejador por defecto de Express
        return next(err);
    }

    // Respuesta diferente según el entorno
    const isDevelopment = process.env.NODE_ENV === 'development';

    let errorResponse = {
        error: true,
        message: 'Error interno del servidor',
        timestamp: timestamp,
        path: url
    };

    // En desarrollo, incluir más detalles del error
    if (isDevelopment) {
        errorResponse.details = {
            name: errorName,
            message: errorMessage,
            stack: errorStack
        };
    }

    // Personalizar mensaje según el tipo de error
    switch (statusCode) {
        case 400:
            errorResponse.message = 'Solicitud incorrecta';
            break;
        case 401:
            errorResponse.message = 'No autorizado';
            break;
        case 403:
            errorResponse.message = 'Acceso prohibido';
            break;
        case 404:
            errorResponse.message = 'Recurso no encontrado';
            break;
        case 422:
            errorResponse.message = 'Datos mal formateados';
            break;
        case 500:
        default:
            errorResponse.message = 'Error interno del servidor';
            break;
    }

    // Enviar respuesta de error
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;