/**
 * OAuth Callback - Google Calendar
 * GET /api/integrations/google-calendar/callback
 * 
 * Feature 16 Completion: Handle OAuth callback and store tokens
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/google-calendar/callback`
);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);
        oauth2Client.setCredentials(tokens);

        // Get user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        // Store OAuth connection in Firestore
        const connectionData = {
            userId: state || 'unknown', // Passed from connect endpoint
            provider: 'google' as const,
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expiry_date ? Timestamp.fromMillis(tokens.expiry_date) : null,
            scope: tokens.scope?.split(' ') || [],
            providerUserId: userInfo.id!,
            providerEmail: userInfo.email!,
            accountName: userInfo.name || userInfo.email!,
            status: 'active' as const,
            metadata: {
                userInfo
            },
            connectedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'oauthConnections'), connectionData);

        // Redirect back to app with success message
        return res.redirect('/settings/integrations?success=google_calendar');
    } catch (error: any) {
        console.error('OAuth callback error:', error);
        return res.redirect('/settings/integrations?error=oauth_failed');
    }
}
