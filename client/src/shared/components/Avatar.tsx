import React from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const bgColors = [
  'bg-primary/20 text-primary',
  'bg-success/20 text-success',
  'bg-warning/20 text-warning',
];

export function Avatar({ src, name, size = 'md', online }: AvatarProps) {
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getHashValue = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const colorClass = bgColors[getHashValue(name) % bgColors.length];

  return (
    <div className={`relative inline-block ${sizeClasses[size]}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover rounded-full bg-surface-2"
        />
      ) : (
        <div className={`w-full h-full rounded-full flex items-center justify-center font-medium ${colorClass}`}>
          {getInitials(name)}
        </div>
      )}
      
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface block" />
      )}
    </div>
  );
}
