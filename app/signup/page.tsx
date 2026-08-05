"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { CARD, INPUT, Logo, PRIMARY_BTN, PageGlow } from "@/app/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    router.push("/onboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden flex items-center justify-center px-6">
      <PageGlow />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo className="h-9 w-auto mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Create your account</h1>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
            <button type="submit" disabled={submitting} className={`w-full ${PRIMARY_BTN}`}>
              {submitting ? "Creating account..." : "Sign up"}
            </button>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </form>
        </div>

        <p className="text-sm text-neutral-500 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-600 font-medium hover:text-violet-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
