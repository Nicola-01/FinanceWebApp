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
                <label className="ml-1 mb-2 block text-[0.85rem] font-medium text-white/70">
                    {label}
                </label>
                <div className="relative flex w-full items-center">
                    {/* Left Side Icon */}
                    <FontAwesomeIcon
                        icon={icon}
                        className="pointer-events-none absolute left-[14px] z-10 text-base text-white/40"
                    />
                    <input
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-[45px] pr-[45px] text-base text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                        type={isVisible ? "text" : "password"}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    {/* Visibility Toggle Button */}
                    <button
                        type="button"
                        className="absolute right-[12px] z-10 flex cursor-pointer border-none bg-transparent p-1.5 text-base text-white/40 transition-colors hover:text-white"
                        onClick={() => setIsVisible(!isVisible)}
                        tabIndex={-1}
                    >
                        <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye}/>
                    </button>
                </div>
            </div>
        );
    };