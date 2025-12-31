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
      }
    }
  }
})
