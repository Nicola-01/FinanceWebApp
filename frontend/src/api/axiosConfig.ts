// src/api/axiosConfig.ts
import axios, {type InternalAxiosRequestConfig} from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const publicEndpoints = ['/auth/login', '/auth/register'];

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