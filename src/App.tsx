import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BabyDetail from './pages/BabyDetail';
import Navbar from './components/layout/Navbar';
import AppCredits from './components/layout/AppCredits';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="hero-panel rounded-[2rem] px-8 py-10 text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-indigo-500 dark:text-indigo-300">TinySteps</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">Preparing follow-up workspace</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Loading infant care records and clinical modules.</p>
        </div>
      </div>
    );
  }
  if (!user || !profile) return <Navigate to="/login" />;
  
  return (
    <div className="app-shell min-h-screen bg-background transition-colors duration-300">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {children}
        <AppCredits />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/baby/:id" 
              element={
                <ProtectedRoute>
                  <BabyDetail />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
