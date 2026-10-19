// ============================================================================
// BELLA PDV - SERVICE WORKER OFFLINE ENGINE
// Versão 2.0.0 - Suporte robusto para WebAPK Android, PWA & Operação Offline
// ============================================================================

const CACHE_VERSION = 'bella-pdv-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// Lista de ativos essenciais para o Shell do Aplicativo (App Shell)
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// ============================================================================
// 1. INSTALAÇÃO DO SERVICE WORKER (Pré-cache resiliente)
// ============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Usar Promise.allSettled para garantir que a falha de um único ativo não aborte a instalação
      const cachePromises = ESSENTIAL_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.status === 200) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[ServiceWorker] Falha ao pré-carregar ativo:', url, err);
        }
      });
      await Promise.allSettled(cachePromises);
    }).then(() => {
      // Forçar o Service Worker recém-instalado a se tornar ativo imediatamente
      return self.skipWaiting();
    })
  );
});

// ============================================================================
// 2. ATIVAÇÃO E LIMPEZA DE CACHES OBSOLETOS
// ============================================================================
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, FONT_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deleta versões antigas de caches do Bella PDV
          if (!currentCaches.includes(cacheName) && cacheName.startsWith('bella-pdv-')) {
            console.log('[ServiceWorker] Removendo cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Reivindica o controle de todas as abas e clientes imediatamente
      return self.clients.claim();
    })
  );
});

// ============================================================================
// 3. INTERCEPTAÇÃO DE REQUISIÇÕES (FETCH) E ESTRATÉGIAS DE CACHE
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar métodos não-GET (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar protocolos especiais (ex: chrome-extension, data:, blob:)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  const url = new URL(request.url);

  // Ignorar requisições de API backend, endpoints ao vivo e serviços de autenticação externa
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/live') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  // --------------------------------------------------------------------------
  // Estratégia A: Google Fonts (Cache-First com longa duração)
  // --------------------------------------------------------------------------
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cachedResponse;
        }
      })
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Estratégia B: Requisições de Navegação (Rotas SPA do React Router)
  // --------------------------------------------------------------------------
  // Quando o app é aberto offline ou uma rota é recarregada (/pos, /clients, /settings):
  // Tenta a rede; se falhar (offline), retorna o index.html em cache (App Shell).
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // Dispositivo está OFFLINE!
          // 1. Tentar encontrar a rota específica no cache
          const cachedRoute = await caches.match(request);
          if (cachedRoute) return cachedRoute;

          // 2. Recuar para o App Shell (index.html) para que o React Router carregue a interface
          const appShell = await caches.match('/index.html') || await caches.match('/');
          if (appShell) return appShell;

          // 3. Fallback de emergência caso nenhum index.html esteja disponível
          return new Response(
            '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bella PDV - Modo Offline</title><style>body{background:#05070F;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}h1{color:#10b981;font-size:24px}p{color:#94a3b8;font-size:14px}button{background:#10b981;color:#05070F;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;margin-top:15px}</style></head><body><div><h1>Bella PDV Offline</h1><p>Você está desconectado. Conecte-se à internet para atualizar os dados.</p><button onclick="window.location.reload()">Tentar Novamente</button></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Estratégia C: Ativos Estáticos da Aplicação (Scripts JS, CSS, Imagens, Ícones)
  // --------------------------------------------------------------------------
  // Stale-While-Revalidate: entrega a versão em cache imediatamente e atualiza em segundo plano.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(DYNAMIC_CACHE);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Em caso de erro de rede, apenas retorna o cache existente
            return cachedResponse;
          });

        // Se houver no cache, retorna imediatamente para evitar tela em branco;
        // caso contrário, aguarda o download pela rede.
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// ============================================================================
// 4. SUPORTE A MENSAGENS ENTRE JANELA E SERVICE WORKER
// ============================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
