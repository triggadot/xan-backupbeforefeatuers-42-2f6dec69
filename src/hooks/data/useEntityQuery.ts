
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { BaseRow } from '@/types/base';
import { BaseService } from '@/services/base-service';
import { handleDatabaseError } from '@/utils/error-handling';

export function useEntityQuery<TRow extends BaseRow, TEntity>(
  service: BaseService<TRow, TEntity>,
  id: string,
  options?: UseQueryOptions<TEntity | null, Error>
) {
  return useQuery({
    queryKey: [service.constructor.name, id],
    queryFn: async () => {
      try {
        return await service.getById(id);
      } catch (error) {
        throw handleDatabaseError(error, service.constructor.name, 'read');
      }
    },
    ...options
  });
}

export function useEntitiesQuery<TRow extends BaseRow, TEntity>(
  service: BaseService<TRow, TEntity>,
  options?: UseQueryOptions<TEntity[], Error>
) {
  return useQuery({
    queryKey: [service.constructor.name, 'list'],
    queryFn: async () => {
      try {
        return await service.getAll();
      } catch (error) {
        throw handleDatabaseError(error, service.constructor.name, 'read');
      }
    },
    ...options
  });
}
