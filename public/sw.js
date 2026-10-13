// Minimal service worker so browsers treat the site as an installable app.
// It deliberately caches nothing: church data and logins must always come live from Supabase.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
