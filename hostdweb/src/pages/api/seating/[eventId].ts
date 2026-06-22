/**
 * Reserved Seating API - Get Seat Map
 * GET /api/seating/[eventId]
 * 
 * Step 2.6: Retrieve seat map for an event
 * Returns seat map with real-time seat availability
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { rtdb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

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

        // Get seat map
        const q = query(
            collection(db, 'seatMaps'),
            where('eventId', '==', eventId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Seat map not found for this event' });
        }

        const seatMapDoc = snapshot.docs[0];
        const seatMap: any = {
            id: seatMapDoc.id,
            ...seatMapDoc.data()
        };

        // Get real-time seat locks
        const locksRef = ref(rtdb, `seatLocks/${eventId}`);
        const locksSnapshot = await get(locksRef);
        const locks = locksSnapshot.val() || {};

        // Update seat statuses based on locks
        const now = Date.now();
        const updatedLayout = { ...seatMap.layout };

        for (const section of updatedLayout.sections) {
            for (const row of section.rows) {
                for (const seat of row.seats) {
                    // Check if seat is locked
                    const lock = locks[seat.id];
                    if (lock && lock.expiresAt > now) {
                        seat.status = 'held';
                        seat.holdExpiry = lock.expiresAt;
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            seatMap: {
                ...seatMap,
                layout: updatedLayout
            }
        });
    } catch (error: any) {
        console.error('Error fetching seat map:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch seat map' });
    }
}
