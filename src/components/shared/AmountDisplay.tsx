import React from 'react';
import { formatCurrency } from '@/utils/format-utils';

/**
 * AmountDisplay component for displaying monetary amounts with different visual styles
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number|undefined|null} props.amount - The monetary amount to display
 * @param {'default'|'destructive'|'success'|'warning'} [props.variant='default'] - Visual style variant
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Formatted currency amount with appropriate styling
 * 
 * @example
 * // Display a positive amount in green
 * <AmountDisplay amount={100.50} variant="success" />
 * 
 * // Display a negative amount in red
 * <AmountDisplay amount={-50.75} variant="destructive" />
 */
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
