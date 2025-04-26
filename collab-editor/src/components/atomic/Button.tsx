import React, { ReactNode, ButtonHTMLAttributes } from 'react';

// Define the available button variants
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

// Define the available button sizes
type ButtonSize = 'sm' | 'md' | 'lg';

// Extend the native HTML button props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Visual variants
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  
  // Icon options
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  
  // Other states
  isLoading?: boolean;
  
  // Content
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  // Base classes that apply to all buttons - added cursor-pointer
  const baseClasses = "inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer";
  
  // Classes based on variant
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    tertiary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500"
  };
  
  // Classes based on size
  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-2"
  };
  
  // Spacing when icons are present
  const iconSpacing = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2"
  };
  
  // Classes for width
  const widthClass = fullWidth ? "w-full" : "";
  
  // Classes for disabled state
  const disabledClass = disabled || isLoading 
    ? "opacity-60 cursor-not-allowed pointer-events-none" 
    : "";
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    iconSpacing[size],
    widthClass,
    disabledClass,
    className
  ].join(" ");
  
  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></span>
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      <span>{children}</span>
      
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}