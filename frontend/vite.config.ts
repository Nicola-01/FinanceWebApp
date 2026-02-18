import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({mode}) => {
    const envDirectory = path.resolve(__dirname, '..');
    const env = loadEnv(mode, envDirectory, '');

    // Logica di pulizia: rimuove protocollo e slash finali
    const rawHosts = env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',') : [];
    const allowedHosts = rawHosts.map(host =>
        host.trim()
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '')
    );

    console.log('--- DEBUG VITE CONFIG ---')
    console.log('Current Dir:', __dirname)
    console.log('Env Dir:', envDirectory)
    console.log('RAW VITE_ALLOWED_HOSTS:', env.VITE_ALLOWED_HOSTS)
    console.log('CLEANED ALLOWED HOSTS:', allowedHosts)
    console.log('VITE_API_URL:', env.VITE_API_URL)
    console.log('-------------------------')

    return {
        plugins: [react(), tailwindcss()],
        server: {
            allowedHosts: allowedHosts.length > 0 ? allowedHosts : true,
            host: true,
            port: 5173
        },
        envDir: envDirectory,
    }
})