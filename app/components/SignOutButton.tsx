"use client";

import { signOutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="text-sm text-neutral-500 hover:underline">
        Sign out
      </button>
    </form>
  );
}
