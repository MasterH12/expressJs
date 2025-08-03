# Actualizaciones de Seguridad - Hash de Contraseñas

Se ha implementado el hash de contraseñas usando bcryptjs para mejorar la seguridad de la aplicación.

## 🔒 Cambios Implementados

### 1. **Importación de bcryptjs**
```javascript
const bcrypt = require("bcryptjs");
```

### 2. **Hash en Registro (`/register`)**
```javascript
// Hashear el password antes de guardarlo
const saltRounds = 12; // Número de rondas de salt
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Guardar password hasheado en la base de datos
const newUser = await prisma.user.create({
    data: {
        name: name,
        email: email,
        password: hashedPassword, // Password hasheado
        role: userRole
    }
});
```

### 3. **Verificación en Login (`/login`)**
```javascript
// Verificar password usando bcrypt
const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
    return res.status(401).json({
        error: "Credenciales inválidas",
        message: "Email o password incorrectos"
    });
}
```

### 4. **Hash en Creación por Admin (`/db-users`)**
```javascript
// Validar longitud mínima de password
if (password.length < 6) {
    return res.status(400).json({
        error: "Password inválido",
        message: "El password debe tener al menos 6 caracteres"
    });
}

// Hashear el password
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

## 🛡️ Características de Seguridad

### **Salt Rounds: 12**
- **Más seguro**: 12 rondas proporcionan excelente seguridad
- **Rendimiento**: Balance entre seguridad y velocidad
- **Futuro-proof**: Resistente a ataques de fuerza bruta

### **Validaciones Implementadas**
- **Longitud mínima**: 6 caracteres (en ambos endpoints)
- **Hash automático**: Todos los passwords se hashean antes de guardar
- **Comparación segura**: Uso de `bcrypt.compare()` para verificación

## 🧪 Cómo Probar

### **1. Registrar un nuevo usuario**
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **2. Hacer login con el usuario registrado**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **3. Verificar en la base de datos**
El password en la base de datos debería verse así:
```
$2a$12$XYZ123...hash_muy_largo_y_aleatorio
```

## ⚠️ Importante: Datos Existentes

### **Problema con usuarios existentes**
Los usuarios creados antes de esta actualización tienen passwords en texto plano y **NO podrán hacer login** hasta que se actualicen.

### **Soluciones:**

**Opción 1: Resetear base de datos (Recomendado para desarrollo)**
```bash
npm run db:reset
```

**Opción 2: Script de migración de passwords**
```javascript
// Crear script para hashear passwords existentes
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migratePasswords() {
    const users = await prisma.user.findMany();
    
    for (const user of users) {
        // Solo hashear si el password no está ya hasheado
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            console.log(`Password actualizado para: ${user.email}`);
        }
    }
}
```

**Opción 3: Recrear usuarios manualmente**
```bash
# Eliminar usuario existente y recrearlo
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "password": "password123"
  }'
```

## 🔍 Verificación de Seguridad

### **Antes (INSEGURO)**
```sql
SELECT email, password FROM User;
-- Resultado:
-- juan@example.com | password123
-- maria@example.com | mypassword
```

### **Después (SEGURO)**
```sql
SELECT email, password FROM User;
-- Resultado:
-- juan@example.com | $2a$12$XYZ123...hash_muy_largo
-- maria@example.com | $2a$12$ABC456...otro_hash_largo
```

## 📋 Checklist de Seguridad

- ✅ **bcryptjs instalado** y configurado
- ✅ **Salt rounds: 12** (seguridad alta)
- ✅ **Hash en registro** (`/register`)
- ✅ **Hash en creación admin** (`/db-users`)
- ✅ **Verificación segura** en login (`/login`)
- ✅ **Validación de longitud** mínima (6 caracteres)
- ✅ **No exposición** de passwords en respuestas
- ⚠️ **Migración de datos** existentes pendiente

## 🚀 Próximos Pasos Recomendados

1. **Ejecutar seeding** para tener usuarios con passwords hasheados
2. **Probar login/register** con nuevos usuarios
3. **Implementar reset de password** (opcional)
4. **Agregar validaciones** de complejidad de password (opcional)
5. **Implementar rate limiting** para login (opcional)

## 🔧 Comandos Útiles

```bash
# Instalar dependencias (si no está instalado)
npm install bcryptjs

# Resetear base de datos con nuevos usuarios
npm run db:reset

# Ejecutar seeding con passwords hasheados
node prisma/seeds/seed.js

# Probar la aplicación
npm start
```

La aplicación ahora es **significativamente más segura** con passwords hasheados usando bcryptjs.