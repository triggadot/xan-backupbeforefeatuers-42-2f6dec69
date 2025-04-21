
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = "https://swrfsullhirscyxqneay.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cmZzdWxsaGlyc2N5eHFuZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNjI4OTQsImV4cCI6MjA1NzgzODg5NH0.NoWyPlwYmKnzrzApejDd5JSFBz91AJS7HJPthPVrn30";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility function to handle Supabase errors consistently
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return new Error(error.message || 'An unknown error occurred');
};
