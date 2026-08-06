import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.APP_BASE_URL || "https://ai-receptionist-3fm9.vercel.app";
const description =
  "Oviflow is an AI phone receptionist for Australian small businesses, tradies, and mortgage brokers — answers calls 24/7, books appointments, and emails or texts you the details. Made in Australia.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Oviflow — AI Receptionist for Australian Small Businesses",
    template: "%s | Oviflow",
  },
  description,
  keywords: [
    "AI receptionist",
    "AI phone answering service",
    "virtual receptionist Australia",
    "missed call answering service",
    "AI answering service for small business",
    "after hours phone answering",
    "AI receptionist for tradies",
    "AI receptionist for mortgage brokers",
    "AI receptionist for restaurants",
  ],
  authors: [{ name: "Oviflow" }],
  applicationName: "Oviflow",
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Oviflow",
    title: "Oviflow — AI Receptionist for Australian Small Businesses",
    description,
    url: siteUrl,
    images: [{ url: "/oviflow.png", width: 1015, height: 291, alt: "Oviflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oviflow — AI Receptionist for Australian Small Businesses",
    description,
    images: ["/oviflow.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
