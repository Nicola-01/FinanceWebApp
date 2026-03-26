import React, {useEffect} from 'react';
import {LoginBackground} from './LoginBackground.tsx';
import {LoginForm} from './LoginForm.tsx';

const Login: React.FC = () => {

    // Clear tokens on component mount to ensure user is truly logged out
    useEffect(() => {
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('mustChangePWD');
    }, []);

    return (
        <div className="relative flex min-h-[100dvh] items-start pt-[8dvh] sm:items-center sm:pt-0 justify-center overflow-x-hidden overflow-y-auto bg-slate-900 px-4 sm:px-0 pb-8 sm:pb-0">
            {/* Renders the visual background and animations */}
            <LoginBackground />

            {/* Renders the actual interactive form */}
            <LoginForm />
        </div>
    );
};

export default Login;