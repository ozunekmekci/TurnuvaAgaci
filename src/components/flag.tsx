import React from 'react';

type FlagProps = {
  code: string;
  className?: string;
};

export const Flag: React.FC<FlagProps> = ({ code, className = 'w-5 h-3.5' }) => {
  // Normalize code for flagcdn (e.g. "us", "de", "gb-eng")
  const normalizedCode = code.toLowerCase();
  
  // We use vector SVG flags from flagcdn for sharp rendering
  const src = `https://flagcdn.com/${normalizedCode}.svg`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${code} flag`}
      className={`inline-block object-cover rounded-sm shadow-sm border border-slate-700/30 ${className}`}
      loading="lazy"
    />
  );
};
