/**
 * Affiliate API - Track Click
 * POST /api/affiliates/track-click
 * 
 * Step 5.2: Track affiliate referral clicks
 * Called when someone clicks an affiliate link
 * Stores click data for later conversion attribution
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, increment, Timestamp, query, where, limit, getDocs } from 'firebase/firestore';
import type { AffiliateClick } from '@/types/affiliate';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            referralCode,
            eventId,
            sessionId,
            landingPage,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign,
        } = req.body;

        if (!referralCode || !sessionId || !landingPage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find affiliate by code
        const affiliateQuery = query(
            collection(db, 'affiliates'),
            where('code', '==', referralCode.toUpperCase()),
            where('status', '==', 'active'),
            limit(1)
        );

        const affiliateSnapshot = await getDocs(affiliateQuery);

        if (affiliateSnapshot.empty) {
            return res.status(404).json({ error: 'Invalid referral code' });
        }

        const affiliate = affiliateSnapshot.docs[0];
        const affiliateData = affiliate.data();

        // Check if affiliate can promote this event
        if (eventId && affiliateData.eventIds.length > 0) {
            if (!affiliateData.eventIds.includes(eventId)) {
                return res.status(403).json({ error: 'Affiliate not authorized for this event' });
            }
        }

        // Get client info
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Create click record
        const clickData: Omit<AffiliateClick, 'id'> = {
            affiliateId: affiliate.id,
            referralCode: referralCode.toUpperCase(),
            eventId,
            sessionId,
            ipAddress: ipAddress.toString(),
            userAgent,
            referrer,
            landingPage,
            utmSource,
            utmMedium,
            utmCampaign,
            converted: false,
            clickedAt: Timestamp.now(),
        };

        const clickRef = await addDoc(collection(db, 'affiliateClicks'), clickData);

        // Increment affiliate click count
        await updateDoc(doc(db, 'affiliates', affiliate.id), {
            'stats.totalClicks': increment(1),
            updatedAt: Timestamp.now(),
        });

        // Store session tracking cookie (handled client-side)
        return res.status(200).json({
            success: true,
            clickId: clickRef.id,
            message: 'Click tracked successfully'
        });

    } catch (error: any) {
        console.error('Error tracking affiliate click:', error);
        return res.status(500).json({ error: error.message || 'Failed to track click' });
    }
}
