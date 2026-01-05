import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  tooltip?: string;
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  tooltip,
  active,
  className = '', 
  ...props 
}) => {
  // Minimal base, no background wrapper by default
  const baseStyles = "group flex items-center justify-center p-2 transition-all duration-300 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed relative";
  
  // Hover effects target the internal SVG via [&>svg]
  // We use drop-shadow for glow and text color for 'solid' feel
  const hoverEffect = "hover:[&>svg]:text-white hover:[&>svg]:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] hover:[&>svg]:scale-110 [&>svg]:transition-all [&>svg]:duration-300";
  
  const variants = {
    primary: `text-neutral-400 ${hoverEffect}`,
    secondary: `text-neutral-500 ${hoverEffect}`,
    danger: `text-red-500 hover:[&>svg]:text-red-400 hover:[&>svg]:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] hover:[&>svg]:scale-110 [&>svg]:transition-all [&>svg]:duration-300`,
    ghost: `text-neutral-600 ${hoverEffect}`
  };

  const activeStyle = active 
    ? "text-white [&>svg]:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-105" 
    : "";

  return (
    <button 
      className={`${baseStyles} ${active ? activeStyle : variants[variant]} ${className}`}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
};