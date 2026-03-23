import { Metadata } from 'next'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import TrustBar from '@/components/TrustBar'
import Security from '@/components/Security'
import AIShowcase from '@/components/AIShowcase'
import Pricing from '@/components/Pricing'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'SQL Performance Intelligence - Database Optimization Platform',
  description: 'Offline, read-only SQL Server performance analysis, index advisor, and query optimization tools for Windows.',
  keywords: 'SQL Server, MS SQL Server, Performance Analysis, Query Optimization, Database Tools, Windows',
  openGraph: {
    title: 'SQL Performance Intelligence',
    description: 'Offline, read-only SQL Server performance analysis and optimization platform for Windows 10 and 11.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <TrustBar />
      <Security />
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-gradientFrom via-primary to-primary-gradientTo">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/5 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <AIShowcase />
          <TrustBar variant="divider" />
          <Pricing />
        </div>
      </div>
      <CTA />
      <Footer />
    </main>
  )
}
