import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
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

// One monospace face for data, labels and the clock — IBM Plex Mono, a refined
// grotesque mono, replacing the generic Geist/JetBrains default everywhere.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Club Crumbs — MITE Club Dashboard",
  description: "A unified dashboard for MITE's tech clubs — Coders Club, Crypton Club and DevStudio: activity tracking, leaderboards, certificates and more.",
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
        className={`${sora.variable} ${plexMono.variable} h-full antialiased`}
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

