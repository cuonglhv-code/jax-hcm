import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'heading' | 'avatar' | 'image' | 'rect';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  let shapeClass = '';
  
  switch (variant) {
    case 'text':
      shapeClass = 'h-4 rounded w-full';
      break;
    case 'heading':
      shapeClass = 'h-7 rounded w-48';
      break;
    case 'avatar':
      shapeClass = 'w-8 h-8 rounded-full shrink-0';
      break;
    case 'image':
      shapeClass = 'w-full h-48 rounded-lg';
      break;
    case 'rect':
      shapeClass = 'rounded-md w-full h-full';
      break;
  }

  const styles = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`shimmer ${shapeClass} ${className}`}
      style={Object.keys(styles).length > 0 ? styles : undefined}
      aria-hidden="true"
    />
  );
}
