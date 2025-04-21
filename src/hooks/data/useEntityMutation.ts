
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { BaseRow } from '@/types/base';
import { BaseService } from '@/services/base-service';
import { handleDatabaseError } from '@/utils/error-handling';

export function useCreateEntity<TRow extends BaseRow, TEntity, TInput = Partial<TEntity>>(
  service: BaseService<TRow, TEntity>,
  options?: UseMutationOptions<TEntity, Error, TInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: TInput) => {
      try {
        return await service.create(input as Partial<TEntity>);
      } catch (error) {
        throw handleDatabaseError(error, service.constructor.name, 'create');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [service.constructor.name, 'list'] });
    },
    ...options
  });
}

export function useUpdateEntity<TRow extends BaseRow, TEntity>(
  service: BaseService<TRow, TEntity>,
  id: string,
  options?: UseMutationOptions<TEntity, Error, Partial<TEntity>>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Partial<TEntity>) => {
      try {
        return await service.update(id, input);
      } catch (error) {
        throw handleDatabaseError(error, service.constructor.name, 'update');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [service.constructor.name, id] });
      queryClient.invalidateQueries({ queryKey: [service.constructor.name, 'list'] });
    },
    ...options
  });
}

export function useDeleteEntity<TRow extends BaseRow, TEntity>(
  service: BaseService<TRow, TEntity>,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await service.delete(id);
      } catch (error) {
        throw handleDatabaseError(error, service.constructor.name, 'delete');
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [service.constructor.name, id] });
      queryClient.invalidateQueries({ queryKey: [service.constructor.name, 'list'] });
    },
    ...options
  });
}
