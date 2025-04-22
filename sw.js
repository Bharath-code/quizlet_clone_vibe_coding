const CACHE_NAME = "quizlet-clone-cache-v1"
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json", // Added manifest
  // Add other static assets like CSS, JS, images if they exist
  // '/styles.css',
  // '/script.js',
  // '/icons/icon-192x192.png', // Assuming these exist, uncomment if needed
  // '/icons/icon-512x512.png'  // Assuming these exist, uncomment if needed
]

// Install event: Cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    })
  )
})

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event: Serve cached assets or fetch from network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Clone the request because it's a stream and can only be consumed once
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response
          }

          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch((error) => {
          // Handle fetch errors, e.g., network errors when offline
          console.error("SW Fetch failed:", error)
          // Optionally return a fallback page or response
          // return caches.match('/offline.html');
          // Rethrowing the error will still cause an uncaught promise rejection
          // if not handled further up. For now, just logging.
          // If you want to avoid the console error entirely, return a generic Response or null.
          // return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        })
    })
  )
})
