
import { supabase } from '@/integrations/supabase/client';
import { BaseRow } from '@/types/base';
import { asTable } from '@/utils/supabase';

export class BaseService<TRow extends BaseRow, TEntity> {
  constructor(
    protected tableName: string,
    protected mapRowToEntity: (row: TRow) => TEntity,
    protected mapEntityToRow: (entity: TEntity) => Partial<TRow>
  ) {}

  async getAll(): Promise<TEntity[]> {
    const { data, error } = await supabase
      .from(asTable(this.tableName))
      .select('*');
      
    if (error) throw error;
    
    return (data as TRow[]).map(this.mapRowToEntity);
  }

  async getById(id: string): Promise<TEntity | null> {
    const { data, error } = await supabase
      .from(asTable(this.tableName))
      .select('*')
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return data ? this.mapRowToEntity(data as TRow) : null;
  }

  async create(entity: Partial<TEntity>): Promise<TEntity> {
    const rowData = this.mapEntityToRow(entity as TEntity);
    
    const { data, error } = await supabase
      .from(asTable(this.tableName))
      .insert(rowData)
      .select()
      .single();
      
    if (error) throw error;
    
    return this.mapRowToEntity(data as TRow);
  }

  async update(id: string, entity: Partial<TEntity>): Promise<TEntity> {
    const rowData = this.mapEntityToRow(entity as TEntity);
    
    const { data, error } = await supabase
      .from(asTable(this.tableName))
      .update(rowData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return this.mapRowToEntity(data as TRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(asTable(this.tableName))
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
}
