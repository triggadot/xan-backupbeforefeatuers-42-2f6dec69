
import { corsHeaders } from './cors.ts';

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
export const MAX_BATCH_SIZE = 450; // Keep under 500 limit for safety

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
}

export function handleError(error: Error): Response {
  console.error('Error:', error);
  
  return new Response(
    JSON.stringify({
      error: error.message
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}
