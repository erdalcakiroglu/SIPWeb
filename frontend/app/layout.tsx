import type { Metadata } from 'next'
import Script from 'next/script'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-7P384RE0KJ'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SQL Performance Intelligence™ — Offline, Read-Only SQL Server Performance Intelligence',
  description: 'Identify bottlenecks faster — often in minutes — with evidence-backed recommendations and audit-ready reports.',
  keywords: ['SQL Server', 'DBA', 'performance', 'AI', 'database optimization', 'index advisor'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SQL Performance Intelligence™',
    description: 'Offline, read-only SQL Server performance analysis platform with evidence-backed recommendations and audit-ready reports. Runs on Windows 10 and 11.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Windows',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
    author: {
      '@type': 'Organization',
      name: 'SQL Performance Intelligence™',
    },
    featureList: [
      'Blocking Analysis',
      'Index Advisor',
      'Query Statistics',
      'Wait Statistics',
      'Scheduled Jobs Analysis',
      'Security Audit',
      'Object Explorer',
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${plusJakarta.className} bg-gray-50 text-gray-900 antialiased`}>
        {/* Google Analytics (gtag.js) — runs on every page */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              wait_for_update: 500
            });
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
