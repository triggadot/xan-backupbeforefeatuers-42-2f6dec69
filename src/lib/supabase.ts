import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
// In production, these should be set in your hosting environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://swrfsullhirscyxqneay.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cmZzdWxsaGlyc2N5eHFuZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg5NjQ4MDAsImV4cCI6MjAxNDU0MDgwMH0.0AqDnwZIZuJLhN9nwmUpnF5-gDMvl3fjZSXIQ_hYgJY';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Create a single supabase client for interacting with the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Export the URL for potential use in other parts of the application
export const getSupabaseUrl = () => supabaseUrl;
