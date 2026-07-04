import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../components/ui/Input";

interface PasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  icon: IconDefinition;
  onChange: (value: string) => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder,
  value,
  icon,
  onChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="mb-[15px] text-left">
      <label className="ml-1 mb-2 block text-[0.85rem] font-medium text-app-muted">
        {label}
      </label>
      <Input
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        leadingIcon={<FontAwesomeIcon icon={icon} />}
        rightSlot={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsVisible(!isVisible)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--r-sm)] text-app-muted transition-colors hover:text-app-text"
          >
            <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} />
          </button>
        }
      />
    </div>
  );
};
