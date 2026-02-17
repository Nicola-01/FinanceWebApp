import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    console.log('--- DEBUG VITE CONFIG ---')
    console.log('Current Dir:', __dirname)
    console.log('VITE_ALLOWED_HOSTS:', env.VITE_ALLOWED_HOSTS)
    console.log('-------------------------')

    return {
        plugins: [react(), tailwindcss()],
        server: {
            allowedHosts: env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',') : true,
            host: true,
            port: 5173
        }
    }
})