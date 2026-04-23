import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  role: 'parent' | 'neonatologist' | 'audiologist' | 'slp' | 'ot' | 'ophthalmologist' | 'psychiatrist';
  displayName?: string;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (role: UserProfile['role']) => Promise<void>;
  signInAsGuest: (role?: UserProfile['role']) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function upsertProfile(user: User, role: UserProfile['role'] = 'parent') {
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    role,
    displayName: user.displayName || (user.isAnonymous ? 'Guest User' : ''),
    isAnonymous: user.isAnonymous,
  };

  await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          const created = await upsertProfile(u, 'parent');
          setProfile(created);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });
  }, []);

  const signIn = async (role: UserProfile['role']) => {
    if (!auth.currentUser) return;
    const profile = await upsertProfile(auth.currentUser, role);
    setProfile(profile);
  };

  const signInAsGuest = async (role: UserProfile['role'] = 'parent') => {
    const result = await signInAnonymously(auth);
    const profile = await upsertProfile(result.user, role);
    setProfile(profile);
  };

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
