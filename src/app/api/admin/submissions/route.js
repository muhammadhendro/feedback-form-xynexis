import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Check for auth token in header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all submissions
    const { data, error } = await supabase
      .from('feedback_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }

    return Response.json({ submissions: data });

  } catch (error) {
    console.error('Error in admin/submissions:', error);
    return Response.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
