import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import './ToastNotification.css';

interface ToastProps {
    show: boolean;
    message?: string; // Opzionale, default "Operazione completata"
}

export const ToastNotification: React.FC<ToastProps> = ({ show, message }) => {
    return (
        <div className={`toast-notification ${show ? 'show' : ''}`}>
            <FontAwesomeIcon icon={faCheck} />
            <span>{message}</span>
        </div>
    );
};