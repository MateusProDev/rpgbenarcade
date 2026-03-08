import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          pixi:     ['pixi.js'],
          three:    ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  // Garante que arquivos .glb sejam servidos como assets binários
  assetsInclude: ['**/*.glb', '**/*.gltf'],
});
