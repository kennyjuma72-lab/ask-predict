import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Helper function to recalculate and update attendee count
async function updateAttendeeCount(eventId: string) {
    try {
        // Query all confirmed tickets for this event
        const confirmedTicketsQuery = query(
            collection(db, 'tickets'),
            where('eventId', '==', eventId),
            where('status', '==', 'confirmed')
        );
        const confirmedTicketsSnapshot = await getDocs(confirmedTicketsQuery);
        
        // Count unique users (one user can have multiple tickets)
        const uniqueUserIds = new Set<string>();
        confirmedTicketsSnapshot.forEach((doc) => {
            const ticketData = doc.data();
            if (ticketData.userId) {
                uniqueUserIds.add(ticketData.userId);
            }
        });

        // Update event with accurate count
        await updateDoc(doc(db, 'events', eventId), {
            currentAttendees: uniqueUserIds.size,
        });

        return uniqueUserIds.size;
    } catch (error) {
        console.error('Error updating attendee count:', error);
        throw error;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { attendeeIds, status } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return res.status(400).json({ error: 'Attendee IDs are required' });
        }

        if (!status || !['confirmed', 'pending', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        // Update all tickets
        const updatePromises = attendeeIds.map((id: string) => {
            const ticketRef = doc(db, 'tickets', id);
            return updateDoc(ticketRef, {
                status,
                updatedAt: new Date(),
            });
        });

        await Promise.all(updatePromises);

        // Recalculate and update attendee count if status changed to/from confirmed
        if (status === 'confirmed' || status === 'cancelled') {
            try {
                await updateAttendeeCount(eventId);
            } catch (countError) {
                console.error('Error updating attendee count:', countError);
                // Don't fail the request if count update fails
            }
        }

        console.log(`✅ Updated ${attendeeIds.length} tickets to status: ${status}`);

        return res.status(200).json({
            success: true,
            updated: attendeeIds.length,
            status,
        });
    } catch (error: any) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: error.message || 'Failed to update status' });
    }
}
