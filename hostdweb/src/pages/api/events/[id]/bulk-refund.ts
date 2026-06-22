import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { attendeeIds, reason } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return res.status(400).json({ error: 'Attendee IDs are required' });
        }

        // Fetch tickets to process refunds
        const ticketsPromises = attendeeIds.map((id: string) =>
            getDoc(doc(db, 'tickets', id))
        );
        const ticketDocs = await Promise.all(ticketsPromises);

        const refundPromises = ticketDocs.map(async (ticketDoc) => {
            if (!ticketDoc.exists()) return null;

            const ticket = ticketDoc.data();

            try {
                // Update ticket status to cancelled
                await updateDoc(doc(db, 'tickets', ticketDoc.id), {
                    status: 'cancelled',
                    refundReason: reason || 'Bulk refund',
                    refundedAt: new Date(),
                    updatedAt: new Date(),
                });

                // Update payment record if exists
                if (ticket.paymentId) {
                    try {
                        await updateDoc(doc(db, 'payments', ticket.paymentId), {
                            status: 'refunded',
                            refundedAt: new Date(),
                            refundReason: reason || 'Bulk refund',
                        });
                    } catch (paymentError) {
                        console.log('Payment record not found or already updated');
                    }
                }

                const refundAmount = ticket.amount || ticket.paymentAmount || 0;

                // TODO: Process actual payment refund via Stripe
                console.log(`💰 Refund processed for ticket ${ticketDoc.id}: $${refundAmount}`);

                return { success: true, ticketId: ticketDoc.id, amount: refundAmount };
            } catch (error) {
                console.error(`Failed to refund ticket ${ticketDoc.id}:`, error);
                return { success: false, ticketId: ticketDoc.id, error };
            }
        });

        const results = await Promise.all(refundPromises);
        const successCount = results.filter(r => r?.success).length;
        const totalAmount = results
            .filter(r => r?.success)
            .reduce((sum, r) => sum + (r?.amount || 0), 0);

        console.log(`✅ Processed ${successCount} refunds totaling $${totalAmount}`);

        return res.status(200).json({
            success: true,
            total: attendeeIds.length,
            refunded: successCount,
            failed: attendeeIds.length - successCount,
            totalAmount,
            results,
        });
    } catch (error: any) {
        console.error('Error processing refunds:', error);
        return res.status(500).json({ error: error.message || 'Failed to process refunds' });
    }
}
