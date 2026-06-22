/**
 * Event Insurance API - Purchase Policy
 * POST /api/insurance/purchase
 * 
 * Feature 13 Completion: Purchase insurance policy
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            quoteId,
            userId,
            paymentId
        } = req.body;

        if (!quoteId || !userId || !paymentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get quote
        const quoteDoc = await getDoc(doc(db, 'insuranceQuotes', quoteId));
        if (!quoteDoc.exists()) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const quote = quoteDoc.data();

        // Check if quote is still valid
        if (quote.validUntil.toDate() < new Date()) {
            return res.status(400).json({ error: 'Quote has expired' });
        }

        // Generate policy number
        const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create insurance policy
        const policyData = {
            eventId: quote.eventId,
            userId,
            policyNumber,
            provider: 'event_helper' as const,
            coverageType: quote.coverageType,
            coverageAmount: quote.coverageAmount,
            premium: quote.premium,
            currency: 'USD',
            effectiveFrom: Timestamp.now(),
            effectiveUntil: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year
            terms: `Event insurance policy covering ${quote.coverageType}. Coverage amount: $${quote.coverageAmount}. Deductible: $${quote.deductible}.`,
            status: 'active' as const,
            claimFiled: false,
            purchasedAt: Timestamp.now(),
            createdAt: Timestamp.now()
        };

        const policyRef = await addDoc(collection(db, 'eventInsurance'), policyData);

        // TODO: Generate PDF policy document
        // TODO: Send confirmation email

        return res.json({
            success: true,
            policyId: policyRef.id,
            policyNumber,
            message: 'Insurance policy purchased successfully'
        });
    } catch (error: any) {
        console.error('Error purchasing insurance:', error);
        return res.status(500).json({ error: error.message });
    }
}
