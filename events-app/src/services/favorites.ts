import {
    collection,
    addDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Favorite {
    id: string;
    userId: string;
    eventId: string;
    createdAt: Timestamp;
}

/**
 * Add an event to favorites
 */
export const addToFavorites = async (
    userId: string,
    eventId: string
): Promise<string | null> => {
    try {
        // Check if already favorited
        const existing = await isFavorited(userId, eventId);
        if (existing) {
            console.log('Event already favorited');
            return existing;
        }

        const docRef = await addDoc(collection(db, 'favorites'), {
            userId,
            eventId,
            createdAt: serverTimestamp(),
        });

        console.log('Added to favorites:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding to favorites:', error);
        throw error;
    }
};

/**
 * Remove an event from favorites
 */
export const removeFromFavorites = async (
    userId: string,
    eventId: string
): Promise<void> => {
    try {
        const q = query(
            collection(db, 'favorites'),
            where('userId', '==', userId),
            where('eventId', '==', eventId)
        );

        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map((document) =>
            deleteDoc(doc(db, 'favorites', document.id))
        );

        await Promise.all(deletePromises);
        console.log('Removed from favorites');
    } catch (error) {
        console.error('Error removing from favorites:', error);
        throw error;
    }
};

/**
 * Check if an event is favorited by user
 * Returns the favorite ID if favorited, null otherwise
 */
export const isFavorited = async (
    userId: string,
    eventId: string
): Promise<string | null> => {
    try {
        const q = query(
            collection(db, 'favorites'),
            where('userId', '==', userId),
            where('eventId', '==', eventId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].id;
    } catch (error) {
        console.error('Error checking if favorited:', error);
        return null;
    }
};

/**
 * Get all favorite event IDs for a user
 */
export const getFavoriteEventIds = async (userId: string): Promise<string[]> => {
    try {
        const q = query(
            collection(db, 'favorites'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => doc.data().eventId);
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
};

/**
 * Subscribe to user's favorites in real-time
 */
export const subscribeToFavorites = (
    userId: string,
    callback: (eventIds: string[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const eventIds = snapshot.docs.map((doc) => doc.data().eventId);
            callback(eventIds);
        },
        (error) => {
            // Silently handle permission errors (rules not deployed yet)
            if (error.code !== 'permission-denied') {
                console.error('Error in favorites subscription:', error);
            }
            onError?.(error as Error);
        }
    );

    return unsubscribe;
};

/**
 * Toggle favorite status
 * Returns the new state (true if now favorited, false if removed)
 */
export const toggleFavorite = async (
    userId: string,
    eventId: string
): Promise<boolean> => {
    try {
        const favoriteId = await isFavorited(userId, eventId);

        if (favoriteId) {
            await removeFromFavorites(userId, eventId);
            return false;
        } else {
            await addToFavorites(userId, eventId);
            return true;
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error;
    }
};
