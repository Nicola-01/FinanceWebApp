import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faTriangleExclamation, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import { triggerToast } from '../components/ui/ToastNotification.tsx';

interface Requirements {
    username?: string;
    password?: string;
}

export const LoginForm: React.FC = () => {
    // Input references
    const username = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const rememberMe = useRef<HTMLInputElement>(null);

    // Component states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [require, setRequire] = useState<Requirements>({});
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // If redirected from a protected page (e.g., OAuth consent), go back after login
    const returnTo: string = (location.state as any)?.from?.pathname || '/';

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const requirements: Requirements = {};
        let isValid = true;

        // Validation
        if (!username.current?.value) {
            requirements.username = "Username is required";
            isValid = false;
        }

        if (!password.current?.value) {
            requirements.password = "Password is required";
            isValid = false;
        }

        setRequire(requirements);

        // If validation fails, trigger shake animation and abort
        if (!isValid) {
            setLoading(false);
            setError('shake');
            setTimeout(() => setError(''), 500);
            return;
        }

        // API Call
        try {
            const response = await api.post('/auth/login', {
                username: username.current?.value,
                password: password.current?.value,
                rememberMe: rememberMe.current?.checked
            });

            const { token, passwordMustChange } = response.data;

            localStorage.setItem('mustChangePWD', JSON.stringify(passwordMustChange));

            // Store token based on 'Remember Me' preference
            if (rememberMe.current?.checked)
                localStorage.setItem('jwtToken', token);
            else
                sessionStorage.setItem('jwtToken', token);

            navigate(returnTo);

        } catch (err: any) {
            // Error handling & shake animation
            setError('shake');
            setTimeout(() => setError(''), 500);

            const title = err.response?.data?.title || "Connection Error.";
            triggerToast(title, false);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className={`relative z-10 flex w-full max-w-[380px] flex-col items-center rounded-3xl border border-app-border bg-app-transparent p-6 sm:p-12 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            onSubmit={handleSubmit}
            noValidate
        >
            {/* Avatar Header */}
            <div className="mb-5 sm:mb-8">
                <div
                    className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-app-input border border-app-border">
                    <FontAwesomeIcon icon={faUser} className="text-2xl sm:text-3xl text-app-text" />
                </div>
            </div>

            {/* Username Input */}
            <div className="relative mb-5 sm:mb-8 w-full">
                <div
                    className={`relative flex items-center border-b pb-1 transition-colors duration-300 ${require.username ? 'theme-border-danger' : 'border-app-border focus-within:border-app-text'}`}>
                    <span className="absolute left-0 text-lg text-app-text">
                        <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                        ref={username}
                        type="text"
                        placeholder="Username"
                        className="w-full border-none theme-bg-transparent py-2 pl-8 text-app-text placeholder-app-muted outline-none"
                    />
                </div>
                {/* Username Error Tooltip */}
                {require.username && (
                    <span
                        className="absolute -bottom-6 left-0 flex animate-pulse items-center gap-2 text-sm theme-text-danger">
                        <FontAwesomeIcon icon={faTriangleExclamation} /> {require.username}
                    </span>
                )}
            </div>

            {/* Password Input */}
            <div className="relative mb-5 sm:mb-8 w-full">
                <div
                    className={`relative flex items-center border-b pb-1 transition-colors duration-300 ${require.password ? 'theme-border-danger' : 'border-app-border focus-within:border-app-text'}`}>
                    <span className="absolute left-0 text-lg text-app-text">
                        <FontAwesomeIcon icon={faLock} />
                    </span>
                    <input
                        ref={password}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full border-none theme-bg-transparent py-2 pl-8 pr-8 text-app-text placeholder-app-muted outline-none"
                    />
                    {/* Toggle Visibility Button */}
                    <span
                        className="absolute right-0 z-20 cursor-pointer text-app-muted transition-colors hover:text-app-text"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                </div>
                {/* Password Error Tooltip */}
                {require.password && (
                    <span
                        className="absolute -bottom-6 left-0 flex animate-pulse items-center gap-2 text-sm theme-text-danger">
                        <FontAwesomeIcon icon={faTriangleExclamation} /> {require.password}
                    </span>
                )}
            </div>

            {/* Options (Remember Me / Forgot Password) */}
            <div className="mb-6 sm:mb-8 flex w-full items-center justify-between text-sm text-app-text">
                <label className="group flex cursor-pointer select-none items-center">
                    <div className="relative">
                        <input
                            type="checkbox"
                            ref={rememberMe}
                            className="peer h-4 w-4 appearance-none rounded border border-app-border bg-app-hover transition-all checked:border-app-text checked:bg-app-text cursor-pointer"
                        />
                        <svg
                            className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-app-card opacity-0 transition-opacity peer-checked:opacity-100"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span className="ml-2 font-light transition-colors group-hover:text-app-text">Remember me</span>
                </label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="font-light italic transition-colors hover:text-app-text hover:underline theme-bg-transparent border-none text-app-text cursor-pointer text-sm p-0">
                    Forgot Password?
                </button>
            </div>

            {/* Login Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-app-purple to-app-blue py-3 font-semibold tracking-wider theme-text-default shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {loading ? 'LOADING...' : 'LOGIN'}
            </button>
        </form>
    );
};