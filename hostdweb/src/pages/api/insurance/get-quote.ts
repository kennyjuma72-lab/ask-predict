/**
 * Event Insurance API - Get Quote
 * POST /api/insurance/get-quote
 * 
 * Feature 13 Completion: Calculate insurance quote
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

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
            coverageType,
            eventCost,
            attendeeCount,
            eventDate
        } = req.body;

        if (!eventId || !coverageType || !eventCost || !attendeeCount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate premium based on coverage type and event details
        let baseRate = 0;
        let deductible = 0;

        switch (coverageType) {
            case 'cancellation':
                baseRate = 0.05; // 5% of event cost
                deductible = eventCost * 0.1; // 10% deductible
                break;
            case 'liability':
                baseRate = 0.03; // 3% of event cost
                deductible = 500; // Fixed $500 deductible
                break;
            case 'weather':
                baseRate = 0.04; // 4% of event cost
                deductible = eventCost * 0.15; // 15% deductible
                break;
            case 'comprehensive':
                baseRate = 0.08; // 8% of event cost
                deductible = eventCost * 0.1; // 10% deductible
                break;
            default:
                return res.status(400).json({ error: 'Invalid coverage type' });
        }

        // Adjust for attendee count (higher risk for larger events)
        if (attendeeCount > 500) {
            baseRate *= 1.3;
        } else if (attendeeCount > 200) {
            baseRate *= 1.15;
        }

        const premium = Math.round(eventCost * baseRate * 100) / 100;
        const coverageAmount = eventCost;

        // Save quote
        const quoteData = {
            eventId,
            coverageType,
            eventCost,
            attendeeCount,
            premium,
            coverageAmount,
            deductible,
            validUntil: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
            createdAt: Timestamp.now()
        };

        const quoteRef = await addDoc(collection(db, 'insuranceQuotes'), quoteData);

        return res.json({
            success: true,
            quoteId: quoteRef.id,
            quote: {
                premium,
                coverageAmount,
                deductible,
                coverageType,
                validUntil: quoteData.validUntil.toDate().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Error calculating insurance quote:', error);
        return res.status(500).json({ error: error.message });
    }
}
