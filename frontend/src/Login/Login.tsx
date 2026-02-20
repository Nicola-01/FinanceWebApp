import React, {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faUser,
    faLock,
    faTriangleExclamation,
    faEye,
    faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import {useNavigate} from "react-router-dom";
import Sphere from '../assets/Sphere';
import api from '../api/axiosConfig';

// Nota: Rimuovi l'import di Login.css!

import {triggerToast} from '../Components/ToastNotification.tsx';

interface Requirements {
    username?: string;
    password?: string;
}

const Form: React.FC = () => {
    const username = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const rememberMe = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [require, setRequire] = useState<Requirements>({});
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const requirements: Requirements = {};
        let isValid = true;

        if (!username.current?.value) {
            requirements.username = "Username is required";
            isValid = false;
        }

        if (!password.current?.value) {
            requirements.password = "Password is required";
            isValid = false;
        }

        setRequire(requirements);

        if (!isValid) {
            setLoading(false);
            setError('shake');
            setTimeout(() => setError(''), 500);
            return;
        }

        try {
            const response = await api.post('/auth/login', {
                username: username.current?.value,
                password: password.current?.value,
                rememberMe: rememberMe.current?.checked
            });

            const {token, role, passwordMustChange} = response.data;

            localStorage.setItem('mustChange', JSON.stringify(passwordMustChange));

            if (rememberMe.current?.value)
                localStorage.setItem('jwtToken', token);
            else
                sessionStorage.setItem('jwtToken', token);

            if (role === 'ADMIN')
                navigate('/admin/dashboard');
            else
                navigate('/dashboard');

        } catch (err: any) {
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
            className={`
                relative z-10 flex flex-col items-center 
                w-[380px] p-12 
                bg-white/5 backdrop-blur-xl 
                border border-white/10 rounded-3xl shadow-2xl
                transition-transform duration-300
                ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}
            `}
            onSubmit={handleSubmit}
            noValidate
        >
            {/* AVATAR */}
            <div className="mb-8">
                <div
                    className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
                    <FontAwesomeIcon icon={faUser} className="text-white/80 text-3xl"/>
                </div>
            </div>

            <div className="relative w-full mb-8">
                <div className={`
                    relative flex items-center border-b pb-1 transition-colors duration-300
                    ${require.username ? 'border-red-500' : 'border-white/50 focus-within:border-white'}
                `}>
                    <span className="absolute left-0 text-white/80 text-lg">
                        <FontAwesomeIcon icon={faUser}/>
                    </span>
                    <input
                        ref={username}
                        type="text"
                        placeholder="Username"
                        className="w-full bg-transparent border-none outline-none text-white pl-8 py-2 placeholder-white/70"
                    />
                </div>
                {require.username && (
                    <span
                        className="absolute -bottom-6 left-0 flex items-center gap-2 text-red-500 text-sm animate-pulse">
                        <FontAwesomeIcon icon={faTriangleExclamation}/> {require.username}
                    </span>
                )}
            </div>

            <div className="relative w-full mb-8">
                <div className={`
                    relative flex items-center border-b pb-1 transition-colors duration-300
                    ${require.password ? 'border-red-500' : 'border-white/50 focus-within:border-white'}
                `}>
                    <span className="absolute left-0 text-white/80 text-lg">
                        <FontAwesomeIcon icon={faLock}/>
                    </span>
                    <input
                        ref={password}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full bg-transparent border-none outline-none text-white pl-8 pr-8 py-2 placeholder-white/70"
                    />
                    {/* TOGGLE VISIBILITY ICON */}
                    <span
                        className="absolute right-0 cursor-pointer text-white/50 hover:text-white transition-colors z-20"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye}/>
                    </span>
                </div>
                {require.password && (
                    <span
                        className="absolute -bottom-6 left-0 flex items-center gap-2 text-red-500 text-sm animate-pulse">
                        <FontAwesomeIcon icon={faTriangleExclamation}/> {require.password}
                    </span>
                )}
            </div>

            {/* OPTIONS (Remember Me / Forgot) */}
            <div className="w-full flex justify-between items-center text-sm text-white/80 mb-8">
                <label className="flex items-center cursor-pointer select-none group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            ref={rememberMe}
                            className="peer appearance-none w-4 h-4 border border-white/40 rounded bg-white/10 checked:bg-white checked:border-white cursor-pointer transition-all"
                        />
                        {/* Custom checkmark icon (simulated) */}
                        <svg
                            className="absolute top-0.5 left-0.5 w-3 h-3 text-[#230b38] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span className="ml-2 font-light group-hover:text-white transition-colors">Remember me</span>
                </label>
                <a href="#" className="font-light italic hover:text-white hover:underline transition-colors">Forgot
                    Password?</a>
            </div>

            {/* LOGIN BUTTON */}
            <button
                type="submit"
                disabled={loading}
                className={`
                    w-full py-3 rounded-full 
                    bg-gradient-to-r from-[#4b1a69] to-[#4d6dff] 
                    text-white font-semibold tracking-wider 
                    shadow-lg hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 
                    transition-all duration-200
                    disabled:opacity-70 disabled:cursor-not-allowed
                `}
            >
                {loading ? 'LOADING...' : 'LOGIN'}
            </button>
        </form>
    );
}

const Login: React.FC = () => {
    useEffect(() => {
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('mustChange');
    }, []);

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-slate-900 overflow-hidden">
            {/* BACKGROUND GRADIENT */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#230b38] to-[#1a1a40] z-0"></div>

            {/* ANIMATED BACKGROUND SPHERES */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Red/Purple Sphere */}
                <Sphere style={{
                    height: "400px",
                    width: "400px",
                    background: "linear-gradient(#ff0055, #ff2299)",
                    top: "-100px",
                    left: "20%",
                    opacity: 0.6,
                }} animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -50, 50, 0],
                    scale: [1, 1.1, 0.9, 1],
                }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                />

                {/* Blue/Cyan Sphere */}
                <Sphere style={{
                    height: "450px",
                    width: "450px",
                    background: "linear-gradient(#4d22ff, #22d3ff)",
                    bottom: "-100px",
                    right: "20%",
                    opacity: 0.6
                }} animate={{
                    x: [0, -70, 40, 0],
                    y: [0, 80, -30, 0],
                    scale: [1, 0.9, 1.1, 1],
                }} transition={{
                    duration: 12,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}/>

                {/* Center Blurred Purple Sphere */}
                <Sphere style={{
                    height: "300px",
                    width: "300px",
                    background: "#7a00cc",
                    top: "40%",
                    left: "40%",
                    opacity: "0.3"
                }} animate={{x: [-20, 20], y: [-20, 20]}}
                        transition={{duration: 8, repeat: Infinity, repeatType: "reverse"}}
                />
            </div>

            <Form/>
        </div>
    );
};

export default Login;