import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service — SQL Performance Intelligence™',
  description: 'Terms of Service governing the use of SQL Performance Intelligence software and subscription services.',
}

export default function TermsPage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: February 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 space-y-10">

            <div>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By downloading, installing, subscribing to, or using SQL Performance Intelligence™, 
                you agree to be bound by these Terms of Service. If you do not agree, you must not use the software.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">2. License Grant</h2>
              <p className="text-gray-700 leading-relaxed">
                Subject to payment of applicable fees, we grant you a limited, non-exclusive, 
                non-transferable, non-sublicensable license to install and use the software 
                on a single machine per license for internal business purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">3. Subscription & Renewal</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Subscriptions are billed on a recurring monthly or annual basis. 
                You may cancel at any time. Access to features may be suspended 
                upon expiration of your subscription, subject to any grace period described in our licensing policy.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Payment processing is handled securely by Stripe. We do not store full payment card details.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">4. Trial License</h2>
              <p className="text-gray-700 leading-relaxed">
                Trial licenses may be provided for evaluation purposes. 
                Trial periods are time-limited and automatically expire unless converted to a paid subscription.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">5. Restrictions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Reverse engineer, decompile, or disassemble the software</li>
                <li>Sublicense, rent, lease, or distribute the software</li>
                <li>Bypass license enforcement mechanisms</li>
                <li>Use the software to build competing products</li>
                <li>Remove proprietary notices</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">6. AI-Assisted Recommendations Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                SQL Performance Intelligence provides AI-assisted performance recommendations 
                and diagnostic insights. These recommendations are advisory in nature only.
                You are solely responsible for reviewing, validating, and applying any suggested changes.
                The software does not automatically modify your database schema or data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">7. Database Access & Security</h2>
              <p className="text-gray-700 leading-relaxed">
                The software operates in read-only mode by design. 
                You are responsible for managing database credentials, 
                access controls, and ensuring compliance with your internal security policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All rights, title, and interest in the software, including trademarks, 
                code, and documentation, remain our exclusive property.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, 
                EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                AND NON-INFRINGEMENT.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO 
                THE USE OF THE SOFTWARE.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your license if you violate these Terms. 
                Upon termination, all rights granted to you cease immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by applicable law. 
                You agree to submit to the exclusive jurisdiction of the competent courts.
              </p>
            </div>

            <div className="border-t pt-8">
              <p className="text-sm text-gray-600">
                For questions regarding these Terms, please visit our{' '}
                <Link href="/contact" className="text-primary font-semibold hover:text-primary-dark">
                  Contact page
                </Link>.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
