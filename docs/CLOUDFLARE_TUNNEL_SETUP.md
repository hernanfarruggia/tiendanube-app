# Cloudflare Tunnel Setup - Guía Completa

## 🚀 Quick Start - Setup Automatizado

**¿Quieres empezar rápido?** Usa el script automatizado:

**1. Ejecutar script de setup (solo primera vez)**
```bash
./scripts/setup-cloudflare-tunnel.sh
```

**2. El script te guiará para:**
- Login a Cloudflare (abre browser)
- Crear túnel "tiendanube-app"
- Generar configuración automáticamente
- Mostrarte las URLs públicas

**3. Actualizar frontend/.env con la URL que te muestre el script**
- VITE_API_URL=https://api-TUNNEL-ID.cfargotunnel.com

**4. Levantar todo (3 terminales)**
- Terminal 1:
```bash
cloudflared tunnel run tiendanube-app
```
- Terminal 2:
```bash
cd api && yarn start
```
- Terminal 3:
```bash
cd frontend && yarn start:dev
```

**5. Configurar Partners Portal con las URLs del script**

**¿Prefieres entender el proceso?** Continúa leyendo la guía completa abajo.

---

## ¿Por qué Cloudflare Tunnel?

- **Gratis e ilimitado**: Múltiples túneles sin costo
- **Estable**: Conexiones más confiables que ngrok free
- **1 solo proceso**: Sirve múltiples puertos simultáneamente
- **Persistente**: URLs no cambian (puedes usar subdominios propios)
- **Seguro**: Sin exponer puertos, todo va por Cloudflare

## Instalación

### macOS

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Linux

```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Verificar instalación

```bash
cloudflared --version
```

## Configuración Inicial (Una sola vez)

### Paso 1: Login a Cloudflare

```bash
cloudflared tunnel login
```

Esto abrirá tu navegador. Necesitas:
- Tener una cuenta de Cloudflare (gratis en https://dash.cloudflare.com/sign-up)
- Seleccionar un dominio (o crear uno gratis)
- Autorizar cloudflared

Se guardará un certificado en: `~/.cloudflared/cert.pem`

### Paso 2: Crear el Túnel

```bash
cloudflared tunnel create tiendanube-app
```

Esto genera:
- Un túnel ID (guárdalo)
- Credenciales en: `~/.cloudflared/<TUNNEL-ID>.json`

Verás un mensaje como:
```
Created tunnel tiendanube-app with id: abc123-def456-ghi789
```

### Paso 3: Configurar DNS (En Cloudflare Dashboard)

**IMPORTANTE:** Necesitas un dominio propio en Cloudflare. Las URLs automáticas de `cfargotunnel.com` no funcionan para Tiendanube debido a restricciones de CSP (Content Security Policy).

**Configurar rutas DNS con tu dominio:**

```bash
# Asociar subdominio al túnel
cloudflared tunnel route dns tiendanube-app api.tudominio.com
cloudflared tunnel route dns tiendanube-app app.tudominio.com
```

### Paso 4: Crear Archivo de Configuración

Crea el archivo en: `~/.cloudflared/config.yml`

**Para URLs automáticas de Cloudflare:**

```yaml
tunnel: tiendanube-app
credentials-file: /Users/hernan/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Backend API (puerto 8000)
  - hostname: api-<TUNNEL-ID>.cfargotunnel.com
    service: http://localhost:8000

  # Frontend App (puerto 5173)
  - hostname: app-<TUNNEL-ID>.cfargotunnel.com
    service: http://localhost:5173

  # Catch-all (requerido)
  - service: http_status:404
```

**Para dominio propio:**

```yaml
tunnel: tiendanube-app
credentials-file: /Users/hernan/.cloudflared/<TUNNEL-ID>.json

ingress:
  # Backend API
  - hostname: api.tudominio.com
    service: http://localhost:8000

  # Frontend App
  - hostname: app.tudominio.com
    service: http://localhost:5173

  # Catch-all
  - service: http_status:404
```

## Uso Diario

### Levantar el Túnel

```bash
# Terminal 1 - Cloudflare Tunnel (sirve ambos puertos)
cloudflared tunnel run tiendanube-app

# Terminal 2 - Backend
cd api
yarn start

# Terminal 3 - Frontend
cd frontend
yarn start:dev
```

### URLs Resultantes

**Con URLs automáticas:**
```
Backend:  https://api-<TUNNEL-ID>.cfargotunnel.com
Frontend: https://app-<TUNNEL-ID>.cfargotunnel.com
```

**Con dominio propio:**
```
Backend:  https://api.tudominio.com
Frontend: https://app.tudominio.com
```

## Configuración del Proyecto

### Frontend (.env)

**IMPORTANTE:** Las URLs automáticas de `cfargotunnel.com` **NO funcionan** sin configuración adicional. Debes usar un dominio propio.

Ejemplo con dominio personalizado:
```bash
VITE_API_URL=https://api-tiendanube.tudominio.com
VITE_CLIENT_ID=25366
```

### Partners Portal (Tiendanube)

https://partners.tiendanube.com/applications/YOURAPPID/edit

Con dominio personalizado:
```
URL de Inicio: https://app-tiendanube.tudominio.com
URL de Redirección: https://api-tiendanube.tudominio.com/auth/callback
URL de Instalación: https://api-tiendanube.tudominio.com/install
```

### Ejemplo Real

Este proyecto usa:
```
Backend:  https://api-tiendanube.wearekadre.com
Frontend: https://app-tiendanube.wearekadre.com
```

## Comandos Útiles

```bash
# Ver túneles activos
cloudflared tunnel list

# Ver info del túnel
cloudflared tunnel info tiendanube-app

# Eliminar túnel
cloudflared tunnel delete tiendanube-app

# Ver logs en tiempo real
cloudflared tunnel run tiendanube-app --loglevel debug

# Detener túnel
# Ctrl+C en la terminal donde corre
```

## Troubleshooting

### Error: "tunnel credentials file not found"

```bash
# Verifica que existe el archivo
ls ~/.cloudflared/*.json

# Revisa que el path en config.yml sea correcto
cat ~/.cloudflared/config.yml
```

### Error: "tunnel with that name already exists"

```bash
# Lista túneles existentes
cloudflared tunnel list

# Usa el existente o elimínalo
cloudflared tunnel delete tiendanube-app
```

### Frontend no carga en iframe

Puede ser problema de CSP (Content Security Policy). Agrega en tu backend:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://admin.tiendanube.com');
  next();
});
```

### Conexión muy lenta

```bash
# Usa el servidor más cercano
cloudflared tunnel run tiendanube-app --edge-ip-version 4
```

## Ventajas vs ngrok free

| Feature | ngrok free | Cloudflare Tunnel |
|---------|-----------|-------------------|
| Túneles simultáneos | 1 | Ilimitados |
| URLs persistentes | ❌ (cambian) | ✅ (fijas) |
| Límite de conexiones | 40/min | Sin límite |
| Precio | Gratis | Gratis |
| Estabilidad | Media | Alta |
| Requiere dominio | No | Opcional |

## Configuración Avanzada (Opcional)

### Auto-start en login (macOS)

```bash
# Instalar como servicio
sudo cloudflared service install

# Configurar para que inicie automáticamente
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

### Múltiples proyectos

Puedes crear túneles diferentes para cada proyecto:

```bash
cloudflared tunnel create proyecto-1
cloudflared tunnel create proyecto-2

# Correr el que necesites
cloudflared tunnel run proyecto-1
```

## Referencias

- [Documentación oficial](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Dashboard de Cloudflare](https://dash.cloudflare.com/)
- [Troubleshooting oficial](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)
