
import { Account, AccountFromView } from '@/types/accountNew';

/**
 * Determines the account type based on customer and vendor flags
 */
export const determineAccountType = (
  isCustomer: boolean, 
  isVendor: boolean
): 'Customer' | 'Vendor' | 'Customer & Vendor' => {
  if (isCustomer && isVendor) {
    return 'Customer & Vendor';
  } else if (isCustomer) {
    return 'Customer';
  } else {
    return 'Vendor';
  }
};

/**
 * Extracts is_customer and is_vendor flags from account type
 */
export const extractAccountFlags = (
  type: 'Customer' | 'Vendor' | 'Customer & Vendor'
) => {
  return {
    is_customer: type === 'Customer' || type === 'Customer & Vendor',
    is_vendor: type === 'Vendor' || type === 'Customer & Vendor'
  };
};

/**
 * Maps database account view to Account type
 */
export const mapViewAccountToAccount = (viewAccount: AccountFromView): Account => {
  return {
    id: viewAccount.account_id,
    name: viewAccount.account_name,
    type: determineAccountType(viewAccount.is_customer, viewAccount.is_vendor),
    status: 'active', // Default status, not in view
    balance: viewAccount.balance || 0,
    glide_row_id: viewAccount.glide_row_id,
    accounts_uid: viewAccount.accounts_uid,
    created_at: viewAccount.created_at,
    updated_at: viewAccount.updated_at,
    photo: viewAccount.photo,
    // Additional fields from materialized view
    is_customer: viewAccount.is_customer,
    is_vendor: viewAccount.is_vendor,
    invoice_count: viewAccount.invoice_count || 0,
    total_invoiced: viewAccount.total_invoiced || 0,
    total_paid: viewAccount.total_paid || 0,
    last_invoice_date: viewAccount.last_invoice_date,
    last_payment_date: viewAccount.last_payment_date,
  };
};
