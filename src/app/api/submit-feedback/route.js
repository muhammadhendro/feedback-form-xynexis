import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 'unknown';

    // Parse request body
    const { token, formData } = await request.json();

    if (!token || !formData) {
      return Response.json(
        { error: 'Missing token or form data' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('rate_limit_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 403 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return Response.json(
        { error: 'Token already used' },
        { status: 403 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return Response.json(
        { error: 'Token expired' },
        { status: 403 }
      );
    }

    // 2. Check rate limiting (60 seconds cooldown)
    const sixtySecondsAgo = new Date();
    sixtySecondsAgo.setSeconds(sixtySecondsAgo.getSeconds() - 60);

    const { data: recentSubmissions } = await supabase
      .from('submission_logs')
      .select('submitted_at')
      .eq('ip_address', ip)
      .gte('submitted_at', sixtySecondsAgo.toISOString())
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (recentSubmissions && recentSubmissions.length > 0) {
      const lastSubmission = new Date(recentSubmissions[0].submitted_at);
      const timeSince = Date.now() - lastSubmission.getTime();
      const remainingSeconds = Math.ceil((60000 - timeSince) / 1000);

      return Response.json(
        { 
          error: `Please wait ${remainingSeconds} seconds before submitting again.`,
          remainingSeconds 
        },
        { status: 429 }
      );
    }

    // 3. Mark token as used
    await supabase
      .from('rate_limit_tokens')
      .update({ used: true })
      .eq('token', token);

    // 4. Insert feedback submission
    const { error: insertError } = await supabase
      .from('feedback_submissions')
      .insert({
        full_name: formData.full_name?.trim(),
        company_name: formData.company_name?.trim(),
        sector: formData.sector,
        email: formData.email?.trim().toLowerCase(),
        satisfaction_overall: formData.satisfaction_overall,
        material_usefulness: formData.material_usefulness,
        recommend_colleagues: formData.recommend_colleagues,
        comments: formData.comments?.trim(),
        one_on_one_session: formData.one_on_one_session,
        privacy_consent: formData.privacy_consent
      });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      throw insertError;
    }

    // 5. Log submission for rate limiting
    await supabase
      .from('submission_logs')
      .insert({
        ip_address: ip,
        submitted_at: new Date().toISOString()
      });

    return Response.json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });

  } catch (error) {
    console.error('Error in submit-feedback:', error);
    return Response.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
