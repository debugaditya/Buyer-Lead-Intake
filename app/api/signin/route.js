import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const supabaseUrl = 'https://xpzxedlykqcdmhvyxieg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createTokenForUser(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
  };
  const secretKey = process.env.JWT_SECRET;
  const options = { algorithm: 'HS256' };
  return jwt.sign(payload, secretKey, options);
}

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ message: 'Username and password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });

  const { data: user, error } = await supabaseAdmin
    .from('buyers')
    .select('id, email, password')
    .eq('email', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase error:', error.message);
    return new Response(JSON.stringify({ message: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!user) {
    return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = createTokenForUser(user);
  
  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

