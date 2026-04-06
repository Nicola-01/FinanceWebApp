import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
    const envDirectory = path.resolve(__dirname, '..');
    const env = loadEnv(mode, envDirectory, '');

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
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'prompt',
                includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
                manifest: {
                    name: 'Finance Web App',
                    short_name: 'FinanceApp',
                    description: 'Track your wallets and transactions offline!',
                    theme_color: '#0d0d12',
                    background_color: '#0d0d12',
                    display: 'standalone',
                    icons: [
                        {
                            src: 'pwa-64x64.png',
                            sizes: '64x64',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'maskable-icon-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable'
                        }
                    ]
                },
                workbox: {
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'gstatic-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        }
                    ]
                }
            })
        ],
        server: {
            allowedHosts: allowedHosts.length > 0 ? allowedHosts : true,
            host: true,
            port: 5173
        },
        envDir: envDirectory,
    }
})