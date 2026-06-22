import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = '20px',
  className = '',
  count = 1,
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  const baseClass = 'bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse';

  const variantClass = {
    text: `h-4 w-${widthStyle}`,
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      style={{ width: widthStyle, height: heightStyle }}
    />
  ));

  return count === 1 ? skeletons[0] : <div className="space-y-2">{skeletons}</div>;
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Skeleton width="60%" height="24px" />
        <Skeleton count={3} />
        <Skeleton width="40%" height="20px" />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} width={`${100 / columns}%`} height="32px" />
        ))}
      </div>
    ))}
  </div>
);
