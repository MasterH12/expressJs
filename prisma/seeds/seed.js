const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos dummy para insertar usuarios
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

// Función para generar bloques de tiempo
const generateTimeBlocks = () => {
    const timeBlocks = [];
    const today = new Date();
    
    // Generar bloques de tiempo para los próximos 30 días
    for (let day = 0; day < 30; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        
        // Generar bloques de tiempo de 9:00 AM a 6:00 PM (cada hora)
        for (let hour = 9; hour < 18; hour++) {
            const startTime = new Date(currentDate);
            startTime.setHours(hour, 0, 0, 0);
            
            const endTime = new Date(currentDate);
            endTime.setHours(hour + 1, 0, 0, 0);
            
            timeBlocks.push({
                startTime: startTime,
                endTime: endTime
            });
        }
    }
    
    return timeBlocks;
};

// Función para generar citas aleatorias
const generateAppointments = (userIds, timeBlockIds) => {
    const appointments = [];
    const appointmentTypes = [
        'Consulta médica', 'Revisión general', 'Seguimiento', 'Consulta especializada',
        'Chequeo preventivo', 'Consulta de urgencia', 'Terapia', 'Evaluación'
    ];
    
    // Generar entre 20-40 citas aleatorias
    const numAppointments = Math.floor(Math.random() * 21) + 20; // 20-40 citas
    
    for (let i = 0; i < numAppointments; i++) {
        // Seleccionar usuario y timeblock aleatorios
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomTimeBlockId = timeBlockIds[Math.floor(Math.random() * timeBlockIds.length)];
        
        // Generar fecha de cita (dentro de los próximos 30 días)
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30));
        
        appointments.push({
            date: appointmentDate,
            userId: randomUserId,
            timeBlockId: randomTimeBlockId
        });
    }
    
    return appointments;
};

async function main() {
    console.log('🌱 Iniciando el proceso de seeding completo...');

    try {
        // Limpiar datos existentes en orden correcto (por las relaciones)
        console.log('🗑️  Limpiando datos existentes...');
        await prisma.appointment.deleteMany({});
        await prisma.timeBlock.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('✅ Datos existentes eliminados');

        // 1. INSERTAR USUARIOS
        console.log('\n👥 Insertando usuarios...');
        let insertedUsers = 0;
        const createdUserIds = [];

        for (const userData of usersData) {
            try {
                // Hashear password antes de insertar
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                
                const user = await prisma.user.create({
                    data: {
                        ...userData,
                        password: hashedPassword
                    }
                });
                
                createdUserIds.push(user.id);
                console.log(`✅ Usuario creado: ${user.name} (ID: ${user.id}) - Rol: ${user.role}`);
                insertedUsers++;
            } catch (error) {
                console.error(`❌ Error creando usuario ${userData.name}:`, error.message);
            }
        }

        // 2. INSERTAR TIME BLOCKS
        console.log('\n⏰ Insertando bloques de tiempo...');
        const timeBlocksData = generateTimeBlocks();
        let insertedTimeBlocks = 0;
        const createdTimeBlockIds = [];

        // Insertar timeblocks en lotes para mejor rendimiento
        const batchSize = 50;
        for (let i = 0; i < timeBlocksData.length; i += batchSize) {
            const batch = timeBlocksData.slice(i, i + batchSize);
            
            try {
                const result = await prisma.timeBlock.createMany({
                    data: batch,
                    skipDuplicates: true
                });
                
                insertedTimeBlocks += result.count;
                console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${result.count} bloques de tiempo insertados`);
            } catch (error) {
                console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
            }
        }

        // Obtener IDs de los timeblocks creados
        const allTimeBlocks = await prisma.timeBlock.findMany({
            select: { id: true }
        });
        allTimeBlocks.forEach(tb => createdTimeBlockIds.push(tb.id));

        // 3. INSERTAR APPOINTMENTS
        console.log('\n📅 Insertando citas...');
        const appointmentsData = generateAppointments(createdUserIds, createdTimeBlockIds);
        let insertedAppointments = 0;

        for (const appointmentData of appointmentsData) {
            try {
                const appointment = await prisma.appointment.create({
                    data: appointmentData,
                    include: {
                        user: { select: { name: true } },
                        timeBlock: { select: { startTime: true, endTime: true } }
                    }
                });
                
                console.log(`✅ Cita creada: ${appointment.user.name} - ${appointment.timeBlock.startTime.toLocaleString()}`);
                insertedAppointments++;
            } catch (error) {
                console.error(`❌ Error creando cita:`, error.message);
            }
        }

        // ESTADÍSTICAS FINALES
        console.log('\n🎉 Seeding completado!');
        console.log('=' .repeat(60));
        
        // Verificar los datos insertados
        const totalUsers = await prisma.user.count();
        const totalTimeBlocks = await prisma.timeBlock.count();
        const totalAppointments = await prisma.appointment.count();
        
        console.log(`📊 RESUMEN DE DATOS INSERTADOS:`);
        console.log(`👥 Usuarios: ${insertedUsers}/${usersData.length} (Total en DB: ${totalUsers})`);
        console.log(`⏰ Bloques de tiempo: ${insertedTimeBlocks} (Total en DB: ${totalTimeBlocks})`);
        console.log(`📅 Citas: ${insertedAppointments} (Total en DB: ${totalAppointments})`);
        
        // Estadísticas por rol
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        const userCount = await prisma.user.count({ where: { role: 'USER' } });
        console.log(`👑 Administradores: ${adminCount}`);
        console.log(`👤 Usuarios regulares: ${userCount}`);
        
        // Estadísticas de citas por usuario
        const appointmentsByUser = await prisma.user.findMany({
            include: {
                _count: {
                    select: { appointments: true }
                }
            },
            orderBy: {
                appointments: {
                    _count: 'desc'
                }
            },
            take: 5
        });
        
        console.log(`\n📈 TOP 5 USUARIOS CON MÁS CITAS:`);
        appointmentsByUser.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}: ${user._count.appointments} citas`);
        });

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