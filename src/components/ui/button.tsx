import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      primary: "bg-[#1E293B] text-white hover:bg-[#0F172A]",
      secondary: "bg-[#FAFAF9] text-[#1C1917] border border-[#E7E5E4] hover:bg-[#F5F5F4]",
      outline: "border border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF9]",
      danger: "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA] border border-[#FECACA]",
      ghost: "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAFAF9]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs h-8",
      md: "px-4 py-2 text-sm h-10",
      lg: "px-5 py-2.5 text-base h-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" strokeWidth={1.5} />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
