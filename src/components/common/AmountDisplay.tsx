
import React from 'react';
import { formatCurrency } from '@/utils/format-utils';

export interface AmountDisplayProps {
  amount: number | undefined | null;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
  showPositiveSign?: boolean;
}

/**
 * A standardized component for displaying monetary amounts
 */
export function AmountDisplay({ 
  amount, 
  variant = 'default',
  className = '',
  showPositiveSign = false
}: AmountDisplayProps) {
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

  const formattedAmount = formatCurrency(amount);
  const displayAmount = amount !== undefined && amount !== null && amount > 0 && showPositiveSign 
    ? `+${formattedAmount}` 
    : formattedAmount;

  return (
    <span className={getClassName()}>
      {displayAmount}
    </span>
  );
}
