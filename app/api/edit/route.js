import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpzxedlykqcdmhvyxieg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ message: 'Buyer ID is required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: buyer, error: buyerError } = await supabaseAdmin
            .from('buyers')
            .select('*')
            .eq('id', id)
            .single();

        if (buyerError) {
            console.error('Supabase buyer query error:', buyerError.message);
            if (buyerError.code === 'PGRST116') {
                return NextResponse.json({ message: 'Buyer not found' }, { status: 404 });
            }
            return NextResponse.json({ message: `Database error: ${buyerError.message}` }, { status: 500 });
        }

        const { data: history, error: historyError } = await supabaseAdmin
            .from('buyer_history')
            .select('*')
            .eq('buyerId', id)
            .order('changedAt', { ascending: false })
            .limit(5);

        if (historyError) {
            console.error('Supabase history query error:', historyError.message);
            return NextResponse.json({ message: `History database error: ${historyError.message}` }, { status: 500 });
        }

        return NextResponse.json({ buyer: buyer, history: history || [] });

    } catch (error) {
        console.error('API /api/edit error:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}