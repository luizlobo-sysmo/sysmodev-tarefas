import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 8003, na faixa 80xx dos projetos de Desenvolvimento: 8001 e dos Simuladores e
    // 8002 do Controle de Horas. Porta repetida deixaria o Painel sem saber qual
    // projeto esta no ar.
    port: 8003,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5003',
        changeOrigin: true,
      },
    },
  },
});
