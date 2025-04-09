// supabase/functions/process-account-balance-queue/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function "process-account-balance-queue" starting up');

// Ensure environment variables are available
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  // In a real scenario, you might want to throw an error or handle this differently
}

const supabaseAdmin = createClient(
  supabaseUrl ?? '',
  serviceRoleKey ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const BATCH_SIZE = 100; // Process up to 100 accounts per run

serve(async (req) => {
  // This function is designed to be triggered by a schedule, not HTTP requests.
  // However, the serve function is required by Supabase Edge Functions.
  // We can add a check for a specific header or path if manual invocation is needed for testing.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processing account balance update queue...');

    // 1. Fetch distinct accounts from the queue
    const { data: queueItems, error: fetchError } = await supabaseAdmin
      .from('account_balance_update_queue')
      .select('rowid_accounts')
      .limit(BATCH_SIZE); // Limit the number processed per invocation

    if (fetchError) {
      console.error('Error fetching from queue:', fetchError);
      throw fetchError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('Account balance update queue is empty.');
      return new Response(JSON.stringify({ message: 'Queue empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get unique account IDs
    const accountIdsToProcess = [...new Set(queueItems.map(item => item.rowid_accounts))];
    console.log(`Found ${accountIdsToProcess.length} unique accounts to process.`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Process each account
    for (const accountId of accountIdsToProcess) {
      try {
        console.log(`Updating balance for account: ${accountId}`);
        // IMPORTANT: Assumes the function parameter is named 'p_glide_row_id'. Verify this!
        const { error: rpcError } = await supabaseAdmin.rpc('update_account_customer_balance', {
          p_glide_row_id: accountId, 
        });

        if (rpcError) {
          console.error(`Error updating balance for account ${accountId}:`, rpcError);
          errorCount++;
          // Decide if you want to continue processing others or stop
          // Consider moving failed IDs to a dead-letter queue or logging for retry
        } else {
          // 3. Delete processed items for this account from the queue
          const { error: deleteError } = await supabaseAdmin
            .from('account_balance_update_queue')
            .delete()
            .eq('rowid_accounts', accountId);

          if (deleteError) {
            console.error(`Error deleting queue items for account ${accountId}:`, deleteError);
            // This is problematic - the balance was updated, but the queue item remains. Manual cleanup might be needed.
            errorCount++;
          } else {
            console.log(`Successfully processed and dequeued account: ${accountId}`);
            successCount++;
          }
        }
      } catch (individualError) {
        console.error(`Unexpected error processing account ${accountId}:`, individualError);
        errorCount++;
      }
    }

    console.log(`Processing finished. Success: ${successCount}, Errors: ${errorCount}`);
    return new Response(JSON.stringify({ message: `Processed: ${successCount}, Errors: ${errorCount}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in process-account-balance-queue:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
