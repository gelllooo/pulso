import { defineConfig, loadEnv } from "vite";
import { assertPublicSupabaseKey } from "./scripts/public-config.mjs";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  assertPublicSupabaseKey(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  assertPublicSupabaseKey(env.VITE_SUPABASE_ANON_KEY);
  return {
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        injectRegister: "auto",
        includeAssets: ["logo.svg", "icons/*.png"],
        manifest: {
          id: "/",
          name: "PULSO Marinduque",
          short_name: "PULSO",
          description:
            "Community preparedness and offline incident reporting for Marinduque",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "any",
          background_color: "#fbfaf6",
          theme_color: "#0c233c",
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2,json}"],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: "index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          // API and Supabase responses are never cached by the service worker; private data is account-scoped in Dexie.
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                !url.pathname.startsWith("/api/") &&
                /\.(?:woff2?|png|svg|css)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "pulso-local-assets",
                expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: { port: 5173, host: true },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            map: ["leaflet", "react-leaflet"],
            database: ["dexie", "@supabase/supabase-js"],
          },
        },
      },
    },
  };
});
