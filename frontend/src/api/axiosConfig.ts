// src/api/axiosConfig.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { offlineDb } from '../utils/offlineDb';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const publicEndpoints = ['/auth/login', '/auth/register', '/auth/demo', '/auth/forgot-password', '/auth/reset-password'];

        const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

        if (isPublic)
            return config;

        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

        if (token)
            config.headers.set('Authorization', `Bearer ${token}`);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    async (response) => {
        if (response.config.method?.toUpperCase() === 'GET' && response.config.url) {
            try {
                await offlineDb.cache.put({
                    url: response.config.url,
                    data: response.data,
                    timestamp: Date.now()
                });
            } catch (err) {
                console.error('Failed to cache response', err);
            }
        }
        return response;
    },
    async (error) => {
        const config = error.config;
        if (!config) return Promise.reject(error);

        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || !navigator.onLine;

        if (isNetworkError) {
            const method = config.method?.toUpperCase() || 'GET';
            const url = config.url || '';

            if (method === 'GET') {
                try {
                    const cached = await offlineDb.cache.get(url);
                    if (cached) {
                        return Promise.resolve({
                            data: cached.data,
                            status: 200,
                            statusText: 'OK',
                            headers: {},
                            config,
                            isOfflineCache: true
                        });
                    }
                } catch (e) {
                    console.error('Offline cache error: ', e);
                }
            } else if (['POST', 'PUT', 'DELETE'].includes(method) && !(config as any).isSyncRequest) {
                try {
                    let payloadData = null;
                    if (config.data) {
                        payloadData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                    }

                    await offlineDb.syncQueue.add({
                        url: url,
                        method: method,
                        payload: payloadData,
                        headers: config.headers,
                        createdAt: Date.now()
                    });

                    let mockData = payloadData || {};
                    if (method === 'POST') {
                        mockData = { id: `offline-${Date.now()}`, ...mockData };
                    }

                    window.dispatchEvent(new CustomEvent('offline-sync-queued'));

                    return Promise.resolve({
                        data: mockData,
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config,
                        isOfflineQueueMock: true
                    });
                } catch (e) {
                    console.error('Offline queue error: ', e);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;