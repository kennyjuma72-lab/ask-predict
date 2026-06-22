/**
 * Affiliate API - Get Stats
 * GET /api/affiliates/[userId]/stats
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        // Get affiliate
        const affiliateQuery = query(
            collection(db, 'affiliates'),
            where('userId', '==', userId)
        );
        const affiliateSnapshot = await getDocs(affiliateQuery);

        if (affiliateSnapshot.empty) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate = affiliateSnapshot.docs[0];

        // Get recent commissions
        const commissionsQuery = query(
            collection(db, 'commissions'),
            where('affiliateId', '==', affiliate.id),
            orderBy('earnedAt', 'desc'),
            limit(20)
        );

        const commissionsSnapshot = await getDocs(commissionsQuery);
        const recentCommissions = commissionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.json({
            success: true,
            recentCommissions
        });
    } catch (error: any) {
        console.error('Error fetching affiliate stats:', error);
        return res.status(500).json({ error: error.message });
    }
}
