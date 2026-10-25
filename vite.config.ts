import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: '/face-exercises/',
  plugins: [vue(), VitePWA({registerType:'autoUpdate',includeAssets:['favicon.svg'],manifest:{name:'Face Ritual',short_name:'Face Ritual',description:'Утренняя практика для лица',theme_color:'#f5f0e8',background_color:'#f5f0e8',display:'standalone',start_url:'/face-exercises/',scope:'/face-exercises/',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,json,png,webp}'],maximumFileSizeToCacheInBytes:4*1024*1024}})]
});
