import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Analytics disclosure — SQL Performance Intelligence™',
  description: 'How we use anonymous analytics on the SQL Performance Intelligence website. Google Analytics and product experience.',
}

export default function AnalyticsDisclosurePage() {
  return (
    <main>
      <Header />

      <section className="pt-32 pb-12 px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Analytics disclosure
          </h1>
          <p className="text-gray-600">
            Last updated: March 2026
          </p>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-lg font-medium text-gray-900">
                This website uses anonymous analytics to improve the product experience.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">How we use analytics</h2>
              <p className="text-gray-700 leading-relaxed">
                We use Google Analytics to understand how visitors use our site (e.g. which pages are viewed, in what order, and from which regions). This helps us improve content, navigation, and the overall product experience. Analytics are only enabled if you choose &quot;Accept all&quot; in our cookie banner; we do not set analytics cookies without your consent.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">What we collect</h2>
              <p className="text-gray-700 leading-relaxed">
                Data is collected in an anonymous, aggregated form. We do not use analytics to identify you personally. For more on cookies and consent, see our <Link href="/cookie-policy" className="text-primary font-medium underline hover:text-primary-dark">Cookie Policy</Link> and <Link href="/privacy" className="text-primary font-medium underline hover:text-primary-dark">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
