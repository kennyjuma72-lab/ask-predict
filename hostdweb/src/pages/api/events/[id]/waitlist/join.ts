import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;

        // In a real app, get userId from authentication token
        // For now, we'll need to pass it in the body
        const { userId, userEmail, userName } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!userId || !userEmail || !userName) {
            return res.status(400).json({ error: 'User information is required' });
        }

        // Check if user is already on waitlist
        const waitlistRef = collection(db, 'waitlist');
        const existingQuery = query(
            waitlistRef,
            where('eventId', '==', eventId),
            where('userId', '==', userId)
        );
        const existingDocs = await getDocs(existingQuery);

        if (!existingDocs.empty) {
            const existingEntry = existingDocs.docs[0].data();
            return res.status(400).json({
                error: 'Already on waitlist',
                position: existingEntry.position
            });
        }

        // Get current waitlist count to calculate position
        const allWaitlistQuery = query(waitlistRef, where('eventId', '==', eventId));
        const allWaitlistDocs = await getDocs(allWaitlistQuery);
        const position = allWaitlistDocs.size + 1;

        // Add to waitlist
        const waitlistEntry = {
            eventId,
            userId,
            userEmail,
            userName,
            addedAt: Timestamp.now(),
            priority: 50, // Default priority (1-100)
            notified: false,
            convertedToTicket: false,
            position,
        };

        const newEntry = await addDoc(waitlistRef, waitlistEntry);

        console.log(`✅ User ${userName} added to waitlist for event ${eventId} at position ${position}`);

        return res.status(200).json({
            success: true,
            entryId: newEntry.id,
            position,
            message: 'Successfully joined waitlist',
        });
    } catch (error: any) {
        console.error('Error joining waitlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to join waitlist' });
    }
}
