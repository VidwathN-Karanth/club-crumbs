import type { Metadata, Viewport } from "next";
import { Mulish, Sora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SyncProvider } from "@/components/SyncProvider";
import CookieConsent from "@/components/CookieConsent";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// One sans face for the whole app — a modern, technical grotesk that suits a
// CS-branch tooling console, distinct from the Geist/Inter default. Mono
// (below) stays for data, labels and the clock. Sora is variable (100–800), so
// every weight the UI uses, up to the extrabold marketing headings, is covered.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

// The face for labels, data and the clock. Mulish is a rounded humanist sans
// (not monospace), used wherever the UI used to reach for mono.
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://club-crumbs.vercel.app"),
  title: "Club Crumbs — MITE CSE Clubs Dashboard",
  description: "Club Crumbs is the shared dashboard for MITE's CSE branch clubs — Coders Club, Crypton Club and DevStudio: activity tracking, leaderboards, certificates and more.",
  keywords: [
    "MITE CSE clubs",
    "MITE clubs",
    "CSE clubs MITE",
    "Club Crumbs",
    "Coders Club MITE",
    "Crypton Club MITE",
    "DevStudio MITE",
    "Mangalore Institute of Technology and Engineering clubs",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Club Crumbs — MITE CSE Clubs Dashboard",
    description: "The shared home for MITE's CSE branch clubs — Coders Club, Crypton Club and DevStudio.",
    url: "https://club-crumbs.vercel.app",
    siteName: "Club Crumbs",
    type: "website",
    images: ["/club-crumbs-logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Club Crumbs — MITE CSE Clubs Dashboard",
    description: "The shared home for MITE's CSE branch clubs — Coders Club, Crypton Club and DevStudio.",
    images: ["/club-crumbs-logo.png"],
  },
  // The manifest is what lets a phone install Club Crumbs to the Home Screen,
  // which on iOS is the only way the Notification API exists at all.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Club Crumbs",
    statusBarStyle: "black-translucent",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  }
};

export const viewport: Viewport = {
  themeColor: "#16181C",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available; capping it at 5 keeps a mis-tap from leaving
  // the student stranded at 10x on a phone.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        // Clerk 7 renamed this from `baseTheme`.
        theme: dark,
        variables: {
          colorPrimary: '#007AFF', // Apple Blue
          colorBackground: '#121214', // Neutral dark
          // Renamed by Clerk 7: colorInputBackground/colorInputText became
          // colorInput/colorInputForeground, and the old names now fail the
          // type check rather than being ignored.
          colorInput: 'rgba(255, 255, 255, 0.05)',
          colorInputForeground: '#e2e2e2',
        },
      }}
    >
      <html
        lang="en"
        className={`${sora.variable} ${mulish.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <SyncProvider>
            {children}
            <CookieConsent />
            <SpeedInsights />
          </SyncProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

