/**
 * AI Recommendations Service
 * Generates personalized event recommendations based on user behavior
 */

import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    limit,
    Timestamp,
} from 'firebase/firestore';

export interface UserBehavior {
    userId: string;
    eventViews: { eventId: string; timestamp: Timestamp }[];
    favoriteEvents: string[];
    registeredEvents: string[];
    searchHistory: string[];
    categoryPreferences: { [category: string]: number };
    lastUpdated: Timestamp;
}

export interface Recommendation {
    eventId: string;
    score: number;
    reason: string; // "Similar to X" | "Popular in your area" | "Based on your interests"
}

/**
 * Track event view for recommendations
 */
export const trackEventView = async (
    userId: string,
    eventId: string
): Promise<void> => {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        const behaviorDoc = await getDoc(behaviorRef);

        if (behaviorDoc.exists()) {
            const currentData = behaviorDoc.data() as UserBehavior;
            currentData.eventViews.push({
                eventId,
                timestamp: Timestamp.now(),
            });

            // Keep only last 50 views
            if (currentData.eventViews.length > 50) {
                currentData.eventViews = currentData.eventViews.slice(-50);
            }

            currentData.lastUpdated = Timestamp.now();
            await setDoc(behaviorRef, currentData);
        } else {
            await setDoc(behaviorRef, {
                userId,
                eventViews: [{ eventId, timestamp: Timestamp.now() }],
                favoriteEvents: [],
                registeredEvents: [],
                searchHistory: [],
                categoryPreferences: {},
                lastUpdated: Timestamp.now(),
            });
        }
    } catch (error) {
        console.error('Error tracking event view:', error);
    }
};

/**
 * Track favorite event
 */
export const trackFavorite = async (
    userId: string,
    eventId: string,
    add: boolean
): Promise<void> => {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        const behaviorDoc = await getDoc(behaviorRef);

        if (behaviorDoc.exists()) {
            const currentData = behaviorDoc.data() as UserBehavior;

            if (add) {
                if (!currentData.favoriteEvents.includes(eventId)) {
                    currentData.favoriteEvents.push(eventId);
                }
            } else {
                currentData.favoriteEvents = currentData.favoriteEvents.filter(id => id !== eventId);
            }

            currentData.lastUpdated = Timestamp.now();
            await setDoc(behaviorRef, currentData);
        }
    } catch (error) {
        console.error('Error tracking favorite:', error);
    }
};

/**
 * Get personalized recommendations for user
 */
export const getRecommendations = async (
    userId: string
): Promise<Recommendation[]> => {
    try {
        // Check cache first
        const cacheRef = doc(db, 'recommendations', userId);
        const cacheDoc = await getDoc(cacheRef);

        if (cacheDoc.exists()) {
            const cacheData = cacheDoc.data();
            const cacheAge = Date.now() - cacheData.generatedAt.toMillis();

            // Use cache if less than 6 hours old
            if (cacheAge < 6 * 60 * 60 * 1000) {
                return cacheData.recommendations as Recommendation[];
            }
        }

        // Generate new recommendations
        const recommendations = await generateRecommendations(userId);

        // Cache the results
        await setDoc(cacheRef, {
            userId,
            recommendations,
            generatedAt: Timestamp.now(),
        });

        return recommendations;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

/**
 * Generate recommendations using hybrid approach
 */
const generateRecommendations = async (
    userId: string
): Promise<Recommendation[]> => {
    try {
        const behaviorDoc = await getDoc(doc(db, 'userBehavior', userId));

        if (!behaviorDoc.exists()) {
            // Return popular events for new users
            return await getPopularEvents();
        }

        const behavior = behaviorDoc.data() as UserBehavior;
        const recommendations: Recommendation[] = [];

        // 1. Content-based filtering (40%)
        const contentBased = await getContentBasedRecommendations(behavior);
        recommendations.push(...contentBased.map(r => ({ ...r, score: r.score * 0.4 })));

        // 2. Collaborative filtering (30%)
        const collaborative = await getCollaborativeRecommendations(behavior);
        recommendations.push(...collaborative.map(r => ({ ...r, score: r.score * 0.3 })));

        // 3. Popularity boost (30%)
        const popular = await getPopularEvents();
        recommendations.push(...popular.map(r => ({ ...r, score: r.score * 0.3 })));

        // Deduplicate and sort by score
        const uniqueRecs = deduplicateRecommendations(recommendations);
        return uniqueRecs.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
};

/**
 * Content-based recommendations
 */
const getContentBasedRecommendations = async (
    behavior: UserBehavior
): Promise<Recommendation[]> => {
    // Find events similar to ones user viewed/registered for
    const similarEvents: Recommendation[] = [];

    // Get user's preferred categories
    const topCategories = Object.entries(behavior.categoryPreferences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

    if (topCategories.length > 0) {
        const eventsQuery = query(
            collection(db, 'events'),
            where('category', 'in', topCategories),
            limit(5)
        );

        const snapshot = await getDocs(eventsQuery);
        snapshot.docs.forEach(doc => {
            similarEvents.push({
                eventId: doc.id,
                score: 0.8,
                reason: `Based on your interest in ${doc.data().category}`,
            });
        });
    }

    return similarEvents;
};

/**
 * Collaborative filtering recommendations
 */
const getCollaborativeRecommendations = async (
    behavior: UserBehavior
): Promise<Recommendation[]> => {
    // Find users with similar interests and recommend their favorites
    // Simplified version - in production, use proper matrix factorization
    return [];
};

/**
 * Get popular/trending events
 */
const getPopularEvents = async (): Promise<Recommendation[]> => {
    try {
        const eventsQuery = query(
            collection(db, 'events'),
            where('startAt', '>', Timestamp.now()),
            limit(5)
        );

        const snapshot = await getDocs(eventsQuery);
        return snapshot.docs.map(doc => ({
            eventId: doc.id,
            score: 0.7,
            reason: 'Popular event',
        }));
    } catch (error) {
        console.error('Error fetching popular events:', error);
        return [];
    }
};

/**
 * Deduplicate recommendations
 */
const deduplicateRecommendations = (
    recommendations: Recommendation[]
): Recommendation[] => {
    const seen = new Map<string, Recommendation>();

    recommendations.forEach(rec => {
        const existing = seen.get(rec.eventId);
        if (!existing || rec.score > existing.score) {
            seen.set(rec.eventId, rec);
        }
    });

    return Array.from(seen.values());
};
