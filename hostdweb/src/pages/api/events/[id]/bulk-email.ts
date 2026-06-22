import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { attendeeIds, subject, body } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return res.status(400).json({ error: 'Attendee IDs are required' });
        }

        if (!subject || !body) {
            return res.status(400).json({ error: 'Subject and body are required' });
        }

        // Fetch event details
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const eventData = eventDoc.data();

        // Fetch attendees
        const attendeesPromises = attendeeIds.map((id: string) =>
            getDoc(doc(db, 'tickets', id))
        );
        const attendeeDocs = await Promise.all(attendeesPromises);

        const emailPromises = attendeeDocs.map(async (ticketDoc) => {
            if (!ticketDoc.exists()) return null;

            const attendee = ticketDoc.data();

            // Replace variables in subject and body
            const personalizedSubject = subject
                .replace(/{{name}}/g, attendee.attendeeName || '')
                .replace(/{{event}}/g, eventData?.title || '')
                .replace(/{{date}}/g, eventData?.startAt ? new Date(eventData.startAt.seconds * 1000).toLocaleDateString() : '');

            const personalizedBody = body
                .replace(/{{name}}/g, attendee.attendeeName || '')
                .replace(/{{event}}/g, eventData?.title || '')
                .replace(/{{date}}/g, eventData?.startAt ? new Date(eventData.startAt.seconds * 1000).toLocaleDateString() : '');

            try {
                // TODO: Integrate email service (SendGrid, Nodemailer, etc.)
                console.log(`========== EMAIL PREVIEW ==========`);
                console.log(`To: ${attendee.attendeeEmail}`);
                console.log(`Subject: ${personalizedSubject}`);
                console.log(`Body: ${personalizedBody}`);
                console.log(`===================================`);
                return { success: true, email: attendee.attendeeEmail };
            } catch (error) {
                console.error(`Failed to send email to ${attendee.attendeeEmail}:`, error);
                return { success: false, email: attendee.attendeeEmail, error };
            }
        });

        const results = await Promise.all(emailPromises);
        const successCount = results.filter(r => r?.success).length;

        return res.status(200).json({
            success: true,
            total: attendeeIds.length,
            sent: successCount,
            failed: attendeeIds.length - successCount,
            results,
        });
    } catch (error: any) {
        console.error('Error sending bulk emails:', error);
        return res.status(500).json({ error: error.message || 'Failed to send emails' });
    }
}
