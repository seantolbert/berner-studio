import type { Metadata, Viewport } from "next";
import Script from "next/script";
import dynamic from "next/dynamic";
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

const siteName = "Berner Studio";
const siteDescription = "Custom cutting boards and goods";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

export const metadata: Metadata = {
  title: siteName,
  description: siteDescription,
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      { url: "/og.svg", width: 1200, height: 630, alt: siteName },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
};

// Load client-only header/footer dynamically to avoid require()
const AppHeader = dynamic(() => import("@/app/components/AppHeader"), { ssr: false });
const AppFooter = dynamic(() => import("@/app/components/AppFooter"), { ssr: false });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const SENTRY_DSN = process.env.SENTRY_DSN;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AppHeader />
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}</Script>
          </>
        ) : null}
        {PLAUSIBLE_DOMAIN ? (
          <Script
            id="plausible"
            src="https://plausible.io/js/script.js"
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
            defer
          />
        ) : null}
        {SENTRY_DSN ? (
          <>
            <Script
              id="sentry-cdn"
              src="https://browser.sentry-cdn.com/7.120.1/bundle.tracing.replay.min.js"
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
            <Script id="sentry-init" strategy="afterInteractive">{`
              if (window.Sentry) {
                window.Sentry.init({
                  dsn: '${SENTRY_DSN}',
                  tracesSampleRate: 0.1,
                  integrations: [
                    window.Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
                    window.Sentry.browserTracingIntegration(),
                  ],
                  replaysSessionSampleRate: 0.1,
                  replaysOnErrorSampleRate: 1.0,
                });
              }
            `}</Script>
          </>
        ) : null}
        <main className="flex-1">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
