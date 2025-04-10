import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as postgres from 'https://deno.land/x/postgres@v0.14.0/mod.ts';

// Set up logging for scheduled jobs
const logActivity = async (
  client: postgres.PoolClient,
  jobName: string,
  status: 'started' | 'completed' | 'failed',
  details?: any
) => {
  try {
    const query = `
      INSERT INTO pdf_generation_logs (job_name, status, details, created_at)
      VALUES ($1, $2, $3, NOW())
    `;
    await client.queryArray(query, [jobName, status, JSON.stringify(details || {})]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Function to trigger PDF generation for documents with null URLs
const triggerPdfGeneration = async (client: postgres.PoolClient) => {
  try {
    const jobName = 'scheduled-pdf-scan';
    await logActivity(client, jobName, 'started');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Call the PDF backend scan endpoint
    const response = await fetch(`${supabaseUrl}/functions/v1/pdf-backend/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        // We can pass additional parameters here if needed
        batchSize: 50,
        forceRegenerate: false,
        overwriteExisting: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger PDF generation: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Log the completion
    await logActivity(client, jobName, 'completed', result);
    
    return result;
  } catch (error) {
    console.error('Error in PDF generation job:', error);
    await logActivity(client, 'scheduled-pdf-scan', 'failed', { error: error.message });
    throw error;
  }
};

// Create a PostgreSQL connection pool
const pool = new postgres.Pool({
  tls: { caCertificates: [Deno.env.get('SUPABASE_CERT') || ''] },
  database: 'postgres',
  hostname: Deno.env.get('POSTGRES_HOST') || '',
  port: 5432,
  user: Deno.env.get('POSTGRES_USER') || '',
  password: Deno.env.get('POSTGRES_PASSWORD') || '',
}, 3);

serve(async (req) => {
  try {
    // Get client from pool
    const client = await pool.connect();
    
    try {
      // Check if this is an authorized request
      const authHeader = req.headers.get('Authorization');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Trigger PDF generation
      const result = await triggerPdfGeneration(client);
      
      // Return success response
      return new Response(JSON.stringify({
        success: true,
        message: 'PDF generation job completed successfully',
        result
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in scheduled-pdf-generation function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
