import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // O Firebase sozinho passa de 500 kB (190 kB comprimido). É esperado e fica em cache.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Separa as bibliotecas grandes em arquivos próprios.
        // Elas quase nunca mudam, então o navegador reaproveita o cache entre deploys
        // e só baixa de novo o código do app.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
