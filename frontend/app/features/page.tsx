import type { Metadata } from 'next'
import Header from '@/components/Header'
import Features from '@/components/Features'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Features - SQL Performance Intelligence',
  description:
    'Explore the full SQL Performance Intelligence feature set for query tuning, diagnostics, reporting, and production monitoring.',
}

export default function FeaturesPage() {
  return (
    <main>
      <Header />
      <Features />
      <Footer />
    </main>
  )
}
