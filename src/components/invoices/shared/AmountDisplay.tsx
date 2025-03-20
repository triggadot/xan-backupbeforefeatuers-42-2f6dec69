
import { cn } from '@/lib/utils';

interface AmountDisplayProps {
  amount: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showPositiveSign?: boolean;
}

export const AmountDisplay = ({ 
  amount, 
  className, 
  variant = 'default', 
  showPositiveSign = false 
}: AmountDisplayProps) => {
  // Format amount as currency
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Add plus sign for positive amounts if requested
  const displayValue = amount > 0 && showPositiveSign ? `+${formattedAmount}` : formattedAmount;

  // Define variant classes
  const variantClasses = {
    default: '',
    success: 'text-green-600 dark:text-green-500',
    warning: 'text-amber-600 dark:text-amber-500',
    danger: 'text-red-600 dark:text-red-500',
  };

  return (
    <span className={cn(
      'font-medium tabular-nums',
      variantClasses[variant],
      className
    )}>
      {displayValue}
    </span>
  );
};
