/**
 * Reserved Seating API - Release Seats
 * POST /api/seating/release-seats
 * 
 * Step 2.4: Release held seats (when checkout cancelled or expired)
 * Removes seat locks from Realtime Database and updates reservation status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db, rtdb } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, remove } from 'firebase/database';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { reservationId, eventId, seatIds } = req.body;

        if (!reservationId || !eventId || !seatIds || !Array.isArray(seatIds)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Remove seat locks from Realtime Database
        const unlockPromises = seatIds.map(seatId => {
            const seatLockRef = ref(rtdb, `seatLocks/${eventId}/${seatId}`);
            return remove(seatLockRef);
        });

        await Promise.all(unlockPromises);

        // Update reservation status in Firestore
        const reservationRef = doc(db, 'seatReservations', reservationId);
        await updateDoc(reservationRef, {
            status: 'released',
            releasedAt: Timestamp.now(),
        });

        return res.status(200).json({
            success: true,
            message: 'Seats released successfully',
            seatsReleased: seatIds.length
        });
    } catch (error: any) {
        console.error('Error releasing seats:', error);
        return res.status(500).json({ error: error.message || 'Failed to release seats' });
    }
}
