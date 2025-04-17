import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_shipping_records table
 */

// Database schema type matching Supabase gl_shipping_records table
export interface GlShippingRecord {
  id: string;
  glide_row_id: string;
  rowid_invoices?: string;
  sender_name_company?: string;
  sender_address?: string;
  sender_phone?: string;
  receiver_name?: string;
  receiver_address?: string;
  receiver_state?: string;
  tp_id?: string;
  date_of_shipment?: string; // renamed from ship_date
  tracking_number?: string;
  box_sizes?: string;
  drop_off_location_uid?: string;
  box_weight?: number;
  rowid_accounts?: string;
  created_at: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlShippingRecordInsert {
  glide_row_id: string;
  rowid_invoices?: string;
  sender_name_company?: string;
  sender_address?: string;
  sender_phone?: string;
  receiver_name?: string;
  receiver_address?: string;
  receiver_state?: string;
  tp_id?: string;
  date_of_shipment?: string;
  tracking_number?: string;
  box_sizes?: string;
  drop_off_location_uid?: string;
  box_weight?: number;
  rowid_accounts?: string;
}

// Frontend filter interface
export interface ShippingRecordFilters {
  invoiceId?: string;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating shipping records
export interface ShippingRecordForm {
  invoiceId?: string;
  senderNameCompany?: string;
  senderAddress?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverAddress?: string;
  receiverState?: string;
  tpId?: string;
  dateOfShipment?: Date;
  trackingNumber?: string;
  boxSizes?: string;
  dropOffLocationUid?: string;
  boxWeight?: number;
  accountId?: string;
}

// Shipping record model for frontend use
export interface ShippingRecord {
  id: string;
  glide_row_id: string;
  rowid_invoices?: string;
  sender_name_company?: string;
  sender_address?: string;
  sender_phone?: string;
  receiver_name?: string;
  receiver_address?: string;
  receiver_state?: string;
  tp_id?: string;
  date_of_shipment?: string;
  tracking_number?: string;
  box_sizes?: string;
  drop_off_location_uid?: string;
  box_weight?: number;
  rowid_accounts?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Shipping Records service for Supabase operations
 * Handles CRUD operations for gl_shipping_records table
 */
export const glShippingRecordsService = {
  /**
   * Get all shipping records with optional filtering
   */
  async getShippingRecords(filters: ShippingRecordFilters = {}): Promise<ShippingRecord[]> {
    let query = supabase
      .from('gl_shipping_records')
      .select('*');

    // Apply filters
    if (filters.invoiceId) {
      query = query.eq('rowid_invoices', filters.invoiceId);
    }
    if (filters.accountId) {
      query = query.eq('rowid_accounts', filters.accountId);
    }
    if (filters.dateFrom) {
      query = query.gte('date_of_shipment', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_of_shipment', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `sender_name_company.ilike.%${filters.search}%,sender_address.ilike.%${filters.search}%,receiver_name.ilike.%${filters.search}%,receiver_address.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shipping records:', error);
      throw new Error(`Failed to fetch shipping records: ${error.message}`);
    }

    return (data as unknown as GlShippingRecord[]).map(item => {
      const record: ShippingRecord = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        rowid_invoices: item.rowid_invoices,
        sender_name_company: item.sender_name_company,
        sender_address: item.sender_address,
        sender_phone: item.sender_phone,
        receiver_name: item.receiver_name,
        receiver_address: item.receiver_address,
        receiver_state: item.receiver_state,
        tp_id: item.tp_id,
        date_of_shipment: item.date_of_shipment,
        tracking_number: item.tracking_number,
        box_sizes: item.box_sizes,
        drop_off_location_uid: item.drop_off_location_uid,
        box_weight: item.box_weight,
        rowid_accounts: item.rowid_accounts,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return record;
    });
  },

  /**
   * Get a single shipping record by ID
   */
  async getShippingRecordById(id: string): Promise<ShippingRecord> {
    const { data, error } = await supabase
      .from('gl_shipping_records')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching shipping record:', error);
      throw new Error(`Failed to fetch shipping record: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Shipping record with ID ${id} not found`);
    }

    const item = data as unknown as GlShippingRecord;
    const record: ShippingRecord = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      rowid_invoices: item.rowid_invoices,
      sender_name_company: item.sender_name_company,
      sender_address: item.sender_address,
      sender_phone: item.sender_phone,
      receiver_name: item.receiver_name,
      receiver_address: item.receiver_address,
      receiver_state: item.receiver_state,
      tp_id: item.tp_id,
      date_of_shipment: item.date_of_shipment,
      tracking_number: item.tracking_number,
      box_sizes: item.box_sizes,
      drop_off_location_uid: item.drop_off_location_uid,
      box_weight: item.box_weight,
      rowid_accounts: item.rowid_accounts,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    return record;
  },

