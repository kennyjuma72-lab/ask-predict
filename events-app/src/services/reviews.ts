/**
 * Review Service
 * Handles event reviews and ratings
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    Timestamp,
    orderBy,
    limit,
    increment,
    getDoc,
} from 'firebase/firestore';

export interface EventReview {
    id: string;
    eventId: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    rating: number; // 1-5
    review: string;
    createdAt: Timestamp;
    helpful: number;
    flagged: boolean;
    verified: boolean; // User attended event
}

/**
 * Submit event review
 */
export const submitReview = async (
    eventId: string,
    userId: string,
    userName: string,
    userPhotoURL: string | undefined,
    rating: number,
    reviewText: string
): Promise<EventReview> => {
    try {
        // Check if user already reviewed this event
        const existing = await getUserReview(eventId, userId);
        if (existing) {
            throw new Error('You have already reviewed this event');
        }

        // Check if user attended the event (verification)
        const verified = await checkEventAttendance(eventId, userId);

        const reviewData = {
            eventId,
            userId,
            userName,
            userPhotoURL,
            rating,
            review: reviewText,
            createdAt: Timestamp.now(),
            helpful: 0,
            flagged: false,
            verified,
        };

        const docRef = await addDoc(collection(db, 'eventReviews'), reviewData);

        // Update event rating statistics
        await updateEventRating(eventId, rating);

        return {
            id: docRef.id,
            ...reviewData,
        };
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
};

/**
 * Get all reviews for an event
 */
export const getEventReviews = async (
    eventId: string,
    sortBy: 'recent' | 'helpful' | 'rating' = 'recent'
): Promise<EventReview[]> => {
    try {
        let q;

        if (sortBy === 'recent') {
            q = query(
                collection(db, 'eventReviews'),
                where('eventId', '==', eventId),
                where('flagged', '==', false),
                orderBy('createdAt', 'desc')
            );
        } else if (sortBy === 'helpful') {
            q = query(
                collection(db, 'eventReviews'),
                where('eventId', '==', eventId),
                where('flagged', '==', false),
                orderBy('helpful', 'desc')
            );
        } else {
            q = query(
                collection(db, 'eventReviews'),
                where('eventId', '==', eventId),
                where('flagged', '==', false),
                orderBy('rating', 'desc')
            );
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as EventReview));
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
};

/**
 * Get user's review for an event
 */
export const getUserReview = async (
    eventId: string,
    userId: string
): Promise<EventReview | null> => {
    try {
        const q = query(
            collection(db, 'eventReviews'),
            where('eventId', '==', eventId),
            where('userId', '==', userId),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as EventReview;
    } catch (error) {
        console.error('Error fetching user review:', error);
        return null;
    }
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
    try {
        const reviewRef = doc(db, 'eventReviews', reviewId);
        await updateDoc(reviewRef, {
            helpful: increment(1),
        });
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        throw error;
    }
};

/**
 * Flag review as inappropriate
 */
export const flagReview = async (reviewId: string): Promise<void> => {
    try {
        const reviewRef = doc(db, 'eventReviews', reviewId);
        await updateDoc(reviewRef, {
            flagged: true,
        });
    } catch (error) {
        console.error('Error flagging review:', error);
        throw error;
    }
};

/**
 * Update event rating statistics
 */
const updateEventRating = async (eventId: string, newRating: number): Promise<void> => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) return;

        const currentData = eventDoc.data();
        const currentTotal = currentData.totalReviews || 0;
        const currentAverage = currentData.averageRating || 0;
        const ratingDist = currentData.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        // Calculate new average
        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + newRating) / newTotal;

        // Update distribution
        ratingDist[newRating] = (ratingDist[newRating] || 0) + 1;

        await updateDoc(eventRef, {
            averageRating: newAverage,
            totalReviews: newTotal,
            ratingDistribution: ratingDist,
        });
    } catch (error) {
        console.error('Error updating event rating:', error);
    }
};

/**
 * Check if user attended the event
 */
const checkEventAttendance = async (eventId: string, userId: string): Promise<boolean> => {
    try {
        const q = query(
            collection(db, 'tickets'),
            where('eventId', '==', eventId),
            where('userId', '==', userId),
            where('status', '==', 'confirmed'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking attendance:', error);
        return false;
    }
};

/**
 * Get review statistics for event
 */
export const getReviewStats = async (eventId: string) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const data = eventDoc.data();
        return {
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
            ratingDistribution: data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    } catch (error) {
        console.error('Error fetching review stats:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
};
