import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { handleFtcRequest } from './server/ftc-api.js'

/**
 * No `npm run dev`, responde /api/ftc com a MESMA função que roda na Vercel.
 * O token vem do .env.local (FTC_API_USERNAME e FTC_API_KEY) e nunca vai pro navegador.
 */
function ftcApiDevServer(env) {
  return {
    name: 'ftc-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/ftc', async (req, res) => {
        const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
        const result = await handleFtcRequest(query, env)
        res.writeHead(result.status, result.headers)
        res.end(result.body)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // '' = carrega TODAS as variáveis do .env.local, não só as VITE_. Só a ponte usa as outras.
  plugins: [react(), ftcApiDevServer(loadEnv(mode, process.cwd(), ''))],
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
}))
