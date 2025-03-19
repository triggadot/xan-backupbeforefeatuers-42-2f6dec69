
// Constants for client types
export const CLIENT_TYPE = {
  CUSTOMER: 'Customer',
  VENDOR: 'Vendor',
  BOTH: 'Customer & Vendor'
} as const;

// Type for client type values
export type ClientType = typeof CLIENT_TYPE[keyof typeof CLIENT_TYPE];

/**
 * Normalizes client type strings to match the required format
 * @param clientType The client type string to normalize
 * @returns Normalized client type matching one of the valid values
 */
export function normalizeClientType(clientType?: string): ClientType | undefined {
  if (!clientType) return undefined;
  
  // Convert to lowercase for case-insensitive matching
  const lowerType = clientType.toLowerCase();
  
  if (lowerType === 'customer' || lowerType === 'customer_type') {
    return CLIENT_TYPE.CUSTOMER;
  }
  
  if (lowerType === 'vendor' || lowerType === 'vendor_type') {
    return CLIENT_TYPE.VENDOR;
  }
  
  if (
    lowerType === 'both' || 
    lowerType === 'customer & vendor' || 
    lowerType === 'customer and vendor' || 
    lowerType === 'customer_vendor'
  ) {
    return CLIENT_TYPE.BOTH;
  }
  
  // If nothing matches, default to CUSTOMER
  console.warn(`Unknown client type: ${clientType}, defaulting to Customer`);
  return CLIENT_TYPE.CUSTOMER;
}

/**
 * Checks if an account type is a customer
 */
export function isCustomer(accountType?: string): boolean {
  const normalizedType = normalizeClientType(accountType);
  return normalizedType === CLIENT_TYPE.CUSTOMER || normalizedType === CLIENT_TYPE.BOTH;
}

/**
 * Checks if an account type is a vendor
 */
export function isVendor(accountType?: string): boolean {
  const normalizedType = normalizeClientType(accountType);
  return normalizedType === CLIENT_TYPE.VENDOR || normalizedType === CLIENT_TYPE.BOTH;
}
