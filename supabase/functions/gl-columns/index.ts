
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestPayload {
  action: 'getColumnMappings';
  connectionId: string;
  tableId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as RequestPayload;
    const { action, connectionId, tableId } = payload;

    // Get Supabase client using service role key
    const supabaseAdmin = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseAdmin || !supabaseKey) {
      throw new Error('Missing environment variables for Supabase connection');
    }

    if (action === 'getColumnMappings') {
      // Get the connection details
      const connectionResponse = await fetch(`${supabaseAdmin}/rest/v1/gl_connections?id=eq.${connectionId}&select=*`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!connectionResponse.ok) {
        throw new Error('Failed to get connection details');
      }

      const connections = await connectionResponse.json();
      if (!connections.length) {
        throw new Error('Connection not found');
      }

      const connection = connections[0];
      const { app_id, api_key } = connection;

      // Mock columns for now - in a real implementation, you would call the Glide API
      // to get the actual columns for the specified table
      const mockColumns = [
        { id: 'col1', name: 'Column 1', type: 'string' },
        { id: 'col2', name: 'Column 2', type: 'number' },
        { id: 'col3', name: 'Column 3', type: 'boolean' },
        { id: 'col4', name: 'Date Field', type: 'date-time' },
        { id: 'col5', name: 'Email Field', type: 'email-address' },
        { id: 'col6', name: 'Image Field', type: 'image-uri' },
      ];

      return new Response(
        JSON.stringify({
          columns: mockColumns
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  } catch (error) {
    console.error('Error in gl-columns function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
