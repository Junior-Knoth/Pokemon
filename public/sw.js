const CACHE_NAME = "pokedash-v1";
const STATIC_CACHE = "pokedash-static-v1";
const DYNAMIC_CACHE = "pokedash-dynamic-v1";

// Determina o base path relativo ao próprio Service Worker
const BASE_PATH = (() => {
  try {
    const u = new URL(self.location.href);
    // Ex: /Pokemon/sw.js -> base /Pokemon/
    return u.pathname.replace(/sw\.js$/, "");
  } catch (e) {
    return "/";
  }
})();

// Arquivos essenciais para cache (resolvidos com BASE_PATH)
const STATIC_ASSETS = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",
  BASE_PATH + "icon-192.png",
  BASE_PATH + "icon-512.png",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Fazendo cache dos arquivos estáticos");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("[SW] Erro ao fazer cache dos arquivos:", error);
      }),
  );

  // Força o Service Worker a se tornar ativo imediatamente
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Remove caches antigos
            return (
              cacheName.startsWith("pokedash-") &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE
            );
          })
          .map((cacheName) => {
            console.log("[SW] Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }),
      );
    }),
  );

  // Faz com que o SW assuma o controle imediatamente
  return self.clients.claim();
});

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não são GET
  if (request.method !== "GET") {
    return;
  }

  // Ignora requisições para APIs externas (Supabase, PokeAPI, etc)
  if (url.origin !== location.origin) {
    // Network-first para APIs externas
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache das respostas de API se forem bem-sucedidas
          if (response.ok && url.hostname.includes("pokeapi.co")) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Tenta recuperar do cache em caso de falha de rede
          return caches.match(request);
        }),
    );
    return;
  }

  // Cache-first para recursos estáticos locais
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[SW] Servindo do cache:", request.url);
        return cachedResponse;
      }

      // Se não estiver no cache, busca da rede
      return fetch(request)
        .then((response) => {
          // Não faz cache de respostas inválidas
          if (
            !response ||
            response.status !== 200 ||
            response.type === "error"
          ) {
            return response;
          }

          // Clona a resposta para salvar no cache
          const responseClone = response.clone();

          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch((error) => {
          console.error("[SW] Erro ao buscar recurso:", error);

          // Retorna uma página de fallback se disponível
          if (request.destination === "document") {
            return caches.match(BASE_PATH + "index.html");
          }
        });
    }),
  );
});

// Sincronização em background (para futuras funcionalidades)
self.addEventListener("sync", (event) => {
  console.log("[SW] Sincronização em background:", event.tag);

  if (event.tag === "sync-pokemon-data") {
    event.waitUntil(
      // Aqui você pode adicionar lógica para sincronizar dados
      Promise.resolve(),
    );
  }
});

// Notificações push (para futuras funcionalidades)
self.addEventListener("push", (event) => {
  console.log("[SW] Push recebido");

  const options = {
    body: event.data ? event.data.text() : "Nova atualização disponível!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification("PokeDash", options));
});
