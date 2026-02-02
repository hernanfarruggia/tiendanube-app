# Guía de Integración Tiendanube

## Flujo Completo de Integración Tiendanube

### Cómo Funciona la Arquitectura

```
Tienda (Admin Panel)
    ↓ (iframe)
Frontend (React + Nexo) → Puerto 5173
    ↓ (API calls)
Backend (Node.js) → Puerto 8000
    ↓ (OAuth + API)
Tiendanube Platform
```

### Paso a Paso para Conectar

**1. URLs Necesarias**

Tu app necesita 2 URLs públicas (ngrok):
- **Backend URL**: Para OAuth y API calls (`https://abc123.ngrok.io`)
- **Frontend URL**: Para el iframe del admin (`https://xyz456.ngrok.io`)

**2. Configuración en Partners Portal**

Accede a: https://partners.tiendanube.com/

En tu app (ID: 25366), configura:

```
Nombre: [Tu app]
URL de Inicio: https://xyz456.ngrok.io
URL de Redirección: https://abc123.ngrok.io/auth/callback
URL de Instalación: https://abc123.ngrok.io/install

Scopes (permisos):
- read_products
- write_products
- read_orders
(Los que necesites)
```

**3. Flujo de Instalación**

```
Usuario hace click en "Instalar App" en su tienda
    ↓
Tiendanube redirige a: /install
    ↓
Backend recibe code + store_id
    ↓
Backend hace POST a /apps/authorize/token
    ↓
Recibe access_token
    ↓
Guarda token en base de datos
    ↓
Redirige al frontend (iframe se carga)
    ↓
Frontend se conecta con Nexo
    ↓
Usuario ve la UI de tu app dentro del admin
```

**4. Nexo (El Conector)**

Nexo es la librería que permite:
- Embeber tu app en iframe dentro del admin
- Comunicarte con la navegación de Tiendanube
- Acceder a datos del contexto (store_id, user_id, etc.)

Por eso ves en `App.tsx`:
```typescript
connect(nexo) // Se conecta al admin de Tiendanube
iAmReady(nexo) // Avisa que ya cargó
```

## Levantar el Proyecto

### Estado Actual

**Frontend:**
- ✅ Ya configurado (.env con API URL y CLIENT_ID)
- ✅ Integración con Nexo (para embeber en admin Tiendanube)
- ✅ UI completa con Nimbus components
- ✅ Puerto: 5173 por defecto

**Backend:**
- ✅ Ya configurado (.env con PORT=8000, CLIENT_ID=25366)
- ✅ Autenticación OAuth lista
- ⚠️ Puerto: 8000

### Paso 1: Instalar ngrok

```bash
# Si no lo tienes
brew install ngrok

# O descarga de: https://ngrok.com/download
```

### Paso 2: Configurar Túnel Público

**Opción A: Cloudflare Tunnel (RECOMENDADO - Gratis, Estable, Múltiples Túneles)**

Ver guía completa: [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md)

```bash
# Setup rápido (solo primera vez)
./scripts/setup-cloudflare-tunnel.sh

# Levantar túnel (1 solo proceso para ambos puertos)
cloudflared tunnel run tiendanube-app
```

URLs resultantes:
```
Backend:  https://api-TUNNEL-ID.cfargotunnel.com
Frontend: https://app-TUNNEL-ID.cfargotunnel.com
```

**Opción B: ngrok (Limitado a 1 túnel en free tier)**

```bash
# Solo puedes correr 1 túnel a la vez en free tier
ngrok http 8000

# O para el frontend
ngrok http 5173
```

**IMPORTANTE**: Con Cloudflare puedes servir ambos puertos con 1 solo proceso. Con ngrok free necesitarías el plan pago o usar alternativas.

### Paso 3: Actualizar .env con URLs de ngrok

**Backend (`api/.env`):**
```bash
# No cambies nada aquí - el backend escucha en localhost:8000
# Ngrok hace el proxy público
```

**Frontend (`frontend/.env`):**
```bash
VITE_API_URL=https://abc123-45-67.ngrok-free.app  # URL de ngrok del backend
VITE_CLIENT_ID=25366
```

### Paso 4: Actualizar Partners Portal

Ve a: https://partners.tiendanube.com/applications/25366/edit

Configura:
```
URL de Inicio: https://xyz789-12-34.ngrok-free.app
URL de Redirección: https://abc123-45-67.ngrok-free.app/auth/callback
URL de Instalación: https://abc123-45-67.ngrok-free.app/install
```

### Paso 5: Levantar los Servidores

```bash
# Terminal 3 - Backend
cd api
yarn install  # Si no lo hiciste
yarn start

# Terminal 4 - Frontend
cd frontend
yarn install  # Si no lo hiciste
yarn start:dev
```

### Paso 6: Instalar App en tu Tienda

1. Ve a tu tienda admin
2. Apps > Mis Apps
3. Busca tu app (ID: 25366) o usa el link directo:
   ```
   https://www.tiendanube.com/apps/25366/authorize
   ```
4. Click "Instalar"
5. Autoriza los permisos
6. Deberías ver el iframe con tu app funcionando

## Verificación

**¿Cómo saber si está funcionando?**

1. **Backend logs**: Deberías ver requests en la terminal del backend
2. **Frontend conectado**: En la consola del navegador (F12) no deberían haber errores de Nexo
3. **UI visible**: Ves el "App Template" con las cards de productos

## Troubleshooting Común

**Problema**: "Conectando..." infinito
- **Causa**: Nexo no puede conectar
- **Fix**: Verifica que la URL en Partners Portal coincida con la de ngrok del frontend

**Problema**: CORS errors
- **Causa**: Backend no acepta requests del frontend
- **Fix**: Verifica VITE_API_URL en frontend/.env

**Problema**: "App no encontrada"
- **Causa**: CLIENT_ID incorrecto o app no publicada
- **Fix**: Verifica que CLIENT_ID sea 25366 en ambos .env

## Comandos Rápidos

```bash
# Levantar todo (4 terminales)
# T1: ngrok http 8000
# T2: ngrok http 5173
# T3: cd api && yarn start
# T4: cd frontend && yarn start:dev

# Verificar estado
curl http://localhost:8000/health  # Backend health check
curl http://localhost:5173         # Frontend running
```

## Notas Importantes

- Las URLs de ngrok cambian cada vez que reinicias (usa plan pago para URLs fijas)
- Actualiza Partners Portal cada vez que cambien las URLs de ngrok
- El CLIENT_ID debe ser el mismo en backend y frontend
- En producción, reemplaza ngrok con dominios reales
