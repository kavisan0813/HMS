import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
//http://192.168.1.44:8081
//https://api.hms.viyaninfo.com
//https://safe-hands-hms-backend.onrender.com
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://api.hms.viyaninfo.com",
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: "https://hms.viyaninfo.com",
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("origin", "https://hms.viyaninfo.com");
          });
        },
      },
      "/uploads": {
        target: "https://api.hms.viyaninfo.com",
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: "https://hms.viyaninfo.com",
        },
      },
    },
  },
});
