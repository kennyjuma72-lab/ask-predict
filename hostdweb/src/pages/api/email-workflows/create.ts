/**
 * Email Workflow API - Create Workflow
 * POST /api/email-workflows/create
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
            trigger,
            steps,
            status = 'draft',
            stats,
            settings
        } = req.body;

        if (!eventId || !name || !trigger || !steps) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const workflowData = {
            eventId,
            name,
            description: '',
            trigger,
            steps,
            status,
            stats: stats || {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                bounced: 0,
                unsubscribed: 0
            },
            settings: settings || {
                timezone: 'UTC',
                skipWeekends: false
            },
            createdBy: 'current-user-id', // Replace with actual user
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'emailWorkflows'), workflowData);

        return res.status(201).json({
            success: true,
            workflowId: docRef.id,
            message: 'Workflow created successfully'
        });
    } catch (error: any) {
        console.error('Error creating workflow:', error);
        return res.status(500).json({ error: error.message });
    }
}
