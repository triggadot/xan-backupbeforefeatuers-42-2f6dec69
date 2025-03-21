
import React from 'react';
import { formatCurrency } from '@/utils/format-utils';

export interface AmountDisplayProps {
  amount: number | undefined | null;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({ 
  amount, 
  variant = 'default',
  className = ''
}) => {
  const getClassName = () => {
    const baseClass = className;
    switch (variant) {
      case 'success':
        return `text-green-600 ${baseClass}`;
      case 'destructive':
        return `text-red-600 ${baseClass}`;
      case 'warning':
        return `text-yellow-600 ${baseClass}`;
      default:
        return baseClass;
    }
  };

  return (
    <span className={getClassName()}>
      {formatCurrency(amount)}
    </span>
  );
};
