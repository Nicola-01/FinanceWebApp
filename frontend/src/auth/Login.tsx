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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900">
            {/* Renders the visual background and animations */}
            <LoginBackground />

            {/* Renders the actual interactive form */}
            <LoginForm />
        </div>
    );
};

export default Login;