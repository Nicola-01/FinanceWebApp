import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface PasswordRequirementsProps {
    password: string;
    confirmPassword?: string;
}

// Esportiamo la logica così può essere usata per bloccare/sbloccare i bottoni Submit
export const getPasswordRequirements = (password: string, confirmPassword?: string) => [
    { label: "At least 8 characters", test: () => password.length >= 8 },
    { label: "One lowercase letter", test: () => /[a-z]/.test(password) },
    { label: "One uppercase letter", test: () => /[A-Z]/.test(password) },
    { label: "At least one number", test: () => /[0-9]/.test(password) },
    { label: "One special symbol (!@#$...)", test: () => /[^A-Za-z0-9]/.test(password) },
    // Il controllo del match avviene solo se viene passata la confirmPassword
    { label: "Passwords match", test: () => confirmPassword !== undefined ? (password === confirmPassword && password !== '') : true }
];

export const isPasswordValid = (password: string, confirmPassword?: string) => {
    return getPasswordRequirements(password, confirmPassword).every(req => req.test());
};

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password, confirmPassword }) => {
    const requirements = getPasswordRequirements(password, confirmPassword);

    return (
        <div className="my-5 rounded-lg border border-white/5 bg-black/20 p-[15px] text-left w-full shadow-inner">
            {requirements.map((req, index) => (
                <div
                    key={index}
                    className={`mb-2 flex items-center gap-2.5 text-[0.85rem] transition-colors duration-300 last:mb-0 ${
                        req.test() ? 'text-[#00ff7f]' : 'text-white/30'
                    }`}
                >
                    <FontAwesomeIcon icon={req.test() ? faCheck : faTimes} />
                    <span>{req.label}</span>
                </div>
            ))}
        </div>
    );
};