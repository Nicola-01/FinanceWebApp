import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faLock, faEnvelope, faEye, faEyeSlash,
    faSpinner, faCircleExclamation, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import { triggerToast } from '../components/ui/ToastNotification.tsx';
import Sphere from '../assets/Sphere';

// Tipi basati sui tuoi DTO Java
interface RegisterInviteResponse {
    email: string;
    createdAt: string;
    expiresAt: string;
    status: string;
}

const Register: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    // Stati generali
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteData, setInviteData] = useState<RegisterInviteResponse | null>(null);

    // Stati del form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Verifica il token al caricamento della pagina
    useEffect(() => {
        if (!token) {
            setError("No registration token provided in the URL.");
            setIsLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                // GET /register/{token}
                const res = await api.get(`/auth/register/${token}`);
                setInviteData(res.data);

                // Opzionale: Se il backend non lancia errore ma ritorna uno stato scaduto
                if (res.data.status !== 'PENDING') {
                    setError("This invitation has already been used or was revoked.");
                }
            } catch (err: any) {
                setError(err.response?.data?.title || "Invalid or expired invitation link.");
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    // 2. Gestisce l'invio della registrazione
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validazioni Frontend
        if (username.trim().length < 3) {
            return triggerToast("Username must be at least 3 characters long.", false);
        }
        if (password.length < 6) {
            return triggerToast("Password must be at least 6 characters long.", false);
        }
        if (password !== confirmPassword) {
            return triggerToast("Passwords do not match.", false);
        }

        setIsSubmitting(true);
        try {
            // POST /register/{token} usando il tuo DTO RegisterInviteRequest
            await api.post(`/auth/register/${token}`, {
                username: username.trim(),
                password: password
            });

            triggerToast("Registration successful! You can now log in.", true);

            // Reindirizza alla pagina di login
            navigate('/login');
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error during registration.", false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0f10] theme-text-default font-semibold">

            {/* Background Sphere per estetica */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
                <Sphere
                    style={{
                        height: "600px",
                        width: "600px",
                        background: "#b829ff",
                        opacity: 0.15,
                        position: "absolute"
                    }}
                    animate={{ x: [0, 0], y: [0, 0] }}
                />
            </div>

            {/* Container Principale (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-md p-6">

                {/* Logo / Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-input border border-app-border text-3xl shadow-[0_0_30px_rgba(184,41,255,0.2)] text-[#b829ff]">
                        🚀
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight theme-text-default">Join FinanceWebApp</h1>
                    <p className="mt-2 text-sm text-app-muted">Complete your registration to get started.</p>
                </div>

                <div className="rounded-2xl border border-app-border bg-[#141414]/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-[fadeIn_0.4s_ease-out]">

                    {/* STATO 1: CARICAMENTO */}
                    {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-app-muted gap-4">
                                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#b829ff]" />
                                <p>Verifying invitation link...</p>
                            </div>
                        ) :

                        /* STATO 2: ERRORE TOKEN */
                        error || !inviteData || inviteData.status !== 'PENDING' ? (
                                <div className="flex flex-col items-center text-center py-6">
                                    <FontAwesomeIcon icon={faCircleExclamation} className="text-5xl theme-text-danger mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                                    <h3 className="text-xl font-bold mb-2">Registration Failed</h3>
                                    <p className="text-app-muted text-sm mb-6">{error}</p>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full rounded-xl bg-app-input py-3 font-bold transition-colors hover:bg-app-surface"
                                    >
                                        Go to Login
                                    </button>
                                </div>
                            ) :

                            /* STATO 3: FORM DI REGISTRAZIONE */
                            (
                                <form onSubmit={handleRegister} className="flex flex-col gap-5">

                                    {/* Email Sola Lettura (dal DTO) */}
                                    <div>
                                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-subtle">
                                                <FontAwesomeIcon icon={faEnvelope} />
                                            </div>
                                            <input
                                                type="email"
                                                value={inviteData.email}
                                                disabled
                                                className="h-[50px] w-full rounded-xl border border-app-border bg-app-input pl-[40px] pr-[15px] py-3 text-[0.95rem] text-app-muted cursor-not-allowed outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Username Input */}
                                    <div>
                                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                                            Choose Username
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b829ff]/70">
                                                <FontAwesomeIcon icon={faUser} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="e.g. mario.rossi"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="h-[50px] w-full rounded-xl border border-app-border theme-bg-overlay-dark pl-[40px] pr-[15px] py-3 text-[0.95rem] theme-text-default outline-none transition-colors focus:border-[#b829ff]"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div>
                                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                                            Set Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b829ff]/70">
                                                <FontAwesomeIcon icon={faLock} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Min. 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="h-[50px] w-full rounded-xl border border-app-border theme-bg-overlay-dark pl-[40px] pr-[45px] py-3 text-[0.95rem] theme-text-default outline-none transition-colors focus:border-[#b829ff]"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface hover:theme-text-default transition-colors"
                                            >
                                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password Input */}
                                    <div>
                                        <div className="relative mt-1">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b829ff]/70">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirm password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-[50px] w-full rounded-xl border border-app-border theme-bg-overlay-dark pl-[40px] pr-[15px] py-3 text-[0.95rem] theme-text-default outline-none transition-colors focus:border-[#b829ff]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !username || !password || !confirmPassword}
                                        className="mt-4 h-[50px] w-full rounded-xl font-bold theme-text-default transition-all duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                                        style={{
                                            background: 'linear-gradient(90deg, #b829ff 0%, #ff2299 100%)',
                                            boxShadow: '0 8px 25px -5px rgba(184,41,255,0.5)'
                                        }}
                                    >
                                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : "Create Account"}
                                    </button>
                                </form>
                            )}
                </div>
            </div>
        </div>
    );
};

export default Register;