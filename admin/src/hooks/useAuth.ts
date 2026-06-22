import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
// Remove this line if present:
// import { setUserContext, trackError } from '../utils/errorTracking';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'attendee' | 'host' | 'admin';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj = {
              id: firebaseUser.uid,
              name: userData?.name,
              email: userData?.email,
              role: userData?.role,
            };
            setUser(userObj);
            // removed: setUserContext(userObj);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // replaced trackError(error as Error, { context: 'useAuth', operation: 'fetchUserData' });
        }
      } else {
        setUser(null);
        // removed: setUserContext(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('useAuth signIn error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData = {
        name: name || email.split('@')[0], // Use provided name or email prefix
        email: email,
        role: 'admin', // Set as admin for now
        createdAt: new Date(),
        isSuspended: false,
      };

      await setDoc(doc(db, 'users', user.uid), userData);
    } catch (error) {
      console.error('useAuth signUp error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('useAuth signOut error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
  };
}
