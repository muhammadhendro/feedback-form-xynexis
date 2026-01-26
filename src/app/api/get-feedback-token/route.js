import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 'unknown';

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Generate unique token
    const token = crypto.randomUUID();
    
    // Set expiration (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Store token in database
    const { error } = await supabase
      .from('rate_limit_tokens')
      .insert({
        token,
        ip_address: ip,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (error) {
      console.error('Error storing token:', error);
      throw error;
    }

    return Response.json({ token });

  } catch (error) {
    console.error('Error in get-feedback-token:', error);
    return Response.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
