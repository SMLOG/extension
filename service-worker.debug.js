/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

importScripts(
  "wb-debug.js",
  "precache-manifest.js?_v=6f3b9d134ca37884762a62fb3fe524cd"
);

workbox.core.setCacheNameDetails({prefix: "my"});

workbox.core.skipWaiting();

workbox.core.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerNavigationRoute(workbox.precaching.getCacheKeyForURL("index.html"));

workbox.routing.registerRoute(/.*?.html/, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"index", plugins: [new workbox.cacheableResponse.Plugin({ statuses: [ 200 ] })] }), 'GET');
workbox.routing.registerRoute(/.*?word.r..js.*?/, new workbox.strategies.CacheFirst({ "cacheName":"baidu", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 8640000, purgeOnQuotaError: false }), new workbox.cacheableResponse.Plugin({ statuses: [ 0, 200 ] })] }), 'GET');
workbox.routing.registerRoute(/.*?.js.*?/, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"js", plugins: [new workbox.cacheableResponse.Plugin({ statuses: [ 200 ] })] }), 'GET');
workbox.routing.registerRoute(/.*?.css.*?/, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"css", plugins: [new workbox.cacheableResponse.Plugin({ statuses: [ 200 ] })] }), 'GET');
workbox.routing.registerRoute(/.*?.json.*?/, new workbox.strategies.NetworkFirst({ "cacheName":"index","networkTimeoutSeconds":5, plugins: [new workbox.cacheableResponse.Plugin({ statuses: [ 200 ] })] }), 'GET');
workbox.routing.registerRoute(/.*?\.(png|gif|jpg)/i, new workbox.strategies.CacheFirst({ "cacheName":"img", plugins: [new workbox.cacheableResponse.Plugin({ statuses: [ 0, 200 ] })] }), 'GET');
