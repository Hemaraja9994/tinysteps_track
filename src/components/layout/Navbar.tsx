import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { LogOut, Footprints } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/65 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-110">
            <Footprints className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="hidden text-xl font-extrabold leading-none tracking-tight text-foreground sm:block">TinySteps</span>
            <span className="hidden text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300 sm:block">
              Preterm Follow-up System
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />

          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold leading-tight text-foreground">{profile?.displayName || profile?.email}</div>
              <Badge variant="outline" className="h-5 border-indigo-200 bg-indigo-50/90 py-0 text-[10px] font-black uppercase text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
                {profile?.role}
              </Badge>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-gradient-to-br from-slate-100 to-white text-sm font-black text-slate-700 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100">
              TS
            </div>
          </div>

          <div className="ml-2 hidden h-8 w-px bg-border sm:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl text-xs font-bold uppercase text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden tracking-wider lg:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
