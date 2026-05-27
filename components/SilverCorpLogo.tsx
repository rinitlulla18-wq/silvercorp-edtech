import React from 'react';

export const SilverCorpLogo: React.FC<{ className?: string; src?: string }> = ({ className = "w-10 h-10", src }) => {
  if (src) {
    return <img src={src} alt="Logo" className={`${className} object-contain`} referrerPolicy="no-referrer" />;
  }
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Orange Outer Shape (Stylized M/V) */}
      <path 
        d="M50 90 L30 70 L10 40 L20 20 L40 40 L50 20 L60 40 L80 20 L90 40 L70 70 Z" 
        fill="#f97316" 
      />
      {/* Silver Inner Circle */}
      <circle cx="50" cy="50" r="15" fill="#94a3b8" />
    </svg>
  );
};
