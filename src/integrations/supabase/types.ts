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
          accounts_uid: string | null
          client_type: string | null
          created_at: string | null
          date_added_client: string | null
          email_of_who_added: string | null
          glide_row_id: string
          id: string
          photo: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          accounts_uid?: string | null
          client_type?: string | null
          created_at?: string | null
          date_added_client?: string | null
          email_of_who_added?: string | null
          glide_row_id: string
          id?: string
          photo?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          accounts_uid?: string | null
          client_type?: string | null
          created_at?: string | null
          date_added_client?: string | null
          email_of_who_added?: string | null
          glide_row_id?: string
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
          updated_at?: string | null
        }
        Relationships: []
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
          type_of_payment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gl_estimate_lines: {
        Row: {
          created_at: string | null
          date_of_sale: string | null
          glide_row_id: string
          id: string
          product_sale_note: string | null
          qty_sold: number | null
          rowid_estimate_lines: string | null
          rowid_products: string | null
          sale_product_name: string | null
          selling_price: number | null
          total_stock_after_sell: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id: string
          id?: string
          product_sale_note?: string | null
          qty_sold?: number | null
          rowid_estimate_lines?: string | null
          rowid_products?: string | null
          sale_product_name?: string | null
          selling_price?: number | null
          total_stock_after_sell?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id?: string
          id?: string
          product_sale_note?: string | null
          qty_sold?: number | null
          rowid_estimate_lines?: string | null
          rowid_products?: string | null
          sale_product_name?: string | null
          selling_price?: number | null
          total_stock_after_sell?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gl_estimates: {
        Row: {
          add_note: boolean | null
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
          updated_at: string | null
          valid_final_create_invoice_clicked: boolean | null
        }
        Insert: {
          add_note?: boolean | null
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
          updated_at?: string | null
          valid_final_create_invoice_clicked?: boolean | null
        }
        Update: {
          add_note?: boolean | null
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
          updated_at?: string | null
          valid_final_create_invoice_clicked?: boolean | null
        }
        Relationships: []
      }
      gl_invoice_lines: {
        Row: {
          created_at: string | null
          date_of_sale: string | null
          glide_row_id: string
          id: string
          product_sale_note: string | null
          qty_sold: number | null
          renamed_product_name: string | null
          rowid_invoices: string | null
          rowid_products: string | null
          selling_price: number | null
          updated_at: string | null
          user_email_of_added: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id: string
          id?: string
          product_sale_note?: string | null
          qty_sold?: number | null
          renamed_product_name?: string | null
          rowid_invoices?: string | null
          rowid_products?: string | null
          selling_price?: number | null
          updated_at?: string | null
          user_email_of_added?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_sale?: string | null
          glide_row_id?: string
          id?: string
          product_sale_note?: string | null
          qty_sold?: number | null
          renamed_product_name?: string | null
          rowid_invoices?: string | null
          rowid_products?: string | null
          selling_price?: number | null
          updated_at?: string | null
          user_email_of_added?: string | null
        }
        Relationships: []
      }
      gl_invoices: {
        Row: {
          created_at: string | null
          created_timestamp: string | null
          doc_glideforeverlink: string | null
          glide_row_id: string
          id: string
          invoice_order_date: string | null
          notes: string | null
          processed: boolean | null
          rowid_accounts: string | null
          submitted_timestamp: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          created_at?: string | null
          created_timestamp?: string | null
          doc_glideforeverlink?: string | null
          glide_row_id: string
          id?: string
          invoice_order_date?: string | null
          notes?: string | null
          processed?: boolean | null
          rowid_accounts?: string | null
          submitted_timestamp?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          created_at?: string | null
          created_timestamp?: string | null
          doc_glideforeverlink?: string | null
          glide_row_id?: string
          id?: string
          invoice_order_date?: string | null
          notes?: string | null
          processed?: boolean | null
          rowid_accounts?: string | null
          submitted_timestamp?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
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
          terms_for_fronted_product?: string | null
          total_qty_purchased?: number | null
          total_units_behind_sample?: number | null
          updated_at?: string | null
          vendor_product_name?: string | null
        }
        Relationships: []
      }
      gl_purchase_orders: {
        Row: {
          created_at: string | null
          date_payment_date_mddyyyy: string | null
          docs_shortlink: string | null
          glide_row_id: string
          id: string
          po_date: string | null
          purchase_order_uid: string | null
          rowid_accounts: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_payment_date_mddyyyy?: string | null
          docs_shortlink?: string | null
          glide_row_id: string
          id?: string
          po_date?: string | null
          purchase_order_uid?: string | null
          rowid_accounts?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_payment_date_mddyyyy?: string | null
          docs_shortlink?: string | null
          glide_row_id?: string
          id?: string
          po_date?: string | null
          purchase_order_uid?: string | null
          rowid_accounts?: string | null
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
          sender_sender_address?: string | null
          sender_sender_name_company?: string | null
          sender_sender_phone?: string | null
          ship_date?: string | null
          tp_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          updated_at?: string | null
          vendor_purchase_note?: string | null
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
    }
    Views: {
      gl_mapping_status: {
        Row: {
          app_name: string | null
          connection_id: string | null
          current_status: string | null
          enabled: boolean | null
          glide_table: string | null
          glide_table_display_name: string | null
          last_sync_completed_at: string | null
          last_sync_started_at: string | null
          mapping_id: string | null
          records_processed: number | null
          supabase_table: string | null
          sync_direction: string | null
          total_records: number | null
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
          table_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_table_columns: {
        Args: {
          table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
