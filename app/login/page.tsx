"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { CARD, INPUT, Logo, PRIMARY_BTN, PageGlow } from "@/app/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden flex items-center justify-center px-6">
      <PageGlow />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo className="h-9 w-auto mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Welcome back</h1>
        </div>

        <div className={`${CARD} animate-fade-in-up`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
            <button type="submit" disabled={submitting} className={`w-full ${PRIMARY_BTN}`}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </form>
        </div>

        <p className="text-sm text-neutral-500 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-violet-600 font-medium hover:text-violet-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
