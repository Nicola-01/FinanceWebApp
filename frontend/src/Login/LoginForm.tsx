import React, { useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faTriangleExclamation, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import { triggerToast } from '../Components/ToastNotification.tsx';

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

            const { token, role, passwordMustChange } = response.data;

            localStorage.setItem('mustChange', JSON.stringify(passwordMustChange));

            // Store token based on 'Remember Me' preference
            if (rememberMe.current?.checked) {
                localStorage.setItem('jwtToken', token);
            } else {
                sessionStorage.setItem('jwtToken', token);
            }

            // Role-based routing
            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }

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
            className={`relative z-10 flex w-[380px] flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-12 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            onSubmit={handleSubmit}
            noValidate
        >
            {/* Avatar Header */}
            <div className="mb-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-white/80" />
                </div>
            </div>

            {/* Username Input */}
            <div className="relative mb-8 w-full">
                <div className={`relative flex items-center border-b pb-1 transition-colors duration-300 ${require.username ? 'border-red-500' : 'border-white/50 focus-within:border-white'}`}>
                    <span className="absolute left-0 text-lg text-white/80">
                        <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                        ref={username}
                        type="text"
                        placeholder="Username"
                        className="w-full border-none bg-transparent py-2 pl-8 text-white placeholder-white/70 outline-none"
                    />
                </div>
                {/* Username Error Tooltip */}
                {require.username && (
                    <span className="absolute -bottom-6 left-0 flex animate-pulse items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon icon={faTriangleExclamation} /> {require.username}
                    </span>
                )}
            </div>

            {/* Password Input */}
            <div className="relative mb-8 w-full">
                <div className={`relative flex items-center border-b pb-1 transition-colors duration-300 ${require.password ? 'border-red-500' : 'border-white/50 focus-within:border-white'}`}>
                    <span className="absolute left-0 text-lg text-white/80">
                        <FontAwesomeIcon icon={faLock} />
                    </span>
                    <input
                        ref={password}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full border-none bg-transparent py-2 pl-8 pr-8 text-white placeholder-white/70 outline-none"
                    />
                    {/* Toggle Visibility Button */}
                    <span
                        className="absolute right-0 z-20 cursor-pointer text-white/50 transition-colors hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </span>
                </div>
                {/* Password Error Tooltip */}
                {require.password && (
                    <span className="absolute -bottom-6 left-0 flex animate-pulse items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon icon={faTriangleExclamation} /> {require.password}
                    </span>
                )}
            </div>

            {/* Options (Remember Me / Forgot Password) */}
            <div className="mb-8 flex w-full items-center justify-between text-sm text-white/80">
                <label className="group flex cursor-pointer select-none items-center">
                    <div className="relative">
                        <input
                            type="checkbox"
                            ref={rememberMe}
                            className="peer h-4 w-4 appearance-none rounded border border-white/40 bg-white/10 transition-all checked:border-white checked:bg-white cursor-pointer"
                        />
                        <svg className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-[#230b38] opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span className="ml-2 font-light transition-colors group-hover:text-white">Remember me</span>
                </label>
                <a href="#" className="font-light italic transition-colors hover:text-white hover:underline">
                    Forgot Password?
                </a>
            </div>

            {/* Login Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-[#4b1a69] to-[#4d6dff] py-3 font-semibold tracking-wider text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {loading ? 'LOADING...' : 'LOGIN'}
            </button>
        </form>
    );
};