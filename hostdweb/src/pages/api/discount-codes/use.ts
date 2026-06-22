/**
 * Discount Code API - Record Usage
 * POST /api/discount-codes/use
 * 
 * Step 1.5: Record when a discount code is used
 * Called after successful payment to track usage and update stats
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, increment, Timestamp } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            discountCodeId,
            code,
            userId,
            eventId,
            ticketId,
            originalPrice,
            discountAmount,
            finalPrice
        } = req.body;

        if (!discountCodeId || !userId || !eventId || !ticketId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Record usage in discountUsage collection
        const usageData = {
            discountCodeId,
            code,
            userId,
            eventId,
            ticketId,
            originalPrice: Number(originalPrice),
            discountAmount: Number(discountAmount),
            finalPrice: Number(finalPrice),
            usedAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'discountUsage'), usageData);

        // Increment usage counter on the discount code
        const discountRef = doc(db, 'discountCodes', discountCodeId);
        await updateDoc(discountRef, {
            currentUses: increment(1),
            updatedAt: Timestamp.now(),
        });

        return res.status(200).json({
            success: true,
            message: 'Discount code usage recorded'
        });
    } catch (error: any) {
        console.error('Error recording discount usage:', error);
        return res.status(500).json({ error: error.message || 'Failed to record usage' });
    }
}
