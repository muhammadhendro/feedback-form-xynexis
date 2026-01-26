import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Get client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown'

    // Parse request body
    const { token, formData } = await req.json()

    if (!token || !formData) {
      return new Response(
        JSON.stringify({ error: 'Missing token or form data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Validate token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('rate_limit_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check if token is already used
    if (tokenData.used) {
      return new Response(
        JSON.stringify({ error: 'Token already used' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 2. Check rate limiting (60 seconds cooldown)
    const sixtySecondsAgo = new Date()
    sixtySecondsAgo.setSeconds(sixtySecondsAgo.getSeconds() - 60)

    const { data: recentSubmissions, error: logError } = await supabaseClient
      .from('submission_logs')
      .select('submitted_at')
      .eq('ip_address', ip)
      .gte('submitted_at', sixtySecondsAgo.toISOString())
      .order('submitted_at', { ascending: false })
      .limit(1)

    if (logError) {
      console.error('Error checking rate limit:', logError)
    }

    if (recentSubmissions && recentSubmissions.length > 0) {
      const lastSubmission = new Date(recentSubmissions[0].submitted_at)
      const timeSince = Date.now() - lastSubmission.getTime()
      const remainingSeconds = Math.ceil((60000 - timeSince) / 1000)

      return new Response(
        JSON.stringify({ 
          error: `Please wait ${remainingSeconds} seconds before submitting again.`,
          remainingSeconds 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // 3. Mark token as used
    await supabaseClient
      .from('rate_limit_tokens')
      .update({ used: true })
      .eq('token', token)

    // 4. Insert feedback submission
    const { error: insertError } = await supabaseClient
      .from('feedback_submissions')
      .insert({
        full_name: formData.full_name?.trim(),
        company_name: formData.company_name?.trim(),
        email: formData.email?.trim().toLowerCase(),
        satisfaction_overall: formData.satisfaction_overall,
        material_usefulness: formData.material_usefulness,
        recommend_colleagues: formData.recommend_colleagues,
        comments: formData.comments?.trim()
      })

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      throw insertError
    }

    // 5. Log submission for rate limiting
    await supabaseClient
      .from('submission_logs')
      .insert({
        ip_address: ip,
        submitted_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Feedback submitted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in submit-feedback:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to submit feedback' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
