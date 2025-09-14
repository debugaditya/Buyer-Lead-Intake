import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const supabaseUrl = 'https://xpzxedlykqcdmhvyxieg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const buyerData = await request.json();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (buyerData.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('buyers')
        .select('*')
        .eq('email', buyerData.email)
        .single();

      if (existingUser) {
        const diff = [];
        const allKeys = new Set([...Object.keys(buyerData), ...Object.keys(existingUser)]);

        for (const key of allKeys) {
          const oldVal = existingUser[key];
          const newVal = buyerData[key];

          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            if (oldVal !== undefined || newVal !== undefined) {
              diff.push({
                field: key,
                old: oldVal,
                new: newVal
              });
            }
          }
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('buyers')
          .update(buyerData)
          .eq('id', existingUser.id);

        if (updateError) {a
          console.error('Supabase update error:', updateError);
          return NextResponse.json({ message: 'Failed to update existing buyer', details: updateError.message }, { status: 500 });
        }
        
        const historyEntry = {
          buyerId: existingUser.id,
          changedBy: 'system',
          diff: diff
        };

        try {
          await supabaseAdmin.from('buyer_history').insert([historyEntry]);
        } catch (historyError) {
          console.error('Failed to insert into buyer_history:', historyError);
        }

        return NextResponse.json({ message: 'Buyer updated successfully' });
      }
    }

    const dataToInsert = {
      ...buyerData,
      status: buyerData.status || 'New'
    };
    if (buyerData.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(buyerData.password, salt);
      dataToInsert.password = hashedPassword;
    }
    const { data: newBuyer, error: insertError } = await supabaseAdmin
      .from('buyers')
      .insert([dataToInsert])
      .select('id');

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ message: 'Failed to create new buyer', details: insertError.message }, { status: 500 });
    }

    if (newBuyer && newBuyer.length > 0) {
      const historyEntry = {
        buyerId: newBuyer[0].id,
        changedBy: 'system',
        diff: { message: 'New buyer created.', fields: Object.keys(dataToInsert) }
      };
      try {
        await supabaseAdmin.from('buyer_history').insert([historyEntry]);
      } catch (historyError) {
        console.error('Failed to insert into buyer_history:', historyError);
      }
    }
    
    return NextResponse.json({ message: 'Buyer created successfully' }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
