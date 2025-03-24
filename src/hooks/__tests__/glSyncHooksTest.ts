import { renderHook, act } from '@testing-library/react-hooks';
import { useGlSync } from '../useGlSync';
import { useSyncData } from '../useSyncData';
import { useGlSyncValidation } from '../useGlSyncValidation';
import { useColumnMappingValidation } from '../useColumnMappingValidation';
import { supabase } from '@/integrations/supabase/client';
import { glSyncApi } from '@/services/glsync';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    },
    rpc: jest.fn()
  }
}));

jest.mock('@/services/glsync', () => ({
  glSyncApi: {
    listGlideTables: jest.fn(),
    syncData: jest.fn(),
    callSyncFunction: jest.fn()
  }
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('Hook Consolidation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGlSync and useSyncData', () => {
    const mockConnectionId = 'conn-123';
    const mockMappingId = 'map-123';
    const mockSuccessResponse = {
      success: true,
      recordsProcessed: 10,
      failedRecords: 0
    };

    test('useGlSync direct API call', async () => {
      // Setup mock
      (glSyncApi.syncData as jest.Mock).mockResolvedValue(mockSuccessResponse);

      // Render hook
      const { result, waitForNextUpdate } = renderHook(() => useGlSync());

      // Execute function with default useDirect=true
      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncData(mockConnectionId, mockMappingId);
        await waitForNextUpdate();
      });

      // Verify the direct API was called
      expect(glSyncApi.syncData).toHaveBeenCalledWith(mockConnectionId, mockMappingId);
      expect(syncResult).toEqual(mockSuccessResponse);
    });

    test('useGlSync Supabase function call', async () => {
      // Setup mock
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({ 
        data: mockSuccessResponse,
        error: null
      });

      // Render hook
      const { result, waitForNextUpdate } = renderHook(() => useGlSync());

      // Execute function with useDirect=false
      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncData(mockConnectionId, mockMappingId, false);
        await waitForNextUpdate();
      });

      // Verify Supabase function was called directly
      expect(supabase.functions.invoke).toHaveBeenCalledWith('glsync', {
        body: {
          action: 'syncData',
          connectionId: mockConnectionId,
          mappingId: mockMappingId,
        },
      });
      expect(syncResult).toEqual(mockSuccessResponse);
    });

    test('useSyncData adapter uses Supabase function call', async () => {
      // Setup mock
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({ 
        data: mockSuccessResponse,
        error: null
      });

      // Render hook
      const { result, waitForNextUpdate } = renderHook(() => useSyncData());

      // Execute function
      let syncResult;
      await act(async () => {
        syncResult = await result.current.syncData(mockConnectionId, mockMappingId);
        await waitForNextUpdate();
      });

      // Verify Supabase function was called directly
      expect(supabase.functions.invoke).toHaveBeenCalledWith('glsync', {
        body: {
          action: 'syncData',
          connectionId: mockConnectionId,
          mappingId: mockMappingId,
        },
      });
      expect(syncResult).toEqual(mockSuccessResponse);
    });
  });

  describe('useGlSyncValidation and useColumnMappingValidation', () => {
    const mockMappingId = 'map-123';
    const mockValidationResult = {
      is_valid: true,
      validation_message: 'Validation successful'
    };
    const mockMapping = {
      supabase_table: 'gl_products',
      column_mappings: {
        '$rowID': {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        }
      }
    };

    test('useGlSyncValidation validateMappingConfig', async () => {
      // Setup mock
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [mockValidationResult],
        error: null
      });

      // Render hook
      const { result, waitForNextUpdate } = renderHook(() => useGlSyncValidation());

      // Execute function
      let isValid;
      await act(async () => {
        isValid = await result.current.validateMappingConfig(mockMappingId);
        await waitForNextUpdate();
      });

      // Verify RPC was called correctly
      expect(supabase.rpc).toHaveBeenCalledWith('gl_validate_column_mapping', {
        p_mapping_id: mockMappingId
      });
      expect(isValid).toBe(true);
      expect(result.current.validation).toEqual({
        isValid: true,
        message: 'Validation successful'
      });
    });

    test('useGlSyncValidation validateMapping', async () => {
      // Setup mock
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [mockValidationResult],
        error: null
      });

      // Render hook
      const { result, waitForNextUpdate } = renderHook(() => useGlSyncValidation());

      // Execute function
      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateMapping(mockMapping);
        await waitForNextUpdate();
      });

      // Verify RPC was called with serialized mapping
      expect(supabase.rpc).toHaveBeenCalledWith('gl_validate_mapping_data', {
        p_mapping: expect.any(Object)
      });
      expect(validationResult).toEqual(mockValidationResult);
    });

    test('useColumnMappingValidation adapter uses enhanced hook', async () => {
      // Setup mock
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [mockValidationResult],
        error: null
      });

      // Render hook
      const { result, waitForNextUpdate } = renderHook(() => useColumnMappingValidation());

      // Execute function
      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateMapping(mockMapping);
        await waitForNextUpdate();
      });

      // Verify RPC was called through the enhanced hook
      expect(supabase.rpc).toHaveBeenCalledWith('gl_validate_mapping_data', {
        p_mapping: expect.any(Object)
      });
      expect(validationResult).toEqual(mockValidationResult);
      expect(result.current.validationResult).toEqual(mockValidationResult);
    });
  });
}); 