import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  className = '',
  color 
}) => {
  const iconName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const IconComponent = (LucideIcons as any)[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return <div className={`w-${size} h-${size} ${className}`} />;
  }

  return (
    <IconComponent 
      size={size} 
      className={className}
      color={color}
    />
  );
};
