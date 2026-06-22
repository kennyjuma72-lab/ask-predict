import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 text-secondary-500 ring-1 ring-secondary-100">
        {icon ?? <Inbox className="h-7 w-7" strokeWidth={1.75} />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 text-white text-sm font-semibold rounded-xl shadow-sm shadow-secondary-500/20 hover:shadow-md hover:shadow-secondary-500/30 transition-all active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
