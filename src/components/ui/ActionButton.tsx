import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium font-mono text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl';

  // Ensure touch target >= 44px on mobile
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[40px] px-3 py-2 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2.5 text-xs gap-2',
    lg: 'min-h-[48px] px-5 py-3 text-sm gap-2.5'
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40 hover:shadow-emerald-600/20',
    secondary: 'bg-[#0a2f1c] hover:bg-[#0e3b23] text-emerald-100 border border-emerald-800/60 hover:border-emerald-700',
    destructive: 'bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 hover:border-rose-700',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40',
    outline: 'bg-transparent hover:bg-[#0a2f1c] text-emerald-200 border border-emerald-800/60 hover:border-emerald-700',
    ghost: 'bg-transparent hover:bg-[#0a2f1c]/50 text-emerald-300/70 hover:text-white'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
};
