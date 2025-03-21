
import React from 'react';
import { formatCurrency } from '@/utils/format-utils';

interface AmountDisplayProps {
  amount: number | undefined | null;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({ 
  amount, 
  variant = 'default' 
}) => {
  const getClassName = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'destructive':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return '';
    }
  };

  return (
    <span className={getClassName()}>
      {formatCurrency(amount)}
    </span>
  );
};
