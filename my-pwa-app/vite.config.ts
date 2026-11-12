import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "fonts/*.woff2", "images/*.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/categories(?:\/|$)/],
      },
      manifest: {
        name: "여기, 차차 · chachaMap",
        short_name: "여기, 차차",
        description: "충남대학교 식사 공간 혼잡도와 캠퍼스 생활 안내",
        theme_color: "#131313",
        background_color: "#131313",
        display: "standalone",
        //orientation: 'portrait', // 모바일 규격으로 보기
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
