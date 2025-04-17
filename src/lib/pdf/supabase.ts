
import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
const supabaseUrl = 'https://swrfsullhirscyxqneay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cmZzdWxsaGlyc2N5eHFuZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNjI4OTQsImV4cCI6MjA1NzgzODg5NH0.NoWyPlwYmKnzrzApejDd5JSFBz91AJS7HJPthPVrn30';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
