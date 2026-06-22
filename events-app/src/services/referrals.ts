import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
    doc,
    updateDoc,
    increment,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Referral {
    id: string;
    referrerId: string;
    referredUserId: string;
    code: string;
    status: 'pending' | 'completed';
    reward: number;
    createdAt: Timestamp;
}

/**
 * Generate a unique referral code for a user
 */
export const generateReferralCode = (userId: string): string => {
    // Generate code from userId and random string
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const userPart = userId.substring(0, 4).toUpperCase();
    return `${userPart}${random}`;
};

/**
 * Create referral code for user
 */
export const createReferralCode = async (userId: string): Promise<string> => {
    try {
        const code = generateReferralCode(userId);

        // Store in user document
        await updateDoc(doc(db, 'users', userId), {
            referralCode: code,
            referralCount: 0,
        });

        return code;
    } catch (error) {
        console.error('Error creating referral code:', error);
        throw error;
    }
};

/**
 * Apply referral code when user signs up
 */
export const applyReferralCode = async (
    newUserId: string,
    referralCode: string
): Promise<boolean> => {
    try {
        // Find referrer by code
        const usersQuery = query(
            collection(db, 'users'),
            where('referralCode', '==', referralCode)
        );

        const snapshot = await getDocs(usersQuery);

        if (snapshot.empty) {
            console.log('Invalid referral code');
            return false;
        }

        const referrerId = snapshot.docs[0].id;

        // Create referral record
        await addDoc(collection(db, 'referrals'), {
            referrerId,
            referredUserId: newUserId,
            code: referralCode,
            status: 'completed',
            reward: 100, // 100 points reward
            createdAt: serverTimestamp(),
        });

        // Update referrer's count
        await updateDoc(doc(db, 'users', referrerId), {
            referralCount: increment(1),
            referralPoints: increment(100),
        });

        // Give new user welcome bonus
        await updateDoc(doc(db, 'users', newUserId), {
            referralPoints: 50, // Welcome bonus
            referredBy: referrerId,
        });

        return true;
    } catch (error) {
        console.error('Error applying referral code:', error);
        return false;
    }
};

/**
 * Get user's referral stats
 */
export const getReferralStats = async (userId: string) => {
    try {
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('referrerId', '==', userId)
        );

        const snapshot = await getDocs(referralsQuery);

        const totalReferrals = snapshot.size;
        const totalRewards = snapshot.docs.reduce((sum, doc) => sum + doc.data().reward, 0);

        return {
            totalReferrals,
            totalRewards,
            referrals: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        };
    } catch (error) {
        console.error('Error getting referral stats:', error);
        return { totalReferrals: 0, totalRewards: 0, referrals: [] };
    }
};

/**
 * Get referral leaderboard
 */
export const getReferralLeaderboard = async (limit: number = 10) => {
    try {
        // Note: This would ideally use orderBy('referralCount', 'desc')
        // but that requires a composite index
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);

        const users = snapshot.docs
            .map(doc => ({
                id: doc.id,
                name: doc.data().name,
                referralCount: doc.data().referralCount || 0,
                referralPoints: doc.data().referralPoints || 0,
            }))
            .filter(user => user.referralCount > 0)
            .sort((a, b) => b.referralCount - a.referralCount)
            .slice(0, limit);

        return users;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
};
