import { BaseRow } from "./base";

export interface Estimate extends BaseRow {
  glide_row_id: string;
  rowid_invoices: string | null;
  rowid_accounts: string | null;
  account_name: string | null;
  estimate_date: string | null;
  is_a_sample: boolean;
  date_invoice_created: string | null;
  is_note_added: boolean;
  is_invoice_created: boolean;
  glide_pdf_url: string | null;
  glide_pdf_url_secondary: string | null;
  notes: string | null;
  total_amount: number;
  total_credits: number;
  balance: number;
  estimate_uid: string | null;
  status: "draft" | "sent" | "accepted" | "rejected" | "converted";
  supabase_pdf_url: string | null;
  account_id: string | null;
  invoice_id: string | null;
}

export interface EstimateWithRelations extends Estimate {
  invoice_uid?: string;
}

export type EstimateFilter = {
  status?: Estimate["status"];
  account_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
};

export interface EstimateLine {
  id: string;
  estimate_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}
