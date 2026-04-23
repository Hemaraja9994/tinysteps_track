import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Footprints, Shield, Activity, Eye, Ear, Brain, UserRound, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Login() {
  const { signIn, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [roleSelection, setRoleSelection] = useState<'google' | 'guest' | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<'google' | 'guest' | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoadingMethod('google');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        navigate('/');
      } else {
        setRoleSelection('google');
      }
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Google login failed', {
        description: 'Use guest access if Google sign-in is blocked on this device or domain.',
      });
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleGuestLogin = async () => {
    setRoleSelection('guest');
  };

  const selectRole = async (role: any) => {
    if (roleSelection === 'guest') {
      setLoadingMethod('guest');
      try {
        await signInAsGuest(role);
      } catch (error) {
        console.error('Guest login failed', error);
        toast.error('Guest access failed');
        setLoadingMethod(null);
        return;
      }
      setLoadingMethod(null);
    } else {
      await signIn(role);
    }
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4 transition-colors duration-500 dark:from-slate-900 dark:to-slate-950">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="overflow-hidden border-none bg-card shadow-2xl">
          <div className="h-2 bg-indigo-500" />
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
              <Footprints className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-3xl font-black tracking-tight text-foreground">
              TinySteps
            </CardTitle>
            <CardDescription className="text-lg font-medium text-muted-foreground">
              Comprehensive Preterm Follow-up
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {!roleSelection ? (
              <div className="space-y-4">
                <Button
                  onClick={handleGuestLogin}
                  className="h-14 w-full justify-center gap-3 rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                >
                  <UserRound className="h-5 w-5" />
                  {loadingMethod === 'guest' ? 'Opening guest access...' : 'Continue as Guest'}
                </Button>

                <Button
                  onClick={handleGoogleLogin}
                  className="h-14 w-full justify-center gap-3 rounded-2xl border border-border bg-background text-lg font-bold text-foreground shadow-sm transition-all hover:bg-muted"
                  variant="outline"
                >
                  <Chrome className="h-5 w-5" />
                  {loadingMethod === 'google' ? 'Connecting...' : 'Continue with Google'}
                </Button>

                <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                  Guest access works without Google account setup
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-foreground">
                  Select your primary role{roleSelection === 'guest' ? ' for guest access' : ''}:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <RoleButton icon={<Shield className="h-5 w-5" />} label="Parent" onClick={() => selectRole('parent')} />
                  <RoleButton icon={<Activity className="h-5 w-5" />} label="Neonatologist" onClick={() => selectRole('neonatologist')} />
                  <RoleButton icon={<Ear className="h-5 w-5" />} label="Audiologist" onClick={() => selectRole('audiologist')} />
                  <RoleButton icon={<Activity className="h-5 w-5" />} label="Specialist" onClick={() => selectRole('neonatologist')} />
                  <RoleButton icon={<Eye className="h-5 w-5" />} label="Ophthalmologist" onClick={() => selectRole('ophthalmologist')} />
                  <RoleButton icon={<Brain className="h-5 w-5" />} label="Psychiatrist" onClick={() => selectRole('psychiatrist')} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function RoleButton({ icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="flex h-24 flex-col gap-2 rounded-2xl border-border bg-background shadow-sm transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400"
      onClick={onClick}
    >
      <div className="text-indigo-500 dark:text-indigo-400">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Button>
  );
}
