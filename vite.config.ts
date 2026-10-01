import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

//http://192.168.1.44:8081
//https://api.hms.viyaninfo.com
//https://safe-hands-hms-backend.onrender.com
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      "/api": {
        // target: "http://192.168.1.52:8888",
        target: "https://api.hms.viyaninfo.com",
        changeOrigin: true,
        secure: true,
        headers: {
          // Origin: "http://192.168.1.52:8888",
          Origin: "https://api.hms.viyaninfo.com",
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // proxyReq.setHeader("origin", "http://192.168.1.52:8888 ");
            proxyReq.setHeader("origin", "https://api.hms.viyaninfo.com");
          });
        },
      },
      "/uploads": {
        // target: "http://192.168.1.52:8888",
        target: "https://api.hms.viyaninfo.com",
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: "http://192.168.1.52:8888",
        },
      },
    },
  },
});
