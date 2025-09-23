import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick, 
  hover = true,
  delay = 0 
}) => {
  const baseClasses = `
    glass-card rounded-xl p-6
    ${hover ? 'card-3d-subtle glow-on-hover' : ''}
    ${onClick ? 'interactive-glass cursor-pointer' : ''}
    ${className}
  `;

  const style = delay > 0 ? { animationDelay: `${delay}ms` } : {};

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};
