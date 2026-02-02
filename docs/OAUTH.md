# OAuth Flow - Tiendanube App Authentication

## Overview

Este documento explica el flujo de autenticación OAuth 2.0 utilizado para conectar tu app con tiendas de Tiendanube/Nuvemshop. El proceso permite que las tiendas autoricen a tu aplicación para acceder a sus datos de forma segura.

## Conceptos Clave

### ¿Qué es OAuth?

OAuth 2.0 es un protocolo de autorización que permite a tu app acceder a recursos de una tienda sin necesitar las credenciales del usuario. En lugar de compartir usuario/contraseña, se genera un `access_token` temporal y revocable.

### Elementos Principales

- **Client ID**: Identificador público de tu app (obtenido del Partner Portal)
- **Client Secret**: Clave secreta de tu app (NUNCA compartir ni exponer)
- **Authorization Code**: Código temporal de un solo uso generado después de que el usuario acepta
- **Access Token**: Token de larga duración usado para hacer llamadas a la API
- **User ID**: Identificador único de la tienda (usado para identificar qué tienda es)

## Flujo Completo OAuth

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario logueado en TIENDA_X abre URL de autorización    │
│    https://www.tiendanube.com/apps/{app_id}/authorize       │
│                                                             │
│    Tiendanube detecta la tienda por la sesión del browser   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Pantalla de Autorización                                 │
│    ┌─────────────────────────────────────────┐              │
│    │ ¿Permitir que "Mi App" acceda a        │               │
│    │ tu tienda "TIENDA_X"?                   │              │
│    │                                         │              │
│    │ Permisos solicitados:                   │              │
│    │ ✓ Leer productos                        │              │
│    │ ✓ Escribir productos                    │              │
│    │                                         │              │
│    │  [Cancelar]  [Autorizar]                │              │
│    └─────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ Usuario hace click en "Autorizar"
┌─────────────────────────────────────────────────────────────┐
│ 3. Tiendanube genera Authorization Code                     │
│    - Code único para TIENDA_X                               │
│    - Válido por pocos minutos                               │
│    - Un solo uso                                            │
│                                                             │
│    Redirect a:                                              │
│    http://localhost:8000/auth/install?code=ABC123XYZ        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Tu API recibe el code (auth.controller.ts:12)            │
│                                                             │
│    GET /auth/install?code=ABC123XYZ                         │
│                                                             │
│    → Llama a InstallAppService.install(code)                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Intercambio de Code por Access Token                     │
│    (install-app.service.ts:18-38)                           │
│                                                             │
│    POST https://www.tiendanube.com/apps/authorize/token     │
│    {                                                        │
│      "client_id": "12345",                                  │
│      "client_secret": "secret_abc",                         │
│      "grant_type": "authorization_code",                    │
│      "code": "ABC123XYZ"                                    │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Tiendanube responde con credenciales                     │
│                                                             │
│    {                                                        │
│      "access_token": "af56c0d9f79f37636927e9f6ec...",       │
│      "token_type": "bearer",                                │
│      "scope": "write_products",                             │
│      "user_id": 2099076  ← Identifica a TIENDA_X            │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Guardar en PostgreSQL (install-app.service.ts:30)        │
│    (CredentialsRepository.save)                             │
│                                                             │
│    INSERT INTO credentials (user_id, access_token, ...)     │
│    VALUES (2099076, 'af56c0d9...', 'bearer', ...)           │
│    ON CONFLICT (user_id)                                    │
│    DO UPDATE SET access_token = ..., updated_at = NOW()     │
│                                                             │
│    → user_id es UNIQUE, si la tienda reinstala la app,      │
│      se actualiza el token (no duplica)                     │
└─────────────────────────────────────────────────────────────┘
```

## Identificación de Tiendas

### ¿Cómo se vincula con cada tienda?

Cada tienda tiene un **`user_id` único** que Tiendanube asigna. Este ID es la clave para identificar a qué tienda pertenece cada access token.

**Tabla `credentials` en PostgreSQL:**

```sql
CREATE TABLE credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,  -- ← Identifica la tienda
  access_token TEXT NOT NULL,        -- ← Token para API calls
  token_type VARCHAR(50) DEFAULT 'bearer',
  scope TEXT,                        -- ← Permisos otorgados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Ejemplo con múltiples tiendas:**

```sql
SELECT user_id, left(access_token, 20) as token_preview, scope FROM credentials;

-- Resultado:
-- user_id | token_preview        | scope
-- 2099076 | af56c0d9f79f37636... | write_products  ← TIENDA_A
-- 2099077 | b1a23f8c42d8e9f6a... | write_products  ← TIENDA_B
-- 2099078 | c7f45b2a19c3d4e8f... | read_products   ← TIENDA_C
```

### Flujo con Múltiples Tiendas

Cada tienda inicia su propio flujo OAuth independiente:

1. **TIENDA_A** → Usuario loguead en tienda A → Autoriza → `user_id: 2099076`
2. **TIENDA_B** → Usuario loguead en tienda B → Autoriza → `user_id: 2099077`
3. Cada tienda tiene su propio `access_token` en la DB

## Configuración Paso a Paso

### 1. Pre-requisitos

- Cuenta en Partner Portal de Tiendanube
- App creada en Partner Portal
- Tienda de prueba con Developer Mode activado

### 2. Configurar Variables de Entorno

**Archivo: `api/.env`**

```bash
# Puerto de la API
PORT=8000

# URLs de Tiendanube (según región)
# LATAM:
TIENDANUBE_AUTENTICATION_URL=https://www.tiendanube.com/apps/authorize/token
TIENDANUBE_API_URL=https://api.tiendanube.com/v1

# Brasil:
# TIENDANUBE_AUTENTICATION_URL=https://www.nuvemshop.com.br/apps/authorize/token
# TIENDANUBE_API_URL=https://api.nuvemshop.com.br/v1

# Credenciales de tu app (Partner Portal)
CLIENT_SECRET=tu_client_secret_aqui
CLIENT_ID=tu_app_id_aqui
CLIENT_EMAIL=tu_email_del_portal

# IMPORTANTE: En Developer Mode SIEMPRE usa "THE_SECRET"
SECRET_KEY=THE_SECRET

# PostgreSQL
DATABASE_URL=postgresql://tiendanube:dev_password@localhost:5432/tiendanube_ai
```

### 3. Configurar Redirect URL en Partner Portal

1. Accede al Partner Portal
2. Ve a tu app → Editar → Basic Data
3. En "Redirect URL after installation" pon:
   ```
   http://localhost:8000/auth/install
   ```
4. Guarda cambios

### 4. Activar Developer Mode

En tu tienda de prueba:
1. Admin → Apps → Developer Mode
2. Activar

Esto permite que tu app local (HTTP, no HTTPS) funcione correctamente.

### 5. Iniciar la API

```bash
cd api/
yarn start:api
```

La API debe estar corriendo en `http://localhost:8000`

### 6. Instalar la App

**Método Manual (Desarrollo):**

Abre en tu browser (loguead en la tienda de prueba):
```
https://www.tiendanube.com/apps/{TU_APP_ID}/authorize?state=csrf-code
```

**Método Normal (Producción):**
- Los usuarios van al App Store de Tiendanube
- Buscan tu app
- Click "Instalar"

### 7. Verificar Instalación

**Revisar en PostgreSQL:**

```bash
# Conectarse a la DB
docker exec -it tiendanube-postgres psql -U tiendanube -d tiendanube_ai

# Ver credenciales guardadas
SELECT user_id, left(access_token, 20), scope, created_at FROM credentials;
```

**Debería mostrar:**
```
 user_id |         left         |     scope      |         created_at
---------+----------------------+----------------+----------------------------
 2099076 | af56c0d9f79f3763692 | write_products | 2026-01-28 10:30:45.123456
```

## Estructura de la Base de Datos

### Schema Completo (migrations/001_initial_schema.sql)

```sql
-- Credenciales OAuth (una fila por tienda)
CREATE TABLE credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,    -- Identificador de la tienda
  access_token TEXT NOT NULL,         -- Token de acceso
  token_type VARCHAR(50) DEFAULT 'bearer',
  scope TEXT,                          -- Permisos (ej: write_products)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cache local de productos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  store_user_id INTEGER NOT NULL,     -- FK a credentials.user_id
  product_id VARCHAR(100) NOT NULL,   -- ID del producto en Tiendanube
  name_en TEXT,
  name_pt TEXT,
  name_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  description_es TEXT,
  price DECIMAL(10,2),
  images JSONB,
  raw_data JSONB,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_user_id, product_id)
);
```

## Usando el Access Token

Una vez obtenido el `access_token`, se usa en todas las llamadas a la API de Tiendanube.

**Ejemplo:**

```typescript
import axios from 'axios';

// Obtener credenciales de la DB
const credentials = await CredentialsRepository.findOne(user_id);

// Hacer llamada a la API
const response = await axios.get(
  `https://api.tiendanube.com/v1/${credentials.user_id}/products`,
  {
    headers: {
      'Authentication': `bearer ${credentials.access_token}`,
      'User-Agent': 'Mi App (tu_email@example.com)',
      'Content-Type': 'application/json'
    }
  }
);
```

## Developer Mode vs Production

### Developer Mode (Desarrollo Local)

- Permite HTTP (no requiere HTTPS)
- `SECRET_KEY=THE_SECRET` (valor fijo)
- App solo visible para el owner de la tienda
- Se instala desde URL manual

### Production Mode

- Requiere HTTPS obligatorio
- `SECRET_KEY={CLIENT_SECRET}` (mismo valor que CLIENT_SECRET)
- App visible en App Store público
- Usuarios instalan desde App Store
- Requiere implementar autenticación adicional en tu backend

## Seguridad

### Best Practices

1. **NUNCA** commitear `.env` al repositorio
2. **NUNCA** exponer `CLIENT_SECRET` en el frontend
3. Validar siempre el `state` parameter para prevenir CSRF
4. Usar HTTPS en producción
5. Rotar tokens periódicamente
6. Almacenar tokens encriptados en producción
7. Validar scopes antes de hacer operaciones

### Variables Sensibles

```bash
# ❌ NUNCA exponer
CLIENT_SECRET=xxx
ACCESS_TOKEN=xxx

# ✅ OK exponer (públicos)
CLIENT_ID=123
TIENDANUBE_API_URL=https://api.tiendanube.com/v1
```

## Troubleshooting

### Error: "The authorization code not found"

**Causa:** No se recibió el `code` en el query param

**Solución:**
- Verificar que el redirect URL en Partner Portal sea correcto
- Asegurar que la API esté corriendo antes de autorizar

### Error: "Invalid grant: code already used"

**Causa:** El authorization code ya fue intercambiado

**Solución:**
- Cada code es de un solo uso
- Reiniciar el flujo OAuth desde el principio

### Error: Cannot connect to database

**Causa:** PostgreSQL no está corriendo o DATABASE_URL incorrecta

**Solución:**
```bash
# Verificar que el container esté corriendo
docker ps | grep postgres

# Iniciar si está detenido
docker start tiendanube-postgres

# Verificar DATABASE_URL en .env
echo $DATABASE_URL
```

### No se guarda en la DB

**Verificar:**
1. Migraciones ejecutadas: `SELECT * FROM credentials;` debe funcionar
2. DATABASE_URL correcta
3. Permisos de PostgreSQL
4. Logs de la API para errores

### Error: "Forbidden" en llamadas a la API

**Causa:** Token inválido, expirado, o scopes insuficientes

**Solución:**
- Verificar que el token existe en DB
- Re-instalar la app para obtener nuevo token
- Verificar que el app tenga los permisos necesarios en Partner Portal

## Comandos Útiles

### PostgreSQL

```bash
# Conectar a la DB
docker exec -it tiendanube-postgres psql -U tiendanube -d tiendanube_ai

# Ver todas las tiendas instaladas
SELECT user_id, scope, created_at FROM credentials;

# Buscar credencial de una tienda específica
SELECT * FROM credentials WHERE user_id = 2099076;

# Ver cuántas tiendas tienen la app instalada
SELECT COUNT(*) FROM credentials;

# Eliminar credencial (desinstalar)
DELETE FROM credentials WHERE user_id = 2099076;
```

### Testing OAuth Flow

```bash
# Simular instalación (reemplaza con tu app_id)
open "https://www.tiendanube.com/apps/12345/authorize?state=test"

# Ver logs de la API
cd api/
yarn start:api

# Verificar que se guardó
docker exec -it tiendanube-postgres psql -U tiendanube -d tiendanube_ai \
  -c "SELECT * FROM credentials ORDER BY created_at DESC LIMIT 1;"
```

## Referencias

### Documentación Oficial

- [Tiendanube Authentication](https://dev.nuvemshop.com.br/en/docs/applications/authentication)
- [OAuth 2.0 Spec](https://oauth.net/2/)
- [Tiendanube API](https://dev.nuvemshop.com.br/en/docs/developer-tools/nuvemshop-api)
- [Developer Mode](https://dev.nuvemshop.com.br/en/docs/applications/native#developer-mode)

### Archivos Relevantes en el Proyecto

```
api/
├── src/
│   ├── features/auth/
│   │   ├── auth.controller.ts         # Endpoint /auth/install
│   │   ├── install-app.service.ts     # Lógica de intercambio de code
│   │   └── auth.service.ts            # Autenticación de la app
│   ├── database/
│   │   ├── repositories/
│   │   │   └── CredentialsRepository.ts  # CRUD de credentials
│   │   └── migrations/
│   │       └── 001_initial_schema.sql    # Schema de la DB
│   └── repository/
│       └── UserRepository.ts          # Wrapper de CredentialsRepository
├── .env                               # Variables de entorno (NO commitear)
└── .env.example                       # Template de .env
```

### Endpoints de la API

```
# OAuth
GET  /auth/install?code=xxx   # Callback de OAuth (automático)
POST /auth/login              # Login de la app

# Tiendanube OAuth
POST https://www.tiendanube.com/apps/authorize/token
  → Intercambio de code por access_token

# Tiendanube API
GET https://api.tiendanube.com/v1/{user_id}/products
  → Obtener productos de una tienda
```

## Preguntas Frecuentes

### ¿Cómo instalo la app en múltiples tiendas?

Abre la URL de autorización en **ventanas incógnito separadas**, loguéate en diferentes tiendas, y autoriza. Cada tienda generará su propio `user_id` y `access_token`.

### ¿Qué pasa si reinstalo la app en la misma tienda?

El `ON CONFLICT (user_id) DO UPDATE` en el INSERT asegura que se actualice el token existente en lugar de crear un duplicado.

### ¿El access_token expira?

Los tokens de Tiendanube son de larga duración, pero pueden ser revocados por el usuario o por cambios en permisos. Maneja errores 401/403 re-solicitando autorización.

### ¿Puedo tener una app instalada en producción y desarrollo?

Sí, pero necesitas 2 apps diferentes en Partner Portal (una para dev, otra para prod) con diferentes CLIENT_ID y CLIENT_SECRET.

### ¿Cómo manejar webhooks?

Tiendanube puede enviar webhooks cuando ocurren eventos (producto creado, orden nueva, etc). Configura los webhooks en Partner Portal apuntando a tu API.

---

**Última actualización:** 2026-01-28
**Versión del Template:** Node.js + React Native App Template
