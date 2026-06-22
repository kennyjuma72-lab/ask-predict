/**
 * Wait list Service
 * Handles joining/leaving waitlists and checking status
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

export interface WaitlistEntry {
    id: string;
    eventId: string;
    userId: string;
    userEmail: string;
    userName: string;
    joinedAt: Timestamp;
    notified: boolean;
    status: 'waiting' | 'notified' | 'converted';
}

/**
 * Join event waitlist
 */
export const joinWaitlist = async (
    eventId: string,
    userId: string,
    userEmail: string,
    userName: string
): Promise<WaitlistEntry> => {
    try {
        // Check if already on waitlist
        const existing = await checkWaitlistStatus(eventId, userId);
        if (existing) {
            throw new Error('Already on waitlist');
        }

        const waitlistData = {
            eventId,
            userId,
            userEmail,
            userName,
            joinedAt: Timestamp.now(),
            notified: false,
            status: 'waiting' as const,
        };

        const docRef = await addDoc(collection(db, 'waitlist'), waitlistData);

        return {
            id: docRef.id,
            ...waitlistData,
        };
    } catch (error) {
        console.error('Error joining waitlist:', error);
        throw error;
    }
};

/**
 * Leave waitlist
 */
export const leaveWaitlist = async (
    eventId: string,
    userId: string
): Promise<void> => {
    try {
        const q = query(
            collection(db, 'waitlist'),
            where('eventId', '==', eventId),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docRef = doc(db, 'waitlist', snapshot.docs[0].id);
            await deleteDoc(docRef);
        }
    } catch (error) {
        console.error('Error leaving waitlist:', error);
        throw error;
    }
};

/**
 * Check if user is on waitlist
 */
export const checkWaitlistStatus = async (
    eventId: string,
    userId: string
): Promise<WaitlistEntry | null> => {
    try {
        const q = query(
            collection(db, 'waitlist'),
            where('eventId', '==', eventId),
            where('userId', '==', userId),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as WaitlistEntry;
    } catch (error) {
        console.error('Error checking waitlist status:', error);
        return null;
    }
};

/**
 * Get user's position in waitlist
 */
export const getWaitlistPosition = async (
    eventId: string,
    userId: string
): Promise<number> => {
    try {
        // Get all waitlist entries for event, ordered by join time
        const q = query(
            collection(db, 'waitlist'),
            where('eventId', '==', eventId),
            orderBy('joinedAt', 'asc')
        );

        const snapshot = await getDocs(q);

        let position = -1;
        snapshot.docs.forEach((doc, index) => {
            if (doc.data().userId === userId) {
                position = index + 1; // 1-indexed
            }
        });

        return position;
    } catch (error) {
        console.error('Error getting waitlist position:', error);
        return -1;
    }
};

/**
 * Get waitlist count for event
 */
export const getWaitlistCount = async (eventId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, 'waitlist'),
            where('eventId', '==', eventId)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting waitlist count:', error);
        return 0;
    }
};
