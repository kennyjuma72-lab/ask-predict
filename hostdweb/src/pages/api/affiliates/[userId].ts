/**
 * Affiliate API - Get Affiliate Data
 * GET /api/affiliates/[userId]
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        const q = query(
            collection(db, 'affiliates'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const affiliate = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        return res.json({ success: true, affiliate });
    } catch (error: any) {
        console.error('Error fetching affiliate:', error);
        return res.status(500).json({ error: error.message });
    }
}
