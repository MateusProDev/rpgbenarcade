import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:   'bg-castle-gold hover:bg-parchment-400 text-castle-dark font-bold border border-parchment-600',
  secondary: 'bg-castle-wall hover:bg-castle-stone text-parchment-100 border border-castle-gold',
  danger:    'bg-red-800 hover:bg-red-700 text-white border border-red-600',
  ghost:     'bg-transparent hover:bg-castle-wall text-parchment-200 border border-transparent',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-8 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size    = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2 rounded transition-all duration-150
      font-medieval tracking-wide cursor-pointer select-none
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]} ${className}
    `}
    disabled={disabled || loading}
    {...props}
  >
    {loading && (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    )}
    {children}
  </button>
);
