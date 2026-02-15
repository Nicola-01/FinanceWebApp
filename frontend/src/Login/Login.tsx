import React, {useEffect, useState} from 'react';
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
import './Login.css';

interface Requirements {
    username?: string;
    password?: string;
}

const Form: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [require, setRequire] = useState<Requirements>({});
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation
        const requirements: Requirements = {};
        let isValid = true;

        if (!username) {
            requirements.username = "Username is required";
            isValid = false;
        }

        if (!password) {
            requirements.password = "Password is required";
            isValid = false;
        }

        setRequire(requirements);
        if (!isValid) {
            setLoading(false);
            return;
        }

        try {
            // API Call
            const response = await api.post('/auth/login', {
                username,
                password,
                rememberMe
            });

            const {token, role, passwordMustChange} = response.data;

            // Store password expiration status to handle forced change after login
            localStorage.setItem('mustChange', JSON.stringify(passwordMustChange));

            // Persistent or Session storage based on Remember Me checkbox
            if (rememberMe)
                localStorage.setItem('jwtToken', token);
            else
                sessionStorage.setItem('jwtToken', token);


            // Role-based redirection
            if (role === 'ADMIN')
                navigate('/admin/dashboard');
            else
                navigate('/dashboard');


        } catch (err: any) {
            // Error handling
            if (err.response && err.response.data) {
                setError(err.response.data.title || 'Invalid credentials');
            } else {
                setError('Server Connection Error');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    // Clean validation errors as the user types
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        if (require.username) setRequire({...require, username: undefined});
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (require.password) setRequire({...require, password: undefined});
    };

    return (
        <form className={`glass-form ${error ? 'form-error' : ''}`} onSubmit={handleSubmit} noValidate>
            <div className="avatar-container">
                <div className="avatar-circle">
                    <FontAwesomeIcon icon={faUser} className="avatar-icon"/>
                </div>
            </div>

            {/* General error message */}
            {error && <div className="general-error-msg">{error}</div>}

            {/* USERNAME INPUT */}
            <div className="input-group">
                <div className={`input-wrapper ${require.username ? 'error-border' : ''}`}>
                    <span className="icon">
                        <FontAwesomeIcon icon={faUser}/>
                    </span>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={handleUsernameChange}
                    />
                </div>
                {require.username && (
                    <span className="error-msg">
                        <FontAwesomeIcon icon={faTriangleExclamation}/> {require.username}
                    </span>
                )}
            </div>

            {/* PASSWORD INPUT */}
            <div className="input-group">
                <div className={`input-wrapper ${require.password ? 'error-border' : ''}`}>
                    <span className="icon">
                        <FontAwesomeIcon icon={faLock}/>
                    </span>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                    />
                    {/* TOGGLE VISIBILITY ICON */}
                    <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye}/>
                    </span>
                </div>
                {require.password && (
                    <span className="error-msg">
                        <FontAwesomeIcon icon={faTriangleExclamation}/> {require.password}
                    </span>
                )}
            </div>

            <div className="form-options">
                <label className="remember-me">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="label-text">Remember me</span>
                </label>
                <a href="#" className="forgot-pass">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'LOADING...' : 'LOGIN'}
            </button>
        </form>
    );
}

const Login: React.FC = () => {
    // Clear old tokens on login page mount
    useEffect(() => {
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('mustChange');
    }, []);

    return (
        <div className="container">
            {/* ANIMATED BACKGROUND SPHERES */}
            <div className="background">
                {/* Red/Purple Sphere */}
                <Sphere style={{
                    height: "400px",
                    width: "400px",
                    background: "linear-gradient(#ff0055, #ff2299)",
                    top: "-100px",
                    left: "20%"
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
                    opacity: "0.3",
                }} animate={{x: [-20, 20], y: [-20, 20]}}
                        transition={{duration: 8, repeat: Infinity, repeatType: "reverse"}}
                />
            </div>

            <Form/>
        </div>
    );
};

export default Login;