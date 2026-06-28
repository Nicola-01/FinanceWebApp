import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheck, faTimes} from '@fortawesome/free-solid-svg-icons';

interface PasswordRequirementsProps {
    password: string;
    confirmPassword?: string;
}

export const getPasswordRequirements = (password: string, confirmPassword?: string) => [
    {label: "At least 8 characters", test: () => password.length >= 8},
    {label: "One lowercase letter", test: () => /[a-z]/.test(password)},
    {label: "One uppercase letter", test: () => /[A-Z]/.test(password)},
    {label: "At least one number", test: () => /[0-9]/.test(password)},
    {label: "One special symbol (!@#$...)", test: () => /[^A-Za-z0-9]/.test(password)},
    {
        label: "Passwords match",
        test: () => confirmPassword !== undefined ? (password === confirmPassword && password !== '') : true
    }
];

export const isPasswordValid = (password: string, confirmPassword?: string) => {
    return getPasswordRequirements(password, confirmPassword).every(req => req.test());
};

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({password, confirmPassword}) => {
    const requirements = getPasswordRequirements(password, confirmPassword);

    return (
        <div className="mb-5 rounded-lg border border-app-border bg-app-input p-[15px] text-left w-full shadow-inner">
            <h4 className="ml-1 mb-2 block text-[0.85rem] font-medium text-app-muted text-left">
                Password Requirements:
            </h4>
            {requirements.map((req) => {
                const isMet = req.test();

                return (
                    <div
                        key={req.label}
                        className={`mb-2 flex items-center gap-2.5 text-[0.85rem] transition-all duration-300 last:mb-0 ${
                            isMet
                                ? 'text-app-green opacity-40 line-through'
                                : 'text-app-text'
                        }`}
                    >
                        <FontAwesomeIcon icon={isMet ? faCheck : faTimes} className={!isMet ? 'text-app-muted' : ''}/>
                        <span>{req.label}</span>
                    </div>
                );
            })}
        </div>
    );
};