const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Limpiando datos existentes...');
    try{        
        await prisma.user.deleteMany({});
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