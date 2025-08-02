const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'requests.log');

/**
 * Middleware de logging para registrar todas las solicitudes HTTP
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 */
const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const startTime = Date.now(); // Tiempo de inicio de la solicitud
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // Capturar el código de estado de la respuesta
    const originalSend = res.send;
    res.send = function (data) {
        const endTime = Date.now(); // Tiempo de finalización
        const responseTime = endTime - startTime; // Tiempo transcurrido en ms
        const statusCode = res.statusCode;

        // Crear el mensaje de log con tiempo de respuesta
        const logMessage = `[${timestamp}] ${method} ${url} - Status: ${statusCode} - ${responseTime}ms - IP: ${ip} - User-Agent: ${userAgent}\n`;

        // Escribir al archivo de log
        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error('Error escribiendo al archivo de log:', err);
            }
        });

        // También mostrar en consola para desarrollo con tiempo de respuesta
        console.log(`${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`);

        // Llamar al método send original
        originalSend.call(this, data);
    };

    next();
};

module.exports = logger;