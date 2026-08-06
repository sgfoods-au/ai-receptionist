import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up free",
  description: "Create your free Oviflow account — no card required to start your 14-day trial.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
