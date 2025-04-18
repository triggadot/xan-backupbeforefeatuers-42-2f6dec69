import { supabase } from '@/lib/supabaseClient';
import { convertDbToFrontend } from '@/services/supabase/gl-messages';
import type { Message } from '@/types/message-types';

export async function getPublicMedia(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .is('public_url', null, false);
  if (error) throw error;
  return (data ?? []).map(convertDbToFrontend);
}
