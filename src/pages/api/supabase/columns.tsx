
import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { table } = req.query;

  if (!table) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: table
    });

    if (error) throw error;

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error fetching columns:', error);
    return res.status(500).json({ error: error.message });
  }
}
