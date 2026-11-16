import { useState } from 'react';
import { Wallet } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-indigo-50 text-teal-700 p-6 ${className}`}
      >
        <Wallet className="w-8 h-8 mb-2 opacity-80" aria-hidden="true" />
        {fallbackTitle && (
          <span className="text-xs font-medium text-slate-600 text-center">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
