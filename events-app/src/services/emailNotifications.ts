import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Email notification service for calling Cloud Functions
 */

interface WelcomeEmailData {
    userName: string;
    userEmail: string;
}

interface PasswordResetEmailData {
    userName: string;
    userEmail: string;
    resetLink: string;
}

interface EventRegistrationEmailData {
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventImageUrl?: string;
    ticketStatus: string;
}

interface EventCancellationEmailData {
    eventId: string;
    eventTitle: string;
    cancellationReason?: string;
}

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<void> => {
    try {
        const sendWelcomeEmailFn = httpsCallable(functions, 'sendWelcomeEmail');
        await sendWelcomeEmailFn(data);
        console.log('Welcome email sent successfully');
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw error - email sending failure shouldn't block user flow
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (data: PasswordResetEmailData): Promise<void> => {
    try {
        const sendPasswordResetEmailFn = httpsCallable(functions, 'sendPasswordResetEmail');
        await sendPasswordResetEmailFn(data);
        console.log('Password reset email sent successfully');
    } catch (error) {
        console.error('Error sending password reset email:', error);
        // Don't throw error - the Firebase Auth reset email will still work as fallback
    }
};

/**
 * Send event registration confirmation email
 */
export const sendEventRegistrationEmail = async (data: EventRegistrationEmailData): Promise<void> => {
    try {
        const sendEventRegistrationEmailFn = httpsCallable(functions, 'sendEventRegistrationEmail');
        await sendEventRegistrationEmailFn(data);
        console.log('Event registration email sent successfully');
    } catch (error) {
        console.error('Error sending event registration email:', error);
        // Don't throw error - registration is complete even if email fails
    }
};

/**
 * Send event cancellation email to all attendees
 * (Admin/Host function only)
 */
export const sendEventCancellationEmail = async (data: EventCancellationEmailData): Promise<void> => {
    try {
        const sendEventCancellationEmailFn = httpsCallable(functions, 'sendEventCancellationEmail');
        await sendEventCancellationEmailFn(data);
        console.log('Event cancellation emails sent successfully');
    } catch (error) {
        console.error('Error sending event cancellation emails:', error);
        throw error; // Throw for admin operations
    }
};

/**
 * Helper function to format date for emails
 */
export const formatEventDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Helper function to format time for emails
 */
export const formatEventTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};
