import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ message: 'Token is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const secretKey = process.env.JWT_SECRET;
    
    // This will throw an error if the token is invalid or expired
    const decodedPayload = jwt.verify(token, secretKey);

    // If verification is successful, return the user data from the payload
    return new Response(JSON.stringify({ user: decodedPayload }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    // Catch the error from jwt.verify (e.g., expired or invalid)
    return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

