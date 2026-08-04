import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold mb-4">Oviflow</h1>
      <p className="text-neutral-500 mb-8">
        Never miss a customer call again. Set up your business once, and let
        an AI answer calls after hours or while you&apos;re busy.
      </p>
      <div className="flex gap-4">
        <Link href="/signup" className="px-5 py-2 rounded bg-blue-600 text-white">
          Get started
        </Link>
        <Link href="/login" className="px-5 py-2 rounded border">
          Log in
        </Link>
      </div>
    </main>
  );
}
