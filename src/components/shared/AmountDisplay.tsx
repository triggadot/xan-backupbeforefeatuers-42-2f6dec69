import React from 'react';
import { formatCurrency } from '@/utils/format-utils';

/**
 * AmountDisplay component for displaying monetary amounts with different visual styles
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number|undefined|null} props.amount - The monetary amount to display
 * @param {'default'|'destructive'|'success'|'warning'|'auto'} [props.variant='default'] - Visual style variant
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.showLabel=false] - Whether to show "Balance:" label before the amount
 * @param {string} [props.label='Balance:'] - Custom label to show before the amount
 * @returns {JSX.Element} Formatted currency amount with appropriate styling
 * 
 * @example
 * // Display a positive amount in green
 * <AmountDisplay amount={100.50} variant="success" />
 * 
 * // Display a negative amount in red
 * <AmountDisplay amount={-50.75} variant="destructive" />
 * 
 * // Display an account balance with automatic coloring based on value
 * <AmountDisplay amount={account.balance} variant="auto" showLabel />
 */
export interface AmountDisplayProps {
  amount: number | undefined | null;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'auto';
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({ 
  amount, 
  variant = 'default',
  className = '',
  showLabel = false,
  label = 'Balance:'
}) => {
  const getClassName = () => {
    const baseClass = className;
    
    // For auto variant, determine color based on amount value
    if (variant === 'auto') {
      if (amount === null || amount === undefined) return baseClass;
      if (amount > 0) return `text-green-600 ${baseClass}`;
      if (amount < 0) return `text-red-600 ${baseClass}`;
      return baseClass;
    }
    
    // For other variants, use the specified color
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
      {showLabel && <span className="text-gray-500 mr-1">{label}</span>}
      {formatCurrency(amount)}
    </span>
  );
};
