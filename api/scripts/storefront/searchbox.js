/**
 * Tiendanube Storefront Script - AI Search Widget
 *
 * Features:
 * - Conversational AI product search
 * - ChatGPT-style interface with accordion
 * - Product recommendations with cart integration
 * - Typewriting placeholder animation
 * - Session persistence via localStorage
 *
 * Event: onfirstinteraction (recommended)
 * Location: store
 */

(function () {
  'use strict';

  const API_URL = window.AI_SEARCH_API_URL || 'https://api-tiendanube.wearekadre.com';

  if (typeof LS === 'undefined') {
    console.warn('[AI Search] LS object not available');
    return;
  }

  console.log('[AI Search] Initializing on store:', LS.store.id);

  let sessionId = localStorage.getItem('ai_search_session_id');
  let placeholders = [];
  let currentPlaceholderIndex = 0;
  let isTyping = false;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async function initSession() {
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem('ai_search_session_id', sessionId);
    }
  }

  async function fetchPlaceholders() {
    try {
      const response = await fetch(`${API_URL}/products/placeholders?store=${LS.store.id}`);
      if (!response.ok) throw new Error('Failed to fetch placeholders');
      const data = await response.json();
      placeholders = data.placeholders || getDefaultPlaceholders();
    } catch (error) {
      console.error('[AI Search] Placeholder fetch error:', error);
      placeholders = getDefaultPlaceholders();
    }
    startTypewriterEffect();
  }

  function getDefaultPlaceholders() {
    return [
      '¿Buscas un regalo especial?',
      'Productos en oferta',
      '¿Qué necesitas hoy?',
      'Busco algo para...',
    ];
  }

  function typewriterEffect(text, callback) {
    const input = document.getElementById('ai-search-input');
    if (!input || isTyping) return;

    isTyping = true;
    let i = 0;
    input.placeholder = '';

    const interval = setInterval(() => {
      if (i < text.length) {
        input.placeholder += text.charAt(i);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          isTyping = false;
          if (callback) callback();
        }, 3000);
      }
    }, 50);
  }

  function startTypewriterEffect() {
    if (placeholders.length === 0) return;

    typewriterEffect(placeholders[currentPlaceholderIndex], () => {
      currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
      startTypewriterEffect();
    });
  }

  function createWidget() {
    const container = document.createElement('div');
    container.id = 'ai-search-widget';
    container.innerHTML = `
      <style>
        #ai-search-widget {
          margin: 20px auto;
          max-width: 800px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .ai-search-accordion {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ai-search-header {
          padding: 16px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px 8px 0 0;
        }
        .ai-search-header:hover {
          opacity: 0.9;
        }
        .ai-search-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          font-size: 16px;
        }
        .ai-search-icon {
          margin-right: 10px;
          width: 24px;
          height: 24px;
        }
        .ai-search-toggle {
          transition: transform 0.3s;
        }
        .ai-search-toggle.open {
          transform: rotate(180deg);
        }
        .ai-search-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .ai-search-content.open {
          max-height: 800px;
        }
        .ai-search-body {
          padding: 20px;
        }
        .ai-chat-history {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 16px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .ai-message {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          max-width: 80%;
          word-wrap: break-word;
        }
        .ai-message.user {
          background: #667eea;
          color: white;
          margin-left: auto;
          text-align: right;
        }
        .ai-message.assistant {
          background: white;
          border: 1px solid #e0e0e0;
        }
        .ai-products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .ai-product-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          transition: box-shadow 0.2s;
        }
        .ai-product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .ai-product-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .ai-product-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
          color: #333;
        }
        .ai-product-price {
          color: #667eea;
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .ai-add-cart-btn {
          width: 100%;
          padding: 8px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ai-add-cart-btn:hover {
          background: #5568d3;
        }
        .ai-add-cart-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .ai-input-container {
          display: flex;
          gap: 10px;
        }
        #ai-search-input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        #ai-search-input:focus {
          outline: none;
          border-color: #667eea;
        }
        #ai-send-btn {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        #ai-send-btn:hover:not(:disabled) {
          background: #5568d3;
        }
        #ai-send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .ai-typing {
          display: none;
          padding: 10px;
          color: #666;
          font-style: italic;
        }
        .ai-typing.show {
          display: block;
        }
        .ai-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #4caf50;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 10000;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { transform: translateX(400px); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          #ai-search-widget {
            margin: 10px;
          }
          .ai-products {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="ai-search-accordion">
        <div class="ai-search-header" onclick="window.aiSearch.toggle()">
          <div class="ai-search-title">
            <svg class="ai-search-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            Búsqueda Inteligente con IA
          </div>
          <svg class="ai-search-toggle" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>
        </div>
        <div class="ai-search-content">
          <div class="ai-search-body">
            <div class="ai-chat-history" id="ai-chat-history"></div>
            <div class="ai-typing" id="ai-typing">Pensando...</div>
            <div class="ai-input-container">
              <input
                type="text"
                id="ai-search-input"
                placeholder="¿Qué estás buscando?"
                onkeypress="if(event.key==='Enter') window.aiSearch.send()"
              />
              <button id="ai-send-btn" onclick="window.aiSearch.send()">Enviar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    return container;
  }

  function findPlacementLocation() {
    const selectors = ['.js-home-sections-container', 'main', 'body'];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return document.body;
  }

  function inject() {
    if (document.getElementById('ai-search-widget')) return;

    const placement = findPlacementLocation();
    const widget = createWidget();

    if (placement === document.body) {
      placement.appendChild(widget);
    } else {
      placement.insertBefore(widget, placement.firstChild);
    }

    console.log('[AI Search] Widget injected');
  }

  function toggle() {
    const content = document.querySelector('.ai-search-content');
    const toggleIcon = document.querySelector('.ai-search-toggle');

    if (content && toggleIcon) {
      content.classList.toggle('open');
      toggleIcon.classList.toggle('open');
    }
  }

  function addMessage(role, content) {
    const history = document.getElementById('ai-chat-history');
    if (!history) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${role}`;
    messageDiv.textContent = content;
    history.appendChild(messageDiv);
    history.scrollTop = history.scrollHeight;
  }

  function showProducts(products) {
    const history = document.getElementById('ai-chat-history');
    if (!history || products.length === 0) return;

    const productsDiv = document.createElement('div');
    productsDiv.className = 'ai-products';

    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'ai-product-card';

      const image = product.images?.[0]?.src || '';
      const name = product.name?.es || product.name?.en || product.name?.pt || 'Producto';
      const price = product.price || 'N/A';

      card.innerHTML = `
        <img src="${image}" alt="${name}" class="ai-product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23ddd%22 width=%22150%22 height=%22150%22/%3E%3C/svg%3E'" />
        <div class="ai-product-name">${name}</div>
        <div class="ai-product-price">${LS.currency?.display_short || '$'}${price}</div>
        <button class="ai-add-cart-btn" onclick="window.aiSearch.addToCart(${product.id})">
          Agregar al Carrito
        </button>
      `;

      productsDiv.appendChild(card);
    });

    history.appendChild(productsDiv);
    history.scrollTop = history.scrollHeight;
  }

  async function send() {
    const input = document.getElementById('ai-search-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const typing = document.getElementById('ai-typing');

    if (!input || !input.value.trim()) return;

    const message = input.value.trim();
    input.value = '';

    addMessage('user', message);

    sendBtn.disabled = true;
    typing.classList.add('show');

    try {
      const lang = LS.lang || 'es';
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          store_id: LS.store.id,
          language: lang,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      addMessage('assistant', data.message);

      if (data.products && data.products.length > 0) {
        showProducts(data.products);
      }
    } catch (error) {
      console.error('[AI Search] Send error:', error);
      addMessage('assistant', 'Lo siento, hubo un error. Por favor intenta de nuevo.');
    } finally {
      sendBtn.disabled = false;
      typing.classList.remove('show');
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'ai-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  async function addToCart(productId) {
    try {
      if (typeof LS !== 'undefined' && LS.addToCart) {
        await LS.addToCart(productId, 1);
        showToast('Producto agregado al carrito');
      } else {
        showToast('Error: LS.addToCart no disponible');
      }
    } catch (error) {
      console.error('[AI Search] Add to cart error:', error);
      showToast('Error al agregar al carrito');
    }
  }

  async function init() {
    try {
      await initSession();

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          inject();
          fetchPlaceholders();
        });
      } else {
        inject();
        fetchPlaceholders();
      }

      window.aiSearch = { toggle, send, addToCart };
    } catch (error) {
      console.error('[AI Search] Init error:', error);
    }
  }

  init();
})();
