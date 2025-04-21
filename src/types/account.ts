import { BaseRow } from "./base";

export interface Account extends BaseRow {
  id: string;
  glide_row_id: string;
  account_name: string;
  client_type: string;
  accounts_uid: string;
  email_of_who_added: string | null;
  photo: string | null;
  date_added_client: string | null;
  balance: number;
  customer_balance: number;
  vendor_balance: number;
  is_customer: boolean;
  is_vendor: boolean;
  created_at: string;
  updated_at: string;
}

export type AccountFilter = {
  searchTerm?: string;
  accountType?: "customer" | "vendor" | "both" | null;
  status?: "active" | "inactive" | null;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export interface AccountListItem extends Account {
  // Additional fields for list display
  lastTransaction?: string;
}

export type AccountType = "Customer" | "Vendor" | "Customer & Vendor";
export type AccountStatus = "active" | "inactive";

// Helper type for account type determination
export type AccountTypeProps = {
  is_customer: boolean;
  is_vendor: boolean;
};
