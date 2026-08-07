import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set up your AI receptionist",
  robots: { index: false, follow: false },
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
