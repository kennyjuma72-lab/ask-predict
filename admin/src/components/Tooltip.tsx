import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-b-0 border-l-transparent border-r-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-t-0 border-l-transparent border-r-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-r-0 border-t-transparent border-b-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-l-0 border-t-transparent border-b-transparent border-r-gray-900',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded whitespace-nowrap pointer-events-none ${
            positionClasses[position]
          }`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};
