export async function POST(request) {
  try {
    const { password } = await request.json();

    // Check password against environment variable
    if (password === process.env.ADMIN_PASSWORD) {
      // Generate simple session token
      const token = crypto.randomUUID();
      
      return Response.json({ 
        success: true, 
        token 
      });
    } else {
      return Response.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
