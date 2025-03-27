
export interface SyncRequestPayload {
  action: 'testConnection' | 'getTableNames' | 'syncData' | 'getColumnMappings' | 'mapRelationships';
  connectionId?: string;
  mappingId?: string;
  tableId?: string;
}
