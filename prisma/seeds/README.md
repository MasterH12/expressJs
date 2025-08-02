# Scripts de Seeding para Base de Datos

Este directorio contiene scripts para poblar la base de datos PostgreSQL con datos de prueba usando Prisma.

## Scripts Disponibles

### 1. `seed.js` - Seeding Básico
Script simple que inserta 15 usuarios predefinidos con datos en español.

**Características:**
- Datos predefinidos y realistas
- Limpia datos existentes antes de insertar
- Manejo de errores individual por usuario
- Feedback detallado en consola

### 2. `advanced-seed.js` - Seeding Avanzado
Script más sofisticado que genera datos aleatorios usando Faker.js.

**Características:**
- Genera datos aleatorios realistas
- Configurable mediante variables de entorno
- Inserción en lotes para mejor rendimiento
- Manejo avanzado de errores
- Estadísticas detalladas

## Cómo Ejecutar los Scripts

### Prerequisitos
1. Asegúrate de tener PostgreSQL corriendo
2. Configura tu `DATABASE_URL` en el archivo `.env`
3. Ejecuta las migraciones de Prisma: `npx prisma migrate dev`

### Opción 1: Usando npm scripts (Recomendado)

```bash
# Seeding básico (15 usuarios predefinidos)
npm run seed

# Seeding avanzado (50 usuarios aleatorios por defecto)
npm run seed:advanced

# Resetear base de datos y hacer seeding básico
npm run db:reset
```

### Opción 2: Ejecutar directamente con Node

```bash
# Seeding básico
node scripts/seed.js

# Seeding avanzado
node scripts/advanced-seed.js
```

### Opción 3: Seeding avanzado con configuración personalizada

```bash
# Generar 100 usuarios sin limpiar datos existentes
SEED_USER_COUNT=100 SEED_CLEAR=false node prisma/seeds/advanced-seed.js

# Generar 25 usuarios con 30% de administradores
SEED_USER_COUNT=25 SEED_ADMIN_PERCENTAGE=0.3 node prisma/seeds/advanced-seed.js

# Generar 50 usuarios, 40% admins, sin limpiar datos existentes
SEED_USER_COUNT=50 SEED_ADMIN_PERCENTAGE=0.4 SEED_CLEAR=false node prisma/seeds/advanced-seed.js
```

## Variables de Entorno para Seeding Avanzado

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `SEED_USER_COUNT` | Número de usuarios a generar | `50` |
| `SEED_CLEAR` | Limpiar datos existentes (`true`/`false`) | `true` |
| `SEED_ADMIN_PERCENTAGE` | Porcentaje de administradores (0.0-1.0) | `0.2` (20%) |

## Ejemplos de Uso

### Desarrollo Local
```bash
# Para desarrollo, usa el seeding básico
npm run seed
```

### Testing
```bash
# Para testing, genera muchos usuarios
SEED_USER_COUNT=200 npm run seed:advanced
```

### Producción (NO recomendado)
```bash
# Solo si necesitas datos de prueba en producción
SEED_CLEAR=false SEED_USER_COUNT=10 npm run seed:advanced
```

## Estructura de Datos Generados

Ambos scripts crean usuarios con la siguiente estructura:

```javascript
{
  id: 1,                           // Auto-generado por PostgreSQL
  name: "Juan Pérez",             // Nombre completo
  email: "juan.perez@example.com", // Email único
  password: "password123",        // Contraseña (básico) o aleatoria (avanzado)
  role: "ADMIN"                   // Rol: ADMIN o USER
}
```

## Solución de Problemas

### Error: "Database connection failed"
- Verifica que PostgreSQL esté corriendo
- Revisa tu `DATABASE_URL` en `.env`
- Ejecuta `npx prisma db push` para sincronizar el esquema

### Error: "Unique constraint violation"
- El script básico limpia datos automáticamente
- Para el avanzado, usa `SEED_CLEAR=true`

### Error: "Module not found: @faker-js/faker"
```bash
# Instala faker para el seeding avanzado
npm install --save-dev @faker-js/faker
```

## Verificar Datos Insertados

Después de ejecutar el seeding, puedes verificar los datos:

```bash
# Usando Prisma Studio (interfaz gráfica)
npx prisma studio

# O consulta tu endpoint
curl http://localhost:3000/db-users
```