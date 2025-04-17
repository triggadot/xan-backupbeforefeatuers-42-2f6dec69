import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_mappings table
 */

// Database schema type matching Supabase gl_mappings table
export interface GlMappingRecord {
  id: string;
  connection_id: string;
  glide_table: string;
  supabase_table: string;
  column_mappings: Record<string, {
    data_type: string;
    glide_column_name: string;
    supabase_column_name: string;
  }>;
  sync_direction: 'glide_to_supabase' | 'supabase_to_glide' | 'bidirectional';
  enabled: boolean;
  created_at: string;
  glide_table_display_name: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlMappingInsert {
  connection_id: string;
  glide_table: string;
  supabase_table: string;
  column_mappings: Record<string, {
    data_type: string;
    glide_column_name: string;
    supabase_column_name: string;
  }>;
  sync_direction: 'glide_to_supabase' | 'supabase_to_glide' | 'bidirectional';
  enabled: boolean;
  glide_table_display_name: string;
}

// Frontend filter interface
export interface MappingFilters {
  connectionId?: string;
  glideTable?: string;
  supabaseTable?: string;
  enabled?: boolean;
}

// Form data for creating/updating mappings
export interface MappingForm {
  connectionId: string;
  glideTable: string;
  supabaseTable: string;
  columnMappings: Record<string, {
    data_type: string;
    glide_column_name: string;
    supabase_column_name: string;
  }>;
  syncDirection: 'glide_to_supabase' | 'supabase_to_glide' | 'bidirectional';
  enabled: boolean;
  glideTableDisplayName: string;
}

// Mapping model for frontend use
export interface Mapping {
  id: string;
  connection_id: string;
  glide_table: string;
  supabase_table: string;
  column_mappings: Record<string, {
    data_type: string;
    glide_column_name: string;
    supabase_column_name: string;
  }>;
  sync_direction: 'glide_to_supabase' | 'supabase_to_glide' | 'bidirectional';
  enabled: boolean;
  created_at: string;
  glide_table_display_name: string;
  updated_at: string;
}

/**
 * Mappings service for Supabase operations
 * Handles CRUD operations for gl_mappings table
 */
export const glMappingsService = {
  /**
   * Get all mappings with optional filtering
   */
  async getMappings(filters: MappingFilters = {}): Promise<Mapping[]> {
    let query = supabase
      .from('gl_mappings')
      .select('*');

    // Apply filters
    if (filters.connectionId) {
      query = query.eq('connection_id', filters.connectionId);
    }
    if (filters.glideTable) {
      query = query.eq('glide_table', filters.glideTable);
    }
    if (filters.supabaseTable) {
      query = query.eq('supabase_table', filters.supabaseTable);
    }
    if (filters.enabled !== undefined) {
      query = query.eq('enabled', filters.enabled);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mappings:', error);
      throw new Error(`Failed to fetch mappings: ${error.message}`);
    }

    return (data as unknown as GlMappingRecord[]).map(item => {
      const mapping: Mapping = {
        id: item.id,
        connection_id: item.connection_id,
        glide_table: item.glide_table,
        supabase_table: item.supabase_table,
        column_mappings: item.column_mappings,
        sync_direction: item.sync_direction,
        enabled: item.enabled,
        created_at: item.created_at,
        glide_table_display_name: item.glide_table_display_name,
        updated_at: item.updated_at,
      };
      return mapping;
    });
  },

  /**
   * Get a single mapping by ID
   */
  async getMappingById(id: string): Promise<Mapping> {
    const { data, error } = await supabase
      .from('gl_mappings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching mapping:', error);
      throw new Error(`Failed to fetch mapping: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Mapping with ID ${id} not found`);
    }

    const item = data as unknown as GlMappingRecord;
    const mapping: Mapping = {
      id: item.id,
      connection_id: item.connection_id,
      glide_table: item.glide_table,
      supabase_table: item.supabase_table,
      column_mappings: item.column_mappings,
      sync_direction: item.sync_direction,
      enabled: item.enabled,
      created_at: item.created_at,
      glide_table_display_name: item.glide_table_display_name,
      updated_at: item.updated_at,
    };

    return mapping;
  },

  /**
   * Create a new mapping
   */
  async createMapping(mappingData: MappingForm): Promise<Mapping> {
    const dbMapping: GlMappingInsert = {
      connection_id: mappingData.connectionId,
      glide_table: mappingData.glideTable,
      supabase_table: mappingData.supabaseTable,
      column_mappings: mappingData.columnMappings,
      sync_direction: mappingData.syncDirection,
      enabled: mappingData.enabled,
      glide_table_display_name: mappingData.glideTableDisplayName,
    };

    const { data, error } = await supabase
      .from('gl_mappings')
      .insert(dbMapping)
      .select()
      .single();

    if (error) {
      console.error('Error creating mapping:', error);
      throw new Error(`Failed to create mapping: ${error.message}`);
    }

    return this.getMappingById(data.id);
  },

  /**
   * Update an existing mapping
   */
  async updateMapping(id: string, mappingData: Partial<MappingForm>): Promise<Mapping> {
    const dbMapping: Partial<GlMappingInsert> = {};

    if (mappingData.connectionId !== undefined) dbMapping.connection_id = mappingData.connectionId;
    if (mappingData.glideTable !== undefined) dbMapping.glide_table = mappingData.glideTable;
    if (mappingData.supabaseTable !== undefined) dbMapping.supabase_table = mappingData.supabaseTable;
    if (mappingData.columnMappings !== undefined) dbMapping.column_mappings = mappingData.columnMappings;
    if (mappingData.syncDirection !== undefined) dbMapping.sync_direction = mappingData.syncDirection;
    if (mappingData.enabled !== undefined) dbMapping.enabled = mappingData.enabled;
    if (mappingData.glideTableDisplayName !== undefined) dbMapping.glide_table_display_name = mappingData.glideTableDisplayName;

    const { error } = await supabase
      .from('gl_mappings')
      .update(dbMapping)
      .eq('id', id);

    if (error) {
      console.error('Error updating mapping:', error);
      throw new Error(`Failed to update mapping: ${error.message}`);
    }

    return this.getMappingById(id);
  },

  /**
   * Delete a mapping
   */
  async deleteMapping(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting mapping:', error);
      throw new Error(`Failed to delete mapping: ${error.message}`);
    }
  },

  /**
   * Subscribe to mapping changes
   */
  subscribeToMappingChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_mappings' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
