// Service Worker — PWA کندو
const CACHE_NAME = "kandoo-v6";
const STATIC_ASSETS = ["/manifest.json", "/bee-colori-logo.png", "/offline"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// شبکه های ناپایدار (VPN و…) گاهی fetch را یک باره رد می کنند
// چند بار تلاش مجدد می کنیم تا صفحه آفلاین اشتباهی نمایش داده نشود
async function fetchWithRetry(request, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(request);
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await wait(600 * (i + 1));
    }
  }
  throw lastError;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // فقط مسیرهای نسبی همان دامنه را کش کن
  if (url.origin !== self.location.origin) return;

  // API ها و RSC را هرگز کش نکن — دیتای تازه فقط وقتی آنلاین است
  if (url.pathname.startsWith("/api/")) return;
  if (url.searchParams.has("_rsc")) return;
  if (url.searchParams.has("__flight__")) return;
  if (request.headers.get("RSC") === "1") return;
  if (request.headers.get("Next-Router-State-Tree")) return;
  if (request.headers.get("Next-Router-Prefetch")) return;
  if (request.cache === "reload") return;

  // دارایی های Next.js (JS/CSS هش شده) — کش کن تا اپ در حالت آفلاین هم بالا بیاید
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // navigation ها: network-first — آفلاین اول صفحه کش شده، در آخر صفحه آفلاین
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetchWithRetry(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match("/offline"));
        })
    );
    return;
  }

  // فایل های استاتیک (عکس ها، آیکن ها و…) را stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// دریافت push notification
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    // نام برند اپ (برندهای مارکتی) به عنوان پیشوند عنوان نوتیف می آید
    const title = data.appName ? `${data.appName} — ${data.title || ""}` : data.title || "کندو";
    const options = {
      body: data.body || "",
      icon: data.icon || "/bee-colori-logo.png",
      badge: data.badge || "/bee-colori-logo.png",
      data: data.data || {},
      vibrate: [100, 50, 100],
      dir: "rtl",
      lang: "fa",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    event.waitUntil(self.registration.showNotification("کندو", { body: "پیام جدید" }));
  }
});

// کلیک روی نوتیفیکیشن — باز کردن اپ
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
