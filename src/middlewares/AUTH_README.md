# Sistema de Autenticación JWT

Este sistema proporciona autenticación basada en JWT (JSON Web Tokens) para proteger rutas y controlar acceso basado en roles.

## 🔧 Instalación

```bash
npm install jsonwebtoken
```

## 🔑 Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
JWT_SECRET=tu_clave_secreta_super_segura_y_larga
JWT_EXPIRES_IN=24h
```

## 📋 Middlewares Disponibles

### 1. `authenticateToken`
Middleware que requiere un token JWT válido.

```javascript
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Acceso autorizado', user: req.user });
});
```

### 2. `requireRole(roles)`
Middleware que requiere roles específicos (debe usarse después de `authenticateToken`).

```javascript
// Solo administradores
app.get('/admin', authenticateToken, requireRole('ADMIN'), handler);

// Múltiples roles
app.get('/moderator', authenticateToken, requireRole(['ADMIN', 'MODERATOR']), handler);
```

### 3. `optionalAuth`
Middleware que agrega información del usuario si está autenticado, pero no falla si no lo está.

```javascript
app.get('/public', optionalAuth, (req, res) => {
    if (req.user) {
        res.json({ message: `Hola ${req.user.name}!` });
    } else {
        res.json({ message: 'Hola visitante!' });
    }
});
```

## 🚀 Rutas de Ejemplo Implementadas

### Login
```http
POST /login
Content-Type: application/json

{
  "email": "juan.perez@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "ADMIN"
  }
}
```

### Perfil del Usuario
```http
GET /profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Lista de Usuarios (Autenticado)
```http
GET /db-users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Crear Usuario (Solo Admin)
```http
POST /db-users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Nuevo Usuario",
  "email": "nuevo@example.com",
  "password": "password123",
  "role": "USER"
}
```

### Estadísticas (Solo Admin)
```http
GET /admin/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Información Pública (Autenticación Opcional)
```http
GET /public-info
# Con token (opcional)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔒 Códigos de Error

| Código | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| **401** | No autorizado | Token faltante, inválido o expirado |
| **403** | Acceso denegado | Usuario autenticado pero sin permisos suficientes |

### Ejemplos de Respuestas de Error

**Token faltante (401):**
```json
{
  "error": "Token de acceso requerido",
  "message": "Debes proporcionar un token de autenticación válido"
}
```

**Token expirado (401):**
```json
{
  "error": "Token expirado",
  "message": "El token ha expirado, por favor inicia sesión nuevamente"
}
```

**Rol insuficiente (403):**
```json
{
  "error": "Acceso denegado",
  "message": "Se requiere uno de los siguientes roles: ADMIN",
  "userRole": "USER"
}
```

## 🧪 Cómo Probar

### 1. Hacer Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "password123"
  }'
```

### 2. Usar el Token
```bash
# Guardar el token de la respuesta anterior
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Acceder a ruta protegida
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/profile
```

### 3. Probar Diferentes Roles
```bash
# Como usuario regular (debería fallar)
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:3000/admin/stats

# Como administrador (debería funcionar)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/admin/stats
```

## 🛡️ Consideraciones de Seguridad

### ⚠️ Importante para Producción:

1. **Hashear contraseñas**: Usar bcrypt para hashear contraseñas
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
```

2. **Clave secreta segura**: Usar una clave JWT larga y aleatoria
```env
JWT_SECRET=una_clave_muy_larga_y_aleatoria_de_al_menos_32_caracteres
```

3. **HTTPS**: Usar siempre HTTPS en producción

4. **Expiración de tokens**: Configurar tiempos de expiración apropiados

5. **Refresh tokens**: Implementar refresh tokens para sesiones largas

## 🔧 Funciones Helper

### `generateToken(user)`
Genera un token JWT para un usuario.

```javascript
const { generateToken } = require('./middlewares/auth');
const token = generateToken(user);
```

### `verifyToken(token)`
Verifica y decodifica un token JWT.

```javascript
const { verifyToken } = require('./middlewares/auth');
try {
  const decoded = verifyToken(token);
  console.log(decoded.userId);
} catch (error) {
  console.log('Token inválido');
}
```

## 📝 Estructura del Token

El token JWT contiene:

```json
{
  "userId": 1,
  "email": "juan@example.com",
  "role": "ADMIN",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## 🔄 Flujo de Autenticación

1. **Login**: Usuario envía credenciales → Servidor valida → Devuelve token
2. **Solicitud**: Cliente incluye token en header `Authorization: Bearer <token>`
3. **Validación**: Middleware verifica token → Agrega `req.user` → Continúa
4. **Autorización**: Middleware de roles verifica permisos → Permite/Deniega acceso