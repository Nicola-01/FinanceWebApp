import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {LoginBackground} from './LoginBackground.tsx';
import {LoginForm} from './LoginForm.tsx';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFlask, faSpinner} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import {triggerToast} from '../components/ToastNotification.tsx';

const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === 'true';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [demoLoading, setDemoLoading] = useState(false);

    // Clear tokens on component mount to ensure user is truly logged out
    useEffect(() => {
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('mustChangePWD');
    }, []);

    const handleTryDemo = async () => {
        setDemoLoading(true);
        try {
            const response = await api.post('/auth/demo');
            const {token} = response.data;

            localStorage.setItem('mustChangePWD', JSON.stringify(false));
            sessionStorage.setItem('jwtToken', token);

            navigate('/');
        } catch (err: any) {
            const title = err.response?.data?.title || "Could not create demo account.";
            triggerToast(title, false);
            console.error(err);
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div
            className="relative flex min-h-[100dvh] items-start pt-[8dvh] sm:items-center sm:pt-0 justify-center overflow-x-hidden overflow-y-auto bg-slate-900 px-4 sm:px-0 pb-8 sm:pb-0">
            {/* Renders the visual background and animations */}
            <LoginBackground/>

            <div className={`relative z-10 flex flex-col items-center gap-6 w-full ${demoEnabled ? 'max-w-[420px]' : 'max-w-[380px]'}`}>
                {/* Conditionally Render Form vs Demo Card */}
                {!demoEnabled ? (
                    <LoginForm/>
                ) : (
                    <div className="w-full flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
                        {/* Demo Icon Header */}
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#4b1a69] to-[#4d6dff] shadow-[0_0_20px_rgba(77,109,255,0.4)]">
                            <FontAwesomeIcon icon={faFlask} className="text-3xl text-white"/>
                        </div>
                        
                        <h2 className="mb-3 text-2xl font-bold tracking-wide text-white text-center">
                            Live Demo Access
                        </h2>
                        
                        {/* Detailed Description */}
                        <div className="mb-8 flex flex-col items-center space-y-4 text-center text-sm text-white/70">
                            <p className="leading-relaxed">
                                Experience the personal finance manager completely risk-free. No sign-up required.
                            </p>
                            
                            {/* Feature List */}
                            <div className="w-full rounded-xl border border-white/5 bg-black/20 p-5 mt-2 text-left shadow-inner">
                                <ul className="space-y-3.5">
                                    <li className="flex items-start">
                                        <span className="mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-[10px] text-green-400 font-bold">✓</span>
                                        <span className="text-white/80 leading-tight">Pre-populated with realistic sample data</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] text-blue-400 font-bold">✓</span>
                                        <span className="text-white/80 leading-tight">Full access to all the features</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[10px] text-purple-400 font-bold">✓</span>
                                        <span className="text-white/80 leading-tight">Completely private, safe workspace</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <p className="text-xs text-white/40 italic pt-2">
                                Note: All demo data is ephemeral and will be securely erased daily.
                            </p>
                        </div>
                        
                        {/* CTA Button */}
                        <button
                            type="button"
                            disabled={demoLoading}
                            onClick={handleTryDemo}
                            className="w-full rounded-full bg-gradient-to-r from-[#4b1a69] to-[#4d6dff] py-3.5 text-sm font-bold tracking-wider text-white shadow-[0_5px_15px_rgba(77,109,255,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(77,109,255,0.5)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {demoLoading ? (
                                <><FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin"/>GENERATING WORKSPACE...</>
                            ) : (
                                <><FontAwesomeIcon icon={faFlask} className="mr-2 text-lg"/>START EXPLORING NOW</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
        ;
};

export default Login;