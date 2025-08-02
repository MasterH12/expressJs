const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Configuración del seeding
const CONFIG = {
    // Número de usuarios a generar
    USER_COUNT: process.env.SEED_USER_COUNT ? parseInt(process.env.SEED_USER_COUNT) : 50,
    // Si limpiar datos existentes
    CLEAR_EXISTING: process.env.SEED_CLEAR !== 'false',
    // Idioma para faker (español)
    LOCALE: 'es',
    // Porcentaje de administradores (por defecto 20%)
    ADMIN_PERCENTAGE: process.env.SEED_ADMIN_PERCENTAGE ? parseFloat(process.env.SEED_ADMIN_PERCENTAGE) : 0.2
};

// Configurar faker para español
faker.setLocale(CONFIG.LOCALE);

/**
 * Genera datos de usuario aleatorios usando Faker
 * @param {number} count - Número de usuarios a generar
 * @returns {Array} Array de objetos usuario
 */
function generateUsers(count) {
    const users = [];
    const usedEmails = new Set();
    
    for (let i = 0; i < count; i++) {
        let email;
        let attempts = 0;
        
        // Asegurar emails únicos
        do {
            email = faker.internet.email().toLowerCase();
            attempts++;
            if (attempts > 10) {
                // Si no podemos generar un email único, usar timestamp
                email = `user${Date.now()}${i}@example.com`;
                break;
            }
        } while (usedEmails.has(email));
        
        usedEmails.add(email);
        
        // Generar rol aleatorio basado en el porcentaje configurado
        const role = Math.random() < CONFIG.ADMIN_PERCENTAGE ? 'ADMIN' : 'USER';
        
        users.push({
            name: faker.name.fullName(),
            email: email,
            password: faker.internet.password(12), // Contraseña aleatoria de 12 caracteres
            role: role
        });
    }
    
    return users;
}

/**
 * Función principal de seeding
 */
async function main() {
    console.log('🌱 Iniciando seeding avanzado...');
    console.log(`📋 Configuración:`);
    console.log(`   - Usuarios a crear: ${CONFIG.USER_COUNT}`);
    console.log(`   - Limpiar datos existentes: ${CONFIG.CLEAR_EXISTING}`);
    console.log(`   - Idioma: ${CONFIG.LOCALE}`);
    console.log(`   - Porcentaje de administradores: ${(CONFIG.ADMIN_PERCENTAGE * 100).toFixed(1)}%`);
    
    try {
        // Limpiar datos existentes si está configurado
        if (CONFIG.CLEAR_EXISTING) {
            console.log('\n🗑️  Limpiando datos existentes...');
            const deletedCount = await prisma.user.deleteMany({});
            console.log(`✅ ${deletedCount.count} usuarios eliminados`);
        }

        // Generar datos de usuarios
        console.log('\n🎲 Generando datos aleatorios...');
        const usersData = generateUsers(CONFIG.USER_COUNT);
        console.log(`✅ ${usersData.length} usuarios generados`);

        // Insertar usuarios en lotes para mejor rendimiento
        console.log('\n👥 Insertando usuarios en la base de datos...');
        const batchSize = 10;
        let insertedCount = 0;
        
        for (let i = 0; i < usersData.length; i += batchSize) {
            const batch = usersData.slice(i, i + batchSize);
            
            try {
                const result = await prisma.user.createMany({
                    data: batch,
                    skipDuplicates: true // Saltar duplicados si los hay
                });
                
                insertedCount += result.count;
                console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${result.count} usuarios insertados`);
                
            } catch (error) {
                console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
                
                // Intentar insertar uno por uno en caso de error
                for (const userData of batch) {
                    try {
                        await prisma.user.create({ data: userData });
                        insertedCount++;
                        console.log(`✅ Usuario individual creado: ${userData.name} - ${userData.role}`);
                    } catch (individualError) {
                        console.error(`❌ Error creando ${userData.name}:`, individualError.message);
                    }
                }
            }
        }

        // Estadísticas finales
        console.log(`\n🎉 Seeding completado!`);
        console.log(`📊 Estadísticas:`);
        console.log(`   - Usuarios solicitados: ${CONFIG.USER_COUNT}`);
        console.log(`   - Usuarios insertados: ${insertedCount}`);
        
        const totalUsers = await prisma.user.count();
        console.log(`   - Total en base de datos: ${totalUsers}`);
        
        // Estadísticas por rol
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        const userCount = await prisma.user.count({ where: { role: 'USER' } });
        console.log(`   - Administradores: ${adminCount} (${((adminCount/totalUsers)*100).toFixed(1)}%)`);
        console.log(`   - Usuarios regulares: ${userCount} (${((userCount/totalUsers)*100).toFixed(1)}%)`);
        
        // Mostrar algunos ejemplos
        console.log('\n👀 Ejemplos de usuarios creados:');
        const sampleUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        
        sampleUsers.forEach(user => {
            const roleIcon = user.role === 'ADMIN' ? '👑' : '👤';
            console.log(`   ${roleIcon} ${user.name} (${user.email}) - ${user.role}`);
        });
        
    } catch (error) {
        console.error('💥 Error durante el seeding:', error);
        throw error;
    }
}

// Ejecutar el script
main()
    .catch((e) => {
        console.error('💥 Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('\n🔌 Desconectando de la base de datos...');
        await prisma.$disconnect();
        console.log('👋 Proceso completado');
    });