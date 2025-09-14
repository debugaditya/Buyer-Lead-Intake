import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = 'https://xpzxedlykqcdmhvyxieg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const buyerData = await request.json();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (buyerData.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('buyers')
        .select('id')
        .eq('email', buyerData.email)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json({ message: 'Buyer with this email already exists' }, { status: 400 });
      }
    }

    return NextResponse.json({ message: 'Buyer  doesnt exist' }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

