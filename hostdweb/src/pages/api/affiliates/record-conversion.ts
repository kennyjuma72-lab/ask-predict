/**
 * Affiliate API - Record Conversion
 * POST /api/affiliates/record-conversion
 * 
 * Step 5.3: Record affiliate conversion after ticket purchase
 * Links purchase to original click and calculates commission
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, addDoc, doc, getDoc, increment, Timestamp } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            sessionId,
            orderId,
            ticketId,
            eventId,
            customerId,
            orderTotal,
            currency = 'USD'
        } = req.body;

        if (!sessionId || !orderId || !ticketId || !orderTotal) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find affiliate click by session ID (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const clickQuery = query(
            collection(db, 'affiliateClicks'),
            where('sessionId', '==', sessionId),
            where('converted', '==', false),
            where('clickedAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );

        const clickSnapshot = await getDocs(clickQuery);

        if (clickSnapshot.empty) {
            // No affiliate click found - organic purchase
            return res.status(200).json({
                success: true,
                affiliate: false,
                message: 'No affiliate attribution'
            });
        }

        const clickDoc = clickSnapshot.docs[0];
        const click = clickDoc.data();

        // Get affiliate details
        const affiliateDoc = await getDoc(doc(db, 'affiliates', click.affiliateId));
        if (!affiliateDoc.exists()) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate = affiliateDoc.data();

        // Calculate commission
        let commissionAmount = 0;
        if (affiliate.commissionType === 'percentage') {
            commissionAmount = orderTotal * affiliate.commissionRate;
        } else {
            commissionAmount = affiliate.commissionRate;
        }

        commissionAmount = Math.round(commissionAmount * 100) / 100;

        // Update click record
        await updateDoc(doc(db, 'affiliateClicks', clickDoc.id), {
            converted: true,
            ticketId,
            orderId,
            revenue: orderTotal,
            commissionEarned: commissionAmount,
            convertedAt: Timestamp.now(),
        });

        // Create commission record
        const commissionData = {
            affiliateId: click.affiliateId,
            clickId: clickDoc.id,
            orderId,
            ticketId,
            eventId,
            customerId,
            orderTotal,
            commissionRate: affiliate.commissionRate,
            commissionAmount,
            currency,
            status: 'pending' as const,
            earnedAt: Timestamp.now(),
        };

        const commissionRef = await addDoc(collection(db, 'commissions'), commissionData);

        // Update affiliate stats
        const newConversions = (affiliate.stats?.totalConversions || 0) + 1;
        const newRevenue = (affiliate.stats?.totalRevenue || 0) + orderTotal;
        const newCommission = (affiliate.stats?.totalCommission || 0) + commissionAmount;
        const totalClicks = affiliate.stats?.totalClicks || 1;
        const conversionRate = (newConversions / totalClicks) * 100;
        const averageOrderValue = newRevenue / newConversions;

        await updateDoc(doc(db, 'affiliates', click.affiliateId), {
            'stats.totalConversions': newConversions,
            'stats.totalRevenue': newRevenue,
            'stats.totalCommission': newCommission,
            'stats.conversionRate': Math.round(conversionRate * 100) / 100,
            'stats.averageOrderValue': Math.round(averageOrderValue * 100) / 100,
            updatedAt: Timestamp.now(),
        });

        return res.status(200).json({
            success: true,
            affiliate: true,
            affiliateId: click.affiliateId,
            commissionId: commissionRef.id,
            commissionAmount,
            message: 'Conversion recorded successfully'
        });

    } catch (error: any) {
        console.error('Error recording conversion:', error);
        return res.status(500).json({ error: error.message || 'Failed to record conversion' });
    }
}
