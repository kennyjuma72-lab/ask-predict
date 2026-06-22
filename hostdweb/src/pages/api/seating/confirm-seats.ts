/**
 * Reserved Seating API - Confirm Seats
 * POST /api/seating/confirm-seats
 * 
 * Step 2.5: Confirm seats after successful payment
 * Updates seat status to 'sold' and links to ticket
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db, rtdb } from '@/lib/firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, remove } from 'firebase/database';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { reservationId, eventId, seatMapId, ticketId, seatIds } = req.body;

        if (!reservationId || !eventId || !seatMapId || !ticketId || !seatIds) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get seat map
        const seatMapRef = doc(db, 'seatMaps', seatMapId);
        const seatMapDoc = await getDoc(seatMapRef);

        if (!seatMapDoc.exists()) {
            return res.status(404).json({ error: 'Seat map not found' });
        }

        const seatMap = seatMapDoc.data();

        // Update seat statuses to 'sold' and link to ticket
        const updatedLayout = { ...seatMap.layout };

        for (const section of updatedLayout.sections) {
            for (const row of section.rows) {
                for (const seat of row.seats) {
                    if (seatIds.includes(seat.id)) {
                        seat.status = 'sold';
                        seat.ticketId = ticketId;
                    }
                }
            }
        }

        // Update seat map
        await updateDoc(seatMapRef, {
            layout: updatedLayout,
            updatedAt: Timestamp.now(),
        });

        // Remove locks from Realtime Database
        const unlockPromises = seatIds.map((seatId: string) => {
            const seatLockRef = ref(rtdb, `seatLocks/${eventId}/${seatId}`);
            return remove(seatLockRef);
        });

        await Promise.all(unlockPromises);

        // Update reservation status
        const reservationRef = doc(db, 'seatReservations', reservationId);
        await updateDoc(reservationRef, {
            status: 'confirmed',
            confirmedAt: Timestamp.now(),
            ticketId,
        });

        return res.status(200).json({
            success: true,
            message: 'Seats confirmed and assigned to ticket',
            seatsConfirmed: seatIds.length,
            ticketId
        });
    } catch (error: any) {
        console.error('Error confirming seats:', error);
        return res.status(500).json({ error: error.message || 'Failed to confirm seats' });
    }
}
