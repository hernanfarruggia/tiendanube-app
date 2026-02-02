# Guía de Placement de Elementos en Storefront

Estrategias y selectores para inyectar elementos en la UI del storefront de Tiendanube mediante scripts.

## Índice

- [Estructura del Base Theme](#estructura-del-base-theme)
- [Selectores Comunes](#selectores-comunes)
- [Estrategias de Placement](#estrategias-de-placement)
- [Bootstrap Integration](#bootstrap-integration)
- [Best Practices](#best-practices)
- [Ejemplos Prácticos](#ejemplos-prácticos)

## Estructura del Base Theme

### Framework y Convenciones

**CSS Framework:** Bootstrap 4 (grid system + utilities)
**CSS Naming:** BEM-like methodology
**JS Selectors:** Prefijo `js-` para elementos con funcionalidad JavaScript
**Templates:** Smarty/Twig templating engine

### Organización de Archivos

```
base-theme/
├── config/           # Configuración
├── layouts/          # Layouts principales
├── snipplets/        # Componentes reutilizables
│   ├── header/
│   ├── product/
│   ├── home/
│   └── ...
├── static/           # Assets
│   ├── css/
│   └── js/
└── templates/        # Templates de páginas
    ├── home.tpl
    ├── product.tpl
    ├── category.tpl
    └── ...
```

## Selectores Comunes

### Home Page

```html
<!-- Main container -->
<div class="js-home-sections-container">
  <!-- Secciones de home (slider, productos, etc.) -->
</div>
```

**Placement strategies:**
```javascript
// Al inicio del home
const homeContainer = document.querySelector('.js-home-sections-container');
homeContainer.insertBefore(myElement, homeContainer.firstChild);

// Al final del home
homeContainer.appendChild(myElement);
```

### Product Page

```html
<!-- Main product wrapper -->
<div id="single-product" class="section-single-product">
  <div class="container">

    <!-- Product container (con data-store) -->
    <div class="js-product-container" data-store="product-detail">

      <!-- Product detail info -->
      <div class="js-product-detail" data-variants='{"id": 123, ...}'>
        <!-- Product images, title, price, variants, etc. -->
      </div>

    </div>

  </div>
</div>

<!-- Reviews section -->
<div id="reviewsapp"></div>

<!-- Shipping calculator -->
<div class="js-shipping-calculator-container js-has-new-shipping">
  <!-- Shipping form -->
</div>
```

**Selectores útiles:**

| Selector | Ubicación | Uso recomendado |
|----------|-----------|------------------|
| `#single-product` | Page wrapper | Placement general |
| `.js-product-container` | Product wrapper | Elementos relacionados al producto |
| `.js-product-detail` | Product info | Data attributes access |
| `#reviewsapp` | Reviews section | Insert before/after reviews |
| `.js-shipping-calculator-container` | Shipping calculator | Related shipping features |

### Category/Collection Page

```html
<div class="js-category-page">
  <!-- Products grid -->
</div>
```

### Cart Page

```html
<div class="js-cart-page">
  <!-- Cart items -->
</div>
```

### Common Elements

```html
<!-- Bootstrap containers (presentes en todas las páginas) -->
<div class="container">
  <div class="row">
    <div class="col-12 col-md-6">
      <!-- Content -->
    </div>
  </div>
</div>

<!-- Main element (fallback universal) -->
<main>
  <!-- Page content -->
</main>
```

### Data Attributes

#### data-store (Tracking/Analytics)

Usados por Tiendanube para tracking:

```html
<div data-store="product-detail">...</div>
<div data-store="product-image-{{ product.id }}">...</div>
<div data-store="product-info-{{ product.id }}">...</div>
```

#### data-variants (Product Data)

Contiene JSON con info de variantes:

```html
<div class="js-product-detail" data-variants='{"id": 123, "name": "Product", "variants": [...]}'>
```

**Acceso desde script:**
```javascript
const productDetail = document.querySelector('.js-product-detail');
if (productDetail) {
  const variants = JSON.parse(productDetail.getAttribute('data-variants'));
  console.log('Product variants:', variants);
}
```

## Estrategias de Placement

### 1. Append (Al final)

Agregar elemento al final de un container.

```javascript
const container = document.querySelector('.js-product-container');
if (container) {
  const myElement = document.createElement('div');
  myElement.innerHTML = '<p>My content</p>';
  container.appendChild(myElement);
}
```

**Cuándo usar:**
- Widgets adicionales que no interfieren con contenido principal
- Banners informativos
- CTAs secundarios

### 2. Prepend (Al inicio)

Agregar elemento al principio de un container.

```javascript
const container = document.querySelector('.js-product-container');
if (container) {
  const myElement = document.createElement('div');
  myElement.innerHTML = '<p>My content</p>';
  container.insertBefore(myElement, container.firstChild);
}
```

**Cuándo usar:**
- Alertas importantes
- Badges destacados
- Información prioritaria

### 3. Insert Before (Antes de elemento específico)

Insertar antes de un elemento de referencia.

```javascript
const reviewsSection = document.querySelector('#reviewsapp');
if (reviewsSection) {
  const myElement = document.createElement('div');
  myElement.innerHTML = '<p>Content before reviews</p>';
  reviewsSection.parentNode.insertBefore(myElement, reviewsSection);
}
```

**Cuándo usar:**
- Separadores entre secciones
- CTAs antes de reviews
- Banners contextuales

### 4. Insert After (Después de elemento específico)

Insertar después de un elemento de referencia.

```javascript
const reviewsSection = document.querySelector('#reviewsapp');
if (reviewsSection) {
  const myElement = document.createElement('div');
  myElement.innerHTML = '<p>Content after reviews</p>';

  // Insert after (no hay método nativo, usar nextSibling)
  reviewsSection.parentNode.insertBefore(
    myElement,
    reviewsSection.nextSibling
  );
}
```

**Cuándo usar:**
- Contenido complementario
- Related products
- Social proof

### 5. Replace (Reemplazar elemento)

Reemplazar un elemento existente.

```javascript
const oldElement = document.querySelector('.old-element');
if (oldElement) {
  const newElement = document.createElement('div');
  newElement.innerHTML = '<p>New content</p>';
  oldElement.parentNode.replaceChild(newElement, oldElement);
}
```

**Cuándo usar:**
- Mejorar funcionalidad existente
- Custom shipping calculator
- Enhanced product selectors

⚠️ **Advertencia:** Usar con cuidado, puede romper funcionalidad del tema.

### 6. Multi-Fallback Strategy

Intentar múltiples selectores hasta encontrar uno que exista.

```javascript
function findPlacementLocation() {
  const selectors = [
    '.js-product-container',      // Preferido
    '#single-product',             // Fallback 1
    '.container:first-of-type',    // Fallback 2
    'main',                        // Fallback 3
    'body'                         // Last resort
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('Placement found:', selector);
      return element;
    }
  }

  return document.body;
}

const placement = findPlacementLocation();
placement.appendChild(myElement);
```

**Cuándo usar:**
- Compatibilidad entre múltiples temas
- Scripts genéricos
- Widgets universales

## Bootstrap Integration

### Grid System

Usar Bootstrap 4 grid para responsive design:

```javascript
const widget = document.createElement('div');
widget.className = 'container mt-4 mb-4'; // Margin top/bottom 4

widget.innerHTML = `
  <div class="row">
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Widget Title</h5>
          <p class="card-text">Content here</p>
        </div>
      </div>
    </div>
  </div>
`;
```

### Utility Classes

**Spacing:**
```html
<!-- Margins -->
<div class="mt-3">    <!-- Margin top 3 -->
<div class="mb-4">    <!-- Margin bottom 4 -->
<div class="mx-auto">  <!-- Margin horizontal auto (center) -->

<!-- Padding -->
<div class="pt-2">    <!-- Padding top 2 -->
<div class="px-3">    <!-- Padding horizontal 3 -->
```

**Display:**
```html
<div class="d-none">           <!-- Display none -->
<div class="d-block">          <!-- Display block -->
<div class="d-flex">           <!-- Display flex -->
<div class="d-none d-md-block"> <!-- Hidden on mobile, visible on tablet+ -->
```

**Text:**
```html
<p class="text-center">    <!-- Text center -->
<p class="text-muted">     <!-- Muted color -->
<p class="font-weight-bold"> <!-- Bold -->
```

### Components

**Card:**
```javascript
const card = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title">Title</h5>
      <p class="card-text">Content</p>
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
`;
```

**Alert:**
```javascript
const alert = `
  <div class="alert alert-info alert-dismissible fade show" role="alert">
    <strong>Info!</strong> Message here.
    <button type="button" class="close" data-dismiss="alert">
      <span>&times;</span>
    </button>
  </div>
`;
```

**Badge:**
```javascript
const badge = `
  <span class="badge badge-primary">New</span>
  <span class="badge badge-success">In Stock</span>
  <span class="badge badge-danger">Sale</span>
`;
```

## Best Practices

### ✅ DO

**1. Usar múltiples fallbacks**
```javascript
const selectors = ['.preferred', '.fallback', 'body'];
```

**2. Prevenir duplicados**
```javascript
if (document.getElementById('my-widget')) {
  return; // Ya existe
}
```

**3. Responsive design con Bootstrap**
```javascript
element.className = 'container mt-4';
```

**4. Guard clauses**
```javascript
const container = document.querySelector('.js-product-container');
if (!container) return; // Exit early

container.appendChild(myElement);
```

**5. Esperar DOM ready**
```javascript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

**6. Usar data attributes propios**
```javascript
element.setAttribute('data-app', 'my-app-widget');
element.setAttribute('data-version', '1.0.0');
```

### ❌ DON'T

**1. Selectores específicos de un tema**
```javascript
// ❌ Malo
const el = document.querySelector('.specific-theme-class-xyz');

// ✅ Bueno
const el = document.querySelector('.js-product-container');
```

**2. Asumir estructura DOM fija**
```javascript
// ❌ Malo
const el = document.body.children[2].children[0];

// ✅ Bueno
const el = document.querySelector('.js-product-container');
```

**3. Modificar elementos de Tiendanube**
```javascript
// ❌ Malo
document.querySelector('.js-product-detail').innerHTML = 'New content';

// ✅ Bueno
const myElement = document.createElement('div');
document.querySelector('.js-product-detail').appendChild(myElement);
```

**4. Operaciones pesadas en loop**
```javascript
// ❌ Malo
for (let i = 0; i < 1000; i++) {
  document.body.appendChild(document.createElement('div'));
}

// ✅ Bueno
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  fragment.appendChild(document.createElement('div'));
}
document.body.appendChild(fragment);
```

## Ejemplos Prácticos

### Widget de Recomendaciones (Product Page)

```javascript
(function() {
  'use strict';

  if (typeof LS === 'undefined' || !LS.product) return;

  // Crear widget
  const widget = document.createElement('div');
  widget.className = 'container mt-5 mb-5';
  widget.id = 'recommendations-widget';
  widget.setAttribute('data-app', 'recommendations');

  widget.innerHTML = `
    <div class="row">
      <div class="col-12">
        <h3 class="mb-4">Productos Relacionados</h3>
        <div id="recommendations-content" class="row">
          <div class="col-12">
            <p class="text-muted">Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Placement: Después de reviews
  const reviewsSection = document.querySelector('#reviewsapp');
  if (reviewsSection) {
    reviewsSection.parentNode.insertBefore(
      widget,
      reviewsSection.nextSibling
    );
  } else {
    // Fallback: al final del product container
    const productContainer = document.querySelector('.js-product-container');
    if (productContainer) {
      productContainer.appendChild(widget);
    }
  }

  // Fetch recommendations
  fetch(`https://api.example.com/recommendations/${LS.product.id}`)
    .then(res => res.json())
    .then(products => {
      const content = document.getElementById('recommendations-content');
      content.innerHTML = products.map(p => `
        <div class="col-6 col-md-4 col-lg-3 mb-3">
          <div class="card">
            <img src="${p.image}" class="card-img-top" alt="${p.name}">
            <div class="card-body">
              <h6 class="card-title">${p.name}</h6>
              <p class="card-text">${p.price}</p>
            </div>
          </div>
        </div>
      `).join('');
    });
})();
```

### Banner Informativo (Home Page)

```javascript
(function() {
  'use strict';

  // Solo en home
  if (!document.querySelector('.js-home-sections-container')) return;

  // Prevenir duplicados
  if (document.getElementById('info-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'info-banner';
  banner.className = 'container mt-4';
  banner.innerHTML = `
    <div class="alert alert-info alert-dismissible fade show" role="alert">
      <strong>¡Nuevo!</strong> Envío gratis en compras superiores a $5000.
      <button type="button" class="close" data-dismiss="alert">
        <span>&times;</span>
      </button>
    </div>
  `;

  // Placement: Al inicio del home
  const homeContainer = document.querySelector('.js-home-sections-container');
  homeContainer.insertBefore(banner, homeContainer.firstChild);
})();
```

### Enhanced Shipping Calculator

```javascript
(function() {
  'use strict';

  const shippingCalc = document.querySelector('.js-shipping-calculator-container');
  if (!shippingCalc) return;

  // Agregar info adicional ANTES del calculator
  const infoBox = document.createElement('div');
  infoBox.className = 'alert alert-success mb-3';
  infoBox.innerHTML = `
    <strong>Envío Express disponible!</strong>
    Recibí tu pedido en 24hs en CABA.
  `;

  shippingCalc.parentNode.insertBefore(infoBox, shippingCalc);
})();
```

### Exit Intent Popup

```javascript
(function() {
  'use strict';

  let shown = false;

  function showPopup() {
    if (shown) return;
    shown = true;

    const modal = document.createElement('div');
    modal.id = 'exit-intent-modal';
    modal.className = 'modal fade show d-block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">¡Espera!</h5>
            <button type="button" class="close" id="close-exit-modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Recibe 10% de descuento en tu primera compra</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary">Obtener descuento</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-exit-modal').addEventListener('click', () => {
      modal.remove();
    });
  }

  // Trigger on mouse leave (hacia arriba)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 10) {
      showPopup();
    }
  });
})();
```

## Referencias

- [Base Theme Repository](https://github.com/TiendaNube/base-theme)
- [Bootstrap 4 Documentation](https://getbootstrap.com/docs/4.6)
- [MDN - Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [Storefront Scripts Documentation](./STOREFRONT_SCRIPTS.md)

---

**Sources:**
- [Static | Documentación para Diseñadores](https://docs.tiendanube.com/help/static)
- [GitHub - TiendaNube/base-theme](https://github.com/TiendaNube/base-theme)
- [Layout | Documentación para Diseñadores](https://docs.tiendanube.com/help/layouts)

**Última actualización:** 2026-02-02
