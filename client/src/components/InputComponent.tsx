import { useState } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

interface InputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  hint?: string;
  error?: string;
  success?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel";
  icon?: any;
}

const InputComponent = ({
  label,
  value,
  onChange,
  hint,
  error,
  success,
  placeholder,
  type = "text",
  icon: Icon,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span
          className="text-[11px] tracking-wide"
          style={{ color: error ? "#ff453a" : success ? "#30d158" : "#8888a0" }}
        >
          {label}
        </span>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3 pointer-events-none"
            color={error ? "#ff453a" : success ? "#30d158" : "#55556a"}
          />
        )}

        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-bg2 border-[1.5px] rounded-xl py-3 text-sm text-text outline-none transition-all placeholder:text-text3"
          style={{
            borderColor: error ? "#ff453a" : success ? "#30d158" : "#2a2a35",
            paddingLeft: Icon ? "2.5rem" : "0.75rem",
            paddingRight: isPassword || error || success ? "2.5rem" : "0.75rem",
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 text-text3 hover:text-text transition-colors"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        {!isPassword && error && (
          <AlertCircle
            size={15}
            color="#ff453a"
            className="absolute right-3 pointer-events-none"
          />
        )}
        {!isPassword && !error && success && (
          <CheckCircle
            size={15}
            color="#30d158"
            className="absolute right-3 pointer-events-none"
          />
        )}
      </div>

      {(error || hint) && (
        <span
          className="text-[11px]"
          style={{ color: error ? "#ff453a" : "#55556a" }}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
};

export default InputComponent;
