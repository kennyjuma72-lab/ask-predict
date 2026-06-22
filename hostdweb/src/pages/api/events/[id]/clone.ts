import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // FIXED: Use req.query.id instead of req.query.eventId
        // because the file path is [id]/clone.ts, not [eventId]/clone.ts
        const { id } = req.query;
        const eventId = id as string;
        const { newTitle, copyAttendees, editBeforePublish, publishImmediately } = req.body;

        console.log('Clone request:', { eventId, newTitle, copyAttendees, editBeforePublish, publishImmediately });

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!newTitle || typeof newTitle !== 'string') {
            return res.status(400).json({ error: 'New event title is required' });
        }

        // Fetch the original event
        console.log('Fetching event:', eventId);
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            console.error('Event not found:', eventId);
            return res.status(404).json({ error: 'Event not found' });
        }

        const originalEvent = eventDoc.data();
        console.log('Original event fetched:', originalEvent.title);

        // Create cloned event data
        const clonedEventData = {
            ...originalEvent,
            title: newTitle.trim(),
            // Reset date-related fields
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            // Status based on options
            status: editBeforePublish ? 'draft' : (publishImmediately ? 'published' : 'draft'),
            published: publishImmediately || false,
            // Clear analytics
            viewCount: 0,
            ticketsSold: 0,
            totalRevenue: 0,
            // Add clone metadata
            clonedFrom: eventId,
            clonedAt: Timestamp.now(),
            // Remove unique identifiers
            analytics: {},
            customization: originalEvent.customization || {},
        };

        console.log('Creating cloned event...');
        // Create the new event
        const newEventRef = await addDoc(collection(db, 'events'), clonedEventData);
        const newEventId = newEventRef.id;

        console.log(`✅ Event cloned successfully: ${eventId} → ${newEventId}`);

        return res.status(200).json({
            success: true,
            newEventId,
            message: editBeforePublish
                ? 'Event cloned as draft. You can edit it before publishing.'
                : 'Event cloned successfully',
        });
    } catch (error: any) {
        console.error('Error cloning event - Full error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            error: error.message || 'Failed to clone event',
            details: error.toString()
        });
    }
}
