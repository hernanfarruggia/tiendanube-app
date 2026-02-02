# Storefront Scripts

Scripts JavaScript que se inyectan en el storefront de Tiendanube.

## Estructura

```
storefront/
├── README.md              # Esta guía
├── searchbox.js           # Searchbox con debouncer
└── [otros scripts]        # Futuros scripts
```

## Scripts Disponibles

### searchbox.js

**Funcionalidad:**
- Inyecta searchbox en páginas del storefront
- Debouncer de 250ms para optimizar performance
- Console logs del input del usuario
- Styling responsive con Bootstrap

**Características:**
- ✅ Event: `onfirstinteraction` (no bloquea carga)
- ✅ Placement inteligente (múltiples fallbacks)
- ✅ Previene duplicados
- ✅ Error handling robusto
- ✅ Compatible con todos los temas

**Setup en Partners Portal:**
```
Name: Enhanced Searchbox
Handle: enhanced-searchbox
Location: store
Event: onfirstinteraction
Auto Installed: true
```

## Cómo Deployar un Script

### 1. Preparación Local

```bash
# Edita el script
nano api/scripts/storefront/searchbox.js

# Prueba localmente (opcional)
# Copia/pega en Console del navegador en una tienda de prueba
```

### 2. Upload en Partners Portal

1. Ve a: https://partners.tiendanube.com/applications/25366
2. Navega a sección "Scripts"
3. Crea nuevo script (si no existe)
4. Click "Add version"
5. Upload `searchbox.js`
6. Estado: **Draft**

### 3. Testing

```bash
# Deploy a Testing
1. Select la versión Draft
2. Click "Deploy to Testing"
3. Estado: Testing

# Verificar en tienda de prueba
1. Abre una tienda de prueba
2. Navega a página de producto
3. Abre Console (F12)
4. Busca logs: "[Searchbox] ..."
5. Verifica que el searchbox aparezca
6. Escribe en el input y verifica debounce
```

### 4. Production

```bash
# Deploy a Production
1. Select la versión Testing
2. Click "Deploy to Production"
3. Estado: Active
4. ✅ Se actualiza en TODAS las tiendas automáticamente
```

### 5. Rollback (si hay problemas)

```bash
1. Select versión Legacy
2. Click "Deploy to Production"
3. ✅ Vuelve a la versión anterior instantáneamente
```

## Development Workflow

### Local Development

```bash
# 1. Edita script
code api/scripts/storefront/searchbox.js

# 2. Test en Console del navegador
# Copia todo el contenido del archivo
# Pega en Console de una tienda de prueba
# Verifica funcionamiento

# 3. Commit cambios
git add api/scripts/storefront/searchbox.js
git commit -m "feat(scripts): update searchbox debounce logic"
```

### Versioning

Usa comentarios en el archivo para tracking:

```javascript
/**
 * Searchbox Script v1.1.0
 *
 * Changelog:
 * - v1.1.0 (2026-02-02): Added clear button
 * - v1.0.0 (2026-02-01): Initial version
 */
```

### Feature Flags (Avanzado)

Para features experimentales:

```javascript
// En el script
const urlParams = new URLSearchParams(window.location.search);
const storeId = urlParams.get('store');

// Fetch config desde tu backend
fetch(`https://your-api.com/feature-flags/${storeId}`)
  .then(res => res.json())
  .then(config => {
    if (config.enableNewFeature) {
      // Nueva funcionalidad
    }
  });
```

## Best Practices

### ✅ DO

- Wrap código en IIFE: `(function() { })();`
- Validar disponibilidad de `LS` object
- Usar selectores genéricos (`.js-`, `.container`, etc.)
- Incluir error handling con try-catch
- Prevenir duplicados (check ID antes de inject)
- Usar Bootstrap classes para styling consistente
- Debounce/throttle eventos frecuentes
- Log eventos importantes para debugging

### ❌ DON'T

- No usar variables globales
- No depender de jQuery (o validar disponibilidad)
- No usar selectores específicos de un tema
- No hacer operaciones pesadas en `onload`
- No asumir estructura DOM fija
- No modificar código de Tiendanube directamente

## Debugging

### Console Logs

Todos los scripts usan prefijo `[ScriptName]`:

```javascript
console.log('[Searchbox] Initializing...');
console.log('[Searchbox] User input:', value);
console.error('[Searchbox] Error:', error);
```

### Verificar Carga

```javascript
// En Console del navegador
// Buscar script tag
document.querySelector('script[src*="tiendanube"]');

// Verificar LS object
console.log(LS);
```

### Performance

```javascript
// Agregar profiling temporal
const startTime = performance.now();

// Tu código aquí

const endTime = performance.now();
console.log(`[Script] Execution: ${endTime - startTime}ms`);
```

## Troubleshooting

### Script no se carga

**Causas:**
- Script no está en estado "Active"
- App no instalada en la tienda
- Scope `scripts` no habilitado

**Fix:**
1. Verificar estado en Partners Portal
2. Verificar app instalada: `GET /apps/{app_id}`
3. Verificar scope en Partners Portal

### Elemento no se inyecta

**Causas:**
- Selector no existe en el tema
- Script ejecuta antes de que DOM esté listo

**Fix:**
```javascript
// Usar múltiples fallback selectors
const selectors = [
  '.ideal-selector',
  '.fallback-selector',
  'body'
];

// Esperar DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

### Conflictos con otros scripts

**Causa:**
- Variables globales
- Event listeners múltiples

**Fix:**
```javascript
// IIFE para scope local
(function() {
  // Variables aquí son locales
})();

// Prevenir duplicados
if (document.getElementById('my-element')) {
  return; // Ya existe
}
```

## Próximos Scripts

Ideas para futuros scripts:

- **Product Recommendations**: Widget de productos relacionados
- **Analytics Tracker**: Tracking de eventos personalizados
- **Chatbot Integration**: Widget de chat
- **Wishlist**: Lista de deseos
- **Social Proof**: Notificaciones de compras recientes
- **Exit Intent**: Popup al intentar salir

## Referencias

- [Documentación Completa](../../docs/STOREFRONT_SCRIPTS.md)
- [Base Theme Repository](https://github.com/TiendaNube/base-theme)
- [Partners Portal](https://partners.tiendanube.com/)
- [Scripts API Documentation](https://tiendanube.github.io/api-documentation/resources/script)

---

**Última actualización:** 2026-02-02
