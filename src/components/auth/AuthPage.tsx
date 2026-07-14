import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { signIn, signUp, signInWithGoogle, error, clearError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(name, email, password);
    } catch {
      // error is surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl2 bg-amber-500 text-ink-950 font-display text-xl font-bold">
            S
          </div>
          <h1 className="font-display text-2xl font-semibold text-parchment-100">
            StudyMind AI
          </h1>
          <p className="mt-1 text-sm text-parchment-200/60">
            Your always-available study companion.
          </p>
        </div>

        <div className="rounded-xl2 border border-ink-700 bg-ink-800 p-6">
          <div className="mb-5 flex rounded-lg bg-ink-900 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  clearError();
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-ink-700 text-parchment-100"
                    : "text-parchment-200/60 hover:text-parchment-100"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-parchment-100 placeholder:text-parchment-200/40 focus:border-amber-500"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-parchment-100 placeholder:text-parchment-200/40 focus:border-amber-500"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-parchment-100 placeholder:text-parchment-200/40 focus:border-amber-500"
            />

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-parchment-200/40">
            <div className="h-px flex-1 bg-ink-700" />
            OR
            <div className="h-px flex-1 bg-ink-700" />
          </div>

          <Button variant="secondary" className="w-full" onClick={() => signInWithGoogle()}>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
