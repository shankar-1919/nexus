import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface CivicImageProps {
  src?: string;
  alt: string;
  fallbackLabel?: string;
  className?: string;
}

export const CivicImage: React.FC<CivicImageProps> = ({
  src,
  alt,
  fallbackLabel = 'No photograph attached',
  className = 'w-full h-56',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F1F5F9] text-[#64748B] dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-6 w-6 opacity-70" aria-hidden="true" />
        <span className="text-xs font-medium">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`rounded-lg border border-[#E5E7EB] object-cover dark:border-slate-800 ${className}`}
    />
  );
};
