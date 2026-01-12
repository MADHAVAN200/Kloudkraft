import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/assessment-api': {
        target: 'https://aci6kuvhjkq7g4ecvw5kdmtyxu0gbwms.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/assessment-api/, ''),
        secure: false
      },
      '/assessment-mgmt-api': {
        target: 'https://u5vjutu2euwnn2uhiertnt6fte0vrbht.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/assessment-mgmt-api/, ''),
        secure: false
      },
      '/sql-admin-api': {
        target: 'https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sql-admin-api/, ''),
        secure: false
      },
      '/zip-upload-api': {
        target: 'https://yaqx2p2toqxk3fjgbn53rf3dii0epiji.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zip-upload-api/, ''),
        secure: false
      },
      '/content-upload-api': {
        target: 'https://cd7ybw2xammmk65arxfgovjdbq0kfkae.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/content-upload-api/, ''),
        secure: false
      },
      '/reports-api': {
        target: 'https://e7w4xx4lfm2scv4qmvat2qwskm0cjhrv.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/reports-api/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Remove the header to prevent "multiple values" error
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['Access-Control-Allow-Origin']; // Case sensitivity safety
          });
        }
      },
      '/sql-assessment-details-api': {
        target: 'https://h2qmjqyjegeqq7m7p4i3jbwk2q0xrimw.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sql-assessment-details-api/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['Access-Control-Allow-Origin'];
          });
        }
      },
      '/content-fetch-api': {
        target: 'https://2h3ttolsuw4s6owyk65rdrr6q40nahmd.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/content-fetch-api/, ''),
        secure: false
      },
      '/sql-reports-api': {
        target: 'https://w347g7cpkidsnsp3nfmg6gaf3i0fkvkq.lambda-url.eu-central-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sql-reports-api/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Remove duplicate header causing CORS error
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['Access-Control-Allow-Origin'];
          });
        }
      }
    }
  }
})
