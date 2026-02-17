// src/api/axiosConfig.ts
import axios, {type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    // baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 1. Definiamo gli endpoint pubblici (che non vogliono il token)
        const publicEndpoints = ['/auth/login', '/auth/register'];

        // Controlliamo se l'URL attuale è tra quelli pubblici
        const isPublic = publicEndpoints.some(endpoint => config.url?.endsWith(endpoint));

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

export default api;