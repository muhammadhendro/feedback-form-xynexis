import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Secret for signing download tokens (MUST match the one in submit-feedback)
const DOWNLOAD_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret-do-not-use-in-prod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
    try {
        // Get client IP
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 
                request.headers.get('x-real-ip') || 'unknown';

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing download token', { status: 400 });
        }

        // Decode token
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        
        // Expected format: submissionId:timestamp:signature
        const lastColonIndex = decoded.lastIndexOf(':');
        if (lastColonIndex === -1) {
             return new NextResponse('Invalid token format', { status: 403 });
        }

        const payload = decoded.substring(0, lastColonIndex);
        const signature = decoded.substring(lastColonIndex + 1);
        const [submissionId, timestamp] = payload.split(':');

        if (!submissionId || !timestamp || !signature) {
            return new NextResponse('Invalid token structure', { status: 403 });
        }

        // Verify Signature
        const expectedSignature = crypto
            .createHmac('sha256', DOWNLOAD_SECRET)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            return new NextResponse('Invalid token signature', { status: 403 });
        }

        // Check Expiration (e.g., 1 hour = 3600000 ms)
        const ONE_HOUR = 60 * 60 * 1000;
        if (Date.now() - parseInt(timestamp) > ONE_HOUR) {
            return new NextResponse('Download link expired', { status: 403 });
        }

        // --- RATE LIMITING ---

        // 1. IP Limit: Max 10 downloads per hour
        const oneHourAgo = new Date(Date.now() - ONE_HOUR).toISOString();
        const { count: ipCount, error: ipError } = await supabase
            .from('download_logs')
            .select('*', { count: 'exact', head: true })
            .eq('ip_address', ip)
            .gte('downloaded_at', oneHourAgo);

        if (ipError) console.error('Rate limit IP check error:', ipError);

        if (ipCount >= 10) {
             return new NextResponse('Rate limit exceeded (IP). Please try again later.', { status: 429 });
        }

        // 2. Token Limit: Max 5 downloads per token
        const { count: tokenCount, error: tokenError } = await supabase
            .from('download_logs')
            .select('*', { count: 'exact', head: true })
            .eq('token_signature', signature);

        if (tokenError) console.error('Rate limit Token check error:', tokenError);

        if (tokenCount >= 5) {
             return new NextResponse('Download limit exceeded for this session.', { status: 429 });
        }

        // Log Download Request
        await supabase
            .from('download_logs')
            .insert({
                ip_address: ip,
                token_signature: signature,
                downloaded_at: new Date().toISOString()
            });

        // --- END RATE LIMITING ---

        // Token Valid - Serve File
        const filePath = path.join(process.cwd(), 'secure_docs', '[Slide Webinar January 2026].pdf');

        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return new NextResponse('File not found on server', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': 'attachment; filename="Xynexis_Slide_Materi_PDP_2026.pptx"',
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
