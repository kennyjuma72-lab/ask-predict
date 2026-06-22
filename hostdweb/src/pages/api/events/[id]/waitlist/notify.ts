import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { sendEmail } from '../../../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { count = 1 } = req.body; // Number of spots available

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        // Get event details
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const eventData = eventDoc.data();

        // Get waitlist entries, ordered by priority (desc) then addedAt (asc)
        const waitlistRef = collection(db, 'waitlist');
        const waitlistQuery = query(
            waitlistRef,
            where('eventId', '==', eventId),
            where('notified', '==', false),
            where('convertedToTicket', '==', false)
        );

        const waitlistDocs = await getDocs(waitlistQuery);

        // Sort by priority (higher first) and addedAt (earlier first)
        const sortedEntries = waitlistDocs.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return a.addedAt.seconds - b.addedAt.seconds;
            })
            .slice(0, count);

        if (sortedEntries.length === 0) {
            return res.status(200).json({
                success: true,
                notified: 0,
                message: 'No one on waitlist to notify',
            });
        }

        // Notify each person
        const notificationPromises = sortedEntries.map(async (entry: any) => {
            try {
                // Update entry to mark as notified
                await updateDoc(doc(db, 'waitlist', entry.id), {
                    notified: true,
                    notifiedAt: Timestamp.now(),
                });

                // Send email notification
                const claimUrl = `${process.env.APP_URL || 'http://localhost:3000'}/events/${eventId}/waitlist/claim?entryId=${entry.id}`;

                await sendEmail({
                    to: entry.userEmail,
                    subject: `🎉 Spot Available: ${eventData.title}`,
                    body: `Hi ${entry.userName},\n\nGood news! A spot just opened up for ${eventData.title}.\n\nClaim your spot now: ${claimUrl}\n\nThis link expires in 24 hours.\n\nBest regards,\nHostdweb Team`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">🎉 Spot Available!</h2>
              <p>Hi ${entry.userName},</p>
              <p>Good news! A spot just opened up for <strong>${eventData.title}</strong>.</p>
              <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Claim Your Spot Now
              </a>
              <p style="color: #ef4444; font-size: 14px;"><strong>⏰ This link expires in 24 hours.</strong></p>
              <p>Best regards,<br>Hostdweb Team</p>
            </div>
          `,
                });

                console.log(`✅ Notified ${entry.userName} about available spot`);
                return { success: true, email: entry.userEmail };
            } catch (error) {
                console.error(`Failed to notify ${entry.userEmail}:`, error);
                return { success: false, email: entry.userEmail, error };
            }
        });

        const results = await Promise.all(notificationPromises);
        const successCount = results.filter(r => r.success).length;

        return res.status(200).json({
            success: true,
            notified: successCount,
            total: sortedEntries.length,
            results,
        });
    } catch (error: any) {
        console.error('Error notifying waitlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to notify waitlist' });
    }
}
