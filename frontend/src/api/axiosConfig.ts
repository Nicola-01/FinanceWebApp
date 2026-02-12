// src/api/axiosConfig.ts
import axios, {type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Intercettore Tipizzato
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 1. Cerca il token nel browser
        const token = localStorage.getItem('jwtToken');

        // 2. Se il token esiste...
        if (token) {
            // ...lo aggiunge agli headers della richiesta
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        // 3. Lascia passare la richiesta (modificata)
        return config;
    },
    (error) => {
        // Se c'è un errore nella preparazione, blocca tutto
        return Promise.reject(error);
    }
);

export default api;