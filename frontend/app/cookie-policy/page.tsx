import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookiePreferencesLink from '@/components/CookiePreferencesLink'

export const metadata: Metadata = {
  title: 'Cookie Policy — SQL Performance Intelligence™',
  description: 'How we use cookies and similar technologies on the SQL Performance Intelligence website. GDPR and global privacy.',
}

export default function CookiePolicyPage() {
  return (
    <main>
      <Header />

      <section className="pt-32 pb-12 px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Cookie Policy
          </h1>
          <p className="text-gray-600">
            Last updated: March 2026
          </p>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">1. What are cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files stored on your device when you visit our website. They help us provide a better experience, remember preferences, and understand how the site is used.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">2. How we use cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies only where necessary and in line with your choices:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Analytics (optional):</strong> We use Google Analytics to understand how visitors use our site. This is anonymous and only active if you choose &quot;Accept all&quot; in our cookie banner. See our <Link href="/analytics-disclosure" className="text-primary font-medium underline hover:text-primary-dark">Analytics disclosure</Link> for details.</li>
                <li><strong>Strictly necessary:</strong> We store your cookie consent preference (e.g. &quot;Accept&quot; or &quot;Reject&quot;) so we do not ask again on every visit.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">3. Your choices (GDPR / global)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can change your cookie preferences at any time. Use the link below to reopen the cookie banner and accept or reject non-essential cookies.
              </p>
              <div className="mt-2">
                <CookiePreferencesLink />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">4. More information</h2>
              <p className="text-gray-700 leading-relaxed">
                For how we handle personal data overall, see our <Link href="/privacy" className="text-primary font-medium underline hover:text-primary-dark">Privacy Policy</Link>. For details on analytics, see our <Link href="/analytics-disclosure" className="text-primary font-medium underline hover:text-primary-dark">Analytics disclosure</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
