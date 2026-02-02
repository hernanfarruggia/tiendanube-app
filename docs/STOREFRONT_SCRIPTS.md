# Scripts en Storefront de Tiendanube

Guía completa para crear, gestionar y actualizar scripts JavaScript que se inyectan en el storefront de las tiendas.

## Índice

- [Concepto](#concepto)
- [Configuración](#configuración)
- [Variables Disponibles](#variables-disponibles)
- [Sistema de Versiones](#sistema-de-versiones)
- [Gestión via API](#gestión-via-api)
- [Estrategias de Deployment](#estrategias-de-deployment)
- [Best Practices](#best-practices)
- [Referencias](#referencias)

## Concepto

Los scripts permiten inyectar JavaScript personalizado en las páginas del storefront (productos, checkout, thank you page). Se registran a nivel de app y se cargan automáticamente en las tiendas que instalan tu app.

### Flujo Completo

```
1. Registras script en Partners Portal (App ID: 25366)
   ↓
2. Subes archivo .js con tu código
   ↓
3. Despliegas a Testing → Production
   ↓
4. Script se carga automáticamente en tiendas con tu app instalada
   (o manualmente via API si auto-installed = false)
```

### Ubicación de Carga

Los scripts se hospedan en servidores de Tiendanube, NO en tu servidor. Esto significa:
- ✅ No necesitas hosting para el script
- ✅ Tiendanube se encarga de CDN y performance
- ✅ Updates se propagan automáticamente a todas las tiendas

## Configuración

### En Partners Portal

URL: https://partners.tiendanube.com/applications/25366

**Campos requeridos:**

| Campo | Descripción | Valores |
|-------|-------------|---------|
| **name** | Nombre descriptivo interno | Ej: "Product Recommendations" |
| **handle** | Identificador único | Ej: "product-recs" |
| **location** | Página donde se carga | "store" o "checkout" |
| **event** | Momento de ejecución | "onfirstinteraction" o "onload" |
| **dev mode** | Habilitar URL de desarrollo | true/false |
| **auto installed** | Instalar automáticamente | true/false |

### Tipos de Event

**onfirstinteraction** (Recomendado)
- ✅ Ejecuta tras primer scroll/click/tap del usuario
- ✅ No bloquea carga inicial de página
- ✅ Ideal para: chatbots, wishlists, popups, analytics
- ✅ No requiere aprobación previa

**onload**
- ⚠️ Ejecuta durante carga crítica de página
- ⚠️ Puede afectar performance
- ⚠️ Requiere aprobación previa de Tiendanube (api@nuvemshop.com.br)
- ✅ Necesario para: modificaciones above-the-fold, recolección de datos de usuario

### Permisos Requeridos

En Partners Portal, tu app debe tener el scope:
- `scripts` - Para apps con scripts en storefront
- `write_scripts` - Para payment providers (adicional)

## Variables Disponibles

### Objeto LS (Contexto Global)

El script recibe automáticamente el objeto `LS` con datos del contexto actual.

#### Store Pages (Todas las páginas)

```javascript
LS.store.id          // ID de la tienda
LS.store.url         // URL de la tienda

LS.cart.subtotal     // Subtotal del carrito
LS.cart.items        // Array de items en carrito
LS.cart.items[0].id  // ID del producto
LS.cart.items[0].quantity
LS.cart.has_shippable_products // Boolean

LS.customer          // ID del usuario o null si no logueado

LS.currency.code     // "ARS", "USD", etc.
LS.currency.display_short  // "$"
LS.currency.display_long   // "ARS"
LS.currency.decimal_separator  // "."
LS.currency.thousands_separator // ","

LS.theme.code        // Código del tema
LS.theme.name        // Nombre del tema
```

#### Product Pages

```javascript
// Todo lo anterior +

LS.product.id        // ID del producto
LS.product.name      // Nombre del producto
LS.product.tags      // Array de tags

LS.variants          // JSON de variantes del producto
```

#### Checkout Pages

```javascript
LS.store             // Objeto store
LS.cart              // Objeto cart
LS.customer          // ID o null
LS.lang              // Idioma
LS.currency          // Objeto currency

// ⚠️ NO puedes acceder a LS desde archivos JS de custom payment options
```

#### Thank You Pages

```javascript
LS.order.id          // ID de la orden
LS.order.number      // Número de orden
LS.order.hash        // Hash de la orden
LS.order.total       // Total de la orden
LS.order.coupon      // Array de cupones usados
LS.order.gateway     // Método de pago usado
```

### URL Parameters

Tu script recibe parámetros en la URL:

```javascript
// Script URL: https://cdn.tiendanube.com/script.js?store=1234&versionId=abc123

// Si usas query_params en la API:
// ?store=1234&versionId=abc123&customParam=value

const urlParams = new URLSearchParams(window.location.search);
const storeId = urlParams.get('store');
const customData = urlParams.get('customParam');
```

### jQuery (Opcional)

Tiendanube provee jQuery via Promise:

```javascript
useJquery().then((jq) => {
  console.log(`jQuery version: ${jq().jquery}`);

  // Usar jQuery
  jq('body').append('<div>Hello!</div>');
});
```

⚠️ **Advertencia:** La versión de jQuery no es consistente entre tiendas. Evita depender de versiones específicas.

## Sistema de Versiones

### Estados de una Versión

```
Draft → Testing → Active → Legacy
  ↓                          ↑
  └── (rollback) ───────────┘
```

| Estado | Descripción | Cantidad |
|--------|-------------|----------|
| **Draft** | Versión en desarrollo | Ilimitadas |
| **Testing** | Desplegada en ambiente de prueba | 1 a la vez |
| **Active** | En producción (todas las tiendas) | 1 a la vez |
| **Legacy** | Versión anterior (backup) | 1 a la vez |

### Ciclo de Deployment

**Desplegar Nueva Versión:**

```bash
1. Click "Add version" en Partners Portal
2. Upload archivo .js
3. Estado: Draft

4. Select version → "Deploy to Testing"
5. Estado: Testing
6. Se carga solo en test stores (auto-installed scripts)

7. Verificar funcionamiento
8. "Deploy to Production"
9. Estado: Active
10. ✅ Se actualiza en TODAS las tiendas automáticamente

# La versión Active anterior pasa a Legacy
```

**Rollback (si algo falla):**

```bash
1. Select versión Legacy
2. "Deploy to Production"
3. ✅ Vuelve a Active (sin pasar por Testing)
4. La versión problemática pasa a Legacy
```

### Updates Automáticos

🔑 **Punto Clave:** Cuando despliegas una nueva versión a Production:
- ✅ Se actualiza automáticamente en TODAS las tiendas
- ✅ NO necesitas llamar a la API por cada tienda
- ✅ NO requiere acción del usuario
- ✅ Los `query_params` se preservan

## Gestión via API

### Headers Requeridos

```typescript
const headers = {
  'Authentication': `bearer ${accessToken}`,
  'User-Agent': 'YourAppName partner@email.com',
  'Content-Type': 'application/json'
};
```

### Endpoints

#### GET /scripts

Lista todos los scripts asociados a la tienda.

```typescript
const response = await fetch(
  `https://api.tiendanube.com/${storeId}/v1/scripts?page=1&per_page=50`,
  { headers }
);

const scripts = await response.json();
```

**Response:**
```json
[
  {
    "id": 123,
    "script_id": 456,
    "src": "https://cdn.tiendanube.com/script.js?store=1234",
    "query_params": "{\"param\":\"value\"}"
  }
]
```

#### GET /scripts/{id}

Obtiene detalles de un script específico.

```typescript
const response = await fetch(
  `https://api.tiendanube.com/${storeId}/v1/scripts/${scriptId}`,
  { headers }
);
```

#### POST /scripts

Crea asociación script-tienda (solo para scripts NO auto-instalados).

```typescript
const response = await fetch(
  `https://api.tiendanube.com/${storeId}/v1/scripts`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      script_id: 456, // ID del script en Partners Portal
      query_params: JSON.stringify({
        feature_enabled: true,
        custom_data: 'value'
      })
    })
  }
);
```

**Cuándo usar:**
- Script con `auto_installed = false`
- Necesitas pasar parámetros personalizados
- Activación condicional del script

#### PUT /scripts/{id}

Actualiza `query_params` de asociación existente.

```typescript
const response = await fetch(
  `https://api.tiendanube.com/${storeId}/v1/scripts/${scriptId}`,
  {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      query_params: JSON.stringify({
        new_param: 'new_value'
      })
    })
  }
);
```

#### DELETE /scripts/{id}

Elimina asociación script-tienda. El script deja de cargarse.

```typescript
const response = await fetch(
  `https://api.tiendanube.com/${storeId}/v1/scripts/${scriptId}`,
  {
    method: 'DELETE',
    headers
  }
);
```

## Estrategias de Deployment

### 1. Simple Auto-Update (Recomendado para mayoría)

**Caso de uso:** Mejoras, bug fixes, nuevas features no breaking

```javascript
// v1.0 - Script inicial
(function () {
  console.log('Feature A');
})();

// v1.1 - Nueva feature
(function () {
  console.log('Feature A');
  console.log('Feature B - NEW!');
})();
```

**Proceso:**
1. Desarrollás mejora localmente
2. Testing en ambiente de prueba
3. Deploy a Production en Partners Portal
4. ✅ Se actualiza en todas las tiendas instantáneamente

### 2. Feature Flags para Gradual Rollout

**Caso de uso:** Features experimentales, A/B testing, beta features

```javascript
// Script con feature flags
(function () {
  // Parse query params pasados desde backend
  const urlParams = new URLSearchParams(window.location.search);
  const storeId = urlParams.get('store');

  // Fetch config desde tu backend (opcional)
  fetch(`https://your-api.com/config/${storeId}`)
    .then(res => res.json())
    .then(config => {
      // Feature siempre disponible
      console.log('Feature A');

      // Feature nueva solo para tiendas con flag
      if (config.enableNewFeature) {
        console.log('Feature B - BETA');
      }
    });
})();
```

**Backend controla rollout:**
```typescript
// Habilitar para tienda específica
await updateStoreConfig(storeId, {
  enableNewFeature: true
});

// Análisis de métricas
const metrics = await getFeatureMetrics('newFeature');

// Rollout gradual: 10% → 50% → 100%
```

### 3. Múltiples Scripts (A/B Testing)

**Caso de uso:** Testing de enfoques completamente diferentes

```
Script A (50% tiendas) → approach-a.js
Script B (50% tiendas) → approach-b.js
```

**Gestión:**
- Ambos scripts con `auto_installed = false`
- Backend asigna script_id según criterio (random, store size, etc.)
- Análisis de métricas por script
- Ganador → se convierte en script principal auto-instalado

### 4. Emergency Rollback

**Caso de uso:** Bug crítico en producción

```bash
Escenario: v1.2 (Active) tiene bug crítico

1. Identificar problema
2. En Partners Portal: Legacy version → "Deploy to Production"
3. ✅ Rollback instantáneo (sin Testing)
4. Fix v1.2 localmente
5. Upload v1.2-fix como nuevo Draft
6. Testing exhaustivo
7. Deploy cuando esté listo
```

## Best Practices

### Estructura de Código

**✅ DO: Wrap en closure**
```javascript
(function () {
  // Tu código aquí
  // Evita contaminar namespace global
})();
```

**❌ DON'T: Código global**
```javascript
// Mal - puede causar conflictos
var myVar = 'value';
function myFunction() { }
```

### Performance

**✅ DO: Usar onfirstinteraction**
```javascript
// Se carga después de primer scroll/click
// No bloquea carga inicial
```

**✅ DO: Debounce/throttle eventos**
```javascript
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.addEventListener('scroll', debounce(() => {
  console.log('Scrolling...');
}, 250));
```

**❌ DON'T: Operaciones pesadas en onload**
```javascript
// Evita esto si usas event: "onload"
for (let i = 0; i < 100000; i++) {
  document.body.appendChild(document.createElement('div'));
}
```

### Compatibilidad

**✅ DO: Vanilla JS cuando sea posible**
```javascript
document.querySelector('.product-name').textContent = 'New Name';
```

**⚠️ CAREFUL: jQuery (versión inconsistente)**
```javascript
useJquery().then((jq) => {
  // Usar solo features básicas
  jq('.product-name').text('New Name');
});
```

**❌ DON'T: Dependencias externas pesadas**
```javascript
// Evita librerías grandes
// Aumenta tiempo de carga
```

### Selectors

**✅ DO: HTML selectors genéricos**
```javascript
// Funcionan en todos los temas
document.querySelector('.js-product-name');
document.querySelector('[data-product-id]');
```

**❌ DON'T: Selectores específicos de tema**
```javascript
// Puede no existir en otros temas
document.querySelector('.specific-theme-class');
```

### Error Handling

**✅ DO: Try-catch crítico**
```javascript
(function () {
  try {
    // Código que puede fallar
    const element = document.querySelector('.might-not-exist');
    if (!element) return; // Guard clause

    element.textContent = 'New value';
  } catch (error) {
    console.error('Script error:', error);
    // NO romper la página del usuario
  }
})();
```

**✅ DO: Validar disponibilidad de LS**
```javascript
if (typeof LS !== 'undefined' && LS.product) {
  console.log('Product ID:', LS.product.id);
}
```

### Testing

**Antes de Deploy:**
1. ✅ Probar en múltiples temas
2. ✅ Verificar responsive (mobile/desktop)
3. ✅ Validar sin jQuery disponible
4. ✅ Test con JS deshabilitado (graceful degradation)
5. ✅ Performance profiling (Chrome DevTools)

## Casos de Uso Comunes

### 1. Analytics / Tracking

```javascript
(function () {
  // Track page view
  if (typeof LS !== 'undefined') {
    console.log('Store:', LS.store.id);
    console.log('Page:', window.location.pathname);

    // Enviar a tu analytics
    fetch('https://your-api.com/analytics', {
      method: 'POST',
      body: JSON.stringify({
        store_id: LS.store.id,
        page: window.location.pathname,
        timestamp: Date.now()
      })
    });
  }
})();
```

### 2. Product Recommendations

```javascript
(function () {
  if (typeof LS === 'undefined' || !LS.product) return;

  // Fetch recommendations
  fetch(`https://your-api.com/recommendations/${LS.product.id}`)
    .then(res => res.json())
    .then(products => {
      // Inject recommendations widget
      const container = document.querySelector('.product-detail');
      if (!container) return;

      const widget = document.createElement('div');
      widget.className = 'recommendations';
      widget.innerHTML = products.map(p =>
        `<div class="rec-item">${p.name}</div>`
      ).join('');

      container.appendChild(widget);
    });
})();
```

### 3. Chatbot Widget

```javascript
(function () {
  // Load chatbot después de interacción
  const script = document.createElement('script');
  script.src = 'https://cdn.chatbot.com/widget.js';
  script.async = true;

  script.onload = () => {
    if (typeof ChatbotWidget !== 'undefined') {
      ChatbotWidget.init({
        storeId: LS.store.id,
        customerId: LS.customer || null
      });
    }
  };

  document.body.appendChild(script);
})();
```

### 4. Custom Checkout Validation

```javascript
(function () {
  // Solo en checkout
  if (window.location.pathname.includes('/checkout')) {

    const form = document.querySelector('#checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      const email = form.querySelector('[name="email"]').value;

      if (!email.includes('@')) {
        e.preventDefault();
        alert('Email inválido');
      }
    });
  }
})();
```

## Troubleshooting

### Script no se carga

**Posibles causas:**
1. ❌ Script no está en estado "Active"
2. ❌ App no instalada en la tienda
3. ❌ Scope `scripts` no habilitado en Partners Portal
4. ❌ Script con `auto_installed = false` sin asociación vía API

**Verificar:**
```bash
# Inspeccionar HTML de la tienda
# Buscar: <script src="https://...tiendanube.com/...">
```

### Console errors

**Error común:**
```
ReferenceError: LS is not defined
```

**Fix:**
```javascript
// Siempre validar disponibilidad
if (typeof LS !== 'undefined') {
  // Usar LS
}
```

### Performance issues

**Síntomas:**
- Página carga lento
- Users reportan lag

**Diagnóstico:**
```javascript
// Agregar profiling temporal
const startTime = performance.now();

// Tu código aquí

const endTime = performance.now();
console.log(`Script execution: ${endTime - startTime}ms`);
```

**Fix:**
- Cambiar event a `onfirstinteraction`
- Optimizar loops y queries
- Lazy load recursos pesados

### Conflictos con otros scripts

**Síntomas:**
- Funcionalidades rotas en algunas tiendas
- Errores de "undefined is not a function"

**Prevención:**
```javascript
// Wrap en closure
(function () {
  // Variables locales, no globales
  const myVar = 'value';
})();

// NO usar global namespace
window.myAppFunction = function() { }; // ❌
```

## Referencias

### Documentación Oficial

- [Scripts API - Tiendanube](https://tiendanube.github.io/api-documentation/resources/script)
- [API Resources - Nuvemshop](https://tiendanube.github.io/api-documentation/resources)
- [Partners Portal](https://partners.tiendanube.com/)

### Herramientas

- [Chrome DevTools - Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse - Performance Audit](https://developers.google.com/web/tools/lighthouse)

### Support

- Email: api@nuvemshop.com.br
- Subject format: `[APP_ID: 25366] [APP_NAME] - Consulta`

---

**Última actualización:** 2026-02-02
