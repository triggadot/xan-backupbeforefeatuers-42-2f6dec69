export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      gl_accounts: {
        Row: {
          account_name: string | null
          accounts_uid: string
          balance: number | null
          client_type: string | null
          created_at: string | null
          date_added_client: string | null
          email_of_who_added: string | null
          glide_row_id: string | null
          id: string
          photo: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          accounts_uid?: string
          balance?: number | null
          client_type?: string | null
          created_at?: string | null
          date_added_client?: string | null
          email_of_who_added?: string | null
          glide_row_id?: string | null
          id?: string
          photo?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          accounts_uid?: string
          balance?: number | null
          client_type?: string | null
          created_at?: string | null
          date_added_client?: string | null
          email_of_who_added?: string | null
          glide_row_id?: string | null
          id?: string
          photo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gl_connections: {
        Row: {
          api_key: string
          app_id: string
          app_name: string | null
          created_at: string | null
          id: string
          last_sync: string | null
          settings: Json | null
          status: string | null
        }
        Insert: {
          api_key: string
          app_id: string
          app_name?: string | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          settings?: Json | null
          status?: string | null
        }
        Update: {
          api_key?: string
          app_id?: string
          app_name?: string | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          settings?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      gl_customer_credits: {
        Row: {
          created_at: string | null
          date_of_payment: string | null
          glide_row_id: string
          id: string
          payment_amount: number | null
          payment_note: string | null
          payment_type: string | null
          rowid_accounts: string | null
          rowid_estimates: string | null
          rowid_invoices: string | null
          sb_accounts_id: string | null
          sb_estimates_id: string | null
          sb_invoices_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_payment?: string | null
          glide_row_id: string
          id?: string
          payment_amount?: number | null
          payment_note?: string | null
          payment_type?: string | null
          rowid_accounts?: string | null
          rowid_estimates?: string | null
          rowid_invoices?: string | null
          sb_accounts_id?: string | null
          sb_estimates_id?: string | null
          sb_invoices_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_payment?: string | null
          glide_row_id?: string
          id?: string
          payment_amount?: number | null
          payment_note?: string | null
          payment_type?: string | null
          rowid_accounts?: string | null
          rowid_estimates?: string | null
          rowid_invoices?: string | null
          sb_accounts_id?: string | null
          sb_estimates_id?: string | null
          sb_invoices_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_customer_credits_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_estimates_id_fkey"
            columns: ["sb_estimates_id"]
            isOneToOne: false
            referencedRelation: "gl_estimate_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_estimates_id_fkey"
            columns: ["sb_estimates_id"]
            isOneToOne: false
            referencedRelation: "gl_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_order_fulfillment"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gl_customer_credits_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_customer_payments: {
        Row: {
          created_at: string | null
          date_of_payment: string | null
          email_of_user: string | null
          glide_row_id: string
          id: string
          payment_amount: number | null
          payment_note: string | null
          rowid_accounts: string | null
          rowid_invoices: string | null
          sb_accounts_id: string | null
          sb_invoices_id: string | null
          type_of_payment: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_payment?: string | null
          email_of_user?: string | null
          glide_row_id: string
          id?: string
          payment_amount?: number | null
          payment_note?: string | null
          rowid_accounts?: string | null
          rowid_invoices?: string | null
          sb_accounts_id?: string | null
          sb_invoices_id?: string | null
          type_of_payment?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_payment?: string | null
          email_of_user?: string | null
          glide_row_id?: string
          id?: string
          payment_amount?: number | null
          payment_note?: string | null
          rowid_accounts?: string | null
          rowid_invoices?: string | null
          sb_accounts_id?: string | null
          sb_invoices_id?: string | null
          type_of_payment?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_customer_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_customer_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_customer_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_customer_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_customer_payments_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_customer_payments_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_order_fulfillment"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gl_customer_payments_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_estimate_lines: {
        Row: {
          created_at: string | null
          date_of_sale: string | null
          glide_row_id: string
          id: string
          line_total: number | null
          product_sale_note: string | null
          qty_sold: number | null
          rowid_estimate_lines: string | null
          rowid_products: string | null
          sale_product_name: string | null
          sb_estimates_id: string | null
          sb_invoice_lines_id: string | null
          sb_products_id: string | null
          selling_price: number | null
          total_stock_after_sell: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id: string
          id?: string
          line_total?: number | null
          product_sale_note?: string | null
          qty_sold?: number | null
          rowid_estimate_lines?: string | null
          rowid_products?: string | null
          sale_product_name?: string | null
          sb_estimates_id?: string | null
          sb_invoice_lines_id?: string | null
          sb_products_id?: string | null
          selling_price?: number | null
          total_stock_after_sell?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id?: string
          id?: string
          line_total?: number | null
          product_sale_note?: string | null
          qty_sold?: number | null
          rowid_estimate_lines?: string | null
          rowid_products?: string | null
          sale_product_name?: string | null
          sb_estimates_id?: string | null
          sb_invoice_lines_id?: string | null
          sb_products_id?: string | null
          selling_price?: number | null
          total_stock_after_sell?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_estimate_lines_sb_estimates_id_fkey"
            columns: ["sb_estimates_id"]
            isOneToOne: false
            referencedRelation: "gl_estimate_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimate_lines_sb_estimates_id_fkey"
            columns: ["sb_estimates_id"]
            isOneToOne: false
            referencedRelation: "gl_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimate_lines_sb_invoice_lines_id_fkey"
            columns: ["sb_invoice_lines_id"]
            isOneToOne: false
            referencedRelation: "gl_invoice_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimate_lines_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "gl_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimate_lines_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "gl_unpaid_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimate_lines_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_estimates: {
        Row: {
          add_note: boolean | null
          balance: number | null
          created_at: string | null
          date_invoice_created_date: string | null
          estimate_date: string | null
          glide_pdf_url: string | null
          glide_pdf_url2: string | null
          glide_row_id: string
          id: string
          is_a_sample: boolean | null
          rowid_accounts: string | null
          rowid_invoices: string | null
          sb_accounts_id: string | null
          sb_invoices_id: string | null
          status: string | null
          total_amount: number | null
          total_credits: number | null
          updated_at: string | null
          valid_final_create_invoice_clicked: boolean | null
        }
        Insert: {
          add_note?: boolean | null
          balance?: number | null
          created_at?: string | null
          date_invoice_created_date?: string | null
          estimate_date?: string | null
          glide_pdf_url?: string | null
          glide_pdf_url2?: string | null
          glide_row_id: string
          id?: string
          is_a_sample?: boolean | null
          rowid_accounts?: string | null
          rowid_invoices?: string | null
          sb_accounts_id?: string | null
          sb_invoices_id?: string | null
          status?: string | null
          total_amount?: number | null
          total_credits?: number | null
          updated_at?: string | null
          valid_final_create_invoice_clicked?: boolean | null
        }
        Update: {
          add_note?: boolean | null
          balance?: number | null
          created_at?: string | null
          date_invoice_created_date?: string | null
          estimate_date?: string | null
          glide_pdf_url?: string | null
          glide_pdf_url2?: string | null
          glide_row_id?: string
          id?: string
          is_a_sample?: boolean | null
          rowid_accounts?: string | null
          rowid_invoices?: string | null
          sb_accounts_id?: string | null
          sb_invoices_id?: string | null
          status?: string | null
          total_amount?: number | null
          total_credits?: number | null
          updated_at?: string | null
          valid_final_create_invoice_clicked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_estimates_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimates_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_estimates_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_estimates_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_estimates_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_estimates_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_order_fulfillment"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gl_estimates_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_expenses: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          date: string | null
          expense_address: string | null
          expense_cash: string | null
          expense_change: string | null
          expense_list_of_items: string | null
          expense_receipt_image: string | null
          expense_supplier_name: string | null
          expense_tax: string | null
          expense_text_to_json: string | null
          expense_total: string | null
          glide_row_id: string
          id: string
          notes: string | null
          processing: boolean | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          expense_address?: string | null
          expense_cash?: string | null
          expense_change?: string | null
          expense_list_of_items?: string | null
          expense_receipt_image?: string | null
          expense_supplier_name?: string | null
          expense_tax?: string | null
          expense_text_to_json?: string | null
          expense_total?: string | null
          glide_row_id: string
          id?: string
          notes?: string | null
          processing?: boolean | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          expense_address?: string | null
          expense_cash?: string | null
          expense_change?: string | null
          expense_list_of_items?: string | null
          expense_receipt_image?: string | null
          expense_supplier_name?: string | null
          expense_tax?: string | null
          expense_text_to_json?: string | null
          expense_total?: string | null
          glide_row_id?: string
          id?: string
          notes?: string | null
          processing?: boolean | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gl_invoice_lines: {
        Row: {
          created_at: string | null
          date_of_sale: string | null
          glide_row_id: string
          id: string
          line_total: number | null
          product_sale_note: string | null
          qty_sold: number | null
          renamed_product_name: string | null
          rowid_invoices: string | null
          rowid_products: string | null
          sb_estimate_lines_id: string | null
          sb_invoices_id: string | null
          sb_products_id: string | null
          selling_price: number | null
          updated_at: string | null
          user_email_of_added: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id: string
          id?: string
          line_total?: number | null
          product_sale_note?: string | null
          qty_sold?: number | null
          renamed_product_name?: string | null
          rowid_invoices?: string | null
          rowid_products?: string | null
          sb_estimate_lines_id?: string | null
          sb_invoices_id?: string | null
          sb_products_id?: string | null
          selling_price?: number | null
          updated_at?: string | null
          user_email_of_added?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id?: string
          id?: string
          line_total?: number | null
          product_sale_note?: string | null
          qty_sold?: number | null
          renamed_product_name?: string | null
          rowid_invoices?: string | null
          rowid_products?: string | null
          sb_estimate_lines_id?: string | null
          sb_invoices_id?: string | null
          sb_products_id?: string | null
          selling_price?: number | null
          updated_at?: string | null
          user_email_of_added?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_invoice_lines_sb_estimate_lines_id_fkey"
            columns: ["sb_estimate_lines_id"]
            isOneToOne: false
            referencedRelation: "gl_estimate_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoice_lines_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoice_lines_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_order_fulfillment"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gl_invoice_lines_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoice_lines_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "gl_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoice_lines_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "gl_unpaid_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoice_lines_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_invoices: {
        Row: {
          balance: number | null
          created_at: string | null
          created_timestamp: string | null
          doc_glideforeverlink: string | null
          due_date: string | null
          glide_row_id: string
          id: string
          invoice_order_date: string | null
          notes: string | null
          payment_status: string | null
          processed: boolean | null
          rowid_accounts: string | null
          sb_accounts_id: string | null
          sb_estimates_id: string | null
          submitted_timestamp: string | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          total_paid: number | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          created_timestamp?: string | null
          doc_glideforeverlink?: string | null
          due_date?: string | null
          glide_row_id: string
          id?: string
          invoice_order_date?: string | null
          notes?: string | null
          payment_status?: string | null
          processed?: boolean | null
          rowid_accounts?: string | null
          sb_accounts_id?: string | null
          sb_estimates_id?: string | null
          submitted_timestamp?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          created_timestamp?: string | null
          doc_glideforeverlink?: string | null
          due_date?: string | null
          glide_row_id?: string
          id?: string
          invoice_order_date?: string | null
          notes?: string | null
          payment_status?: string | null
          processed?: boolean | null
          rowid_accounts?: string | null
          sb_accounts_id?: string | null
          sb_estimates_id?: string | null
          submitted_timestamp?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_invoices_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoices_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_invoices_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_invoices_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_invoices_sb_estimates_id_fkey"
            columns: ["sb_estimates_id"]
            isOneToOne: false
            referencedRelation: "gl_estimate_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_invoices_sb_estimates_id_fkey"
            columns: ["sb_estimates_id"]
            isOneToOne: false
            referencedRelation: "gl_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_mappings: {
        Row: {
          column_mappings: Json
          connection_id: string
          created_at: string | null
          enabled: boolean
          glide_table: string
          glide_table_display_name: string
          id: string
          supabase_table: string
          sync_direction: string
          updated_at: string | null
        }
        Insert: {
          column_mappings?: Json
          connection_id: string
          created_at?: string | null
          enabled?: boolean
          glide_table: string
          glide_table_display_name: string
          id?: string
          supabase_table: string
          sync_direction?: string
          updated_at?: string | null
        }
        Update: {
          column_mappings?: Json
          connection_id?: string
          created_at?: string | null
          enabled?: boolean
          glide_table?: string
          glide_table_display_name?: string
          id?: string
          supabase_table?: string
          sync_direction?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "gl_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string | null
          date_timestamp_subm: string | null
          display_name: string | null
          email_email_of_user_who_added_product: string | null
          fronted: boolean | null
          glide_row_id: string
          id: string
          miscellaneous_items: boolean | null
          new_product_name: string | null
          po_po_date: string | null
          po_poui_dfrom_add_prod: string | null
          product_image1: string | null
          product_purchase_date: string | null
          purchase_notes: string | null
          rowid_accounts: string | null
          rowid_purchase_orders: string | null
          rowid_vendor_payments: string | null
          samples: boolean | null
          samples_or_fronted: boolean | null
          sb_accounts_id: string | null
          sb_purchase_orders_id: string | null
          sb_vendor_payments_id: string | null
          terms_for_fronted_product: string | null
          total_qty_purchased: number | null
          total_units_behind_sample: number | null
          updated_at: string | null
          vendor_product_name: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          date_timestamp_subm?: string | null
          display_name?: string | null
          email_email_of_user_who_added_product?: string | null
          fronted?: boolean | null
          glide_row_id: string
          id?: string
          miscellaneous_items?: boolean | null
          new_product_name?: string | null
          po_po_date?: string | null
          po_poui_dfrom_add_prod?: string | null
          product_image1?: string | null
          product_purchase_date?: string | null
          purchase_notes?: string | null
          rowid_accounts?: string | null
          rowid_purchase_orders?: string | null
          rowid_vendor_payments?: string | null
          samples?: boolean | null
          samples_or_fronted?: boolean | null
          sb_accounts_id?: string | null
          sb_purchase_orders_id?: string | null
          sb_vendor_payments_id?: string | null
          terms_for_fronted_product?: string | null
          total_qty_purchased?: number | null
          total_units_behind_sample?: number | null
          updated_at?: string | null
          vendor_product_name?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          date_timestamp_subm?: string | null
          display_name?: string | null
          email_email_of_user_who_added_product?: string | null
          fronted?: boolean | null
          glide_row_id?: string
          id?: string
          miscellaneous_items?: boolean | null
          new_product_name?: string | null
          po_po_date?: string | null
          po_poui_dfrom_add_prod?: string | null
          product_image1?: string | null
          product_purchase_date?: string | null
          purchase_notes?: string | null
          rowid_accounts?: string | null
          rowid_purchase_orders?: string | null
          rowid_vendor_payments?: string | null
          samples?: boolean | null
          samples_or_fronted?: boolean | null
          sb_accounts_id?: string | null
          sb_purchase_orders_id?: string | null
          sb_vendor_payments_id?: string | null
          terms_for_fronted_product?: string | null
          total_qty_purchased?: number | null
          total_units_behind_sample?: number | null
          updated_at?: string | null
          vendor_product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_products_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_products_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_products_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_products_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_products_sb_purchase_orders_id_fkey"
            columns: ["sb_purchase_orders_id"]
            isOneToOne: false
            referencedRelation: "gl_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_products_sb_purchase_orders_id_fkey"
            columns: ["sb_purchase_orders_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_products_sb_vendor_payments_id_fkey"
            columns: ["sb_vendor_payments_id"]
            isOneToOne: false
            referencedRelation: "gl_vendor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_purchase_orders: {
        Row: {
          balance: number | null
          created_at: string | null
          date_payment_date_mddyyyy: string | null
          docs_shortlink: string | null
          glide_row_id: string
          id: string
          payment_status: string | null
          pdf_link: string | null
          po_date: string | null
          product_count: number | null
          purchase_order_uid: string | null
          rowid_accounts: string | null
          sb_accounts_id: string | null
          total_amount: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          date_payment_date_mddyyyy?: string | null
          docs_shortlink?: string | null
          glide_row_id: string
          id?: string
          payment_status?: string | null
          pdf_link?: string | null
          po_date?: string | null
          product_count?: number | null
          purchase_order_uid?: string | null
          rowid_accounts?: string | null
          sb_accounts_id?: string | null
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          date_payment_date_mddyyyy?: string | null
          docs_shortlink?: string | null
          glide_row_id?: string
          id?: string
          payment_status?: string | null
          pdf_link?: string | null
          po_date?: string | null
          product_count?: number | null
          purchase_order_uid?: string | null
          rowid_accounts?: string | null
          sb_accounts_id?: string | null
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_purchase_orders_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_purchase_orders_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_purchase_orders_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_purchase_orders_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      gl_relationship_mapping_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          rowid_field: string
          rowid_value: string | null
          sb_field: string
          source_id: string
          source_table: string
          status: string
          target_id: string | null
          target_table: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          rowid_field: string
          rowid_value?: string | null
          sb_field: string
          source_id: string
          source_table: string
          status?: string
          target_id?: string | null
          target_table: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          rowid_field?: string
          rowid_value?: string | null
          sb_field?: string
          source_id?: string
          source_table?: string
          status?: string
          target_id?: string | null
          target_table?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gl_relationship_mappings: {
        Row: {
          created_at: string | null
          enabled: boolean
          glide_column_id: string
          glide_column_name: string
          glide_table: string
          id: string
          rowid_field: string
          sb_field: string
          supabase_table: string
          target_table: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          glide_column_id: string
          glide_column_name: string
          glide_table: string
          id?: string
          rowid_field: string
          sb_field: string
          supabase_table: string
          target_table: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          glide_column_id?: string
          glide_column_name?: string
          glide_table?: string
          id?: string
          rowid_field?: string
          sb_field?: string
          supabase_table?: string
          target_table?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gl_shipping_records: {
        Row: {
          box_sizes: string | null
          box_weight: number | null
          created_at: string | null
          drop_off_location_uid: string | null
          glide_row_id: string
          id: string
          receiver_receiver_address: string | null
          receiver_receiver_name: string | null
          receiver_state: string | null
          rowid_accounts: string | null
          rowid_invoices: string | null
          sb_accounts_id1: string | null
          sb_accounts_id2: string | null
          sb_accounts_id3: string | null
          sb_invoices_id: string | null
          sender_sender_address: string | null
          sender_sender_name_company: string | null
          sender_sender_phone: string | null
          ship_date: string | null
          tp_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          box_sizes?: string | null
          box_weight?: number | null
          created_at?: string | null
          drop_off_location_uid?: string | null
          glide_row_id: string
          id?: string
          receiver_receiver_address?: string | null
          receiver_receiver_name?: string | null
          receiver_state?: string | null
          rowid_accounts?: string | null
          rowid_invoices?: string | null
          sb_accounts_id1?: string | null
          sb_accounts_id2?: string | null
          sb_accounts_id3?: string | null
          sb_invoices_id?: string | null
          sender_sender_address?: string | null
          sender_sender_name_company?: string | null
          sender_sender_phone?: string | null
          ship_date?: string | null
          tp_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          box_sizes?: string | null
          box_weight?: number | null
          created_at?: string | null
          drop_off_location_uid?: string | null
          glide_row_id?: string
          id?: string
          receiver_receiver_address?: string | null
          receiver_receiver_name?: string | null
          receiver_state?: string | null
          rowid_accounts?: string | null
          rowid_invoices?: string | null
          sb_accounts_id1?: string | null
          sb_accounts_id2?: string | null
          sb_accounts_id3?: string | null
          sb_invoices_id?: string | null
          sender_sender_address?: string | null
          sender_sender_name_company?: string | null
          sender_sender_phone?: string | null
          ship_date?: string | null
          tp_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id1_fkey"
            columns: ["sb_accounts_id1"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id1_fkey"
            columns: ["sb_accounts_id1"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id1_fkey"
            columns: ["sb_accounts_id1"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id1_fkey"
            columns: ["sb_accounts_id1"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id2_fkey"
            columns: ["sb_accounts_id2"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id2_fkey"
            columns: ["sb_accounts_id2"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id2_fkey"
            columns: ["sb_accounts_id2"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id2_fkey"
            columns: ["sb_accounts_id2"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id3_fkey"
            columns: ["sb_accounts_id3"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id3_fkey"
            columns: ["sb_accounts_id3"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id3_fkey"
            columns: ["sb_accounts_id3"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_accounts_id3_fkey"
            columns: ["sb_accounts_id3"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "gl_order_fulfillment"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "gl_shipping_records_sb_invoices_id_fkey"
            columns: ["sb_invoices_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_sync_errors: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          mapping_id: string | null
          record_data: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          retryable: boolean | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          mapping_id?: string | null
          record_data?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          retryable?: boolean | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          mapping_id?: string | null
          record_data?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          retryable?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_sync_errors_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "gl_mapping_status"
            referencedColumns: ["mapping_id"]
          },
          {
            foreignKeyName: "gl_sync_errors_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "gl_mappings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_sync_errors_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "gl_product_sync_stats"
            referencedColumns: ["mapping_id"]
          },
        ]
      }
      gl_sync_logs: {
        Row: {
          completed_at: string | null
          id: string
          mapping_id: string | null
          message: string | null
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          mapping_id?: string | null
          message?: string | null
          records_processed?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          mapping_id?: string | null
          message?: string | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      gl_vendor_payments: {
        Row: {
          created_at: string | null
          date_of_payment: string | null
          date_of_purchase_order: string | null
          glide_row_id: string
          id: string
          payment_amount: number | null
          rowid_accounts: string | null
          rowid_products: string | null
          rowid_purchase_orders: string | null
          sb_accounts_id: string | null
          sb_products_id: string | null
          sb_purchase_orders_id: string | null
          updated_at: string | null
          vendor_purchase_note: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_payment?: string | null
          date_of_purchase_order?: string | null
          glide_row_id: string
          id?: string
          payment_amount?: number | null
          rowid_accounts?: string | null
          rowid_products?: string | null
          rowid_purchase_orders?: string | null
          sb_accounts_id?: string | null
          sb_products_id?: string | null
          sb_purchase_orders_id?: string | null
          updated_at?: string | null
          vendor_purchase_note?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_payment?: string | null
          date_of_purchase_order?: string | null
          glide_row_id?: string
          id?: string
          payment_amount?: number | null
          rowid_accounts?: string | null
          rowid_products?: string | null
          rowid_purchase_orders?: string | null
          sb_accounts_id?: string | null
          sb_products_id?: string | null
          sb_purchase_orders_id?: string | null
          updated_at?: string | null
          vendor_purchase_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_vendor_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_invoice_customer_details"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_accounts_id_fkey"
            columns: ["sb_accounts_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "gl_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "gl_unpaid_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_products_id_fkey"
            columns: ["sb_products_id"]
            isOneToOne: false
            referencedRelation: "mv_product_vendor_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_purchase_orders_id_fkey"
            columns: ["sb_purchase_orders_id"]
            isOneToOne: false
            referencedRelation: "gl_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_vendor_payments_sb_purchase_orders_id_fkey"
            columns: ["sb_purchase_orders_id"]
            isOneToOne: false
            referencedRelation: "mv_purchase_order_vendor_details"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          analyzed_content: Json | null
          caption: string | null
          chat_id: number
          chat_title: string | null
          chat_type: string
          content_disposition: string | null
          correlation_id: string | null
          created_at: string
          deleted_from_telegram: boolean
          duplicate_reference_id: string | null
          duration: number | null
          edit_count: number | null
          edit_history: Json[] | null
          error_code: string | null
          error_message: string | null
          file_id: string
          file_size: number | null
          file_unique_id: string
          forward_info: Json | null
          group_caption_synced: boolean | null
          height: number | null
          id: string
          is_channel_post: boolean
          is_duplicate: boolean
          is_edited: boolean
          is_forward: boolean | null
          is_original_caption: boolean | null
          media_group_id: string | null
          media_type: string | null
          message_caption_id: string | null
          mime_type: string
          mime_type_original: string | null
          mime_type_verified: boolean | null
          needs_redownload: boolean | null
          old_analyzed_content: Json[] | null
          processing_completed_at: string | null
          processing_flow: Json | null
          processing_started_at: string | null
          processing_state:
            | Database["public"]["Enums"]["message_processing_state"]
            | null
          public_url: string | null
          raw_caption: string | null
          redownload_reason: string | null
          storage_exists: boolean | null
          storage_path: string | null
          storage_path_standardized: boolean | null
          telegram_data: Json
          telegram_message_id: number
          updated_at: string
          width: number | null
        }
        Insert: {
          analyzed_content?: Json | null
          caption?: string | null
          chat_id: number
          chat_title?: string | null
          chat_type: string
          content_disposition?: string | null
          correlation_id?: string | null
          created_at?: string
          deleted_from_telegram?: boolean
          duplicate_reference_id?: string | null
          duration?: number | null
          edit_count?: number | null
          edit_history?: Json[] | null
          error_code?: string | null
          error_message?: string | null
          file_id: string
          file_size?: number | null
          file_unique_id: string
          forward_info?: Json | null
          group_caption_synced?: boolean | null
          height?: number | null
          id?: string
          is_channel_post?: boolean
          is_duplicate?: boolean
          is_edited?: boolean
          is_forward?: boolean | null
          is_original_caption?: boolean | null
          media_group_id?: string | null
          media_type?: string | null
          message_caption_id?: string | null
          mime_type: string
          mime_type_original?: string | null
          mime_type_verified?: boolean | null
          needs_redownload?: boolean | null
          old_analyzed_content?: Json[] | null
          processing_completed_at?: string | null
          processing_flow?: Json | null
          processing_started_at?: string | null
          processing_state?:
            | Database["public"]["Enums"]["message_processing_state"]
            | null
          public_url?: string | null
          raw_caption?: string | null
          redownload_reason?: string | null
          storage_exists?: boolean | null
          storage_path?: string | null
          storage_path_standardized?: boolean | null
          telegram_data: Json
          telegram_message_id: number
          updated_at?: string
          width?: number | null
        }
        Update: {
          analyzed_content?: Json | null
          caption?: string | null
          chat_id?: number
          chat_title?: string | null
          chat_type?: string
          content_disposition?: string | null
          correlation_id?: string | null
          created_at?: string
          deleted_from_telegram?: boolean
          duplicate_reference_id?: string | null
          duration?: number | null
          edit_count?: number | null
          edit_history?: Json[] | null
          error_code?: string | null
          error_message?: string | null
          file_id?: string
          file_size?: number | null
          file_unique_id?: string
          forward_info?: Json | null
          group_caption_synced?: boolean | null
          height?: number | null
          id?: string
          is_channel_post?: boolean
          is_duplicate?: boolean
          is_edited?: boolean
          is_forward?: boolean | null
          is_original_caption?: boolean | null
          media_group_id?: string | null
          media_type?: string | null
          message_caption_id?: string | null
          mime_type?: string
          mime_type_original?: string | null
          mime_type_verified?: boolean | null
          needs_redownload?: boolean | null
          old_analyzed_content?: Json[] | null
          processing_completed_at?: string | null
          processing_flow?: Json | null
          processing_started_at?: string | null
          processing_state?:
            | Database["public"]["Enums"]["message_processing_state"]
            | null
          public_url?: string | null
          raw_caption?: string | null
          redownload_reason?: string | null
          storage_exists?: boolean | null
          storage_path?: string | null
          storage_path_standardized?: boolean | null
          telegram_data?: Json
          telegram_message_id?: number
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_message_caption_id"
            columns: ["message_caption_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      other_messages: {
        Row: {
          analyzed_content: Json | null
          chat_id: number
          chat_title: string | null
          chat_type: string
          content: string | null
          correlation_id: string | null
          created_at: string
          deleted_from_telegram: boolean
          edit_count: number | null
          edit_history: Json[] | null
          forward_info: Json | null
          group_caption_synced: boolean | null
          id: string
          is_channel_post: boolean
          is_edited: boolean
          is_forward: boolean | null
          message_caption_id: string | null
          message_text: string | null
          message_type: string
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_state: string | null
          telegram_data: Json
          telegram_message_id: number
          updated_at: string
        }
        Insert: {
          analyzed_content?: Json | null
          chat_id: number
          chat_title?: string | null
          chat_type: string
          content?: string | null
          correlation_id?: string | null
          created_at?: string
          deleted_from_telegram?: boolean
          edit_count?: number | null
          edit_history?: Json[] | null
          forward_info?: Json | null
          group_caption_synced?: boolean | null
          id?: string
          is_channel_post?: boolean
          is_edited?: boolean
          is_forward?: boolean | null
          message_caption_id?: string | null
          message_text?: string | null
          message_type: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_state?: string | null
          telegram_data: Json
          telegram_message_id: number
          updated_at?: string
        }
        Update: {
          analyzed_content?: Json | null
          chat_id?: number
          chat_title?: string | null
          chat_type?: string
          content?: string | null
          correlation_id?: string | null
          created_at?: string
          deleted_from_telegram?: boolean
          edit_count?: number | null
          edit_history?: Json[] | null
          forward_info?: Json | null
          group_caption_synced?: boolean | null
          id?: string
          is_channel_post?: boolean
          is_edited?: boolean
          is_forward?: boolean | null
          message_caption_id?: string | null
          message_text?: string | null
          message_type?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_state?: string | null
          telegram_data?: Json
          telegram_message_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_other_message_caption_id"
            columns: ["message_caption_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_locks: {
        Row: {
          entity_id: string
          entity_type: string
          expires_at: string
          id: string
          locked_at: string | null
          locked_by: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          expires_at: string
          id?: string
          locked_at?: string | null
          locked_by: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          expires_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      unified_audit_logs: {
        Row: {
          chat_id: number | null
          correlation_id: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          event_timestamp: string
          event_type: string
          id: string
          message_id: string | null
          metadata: Json | null
          new_state: Json | null
          previous_state: Json | null
          telegram_message_id: number | null
        }
        Insert: {
          chat_id?: number | null
          correlation_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_timestamp?: string
          event_type: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
          telegram_message_id?: number | null
        }
        Update: {
          chat_id?: number | null
          correlation_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_timestamp?: string
          event_type?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
          telegram_message_id?: number | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      gl_business_metrics: {
        Row: {
          total_customers: number | null
          total_estimates: number | null
          total_invoice_amount: number | null
          total_invoices: number | null
          total_outstanding_balance: number | null
          total_payments_made: number | null
          total_payments_received: number | null
          total_products: number | null
          total_purchase_amount: number | null
          total_purchase_balance: number | null
          total_purchase_orders: number | null
          total_vendors: number | null
        }
        Relationships: []
      }
      gl_current_status: {
        Row: {
          balance_amount: number | null
          category: string | null
          draft_count: number | null
          paid_count: number | null
          total_amount: number | null
          total_count: number | null
          total_paid: number | null
          unpaid_count: number | null
        }
        Relationships: []
      }
      gl_estimate_totals: {
        Row: {
          balance: number | null
          glide_row_id: string | null
          id: string | null
          line_items_count: number | null
          status: string | null
          total_amount: number | null
          total_credits: number | null
        }
        Relationships: []
      }
      gl_mapping_status: {
        Row: {
          app_name: string | null
          column_mappings: Json | null
          connection_id: string | null
          created_at: string | null
          current_status: string | null
          enabled: boolean | null
          error_count: number | null
          glide_table: string | null
          glide_table_display_name: string | null
          last_sync_completed_at: string | null
          last_sync_started_at: string | null
          mapping_id: string | null
          records_processed: number | null
          supabase_table: string | null
          sync_direction: string | null
          total_records: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "gl_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_order_fulfillment: {
        Row: {
          customer_name: string | null
          has_shipping: boolean | null
          invoice_amount: number | null
          invoice_id: string | null
          invoice_rowid: string | null
          payment_status: string | null
          products: string | null
          ship_date: string | null
          total_items: number | null
          tracking_number: string | null
        }
        Relationships: []
      }
      gl_product_sync_stats: {
        Row: {
          app_name: string | null
          connection_id: string | null
          error_count: number | null
          glide_table: string | null
          glide_table_display_name: string | null
          last_sync_time: string | null
          mapping_id: string | null
          supabase_table: string | null
          sync_direction: string | null
          total_products: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "gl_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_recent_logs: {
        Row: {
          app_name: string | null
          glide_table: string | null
          glide_table_display_name: string | null
          id: string | null
          mapping_id: string | null
          message: string | null
          records_processed: number | null
          started_at: string | null
          status: string | null
          supabase_table: string | null
          sync_direction: string | null
        }
        Relationships: []
      }
      gl_sync_stats: {
        Row: {
          failed_syncs: number | null
          successful_syncs: number | null
          sync_date: string | null
          syncs: number | null
          total_records_processed: number | null
        }
        Relationships: []
      }
      gl_tables_view: {
        Row: {
          table_name: unknown | null
        }
        Relationships: []
      }
      gl_unpaid_inventory: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string | null
          date_timestamp_subm: string | null
          display_name: string | null
          email_email_of_user_who_added_product: string | null
          fronted: boolean | null
          glide_row_id: string | null
          id: string | null
          miscellaneous_items: boolean | null
          new_product_name: string | null
          po_po_date: string | null
          po_poui_dfrom_add_prod: string | null
          product_image1: string | null
          product_purchase_date: string | null
          purchase_notes: string | null
          rowid_accounts: string | null
          rowid_purchase_orders: string | null
          rowid_vendor_payments: string | null
          samples: boolean | null
          samples_or_fronted: boolean | null
          terms_for_fronted_product: string | null
          total_qty_purchased: number | null
          total_units_behind_sample: number | null
          unpaid_type: string | null
          unpaid_value: number | null
          updated_at: string | null
          vendor_name: string | null
          vendor_product_name: string | null
        }
        Relationships: []
      }
      media_group_stats: {
        Row: {
          analyzed_count: number | null
          first_message_time: string | null
          last_message_time: string | null
          latest_processing_state:
            | Database["public"]["Enums"]["message_processing_state"]
            | null
          media_group_id: string | null
          synced_count: number | null
          total_messages: number | null
        }
        Relationships: []
      }
      mv_invoice_customer_details: {
        Row: {
          balance: number | null
          created_at: string | null
          created_timestamp: string | null
          customer: Json | null
          customer_id: string | null
          customer_name: string | null
          customer_uid: string | null
          doc_glideforeverlink: string | null
          due_date: string | null
          glide_row_id: string | null
          id: string | null
          invoice_order_date: string | null
          line_item_count: number | null
          line_items_total: number | null
          notes: string | null
          payment_status: string | null
          payments_total: number | null
          processed: boolean | null
          rowid_accounts: string | null
          submitted_timestamp: string | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          total_paid: number | null
          updated_at: string | null
          user_email: string | null
        }
        Relationships: []
      }
      mv_product_vendor_details: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string | null
          date_timestamp_subm: string | null
          display_name: string | null
          email_email_of_user_who_added_product: string | null
          fronted: boolean | null
          glide_row_id: string | null
          id: string | null
          miscellaneous_items: boolean | null
          new_product_name: string | null
          po_date: string | null
          po_number: string | null
          po_po_date: string | null
          po_poui_dfrom_add_prod: string | null
          po_status: string | null
          product_image1: string | null
          product_purchase_date: string | null
          purchase_notes: string | null
          rowid_accounts: string | null
          rowid_purchase_orders: string | null
          rowid_vendor_payments: string | null
          samples: boolean | null
          samples_or_fronted: boolean | null
          terms_for_fronted_product: string | null
          total_qty_purchased: number | null
          total_units_behind_sample: number | null
          updated_at: string | null
          vendor: Json | null
          vendor_glide_id: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_product_name: string | null
          vendor_uid: string | null
        }
        Relationships: []
      }
      mv_purchase_order_vendor_details: {
        Row: {
          balance: number | null
          created_at: string | null
          date_payment_date_mddyyyy: string | null
          docs_shortlink: string | null
          glide_row_id: string | null
          id: string | null
          payment_status: string | null
          payments_total: number | null
          pdf_link: string | null
          po_date: string | null
          product_count: number | null
          product_count_calc: number | null
          products_total: number | null
          purchase_order_uid: string | null
          rowid_accounts: string | null
          total_amount: number | null
          total_paid: number | null
          updated_at: string | null
          vendor: Json | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_uid: string | null
        }
        Relationships: []
      }
      scheduled_processing_stats: {
        Row: {
          error_count: number | null
          event_type: string | null
          last_run: string | null
          recent_metadata: Json[] | null
          total_runs: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      debug_media_message_errors: {
        Args: {
          p_correlation_id?: string
        }
        Returns: {
          error_message: string
          event_timestamp: string
          metadata: Json
          telegram_message_id: number
          chat_id: number
          correlation_id: string
        }[]
      }
      delete_message_by_id: {
        Args: {
          p_telegram_message_id: number
          p_chat_id: number
        }
        Returns: Json
      }
      extract_forward_info: {
        Args: {
          message: Json
        }
        Returns: Json
      }
      force_resync_media_group: {
        Args: {
          p_media_group_id: string
        }
        Returns: Json
      }
      generate_estimate_uid: {
        Args: {
          account_uid: string
          estimate_date: string
          is_sample: boolean
        }
        Returns: string
      }
      generate_invoice_uid: {
        Args: {
          account_uid: string
          invoice_date: string
        }
        Returns: string
      }
      generate_po_uid: {
        Args: {
          account_uid: string
          po_date: string
        }
        Returns: string
      }
      get_relationship_mapping_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          source_table: string
          target_table: string
          total_mappings: number
          successful: number
          failed: number
          success_rate: number
          common_errors: Json
        }[]
      }
      get_table_columns: {
        Args: {
          table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      gl_admin_execute_sql: {
        Args: {
          sql_query: string
        }
        Returns: Json
      }
      gl_calculate_account_balance: {
        Args: {
          account_id: string
        }
        Returns: number
      }
      gl_calculate_product_inventory: {
        Args: {
          product_id: string
        }
        Returns: number
      }
      gl_get_account_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_count: number
          vendor_count: number
        }[]
      }
      gl_get_business_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_invoices: number
          total_estimates: number
          total_purchase_orders: number
          total_products: number
          total_customers: number
          total_vendors: number
          total_invoice_amount: number
          total_payments_received: number
          total_outstanding_balance: number
          total_purchase_amount: number
          total_payments_made: number
          total_purchase_balance: number
        }[]
      }
      gl_get_document_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          total_count: number
          paid_count: number
          unpaid_count: number
          draft_count: number
          total_amount: number
          total_paid: number
          balance_amount: number
        }[]
      }
      gl_get_invoice_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          invoice_count: number
          estimate_count: number
          total_invoice_amount: number
          total_payments_received: number
          total_outstanding_balance: number
        }[]
      }
      gl_get_purchase_order_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          po_count: number
          total_purchase_amount: number
          total_payments_made: number
          total_purchase_balance: number
        }[]
      }
      gl_get_sync_errors: {
        Args: {
          p_mapping_id: string
          p_limit?: number
          p_include_resolved?: boolean
        }
        Returns: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          mapping_id: string | null
          record_data: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          retryable: boolean | null
        }[]
      }
      gl_get_sync_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          app_name: string | null
          column_mappings: Json | null
          connection_id: string | null
          created_at: string | null
          current_status: string | null
          enabled: boolean | null
          error_count: number | null
          glide_table: string | null
          glide_table_display_name: string | null
          last_sync_completed_at: string | null
          last_sync_started_at: string | null
          mapping_id: string | null
          records_processed: number | null
          supabase_table: string | null
          sync_direction: string | null
          total_records: number | null
          updated_at: string | null
        }[]
      }
      gl_get_table_columns: {
        Args: {
          table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: boolean
          is_primary_key: boolean
        }[]
      }
      gl_record_sync_error: {
        Args: {
          p_mapping_id: string
          p_error_type: string
          p_error_message: string
          p_record_data?: Json
          p_retryable?: boolean
        }
        Returns: string
      }
      gl_resolve_sync_error: {
        Args: {
          p_error_id: string
          p_resolution_notes?: string
        }
        Returns: boolean
      }
      gl_suggest_column_mappings: {
        Args: {
          p_supabase_table: string
          p_glide_columns: Json
        }
        Returns: {
          glide_column_name: string
          suggested_supabase_column: string
          data_type: string
          confidence: number
        }[]
      }
      gl_update_all_account_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      gl_update_product_payment_status: {
        Args: {
          product_id: string
          new_status: string
        }
        Returns: boolean
      }
      gl_validate_column_mapping: {
        Args: {
          p_mapping_id: string
        }
        Returns: {
          is_valid: boolean
          validation_message: string
        }[]
      }
      gl_validate_mapping_data: {
        Args: {
          p_mapping: Json
          p_editing?: boolean
        }
        Returns: {
          is_valid: boolean
          validation_message: string
        }[]
      }
      glsync_cleanup_duplicate_accounts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      glsync_create_relationship_triggers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      glsync_map_all_relationships: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      glsync_map_relationships: {
        Args: {
          p_table_name: string
        }
        Returns: Json
      }
      glsync_retry_failed_sync: {
        Args: {
          p_mapping_id: string
        }
        Returns: string
      }
      handle_media_message: {
        Args: {
          p_telegram_message_id: number
          p_chat_id: number
          p_file_unique_id: string
          p_media_data: Json
        }
        Returns: string
      }
      handle_telegram_webhook_standalone: {
        Args: {
          p_message: Json
          p_correlation_id: string
          p_is_edit?: boolean
          p_is_channel_post?: boolean
          p_is_forwarded?: boolean
        }
        Returns: Json
      }
      is_customer: {
        Args: {
          account_type: string
        }
        Returns: boolean
      }
      is_vendor: {
        Args: {
          account_type: string
        }
        Returns: boolean
      }
      map_all_sb_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_circular_references: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_product_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_accounts_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_customer_credits_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_customer_payments_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_estimate_lines_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_estimates_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_invoices_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_products_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_shipping_records_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_sb_vendor_payments_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_media_group_sync_completed: {
        Args: {
          p_media_group_id: string
          p_source_message_id: string
          p_correlation_id?: string
        }
        Returns: Json
      }
      md_check_media_group_content: {
        Args: {
          p_media_group_id: string
          p_message_id: string
          p_correlation_id: string
        }
        Returns: Json
      }
      md_create_pg_notify_listener: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      md_debug_caption_extraction: {
        Args: {
          p_telegram_data: Json
        }
        Returns: Json
      }
      md_delete_media_from_storage: {
        Args: {
          p_storage_path: string
        }
        Returns: boolean
      }
      md_delete_telegram_message: {
        Args: {
          p_telegram_message_id: number
          p_chat_id: number
        }
        Returns: {
          deleted_messages: number
          deleted_other_messages: number
          deleted_audit_logs: number
          deleted_media_files: number
        }[]
      }
      md_extract_caption_from_telegram_data: {
        Args: {
          p_telegram_data: Json
        }
        Returns: string
      }
      md_force_resync_media_group: {
        Args: {
          p_media_group_id: string
        }
        Returns: Json
      }
      md_get_media_group_sync_stats: {
        Args: {
          p_media_group_id: string
        }
        Returns: {
          media_group_id: string
          total_messages: number
          synced_messages: number
          unsynced_messages: number
          messages_with_captions: number
          has_valid_source: boolean
        }[]
      }
      md_get_processing_state_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          state: string
          count: number
          has_caption_count: number
          has_analyzed_content_count: number
          in_media_group_count: number
        }[]
      }
      md_glsync_map_all_relationships: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      md_handle_media_message: {
        Args: {
          p_telegram_message_id: number
          p_chat_id: number
          p_file_unique_id: string
          p_media_data: Json
        }
        Returns: string
      }
      md_mark_media_group_sync_completed: {
        Args: {
          p_media_group_id: string
          p_source_message_id: string
          p_correlation_id?: string
        }
        Returns: Json
      }
      md_parse_caption_product_info: {
        Args: {
          p_caption: string
        }
        Returns: Json
      }
      md_process_message_caption: {
        Args: {
          p_message_id: string
        }
        Returns: Json
      }
      md_process_message_caption_by_id: {
        Args: {
          p_message_id: string
        }
        Returns: Json
      }
      md_process_message_caption_flow: {
        Args: {
          p_message_id: string
        }
        Returns: Json
      }
      md_process_unprocessed_captions_with_flow: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          error_count: number
        }[]
      }
      md_sync_all_media_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          media_group_id: string
          source_message_id: string
          messages_synced: number
        }[]
      }
      md_sync_caption_from_telegram_data: {
        Args: {
          p_message_id: string
        }
        Returns: Json
      }
      md_sync_delayed_media_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          synced_count: number
          error_count: number
          details: Json
        }[]
      }
      md_sync_media_group: {
        Args: {
          p_media_group_id: string
          p_correlation_id?: string
        }
        Returns: Json
      }
      md_sync_media_group_content: {
        Args: {
          p_media_group_id: string
          p_source_message_id?: string
          p_correlation_id?: string
        }
        Returns: Json
      }
      parse_caption_product_info: {
        Args: {
          p_caption: string
        }
        Returns: Json
      }
      process_message_caption_with_flow: {
        Args: {
          p_message_id: string
        }
        Returns: Json
      }
      process_unprocessed_captions: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          error_count: number
        }[]
      }
      process_unprocessed_captions_with_flow: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_webhook_event: {
        Args: {
          p_event_id: string
        }
        Returns: undefined
      }
      refresh_all_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_materialized_view: {
        Args: {
          view_name: string
        }
        Returns: undefined
      }
      refresh_materialized_view_secure: {
        Args: {
          view_name: string
        }
        Returns: undefined
      }
      reprocess_all_captions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reprocess_all_message_captions: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          error_count: number
        }[]
      }
      resolve_circular_references: {
        Args: Record<PropertyKey, never>
        Returns: {
          relationship_type: string
          updated_count: number
        }[]
      }
      sync_captions_from_telegram_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_delayed_media_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          synced_groups: number
          error_count: number
        }[]
      }
      sync_media_group_simple: {
        Args: {
          p_media_group_id: string
        }
        Returns: Json
      }
      sync_media_group_with_source: {
        Args: {
          p_media_group_id: string
          p_source_message_id: string
          p_correlation_id: string
        }
        Returns: Json
      }
      update_estimate_totals: {
        Args: {
          estimate_id: string
        }
        Returns: undefined
      }
      update_invoice_totals: {
        Args: {
          invoice_id: string
        }
        Returns: undefined
      }
      update_message_download_status: {
        Args: {
          p_message_id: string
          p_status: string
          p_needs_redownload?: boolean
          p_error_message?: string
          p_storage_path?: string
          p_public_url?: string
          p_storage_exists?: boolean
          p_mime_type_verified?: boolean
        }
        Returns: boolean
      }
      update_po_totals: {
        Args: {
          po_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "Customer" | "Vendor" | "Customer & Vendor"
      message_processing_state:
        | "pending"
        | "extracting"
        | "parsing"
        | "syncing"
        | "completed"
        | "error"
        | "processing"
        | "initalized"
      processing_state:
        | "initialized"
        | "pending"
        | "processing"
        | "syncing"
        | "completed"
        | "error"
        | "no caption"
      processing_state_type:
        | "initialized"
        | "pending"
        | "processing"
        | "completed"
        | "error"
        | "no_caption"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
