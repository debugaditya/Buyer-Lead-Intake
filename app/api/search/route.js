import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = 'https://xpzxedlykqcdmhvyxieg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // This calls the 'search_buyers' function you created in the Supabase SQL Editor.
    const { data, error } = await supabaseAdmin.rpc('search_buyers', {
      search_term: query.trim()
    });

    if (error) {
      console.error('Search RPC error:', error);
      return NextResponse.json({ message: 'Database search failed' }, { status: 500 });
    }

    // The RPC function returns the data in the format your frontend expects
    return NextResponse.json({ users: data || [] });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

