# Scripts de Utilidad

Scripts para facilitar el desarrollo y configuración del proyecto.

## setup-cloudflare-tunnel.sh

Configura Cloudflare Tunnel para exponer tu aplicación local públicamente (backend + frontend con 1 solo túnel).

**Uso:**
```bash
./scripts/setup-cloudflare-tunnel.sh
```

**Qué hace:**
1. Verifica instalación de cloudflared
2. Te guía en el login a Cloudflare (solo primera vez)
3. Crea el túnel "tiendanube-app"
4. Genera archivo de configuración en `~/.cloudflared/config.yml`
5. Te muestra las URLs públicas para usar en Partners Portal

**Requisitos:**
- cloudflared instalado (`brew install cloudflare/cloudflare/cloudflared`)
- Cuenta de Cloudflare (gratis en https://dash.cloudflare.com/sign-up)

**Ver guía completa:** [docs/CLOUDFLARE_TUNNEL_SETUP.md](../docs/CLOUDFLARE_TUNNEL_SETUP.md)

---

## Agregar nuevos scripts

Cuando agregues scripts aquí:
1. Hazlos ejecutables: `chmod +x scripts/tu-script.sh`
2. Documéntalos en este README
3. Usa bash con `set -e` para errores
