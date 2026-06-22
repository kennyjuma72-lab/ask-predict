/**
 * Discount Code API - Create
 * POST /api/discount-codes/create
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            eventId,
            code,
            type,
            value,
            maxUses,
            startDate,
            endDate,
            minimumPurchase,
            applicableTicketTypes,
            createdBy,
            affiliateId,
            description
        } = req.body;

        // Validation
        if (!eventId || !code || !type || value == null || !createdBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Normalize code to uppercase
        const normalizedCode = code.toUpperCase().trim();

        // Check if code already exists for this event
        const existingQuery = query(
            collection(db, 'discountCodes'),
            where('eventId', '==', eventId),
            where('code', '==', normalizedCode)
        );
        const existing = await getDocs(existingQuery);

        if (!existing.empty) {
            return res.status(400).json({ error: 'This discount code already exists for this event' });
        }

        // Create discount code
        const discountCodeData = {
            eventId,
            code: normalizedCode,
            type,
            value: Number(value),
            maxUses: maxUses ? Number(maxUses) : null,
            currentUses: 0,
            startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : Timestamp.now(),
            endDate: Timestamp.fromDate(new Date(endDate)),
            minimumPurchase: minimumPurchase ? Number(minimumPurchase) : undefined,
            applicableTicketTypes: applicableTicketTypes || undefined,
            status: 'active' as const,
            createdBy,
            affiliateId: affiliateId || undefined,
            description: description || undefined,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'discountCodes'), discountCodeData);

        return res.status(201).json({
            success: true,
            discountCodeId: docRef.id,
            code: normalizedCode
        });
    } catch (error: any) {
        console.error('Error creating discount code:', error);
        return res.status(500).json({ error: error.message || 'Failed to create discount code' });
    }
}
