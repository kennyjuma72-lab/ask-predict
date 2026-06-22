/**
 * Reserved Seating API - Create Seat Map
 * POST /api/seating/create-map
 * 
 * Step 2.2: Create a new seat map for an event
 * This is typically done once per event during setup
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import type { SeatMap } from '@/types/seating';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, name, layout } = req.body;

        if (!eventId || !name || !layout) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate total capacity
        let totalCapacity = 0;
        layout.sections.forEach((section: any) => {
            section.rows.forEach((row: any) => {
                totalCapacity += row.seats.filter((s: any) => s.type !== 'blocked').length;
            });
        });

        // Create seat map
        const seatMapData: Omit<SeatMap, 'id'> = {
            eventId,
            name,
            totalCapacity,
            layout,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'seatMaps'), seatMapData);

        return res.status(201).json({
            success: true,
            seatMapId: docRef.id,
            totalCapacity,
            message: 'Seat map created successfully'
        });
    } catch (error: any) {
        console.error('Error creating seat map:', error);
        return res.status(500).json({ error: error.message || 'Failed to create seat map' });
    }
}