  /**
   * Create a new shipping record
   */
  async createShippingRecord(recordData: ShippingRecordForm): Promise<ShippingRecord> {
    // Generate a UUID for the glide_row_id
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbRecord: GlShippingRecordInsert = {
      glide_row_id: uuid,
      rowid_invoices: recordData.invoiceId,
      sender_name_company: recordData.senderNameCompany,
      sender_address: recordData.senderAddress,
      sender_phone: recordData.senderPhone,
      receiver_name: recordData.receiverName,
      receiver_address: recordData.receiverAddress,
      receiver_state: recordData.receiverState,
      tp_id: recordData.tpId,
      date_of_shipment: recordData.dateOfShipment?.toISOString(),
      tracking_number: recordData.trackingNumber,
      box_sizes: recordData.boxSizes,
      drop_off_location_uid: recordData.dropOffLocationUid,
      box_weight: recordData.boxWeight,
      rowid_accounts: recordData.accountId,
    };

    const { data, error } = await supabase
      .from('gl_shipping_records')
      .insert(dbRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating shipping record:', error);
      throw new Error(`Failed to create shipping record: ${error.message}`);
    }

    return this.getShippingRecordById(data.glide_row_id);
  },

  /**
   * Update an existing shipping record
   */
  async updateShippingRecord(id: string, recordData: Partial<ShippingRecordForm>): Promise<ShippingRecord> {
    const dbRecord: Partial<GlShippingRecordInsert> = {};

    if (recordData.invoiceId !== undefined) dbRecord.rowid_invoices = recordData.invoiceId;
    if (recordData.senderNameCompany !== undefined) dbRecord.sender_name_company = recordData.senderNameCompany;
    if (recordData.senderAddress !== undefined) dbRecord.sender_address = recordData.senderAddress;
    if (recordData.senderPhone !== undefined) dbRecord.sender_phone = recordData.senderPhone;
    if (recordData.receiverName !== undefined) dbRecord.receiver_name = recordData.receiverName;
    if (recordData.receiverAddress !== undefined) dbRecord.receiver_address = recordData.receiverAddress;
    if (recordData.receiverState !== undefined) dbRecord.receiver_state = recordData.receiverState;
    if (recordData.tpId !== undefined) dbRecord.tp_id = recordData.tpId;
    if (recordData.dateOfShipment !== undefined) dbRecord.date_of_shipment = recordData.dateOfShipment?.toISOString();
    if (recordData.trackingNumber !== undefined) dbRecord.tracking_number = recordData.trackingNumber;
    if (recordData.boxSizes !== undefined) dbRecord.box_sizes = recordData.boxSizes;
    if (recordData.dropOffLocationUid !== undefined) dbRecord.drop_off_location_uid = recordData.dropOffLocationUid;
    if (recordData.boxWeight !== undefined) dbRecord.box_weight = recordData.boxWeight;
    if (recordData.accountId !== undefined) dbRecord.rowid_accounts = recordData.accountId;

    const { error } = await supabase
      .from('gl_shipping_records')
      .update(dbRecord)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating shipping record:', error);
      throw new Error(`Failed to update shipping record: ${error.message}`);
    }

    return this.getShippingRecordById(id);
  },

  /**
   * Delete a shipping record
   */
  async deleteShippingRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_shipping_records')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting shipping record:', error);
      throw new Error(`Failed to delete shipping record: ${error.message}`);
    }
  },

  /**
   * Subscribe to shipping record changes
   */
  subscribeToShippingRecordChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_shipping_records' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
