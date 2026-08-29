import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import AuthProvider from "@/components/AuthProvider";
import PhoneVerificationGuard from "@/components/PhoneVerificationGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FlatNFlatmates.in | Find Flats & Flatmates in Pune",
  description: "Easiest, quickest, and most precise flat and flatmate search platform in Pune with premium Vibe upgrade services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-gray-50/50`}
      >
        <AuthProvider>
          <PhoneVerificationGuard>
            <Header />
            <main className="flex-grow flex flex-col w-full">
              {children}
            </main>
            <Footer />
          </PhoneVerificationGuard>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places`}
            strategy="afterInteractive"
          />
        </AuthProvider>
      </body>
    </html>
  );
}

