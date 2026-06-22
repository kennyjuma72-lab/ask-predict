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
  height,
  className = '',
  count = 1,
}) => {
  const defaultHeight =
    variant === 'text' ? '0.875rem' : variant === 'circular' ? '2.5rem' : '1.25rem';
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle =
    typeof height === 'number' ? `${height}px` : height ?? defaultHeight;

  const radius =
    variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-xl';

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      aria-hidden="true"
      className={`skeleton ${radius} ${className}`}
      style={{
        width: variant === 'circular' ? heightStyle : widthStyle,
        height: heightStyle,
      }}
    />
  ));

  return count === 1 ? skeletons[0] : <div className="space-y-2">{skeletons}</div>;
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-[0_1px_3px_rgba(15,15,15,0.04)]"
      >
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height="14px" />
            <Skeleton width="60%" height="12px" />
          </div>
        </div>
        <Skeleton count={3} />
        <Skeleton width="40%" height="20px" />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} width={`${100 / columns}%`} height="36px" />
        ))}
      </div>
    ))}
  </div>
);
