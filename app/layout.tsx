import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { Suspense } from "react";
import { MetaPixelEvents } from "@/components/MetaPixelEvents";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Obsidian Systems Showcase Platform",
  description:
    "Explore interactive demo websites, AI-powered quote flows, and managed business platform systems built by Obsidian Systems LLC.",
  metadataBase: siteUrl,
  openGraph: {
    title: "Obsidian Systems Showcase Platform",
    description:
      "Explore interactive demo websites, AI-powered quote flows, and managed business platform systems built by Obsidian Systems LLC.",
    url: "/",
    siteName: "Obsidian Systems LLC",
    images: [
      {
        url: "/og-home-preview.png",
        width: 1200,
        height: 630,
        alt: "Obsidian Systems Showcase Platform landing page preview"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Obsidian Systems Showcase Platform",
    description:
      "Explore interactive demo websites, AI-powered quote flows, and managed business platform systems built by Obsidian Systems LLC.",
    images: ["/og-home-preview.png"]
  },
  icons: {
    icon: "/icon.svg"
  },
};

function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    return new URL(normalizedUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID;
  const enableVercelAnalytics = process.env.VERCEL === "1";

  return (
    <html lang="en">
      <body>
        {gtmId ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        ) : null}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
        {metaPixelId ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixelId}');fbq('track','PageView');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
            <Suspense fallback={null}>
              <MetaPixelEvents />
            </Suspense>
          </>
        ) : null}
        {children}
        {enableVercelAnalytics ? <Analytics /> : null}
      </body>
    </html>
  );
}
