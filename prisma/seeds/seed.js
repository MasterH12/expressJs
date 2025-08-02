const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Datos dummy para insertar
const usersData = [
    {
        name: "Juan Pérez",
        email: "juan.perez@example.com",
        password: "password123",
        role: "ADMIN"
    },
    {
        name: "María García",
        email: "maria.garcia@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Carlos López",
        email: "carlos.lopez@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Ana Martínez",
        email: "ana.martinez@example.com",
        password: "password123",
        role: "ADMIN"
    },
    {
        name: "Luis Rodríguez",
        email: "luis.rodriguez@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Carmen Sánchez",
        email: "carmen.sanchez@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Pedro González",
        email: "pedro.gonzalez@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Laura Fernández",
        email: "laura.fernandez@example.com",
        password: "password123",
        role: "ADMIN"
    },
    {
        name: "Miguel Torres",
        email: "miguel.torres@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Isabel Ruiz",
        email: "isabel.ruiz@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Roberto Díaz",
        email: "roberto.diaz@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Patricia Moreno",
        email: "patricia.moreno@example.com",
        password: "password123",
        role: "ADMIN"
    },
    {
        name: "Francisco Jiménez",
        email: "francisco.jimenez@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Elena Álvarez",
        email: "elena.alvarez@example.com",
        password: "password123",
        role: "USER"
    },
    {
        name: "Antonio Romero",
        email: "antonio.romero@example.com",
        password: "password123",
        role: "USER"
    }
];

async function main() {
    console.log('🌱 Iniciando el proceso de seeding...');

    try {
        // Limpiar datos existentes (opcional)
        console.log('🗑️  Limpiando datos existentes...');
        await prisma.user.deleteMany({});
        console.log('✅ Datos existentes eliminados');

        // Insertar usuarios uno por uno para mejor control de errores
        console.log('👥 Insertando usuarios...');
        let insertedCount = 0;

        for (const userData of usersData) {
            try {
                const user = await prisma.user.create({
                    data: userData
                });
                console.log(`✅ Usuario creado: ${user.name} (ID: ${user.id}) - Rol: ${user.role}`);
                insertedCount++;
            } catch (error) {
                console.error(`❌ Error creando usuario ${userData.name}:`, error.message);
            }
        }

        console.log(`\n🎉 Seeding completado!`);
        console.log(`📊 Usuarios insertados: ${insertedCount}/${usersData.length}`);

        // Verificar los datos insertados
        const totalUsers = await prisma.user.count();
        console.log(`📈 Total de usuarios en la base de datos: ${totalUsers}`);

        // Mostrar estadísticas por rol
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        const userCount = await prisma.user.count({ where: { role: 'USER' } });
        console.log(`👑 Administradores: ${adminCount}`);
        console.log(`👤 Usuarios regulares: ${userCount}`);

    } catch (error) {
        console.error('💥 Error durante el seeding:', error);
        throw error;
    }
}

// Ejecutar el script y manejar la desconexión
main()
    .catch((e) => {
        console.error('💥 Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('🔌 Desconectando de la base de datos...');
        await prisma.$disconnect();
        console.log('👋 Proceso completado');
    });