/**
 * Utilidad para listar todas las rutas de la aplicación Express
 */

/**
 * Extrae todas las rutas de una aplicación Express
 * @param {Object} app - Aplicación Express
 * @returns {Array} Array de rutas con método, path y middleware
 */
const listRoutes = (app) => {
    const routes = [];

    // Función recursiva para extraer rutas de los routers
    const extractRoutes = (middleware, basePath = '') => {
        if (middleware.route) {
            // Es una ruta directa
            const methods = Object.keys(middleware.route.methods);
            methods.forEach(method => {
                routes.push({
                    method: method.toUpperCase(),
                    path: basePath + middleware.route.path,
                    middleware: middleware.route.stack.map(layer => layer.name || 'anonymous').join(', ')
                });
            });
        } else if (middleware.name === 'router') {
            // Es un router, extraer rutas recursivamente
            const routerBasePath = basePath + (middleware.regexp.source.match(/\^\\?\/?(.*)\\?\$/) || ['', ''])[1].replace(/\\\//g, '/');

            middleware.handle.stack.forEach(layer => {
                extractRoutes(layer, routerBasePath);
            });
        }
    };

    // Recorrer todos los middlewares de la aplicación
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            // Ruta directa en app
            const methods = Object.keys(middleware.route.methods);
            methods.forEach(method => {
                routes.push({
                    method: method.toUpperCase(),
                    path: middleware.route.path,
                    middleware: middleware.route.stack.map(layer => layer.name || 'anonymous').join(', '),
                    access: getAccessLevel(middleware.route.stack)
                });
            });
        } else if (middleware.name === 'router') {
            // Router montado (como /auth)
            const basePath = getBasePath(middleware.regexp);

            middleware.handle.stack.forEach(layer => {
                if (layer.route) {
                    const methods = Object.keys(layer.route.methods);
                    methods.forEach(method => {
                        routes.push({
                            method: method.toUpperCase(),
                            path: basePath + layer.route.path,
                            middleware: layer.route.stack.map(l => l.name || 'anonymous').join(', '),
                            access: getAccessLevel(layer.route.stack)
                        });
                    });
                }
            });
        }
    });

    return routes.sort((a, b) => a.path.localeCompare(b.path));
};

/**
 * Extrae el path base de un regex de Express
 * @param {RegExp} regexp - Regex del router
 * @returns {string} Path base
 */
const getBasePath = (regexp) => {
    const match = regexp.source.match(/\^\\?\/?(.*)\\?\$/);
    if (match && match[1]) {
        return '/' + match[1].replace(/\\\//g, '/').replace(/\$.*/, '');
    }
    return '';
};

/**
 * Determina el nivel de acceso basado en los middlewares
 * @param {Array} stack - Stack de middlewares
 * @returns {string} Nivel de acceso
 */
const getAccessLevel = (stack) => {
    const middlewareNames = stack.map(layer => layer.name || 'anonymous');

    if (middlewareNames.includes('authenticateToken')) {
        if (middlewareNames.some(name => name.includes('requireRole'))) {
            return 'Admin Only';
        }
        return 'Authenticated';
    } else if (middlewareNames.includes('optionalAuth')) {
        return 'Optional Auth';
    }

    return 'Public';
};

/**
 * Formatea las rutas para mostrar en consola
 * @param {Array} routes - Array de rutas
 * @returns {string} Rutas formateadas
 */
const formatRoutesForConsole = (routes) => {
    let output = '\n📋 RUTAS DISPONIBLES:\n';
    output += '='.repeat(80) + '\n';

    // Agrupar por acceso
    const grouped = routes.reduce((acc, route) => {
        const access = route.access || 'Public';
        if (!acc[access]) acc[access] = [];
        acc[access].push(route);
        return acc;
    }, {});

    Object.keys(grouped).forEach(access => {
        output += `\n🔐 ${access.toUpperCase()}:\n`;
        output += '-'.repeat(40) + '\n';

        grouped[access].forEach(route => {
            const method = route.method.padEnd(6);
            const path = route.path.padEnd(25);
            output += `${method} ${path} ${route.middleware || ''}\n`;
        });
    });

    output += '\n' + '='.repeat(80) + '\n';
    return output;
};

/**
 * Formatea las rutas para respuesta JSON
 * @param {Array} routes - Array de rutas
 * @returns {Object} Rutas agrupadas por acceso
 */
const formatRoutesForJSON = (routes) => {
    const grouped = routes.reduce((acc, route) => {
        const access = route.access || 'Public';
        if (!acc[access]) acc[access] = [];
        acc[access].push({
            method: route.method,
            path: route.path,
            middleware: route.middleware || 'none'
        });
        return acc;
    }, {});

    return {
        message: "Lista de rutas disponibles",
        totalRoutes: routes.length,
        routesByAccess: grouped,
        routes: routes
    };
};

module.exports = {
    listRoutes,
    formatRoutesForConsole,
    formatRoutesForJSON
};