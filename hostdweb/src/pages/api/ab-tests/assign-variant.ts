/**
 * A/B Testing API - Assign Variant
 * POST /api/ab-tests/assign-variant
 * 
 * Assigns a visitor to a test variant based on traffic allocation
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { testId, userId, sessionId } = req.body;

        if (!testId || !sessionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if already assigned
        const existingQuery = query(
            collection(db, 'abTestAssignments'),
            where('testId', '==', testId),
            where('sessionId', '==', sessionId)
        );

        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
            const existing = existingSnapshot.docs[0].data();
            return res.json({
                success: true,
                variantId: existing.variantId,
                cached: true
            });
        }

        // Get test details
        const testDoc = await getDoc(doc(db, 'abTests', testId));
        if (!testDoc.exists()) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const test = testDoc.data();

        // Assign variant based on traffic allocation
        const random = Math.random() * 100;
        let cumulative = 0;
        let assignedVariantId = test.variants[0].id;

        for (const [variantId, percentage] of Object.entries(test.trafficAllocation)) {
            cumulative += Number(percentage);
            if (random <= cumulative) {
                assignedVariantId = variantId;
                break;
            }
        }

        // Create assignment
        const assignmentData = {
            testId,
            variantId: assignedVariantId,
            userId: userId || null,
            sessionId,
            converted: false,
            pageViews: 0,
            timeOnPage: 0,
            clickedCTA: false,
            bounced: false,
            assignedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'abTestAssignments'), assignmentData);

        return res.json({
            success: true,
            variantId: assignedVariantId,
            cached: false
        });
    } catch (error: any) {
        console.error('Error assigning variant:', error);
        return res.status(500).json({ error: error.message });
    }
}
