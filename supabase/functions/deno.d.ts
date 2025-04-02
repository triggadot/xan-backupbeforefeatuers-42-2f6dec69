// Type declarations for Deno runtime APIs
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  };
  
  export function serve(handler: (request: Request) => Promise<Response> | Response): void;
}

// Type declarations for ESM imports
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (request: Request) => Promise<Response> | Response): void;
}
