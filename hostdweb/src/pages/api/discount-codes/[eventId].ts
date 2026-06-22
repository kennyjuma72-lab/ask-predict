/**
 * Discount Code API - Get by Event
 * GET /api/discount-codes/[eventId]
 * 
 * Step 1.3: Retrieve all discount codes for an event
 * Used by: DiscountCodeManager component to display codes table
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { DiscountCode } from '@/types/discount';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        // Query all discount codes for this event
        const q = query(
            collection(db, 'discountCodes'),
            where('eventId', '==', eventId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);

        const discountCodes: DiscountCode[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as DiscountCode));

        return res.status(200).json({
            success: true,
            discountCodes,
            count: discountCodes.length
        });
    } catch (error: any) {
        console.error('Error fetching discount codes:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch discount codes' });
    }
}
