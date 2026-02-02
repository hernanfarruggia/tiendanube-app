/**
 * Tiendanube Storefront Script - Enhanced Searchbox
 *
 * Features:
 * - Injects searchbox in product pages
 * - 250ms debouncer for input
 * - Console logs user input
 * - Responsive Bootstrap styling
 *
 * Event: onfirstinteraction (recommended)
 * Location: store
 */

(function () {
  'use strict';

  // Guard: Validate LS object availability
  if (typeof LS === 'undefined') {
    console.warn('[Searchbox] LS object not available');
    return;
  }

  console.log('[Searchbox] Initializing on store:', LS.store.id);

  /**
   * Debounce utility
   * Delays function execution until after wait time has elapsed
   * since the last time it was invoked
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Creates searchbox HTML element
   */
  function createSearchbox() {
    const container = document.createElement('div');
    container.className = 'container mt-4 mb-4';
    container.id = 'app-searchbox-container';
    container.setAttribute('data-app', 'enhanced-search');

    container.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">
                <svg width="20" height="20" fill="currentColor" class="me-2" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
                Búsqueda Avanzada
              </h5>
              <div class="input-group">
                <input
                  type="text"
                  class="form-control"
                  id="app-searchbox-input"
                  placeholder="Buscar productos..."
                  aria-label="Buscar productos"
                >
                <button class="btn btn-outline-secondary" type="button" id="app-searchbox-clear">
                  Limpiar
                </button>
              </div>
              <small class="text-muted d-block mt-2">
                Los resultados aparecen mientras escribes
              </small>
            </div>
          </div>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Handles search input with logging
   */
  function handleSearch(value) {
    console.log('[Searchbox] User input:', value);

    // Aquí irían las llamadas a tu API/backend
    // Por ahora solo loggeamos
    if (value.trim().length > 0) {
      console.log('[Searchbox] Searching for:', value.trim());
      console.log('[Searchbox] Store context:', {
        storeId: LS.store.id,
        storeUrl: LS.store.url,
        currency: LS.currency?.code
      });
    }
  }

  /**
   * Finds best placement location in DOM
   */
  function findPlacementLocation() {
    // Estrategia: Buscar múltiples opciones de placement
    const selectors = [
      '.js-home-sections-container', // Home page
      // '.js-product-container',      // Product pages
      // '#single-product',             // Product detail page
      // '.container:first-of-type',    // First container (fallback)
      'main',                        // Main element (fallback)
      'body'                         // Last resort
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[Searchbox] Placement found:', selector);
        return element;
      }
    }

    console.warn('[Searchbox] No ideal placement found, using body');
    return document.body;
  }

  /**
   * Injects searchbox into DOM
   */
  function injectSearchbox() {
    // Check if already injected (avoid duplicates)
    if (document.getElementById('app-searchbox-container')) {
      console.warn('[Searchbox] Already injected, skipping');
      return;
    }

    const placementElement = findPlacementLocation();
    const searchbox = createSearchbox();

    // Insert at the beginning of the container
    if (placementElement === document.body) {
      placementElement.appendChild(searchbox);
    } else {
      placementElement.insertBefore(searchbox, placementElement.firstChild);
    }

    console.log('[Searchbox] Injected successfully');
  }

  /**
   * Attaches event listeners
   */
  function attachEventListeners() {
    const input = document.getElementById('app-searchbox-input');
    const clearBtn = document.getElementById('app-searchbox-clear');

    if (!input) {
      console.error('[Searchbox] Input element not found');
      return;
    }

    // Debounced search handler (250ms)
    const debouncedSearch = debounce((value) => {
      handleSearch(value);
    }, 250);

    // Input event with debounce
    input.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        console.log('[Searchbox] Cleared');
      });
    }

    // Enter key handler
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        console.log('[Searchbox] Enter pressed, value:', input.value);
        // Aquí podrías trigger una búsqueda inmediata o navegar a resultados
      }
    });

    console.log('[Searchbox] Event listeners attached');
  }

  /**
   * Initialization
   */
  function init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          injectSearchbox();
          attachEventListeners();
        });
      } else {
        // DOM already loaded
        injectSearchbox();
        attachEventListeners();
      }
    } catch (error) {
      console.error('[Searchbox] Initialization error:', error);
    }
  }

  // Start
  init();

})();
