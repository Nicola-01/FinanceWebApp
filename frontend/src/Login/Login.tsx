// src/Login/Login.tsx
import React from 'react';
// import React, { useState } from 'react';
import {motion} from 'framer-motion';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faLock} from '@fortawesome/free-solid-svg-icons';
// import { useNavigate } from 'react-router-dom';
// import api from '../api/axiosConfig';
// import type {AuthResponse} from '../types'; // Importiamo i tipi
import './Login.css';

const Login: React.FC = () => {
    return (
        <div className="container">
            {/* SFONDO ANIMATO */}
            <div className="background">
                {/* Sfera Rossa/Viola (in alto) */}
                <motion.div
                    className="shape shape-1"
                    animate={{
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
                {/* Sfera Blu/Azzurra (in basso) */}
                <motion.div
                    className="shape shape-2"
                    animate={{
                        x: [0, -70, 40, 0],
                        y: [0, 80, -30, 0],
                        scale: [1, 0.9, 1.1, 1],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                />
                {/* Sfera Aggiuntiva per profondità */}
                <motion.div
                    className="shape shape-3"
                    animate={{x: [-20, 20], y: [-20, 20]}}
                    transition={{duration: 8, repeat: Infinity, repeatType: "reverse"}}
                />
            </div>

            {/* CARD EFFETTO VETRO */}
            <form className="glass-form">
                <div className="avatar-container">
                    <div className="avatar-circle">
                        <FontAwesomeIcon icon={faUser} className="avatar-icon"/>
                    </div>
                </div>

                <h2 className="hidden-title">Login</h2>

                <div className="input-group">
                    <label htmlFor="email">Email ID</label>
                    <div className="input-wrapper">
                        <span className="icon">
                          <FontAwesomeIcon icon={faUser}/>
                        </span>
                        <input type="email" id="email" placeholder="Email ID"/>
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-wrapper">
                        <span className="icon">
                            <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input type="password" id="password" placeholder="Password"/>
                    </div>
                </div>

                <div className="form-options">
                    {/* REMEMBER ME */}
                    <label className="remember-me">
                        <input type="checkbox" />
                        <span className="checkbox-custom"></span> {/* Finto checkbox per lo stile */}
                        <span className="label-text">Remember me</span>
                    </label>

                    {/* FORGOT PASSWORD */}
                    <a href="#" className="forgot-pass">Forgot Password?</a>
                </div>

                <button type="submit" className="login-btn">LOGIN</button>
            </form>
        </div>
    );
};

export default Login;