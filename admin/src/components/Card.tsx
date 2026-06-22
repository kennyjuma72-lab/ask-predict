import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  padding = 'none',
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(15,15,15,0.04),0_8px_24px_-12px_rgba(15,15,15,0.06)] overflow-hidden ${
        hoverable
          ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_6px_rgba(15,15,15,0.06),0_18px_36px_-16px_rgba(15,15,15,0.12)] hover:border-gray-200'
          : ''
      } ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<SectionProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-5 border-b border-gray-100 ${className}`}>{children}</div>
);

export const CardBody: React.FC<SectionProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-5 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<SectionProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-100 bg-gray-50/60 ${className}`}>
    {children}
  </div>
);
