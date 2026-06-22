import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { ticketId, sessionId } = req.body;

        if (!ticketId || !sessionId) {
            return res.status(400).json({ error: 'Ticket ID and Session ID are required' });
        }

        // Get ticket
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketDoc = await getDoc(ticketRef);

        if (!ticketDoc.exists()) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = ticketDoc.data();

        // Verify ticket belongs to this event
        if (ticket.eventId !== eventId) {
            return res.status(403).json({ error: 'Ticket does not belong to this event' });
        }

        // Check if session is allowed for this ticket
        if (ticket.checkIns && ticket.checkIns[sessionId]?.checkedIn) {
            return res.status(400).json({ error: 'Already checked in for this session' });
        }

        // Update check-in status
        const checkInData = {
            [`checkIns.${sessionId}`]: {
                checkedIn: true,
                checkedInAt: Timestamp.now(),
                checkedInBy: req.body.checkedInBy || 'system',
            },
        };

        await updateDoc(ticketRef, checkInData);

        console.log(`✅ Checked in ticket ${ticketId} for session ${sessionId}`);

        return res.status(200).json({
            success: true,
            message: 'Checked in successfully',
            sessionId,
            ticketId,
        });
    } catch (error: any) {
        console.error('Error checking in:', error);
        return res.status(500).json({ error: error.message || 'Failed to check in' });
    }
}
