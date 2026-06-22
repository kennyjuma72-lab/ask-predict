'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  userProfile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const profile = { 
              id: user.uid, 
              name: userData.name || user.displayName || user.email?.split('@')[0],
              email: userData.email || user.email,
              role: userData.role || 'attendee',
              ...userData
            };
            setUserProfile(profile);
            logger.setUser(profile.id, profile.email ?? undefined, profile.role);
            logger.logAuthEvent('user_profile_loaded', { userId: profile.id, role: profile.role });
          } else {
            // Create user profile if it doesn't exist
            const profile = { 
              id: user.uid, 
              name: user.displayName || user.email?.split('@')[0],
              email: user.email,
              role: 'attendee' // Default role
            };
            setUserProfile(profile);
            logger.setUser(profile.id, profile.email ?? undefined, profile.role);
            logger.logAuthEvent('user_profile_loaded', { userId: profile.id, role: profile.role });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          logger.error('Failed to fetch user profile', { 
            context: 'AuthContext', 
            operation: 'fetchUserProfile',
            error: error as Error 
          });
          // Set basic profile even if Firestore fails
          const profile = { 
            id: user.uid, 
            name: user.displayName || user.email?.split('@')[0],
            email: user.email,
            role: 'attendee'
          };
          setUserProfile(profile);
          logger.setUser(profile.id, profile.email ?? undefined, profile.role);
          logger.logAuthEvent('user_profile_created', { userId: profile.id });
        }
      } else {
        setUserProfile(null);
        logger.clearUser();
        logger.logAuthEvent('user_logged_out');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      logger.logAuthEvent('sign_in_attempt', { email });
      await signInWithEmailAndPassword(auth, email, password);
      logger.logAuthEvent('sign_in_success', { email });
    } catch (error: any) {
      logger.error('Sign in failed', { 
        context: 'AuthContext', 
        operation: 'signIn', 
        metadata: { email },
        error: error 
      });
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      logger.logAuthEvent('sign_up_attempt', { email });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile = {
        name: name || email.split('@')[0],
        email: email,
        role: 'attendee',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      logger.logAuthEvent('sign_up_success', { email, userId: user.uid });
    } catch (error: any) {
      logger.error('Sign up failed', { 
        context: 'AuthContext', 
        operation: 'signUp', 
        metadata: { email },
        error: error 
      });
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      logger.logAuthEvent('google_sign_in_attempt');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      logger.logAuthEvent('google_sign_in_success');
    } catch (error: any) {
      logger.error('Google sign in failed', { 
        context: 'AuthContext', 
        operation: 'signInWithGoogle',
        error: error 
      });
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      logger.logAuthEvent('logout_attempt', { userId: userProfile?.id });
      await signOut(auth);
      logger.clearUser();
      logger.logAuthEvent('logout_success');
    } catch (error: any) {
      logger.error('Logout failed', { 
        context: 'AuthContext', 
        operation: 'logout',
        error: error 
      });
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
