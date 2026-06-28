import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faEyeSlash, type IconDefinition} from '@fortawesome/free-solid-svg-icons';

interface PasswordInputProps {
    label: string;
    placeholder: string;
    value: string;
    icon: IconDefinition;
    onChange: (value: string) => void;
}

export const PasswordInput: React.FC<PasswordInputProps> =
    ({
         label,
         placeholder,
         value,
         icon,
         onChange
     }) => {
        const [isVisible, setIsVisible] = useState(false);

        return (
            <div className="mb-[15px] text-left">
                {/* Field Label */}
                <label className="ml-1 mb-2 block text-[0.85rem] font-medium text-app-muted">
                    {label}
                </label>
                <div className="relative flex w-full items-center">
                    {/* Left Side Icon */}
                    <FontAwesomeIcon
                        icon={icon}
                        className="pointer-events-none absolute left-[14px] z-10 text-base text-app-muted"
                    />
                    <input
                        className="w-full rounded-lg border border-app-border bg-app-input py-3 pl-[45px] pr-[45px] text-base text-app-text outline-none transition-all duration-300 placeholder:text-app-muted focus:border-app-border focus:bg-app-surface"
                        type={isVisible ? "text" : "password"}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    {/* Visibility Toggle Button */}
                    <button
                        type="button"
                        className="absolute right-[12px] z-10 flex cursor-pointer border-none theme-bg-transparent p-1.5 text-base text-app-muted transition-colors hover:text-app-text"
                        onClick={() => setIsVisible(!isVisible)}
                        tabIndex={-1}
                    >
                        <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye}/>
                    </button>
                </div>
            </div>
        );
    };