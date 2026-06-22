/**
 * A/B Testing API - Create Test
 * POST /api/ab-tests/create
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
            name,
            hypothesis,
            testType,
            variants,
            trafficAllocation,
            goalMetric,
            confidenceLevel = 95,
            minimumSampleSize = 100
        } = req.body;

        if (!eventId || !name || !variants || !trafficAllocation) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const testData = {
            eventId,
            name,
            description: '',
            hypothesis: hypothesis || '',
            testType: testType || 'multi_variant',
            variants,
            trafficAllocation,
            goalMetric: goalMetric || 'ticket_purchase',
            confidenceLevel,
            minimumSampleSize,
            status: 'running' as const,
            results: {
                totalVisitors: 0,
                totalConversions: 0,
                conversionRate: 0,
                statisticalSignificance: 0,
                confidenceInterval: { lower: 0, upper: 0 }
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'abTests'), testData);

        return res.status(201).json({
            success: true,
            testId: docRef.id,
            message: 'A/B test created and started'
        });
    } catch (error: any) {
        console.error('Error creating A/B test:', error);
        return res.status(500).json({ error: error.message });
    }
}
