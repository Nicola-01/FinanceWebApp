import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // Importa path per sicurezza

export default defineConfig(({mode}) => {
    const envDirectory = path.resolve(__dirname, '..');
    const env = loadEnv(mode, envDirectory, '');

    console.log('--- DEBUG VITE CONFIG ---')
    console.log('Current Dir:', __dirname)
    console.log('Env Dir:', envDirectory)
    console.log('VITE_ALLOWED_HOSTS:', env.VITE_ALLOWED_HOSTS)
    console.log('VITE_API_URL:', env.VITE_API_URL)
    console.log('-------------------------')

    return {
        plugins: [react(), tailwindcss()],
        server: {
            allowedHosts: env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',') : true,
            host: true,
            port: 5173
        },
        envDir: envDirectory, // Usiamo la stessa costante qui
    }
})