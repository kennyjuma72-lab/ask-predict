import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
}) => {
  const variants = {
    success: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
    error: { bg: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
    info: { bg: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
    neutral: { bg: 'bg-gray-100 text-gray-700 ring-gray-200', dot: 'bg-gray-400' },
    brand: { bg: 'bg-secondary-50 text-secondary-700 ring-secondary-200', dot: 'bg-secondary-500' },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const v = variants[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${v.bg} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />}
      {children}
    </span>
  );
};

export default Badge;
