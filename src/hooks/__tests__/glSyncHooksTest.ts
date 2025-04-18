import { glSyncService } from '@/services/GlSync';
import { act, renderHook } from '@testing-library/react-hooks';
import { useGlSync } from '../useGlSync';
import { useGlSyncErrors } from '../useGlSyncErrors';
import { useGlSyncStatus } from '../useGlSyncStatus';

// Mock the glSyncService
jest.mock('@/services/glsync', () => ({
  glSyncService: {
    testConnection: jest.fn(),
    listGlideTables: jest.fn(),
    syncData: jest.fn(),
    mapAllRelationships: jest.fn(),
    validateRelationships: jest.fn(),
    createMapping: jest.fn(),
    updateMapping: jest.fn(),
    deleteMapping: jest.fn(),
    retryFailedSync: jest.fn(),
    fetchGlideTables: jest.fn(),
    glideTables: []
  }
}));

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    })),
    removeChannel: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    }))
  }
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('useGlSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('testConnection should call api and return result', async () => {
    // Setup
    const expectedResult = true;
    (glSyncService.testConnection as jest.Mock).mockResolvedValue(expectedResult);

    // Execute
    const { result } = renderHook(() => useGlSync());
    let actualResult;

    await act(async () => {
      actualResult = await result.current.testConnection('test-connection-id');
    });

    // Verify
    expect(glSyncService.testConnection).toHaveBeenCalledWith('test-connection-id');
    expect(actualResult).toBe(expectedResult);
  });

  it('syncData should call api and return result', async () => {
    // Setup
    const expectedResult = { success: true, recordsProcessed: 10 };
    (glSyncService.syncData as jest.Mock).mockResolvedValue(expectedResult);

    // Execute
    const { result } = renderHook(() => useGlSync());
    let actualResult;

    await act(async () => {
      actualResult = await result.current.syncData('test-connection-id', 'test-mapping-id');
    });

    // Verify
    expect(glSyncService.syncData).toHaveBeenCalledWith('test-connection-id', 'test-mapping-id');
    expect(actualResult).toBe(expectedResult);
  });
});

describe('useGlSyncStatus', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGlSyncStatus());

    expect(result.current.syncStatus).toBeNull();
    expect(result.current.allSyncStatuses).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
  });
});

describe('useGlSyncErrors', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGlSyncErrors());

    expect(result.current.syncErrors).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.includeResolved).toBe(false);
  });
});
