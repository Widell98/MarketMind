
import React from 'react';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, variant = 'default', icon }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getVariantClasses()}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </div>
  );
};

export default Badge;
