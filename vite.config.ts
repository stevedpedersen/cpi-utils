import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // Explicitly load .env files
  envPrefix: "PUBLIC_",
/*
  // Example of creating a proxy to deal with CORS errors
  server: {
    proxy: {
      "/api": {
        target:
          "https://jnj-im-dev.it-cpi026.cfapps.eu10-002.hana.ondemand.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
*/
});
