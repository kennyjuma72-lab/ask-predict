/**
 * Discount Code API - Validate
 * POST /api/discount-codes/validate
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { DiscountCode, DiscountValidationResult } from '@/types/discount';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DiscountValidationResult>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ valid: false, error: 'Method not allowed' });
    }

    try {
        const { code, eventId, totalPrice, ticketType } = req.body;

        if (!code || !eventId || totalPrice == null) {
            return res.status(400).json({ valid: false, error: 'Missing required fields' });
        }

        // Find discount code
        const normalizedCode = code.toUpperCase().trim();
        const q = query(
            collection(db, 'discountCodes'),
            where('eventId', '==', eventId),
            where('code', '==', normalizedCode)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return res.json({ valid: false, error: 'Invalid discount code' });
        }

        const discountDoc = snapshot.docs[0];
        const discount = discountDoc.data() as DiscountCode;

        // Check status
        if (discount.status !== 'active') {
            return res.json({ valid: false, error: 'This discount code is no longer active' });
        }

        // Check date validity
        const now = Timestamp.now();
        if (discount.startDate > now) {
            return res.json({ valid: false, error: 'This discount code is not yet valid' });
        }
        if (discount.endDate < now) {
            return res.json({ valid: false, error: 'This discount code has expired' });
        }

        // Check usage limit
        if (discount.maxUses !== null && discount.currentUses >= discount.maxUses) {
            return res.json({ valid: false, error: 'This discount code has reached its usage limit' });
        }

        // Check minimum purchase
        if (discount.minimumPurchase && totalPrice < discount.minimumPurchase) {
            return res.json({
                valid: false,
                error: `Minimum purchase of $${discount.minimumPurchase} required`
            });
        }

        // Check applicable ticket types
        if (discount.applicableTicketTypes && discount.applicableTicketTypes.length > 0) {
            if (ticketType && !discount.applicableTicketTypes.includes(ticketType)) {
                return res.json({
                    valid: false,
                    error: 'This discount code is not applicable to this ticket type'
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        let finalPrice = totalPrice;

        if (discount.type === 'percentage') {
            discountAmount = (totalPrice * discount.value) / 100;
            finalPrice = totalPrice - discountAmount;
        } else if (discount.type === 'fixed') {
            discountAmount = Math.min(discount.value, totalPrice); // Don't go below 0
            finalPrice = totalPrice - discountAmount;
        } else if (discount.type === 'free') {
            discountAmount = totalPrice;
            finalPrice = 0;
        }

        // Ensure final price doesn't go negative
        finalPrice = Math.max(0, finalPrice);
        discountAmount = totalPrice - finalPrice;

        return res.json({
            valid: true,
            discount: {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                discountAmount: Math.round(discountAmount * 100) / 100,
                finalPrice: Math.round(finalPrice * 100) / 100,
            }
        });
    } catch (error: any) {
        console.error('Error validating discount code:', error);
        return res.status(500).json({ valid: false, error: 'Failed to validate discount code' });
    }
}
