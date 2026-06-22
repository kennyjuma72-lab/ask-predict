/**
 * Reserved Seating API - Hold Seats
 * POST /api/seating/hold-seats
 * 
 * Step 2.3: Temporarily reserve seats for 10 minutes
 * Called when customer selects seats in checkout
 * Uses Firebase Realtime Database for sub-second sync
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, set, get, remove } from 'firebase/database';
import { SEAT_HOLD_DURATION_MS } from '@/types/seating';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, seatMapId, userId, seatIds, sessionId } = req.body;

        if (!eventId || !seatMapId || !userId || !seatIds || !Array.isArray(seatIds)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const now = Date.now();
        const expiryTime = now + SEAT_HOLD_DURATION_MS;

        // Check if seats are already held/sold
        const unavailableSeats: string[] = [];

        for (const seatId of seatIds) {
            const seatLockRef = ref(rtdb, `seatLocks/${eventId}/${seatId}`);
            const snapshot = await get(seatLockRef);

            if (snapshot.exists()) {
                const lock = snapshot.val();
                // Check if lock is still valid and belongs to different user
                if (lock.expiresAt > now && lock.userId !== userId) {
                    unavailableSeats.push(seatId);
                }
            }
        }

        if (unavailableSeats.length > 0) {
            return res.status(409).json({
                error: 'Some seats are already held by another user',
                unavailableSeats
            });
        }

        // Create seat locks in Realtime Database
        const lockPromises = seatIds.map(seatId => {
            const seatLockRef = ref(rtdb, `seatLocks/${eventId}/${seatId}`);
            return set(seatLockRef, {
                userId,
                sessionId,
                expiresAt: expiryTime,
            });
        });

        await Promise.all(lockPromises);

        // Create reservation record in Firestore
        const reservationData = {
            eventId,
            seatMapId,
            userId,
            seatIds,
            status: 'held' as const,
            expiresAt: Timestamp.fromMillis(expiryTime),
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'seatReservations'), reservationData);

        // Schedule auto-release (in production, use Cloud Functions)
        // For now, client will handle releasing if payment fails

        return res.status(200).json({
            success: true,
            reservationId: docRef.id,
            expiresAt: expiryTime,
            expiresIn: SEAT_HOLD_DURATION_MS,
            message: `Seats held for ${SEAT_HOLD_DURATION_MS / 1000 / 60} minutes`
        });
    } catch (error: any) {
        console.error('Error holding seats:', error);
        return res.status(500).json({ error: error.message || 'Failed to hold seats' });
    }
}
