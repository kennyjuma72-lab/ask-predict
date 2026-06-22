import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fallback?: string;
  showLoader?: boolean;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  fallback = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
  showLoader = true,
  className = '',
  ...props
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const displaySrc = hasError ? fallback : src;

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {isLoading && showLoader && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
      )}
      <img
        src={displaySrc}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        {...props}
      />
    </div>
  );
};
