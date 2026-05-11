import React from "react"

const ButtonComponent = ({
    label,
    onClick,
    icon,
    iconSide = "right",
    color = "",
    textColor = "text-bg",
    disabled = false,
    type = "button",
    size = "md",
    className = "",
}: {
    label?: string
    onClick?: () => void
    icon?: React.ReactNode
    iconSide?: "left" | "right"
    color?: string
    textColor?: string
    disabled?: boolean
    type?: "submit" | "reset" | "button"
    size?: "sm" | "md" | "lg"
    className?: string
}) => {
    const sizeClasses = {
        sm: "h-10 px-5 text-xs rounded-xl",
        md: "h-12 px-6 text-sm rounded-2xl",
        lg: "h-14 px-8 text-base rounded-2xl",
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full flex items-center justify-center gap-2 font-bold
                transition-all duration-150 active:scale-[0.97]
                disabled:opacity-40 disabled:pointer-events-none 
                ${color} ${textColor}
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {icon && iconSide === "left" && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
            {icon && iconSide === "right" && <span className="shrink-0">{icon}</span>}
        </button>
    )
}

export default ButtonComponent