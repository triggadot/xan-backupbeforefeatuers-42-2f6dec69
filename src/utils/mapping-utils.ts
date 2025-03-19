
import { Account, GlAccount } from '@/types';

// Format currency values for display
export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Map database GlAccount to application Account type
export const mapGlAccountToAccount = (dbAccount: GlAccount): Account => {
  // Map the client_type to the appropriate type
  let accountType: 'customer' | 'vendor' | 'both' = 'customer';
  
  if (dbAccount.client_type) {
    if (dbAccount.client_type.includes('vendor') && dbAccount.client_type.includes('customer')) {
      accountType = 'both';
    } else if (dbAccount.client_type.includes('vendor')) {
      accountType = 'vendor';
    } else if (dbAccount.client_type.includes('customer')) {
      accountType = 'customer';
    }
  }
  
  return {
    id: dbAccount.id,
    name: dbAccount.account_name || '',
    type: accountType,
    email: dbAccount.email_of_who_added || '',
    status: 'active', // Default status
    balance: 0, // Default balance
    createdAt: dbAccount.created_at ? new Date(dbAccount.created_at) : new Date(),
    updatedAt: dbAccount.updated_at ? new Date(dbAccount.updated_at) : new Date(),
  };
};
