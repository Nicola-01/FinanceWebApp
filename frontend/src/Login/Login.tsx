// src/Login/Login.tsx
import React, {useEffect, useState} from 'react';
// import React, { useState } from 'react';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faLock, faTriangleExclamation} from '@fortawesome/free-solid-svg-icons';
// import { useNavigate } from 'react-router-dom';
// import type {AuthResponse} from '../types'; // Importiamo i tipi

import './Login.css';
import Sphere from '../assets/Sphere'
import api from '../api/axiosConfig';

interface Requirements {
    username?: string;
    password?: string;
}

const Form: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false); // Per disabilitare il bottone mentre carica
    const [error, setError] = useState('');
    const [require, setRequire] = useState<Requirements>({});


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const requirements: Requirements = {};
        let isValid = true;

        if (!username) {
            requirements.username = "Enter the username";
            isValid = false;
        }

        if (!password) {
            requirements.password = "Enter the password";
            isValid = false;
        }

        setRequire(requirements)
        if (!isValid) {
            setLoading(false);
            return;
        }

        try {
            // 2. CHIAMATA CON AXIOS
            const response = await api.post('/auth/login', {
                username,
                password,
                rememberMe
            });

            // 3. SUCCESSO
            // Axios mette i dati della risposta direttamente in .data
            const {token} = response.data;

            // 4. SALVA IL TOKEN (Fondamentale per il tuo interceptor!)
            localStorage.setItem('jwtToken', token);

            if (rememberMe)
                localStorage.setItem('jwtToken', token);
            else
                sessionStorage.setItem('jwtToken', token)

            // console.log("Login effettuato!", response.data);

            window.location.href = '/dashboard';

        } catch (err: any) {
            // 5. GESTIONE ERRORI MEGLIO DI FETCH
            // Axios lancia un errore se lo status non è 2xx
            // console.error(err);
            if (err.response && err.response.data) {
                // Se il server risponde con un messaggio di errore personalizzato
                setError(err.response.data.title);
            } else {
                setError('Server Connection Error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Funzione per pulire l'errore quando l'utente scrive
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

            {/*{error && <div style={{ color: '#ff4d4d', marginBottom: '10px' }}>{error}</div>}*/}

            <div className="input-group">
                <div className={`input-wrapper ${require.username ? 'error-border' : ''}`}>
                            <span className="icon">
                              <FontAwesomeIcon icon={faUser}/>
                            </span>
                    <input type="text" id="username" placeholder="Username" value={username}
                           onChange={handleUsernameChange} required/>
                </div>
                {require.username && <span className="error-msg">
                    <FontAwesomeIcon icon={faTriangleExclamation}/>{require.username}
                </span>}
            </div>

            <div className="input-group">
                <div className={`input-wrapper ${require.password ? 'error-border' : ''}`}>
                    <span className="icon"><FontAwesomeIcon icon={faLock}/></span>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                    />
                </div>
                {require.password && <span className="error-msg">
                    <FontAwesomeIcon icon={faTriangleExclamation}/>{require.password}
                </span>}
            </div>

            <div className="form-options">
                {/* REMEMBER ME */}
                <label className="remember-me">
                    <input type="checkbox"
                           checked={rememberMe}
                           onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="checkbox-custom"></span> {/* Finto checkbox per lo stile */}
                    <span className="label-text">Remember me</span>
                </label>

                {/* FORGOT PASSWORD */}
                <a href="#" className="forgot-pass">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>{loading ? 'LOADING...' : 'LOGIN'}</button>
        </form>
    );
}


const Login: React.FC = () => {

    useEffect(() => {
        localStorage.removeItem('jwtToken');
    }, []);

    return (
        <div className="container">
            {/* SFONDO ANIMATO */}
            <div className="background">
                {/* Sfera Rossa/Viola (in alto) */}
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