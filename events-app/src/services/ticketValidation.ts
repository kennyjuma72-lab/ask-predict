import { collection, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Ticket } from '../types';
import { parseTicketQRData, isQRTimestampValid } from './qrCode';

export interface TicketValidationResult {
    valid: boolean;
    ticket?: Ticket & { id: string };
    message: string;
    alreadyCheckedIn?: boolean;
}

/**
 * Validate a scanned QR code ticket
 * @param qrDataString - The scanned QR code string
 * @param eventId - The ID of the event to validate against
 * @returns Validation result with ticket data if valid
 */
export const validateTicket = async (
    qrDataString: string,
    eventId: string
): Promise<TicketValidationResult> => {
    try {
        // Parse QR code data
        const qrData = parseTicketQRData(qrDataString);

        if (!qrData) {
            return {
                valid: false,
                message: '❌ Invalid QR code format',
            };
        }

        // Verify QR timestamp (prevent very old QR codes)
        if (!isQRTimestampValid(qrData.timestamp, 168)) { // 7 days
            return {
                valid: false,
                message: '⚠️ QR code has expired. Please generate a new one.',
            };
        }

        // Verify event matches
        if (qrData.eventId !== eventId) {
            return {
                valid: false,
                message: '❌ This ticket is for a different event',
            };
        }

        // Fetch ticket from Firestore
        const ticketDoc = await getDoc(doc(db, 'tickets', qrData.ticketId));

        if (!ticketDoc.exists()) {
            return {
                valid: false,
                message: '❌ Ticket not found in database',
            };
        }

        const ticketData = ticketDoc.data();
        const ticket: Ticket & { id: string } = {
            id: ticketDoc.id,
            ...ticketData,
            createdAt: ticketData.createdAt?.toDate() || new Date(),
        } as Ticket & { id: string };

        // Verify ticket belongs to the user in QR code
        if (ticket.userId !== qrData.userId) {
            return {
                valid: false,
                message: '❌ Ticket user mismatch. Possible fraud.',
            };
        }

        // Check ticket status
        if (ticket.status === 'cancelled') {
            return {
                valid: false,
                message: '❌ This ticket has been cancelled',
            };
        }

        if (ticket.status === 'refunded') {
            return {
                valid: false,
                message: '❌ This ticket has been refunded',
            };
        }

        if (ticket.status === 'pending') {
            return {
                valid: false,
                message: '⚠️ Ticket payment is pending. Not yet confirmed.',
            };
        }

        if (ticket.status !== 'confirmed') {
            return {
                valid: false,
                message: `❌ Ticket status: ${ticket.status}`,
            };
        }

        // Check if already checked in
        const alreadyCheckedIn = ticketData.checkInStatus === 'checked-in';

        if (alreadyCheckedIn) {
            const checkInTime = ticketData.checkInTime?.toDate();
            const timeStr = checkInTime
                ? checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'earlier';

            return {
                valid: true,
                ticket,
                alreadyCheckedIn: true,
                message: `✓ Already checked in at ${timeStr}`,
            };
        }

        // Valid ticket, ready for check-in
        return {
            valid: true,
            ticket,
            message: '✅ Valid ticket - Ready for check-in',
            alreadyCheckedIn: false,
        };
    } catch (error) {
        console.error('Error validating ticket:', error);
        return {
            valid: false,
            message: '❌ Error validating ticket. Please try again.',
        };
    }
};

/**
 * Check in an attendee by updating their ticket
 * @param ticketId - The ID of the ticket to check in
 * @returns Success boolean
 */
export const checkInAttendee = async (ticketId: string): Promise<boolean> => {
    try {
        await updateDoc(doc(db, 'tickets', ticketId), {
            checkInStatus: 'checked-in',
            checkInTime: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Error checking in attendee:', error);
        return false;
    }
};

/**
 * Undo check-in for an attendee
 * @param ticketId - The ID of the ticket to undo check-in
 * @returns Success boolean
 */
export const undoCheckIn = async (ticketId: string): Promise<boolean> => {
    try {
        await updateDoc(doc(db, 'tickets', ticketId), {
            checkInStatus: 'not-checked-in',
            checkInTime: null,
        });
        return true;
    } catch (error) {
        console.error('Error undoing check-in:', error);
        return false;
    }
};

/**
 * Get ticket details by ID
 * @param ticketId - The ID of the ticket
 * @returns Ticket data or null
 */
export const getTicketById = async (ticketId: string): Promise<(Ticket & { id: string }) | null> => {
    try {
        const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));

        if (!ticketDoc.exists()) {
            return null;
        }

        const ticketData = ticketDoc.data();
        return {
            id: ticketDoc.id,
            ...ticketData,
            createdAt: ticketData.createdAt?.toDate() || new Date(),
        } as Ticket & { id: string };
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return null;
    }
};
