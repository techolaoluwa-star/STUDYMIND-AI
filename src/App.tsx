import { useAuth } from "@/context/AuthContext";
import AuthPage from "@/components/auth/AuthPage";
import AppShell from "@/components/layout/AppShell";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <div className="flex items-center gap-3 text-parchment-200/70">
          <span className="h-2 w-2 animate-blink rounded-full bg-amber-400" />
          <span className="h-2 w-2 animate-blink rounded-full bg-amber-400 [animation-delay:0.15s]" />
          <span className="h-2 w-2 animate-blink rounded-full bg-amber-400 [animation-delay:0.3s]" />
        </div>
      </div>
    );
  }

  return user ? <AppShell /> : <AuthPage />;
}
