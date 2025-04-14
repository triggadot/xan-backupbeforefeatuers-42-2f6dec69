/**
 * Processing states for Telegram messages.
 */

/**
 * Enum for message processing states.
 */
export enum ProcessingState {
  INITIALIZED = 'initialized',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  EDITED = 'edited',
  RECOVERED_EDIT = 'recovered_edit'
}

/**
 * Type guard for ProcessingState
 */
export function isValidProcessingState(state: string): state is ProcessingState {
  return Object.values(ProcessingState).includes(state as ProcessingState);
}
