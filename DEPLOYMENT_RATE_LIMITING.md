# Server-Side Rate Limiting Deployment Guide

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created
- Environment variables configured

## Step 1: Run Database Migration

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

Or manually run the SQL in Supabase Dashboard → SQL Editor:

- File: `supabase/migrations/20260126_rate_limiting.sql`

## Step 2: Deploy Edge Functions

```bash
# Deploy get-feedback-token function
supabase functions deploy get-feedback-token

# Deploy submit-feedback function
supabase functions deploy submit-feedback
```

## Step 3: Verify Deployment

1. **Test Token Generation:**

```bash
curl https://your-project-ref.supabase.co/functions/v1/get-feedback-token
```

Expected response:

```json
{ "token": "uuid-here" }
```

2. **Check Database:**

- Go to Supabase Dashboard → Table Editor
- Verify `rate_limit_tokens` and `submission_logs` tables exist

## Step 4: Update Environment Variables

Make sure `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Deploy Frontend

```bash
# Build and deploy to Vercel
npm run build
vercel --prod
```

## Testing

### Test Rate Limiting:

1. Submit form successfully
2. Try to submit again immediately
3. Should receive error: "Please wait X seconds before submitting again."

### Test Token Security:

1. Try to submit with invalid token → Should fail
2. Try to reuse same token → Should fail
3. Try to submit with expired token (after 5 min) → Should fail

## Maintenance

### Cleanup Old Data (Optional)

Run this periodically in Supabase SQL Editor:

```sql
SELECT cleanup_expired_tokens();
```

Or set up a Supabase cron job to run daily.

## Troubleshooting

### "Security token not ready"

- Check if Edge Function is deployed
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check browser console for fetch errors

### "Invalid token" errors

- Verify database migration ran successfully
- Check Edge Function logs in Supabase Dashboard

### CORS errors

- Edge Functions have CORS headers configured
- If issues persist, check Supabase project settings
