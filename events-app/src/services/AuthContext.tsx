import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db as firebaseDb, checkConnection, retryConnection } from './firebase';
import { User } from '../types';
import { setUserContext, trackError } from '../utils/errorTracking';
import { sendWelcomeEmail as sendWelcomeEmailNotification } from './emailNotifications';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = firebaseAuth;
  const db = firebaseDb;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Try to fetch user data from Firestore first
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || '',
              email: userData.email || firebaseUser.email || '',
              photoURL: userData.photoURL || firebaseUser.photoURL,
              role: userData.role || 'attendee',
              stripeCustomerId: userData.stripeCustomerId,
              createdAt: userData.createdAt?.toDate() || new Date(),
              isSuspended: userData.isSuspended || false,
              hostApplication: userData.hostApplication,
            };
            setUser(userObj);
            setUserContext({
              id: userObj.id,
              email: userObj.email,
              name: userObj.name,
              role: userObj.role,
            });
          } else {
            // Create user document if it doesn't exist
            const newUser: Omit<User, 'id'> = {
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: 'attendee',
              createdAt: new Date(),
              isSuspended: false,
              ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
            };

            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              console.log('User document created successfully');
            } catch (createError) {
              console.warn('Failed to create user document:', createError);
            }

            const newUserObj = {
              id: firebaseUser.uid,
              ...newUser,
            };
            setUser(newUserObj);
            setUserContext({
              id: newUserObj.id,
              email: newUserObj.email,
              name: newUserObj.name,
              role: newUserObj.role,
            });
          }
        } catch (firestoreError) {
          console.warn('Failed to fetch user data from Firestore:', firestoreError);
          trackError(firestoreError as Error, { context: 'AuthContext', operation: 'fetchUserData' });
          // Fallback to Firebase Auth data only
          const fallbackUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'attendee' as const,
            createdAt: new Date(),
            isSuspended: false,
            ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
          };
          setUser(fallbackUser);
          setUserContext({
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            role: fallbackUser.role,
          });

          // Try to create user document in background (non-blocking)
          setTimeout(async () => {
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), fallbackUser);
              console.log('User document created in background');
            } catch (bgError) {
              console.log('Background user document creation failed:', bgError);
            }
          }, 2000);
        }
      } else {
        setUser(null);
        setUserContext(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'signIn', email });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName: name });

      // Create user document in Firestore with robust error handling
      try {
        const userData: Omit<User, 'id'> = {
          name,
          email,
          role: 'attendee',
          createdAt: new Date(),
          isSuspended: false,
          ...(newUser.photoURL && { photoURL: newUser.photoURL }),
        };

        await setDoc(doc(db, 'users', newUser.uid), userData);
        console.log('User document created successfully');

        // Send welcome email (non-blocking)
        sendWelcomeEmailNotification({
          userName: name,
          userEmail: email,
        }).catch(emailError => {
          console.log('Welcome email could not be sent:', emailError);
          // Don't block signup flow if email fails
        });
      } catch (firestoreError) {
        console.warn('Failed to create user document in Firestore:', firestoreError);
        trackError(firestoreError as Error, { context: 'AuthContext', operation: 'signUp', email });
        // Don't throw error - user is still authenticated via Firebase Auth
        // The document will be created when they sign in next time
      }
    } catch (error) {
      console.error('Sign up error:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'signUp', email });
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUserContext(null);
    } catch (error) {
      console.error('Sign out error:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'signOut' });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // Update Firestore document
      try {
        await updateDoc(doc(db, 'users', user.id), updates);
        console.log('User profile updated in Firestore');
      } catch (firestoreError) {
        console.warn('Failed to update user profile in Firestore:', firestoreError);
        // Continue with local update even if Firestore fails
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          id: firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || '',
          email: userData.email || firebaseUser.email || '',
          photoURL: userData.photoURL || firebaseUser.photoURL,
          role: userData.role || 'attendee',
          stripeCustomerId: userData.stripeCustomerId,
          createdAt: userData.createdAt?.toDate() || new Date(),
          isSuspended: userData.isSuspended || false,
          hostApplication: userData.hostApplication,
        });
        console.log('User data refreshed from Firestore');
      }
    } catch (error) {
      console.warn('Error refreshing user data:', error);
      // Don't throw error - user can still use the app with current data
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
    resetPassword,
    updateUserProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
