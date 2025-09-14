import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpzxedlykqcdmhvyxieg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { searchParams } = new URL(request.url);
    
    let query = supabaseAdmin
      .from('buyers')
      .select('id, email, fullName, phone, city, propertyType, budgetMin, budgetMax, timeline, status');

    if (searchParams.get('city')) {
      query = query.eq('city', searchParams.get('city'));
    }
    if (searchParams.get('propertyType')) {
      query = query.eq('propertyType', searchParams.get('propertyType'));
    }
    if (searchParams.get('status')) {
      query = query.eq('status', searchParams.get('status'));
    }
    if (searchParams.get('timeline')) {
      query = query.eq('timeline', searchParams.get('timeline'));
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Supabase error:', error.message);
      return new Response(JSON.stringify({ message: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Defensive check: Ensure the data sent is always an array.
    // If 'users' is null or not an array, it defaults to an empty array.
    const responseData = Array.isArray(users) ? users : [];

    return new Response(JSON.stringify({ info: responseData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Server error:', e);
    return new Response(JSON.stringify({ message: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

