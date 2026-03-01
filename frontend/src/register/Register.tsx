import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faLock, faEnvelope, faEye, faEyeSlash,
    faSpinner, faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import { triggerToast } from '../components/ToastNotification';
import { PasswordRequirements, isPasswordValid } from '../components/PasswordRequirements';
import {LoginBackground} from "../auth/LoginBackground.tsx"; // Import del nuovo componente password

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
                // GET /auth/register/{token}
                const res = await api.get(`/auth/register/${token}`);
                setInviteData(res.data);

                // Se lo stato non è PENDING, la registrazione non è valida
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

    // Variabile derivata per abilitare/disabilitare il tasto submit
    const isFormValid = username.trim().length >= 3 && isPasswordValid(password, confirmPassword);

    // 2. Gestisce l'invio della registrazione
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validazioni Frontend (fallback)
        if (username.trim().length < 3) {
            setError('shake');
            setTimeout(() => setError(''), 500);
            return triggerToast("Username must be at least 3 characters long.", false);
        }
        if (!isPasswordValid(password, confirmPassword)) {
            setError('shake');
            setTimeout(() => setError(''), 500);
            return triggerToast("Please meet all password requirements.", false);
        }

        setIsSubmitting(true);
        try {
            // POST /auth/register/{token}
            await api.post(`/auth/register/${token}`, {
                username: username.trim(),
                password: password
            });

            triggerToast("Registration successful! You can now log in.", true);
            navigate('/login');
        } catch (err: any) {
            setError('shake');
            setTimeout(() => setError(''), 500);
            triggerToast(err.response?.data?.title || "Error during registration.", false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900">

            {/* Utilizziamo l'esatto sfondo animato della pagina di Login */}
            <LoginBackground />

            {/* Container Principale in stile Login */}
            <div className={`relative z-10 flex w-full max-w-[420px] mx-4 flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${error === 'shake' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>

                {/* Logo / Header (Stile Avatar del Login) */}
                <div className="mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
                        <FontAwesomeIcon icon={faUser} className="text-3xl text-white/80"/>
                    </div>
                </div>

                {/* STATO 1: CARICAMENTO */}
                {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-white/50 gap-4">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#4d6dff]" />
                            <p>Verifying invitation link...</p>
                        </div>
                    ) :

                    /* STATO 2: ERRORE TOKEN */
                    error && error !== 'shake' ? (
                            <div className="flex flex-col items-center text-center py-6 w-full">
                                <FontAwesomeIcon icon={faCircleExclamation} className="text-5xl text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                                <h3 className="text-xl font-bold mb-2 text-white">Registration Failed</h3>
                                <p className="text-white/50 text-sm mb-6">{error}</p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full rounded-full bg-white/10 py-3 font-semibold tracking-wider text-white transition-colors hover:bg-white/20"
                                >
                                    Back to Login
                                </button>
                            </div>
                        ) :

                        /* STATO 3: FORM DI REGISTRAZIONE ESTETICA LOGIN */
                        (
                            <form onSubmit={handleRegister} className="flex flex-col w-full" noValidate>

                                {/* Email Sola Lettura */}
                                <div className="relative mb-6 w-full">
                                    <div className="relative flex items-center border-b pb-1 border-white/30">
                                <span className="absolute left-0 text-lg text-white/50">
                                    <FontAwesomeIcon icon={faEnvelope}/>
                                </span>
                                        <input
                                            type="email"
                                            value={inviteData?.email || ''}
                                            disabled
                                            className="w-full border-none bg-transparent py-2 pl-8 text-white/50 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Username Input */}
                                <div className="relative mb-6 w-full">
                                    <div className="relative flex items-center border-b pb-1 border-white/50 focus-within:border-white transition-colors duration-300">
                                <span className="absolute left-0 text-lg text-white/80">
                                    <FontAwesomeIcon icon={faUser}/>
                                </span>
                                        <input
                                            type="text"
                                            placeholder="Choose Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full border-none bg-transparent py-2 pl-8 text-white placeholder-white/70 outline-none"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="relative mb-6 w-full">
                                    <div className="relative flex items-center border-b pb-1 border-white/50 focus-within:border-white transition-colors duration-300">
                                <span className="absolute left-0 text-lg text-white/80">
                                    <FontAwesomeIcon icon={faLock}/>
                                </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Set Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border-none bg-transparent py-2 pl-8 pr-8 text-white placeholder-white/70 outline-none"
                                        />
                                        <span
                                            className="absolute right-0 z-20 cursor-pointer text-white/50 transition-colors hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye}/>
                                </span>
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div className="relative mb-4 w-full">
                                    <div className="relative flex items-center border-b pb-1 border-white/50 focus-within:border-white transition-colors duration-300">
                                <span className="absolute left-0 text-lg text-white/80">
                                    <FontAwesomeIcon icon={faLock}/>
                                </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full border-none bg-transparent py-2 pl-8 pr-8 text-white placeholder-white/70 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Componente Requisiti Password Dinamico */}
                                <PasswordRequirements password={password} confirmPassword={confirmPassword} />

                                {/* Submit Button (Stile Login) */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isFormValid}
                                    className="w-full mt-2 rounded-full bg-gradient-to-r from-[#4b1a69] to-[#4d6dff] py-3 font-semibold tracking-wider text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'CREATE ACCOUNT'}
                                </button>
                            </form>
                        )}
            </div>
        </div>
    );
};

export default Register;