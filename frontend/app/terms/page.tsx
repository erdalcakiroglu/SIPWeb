import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service — SQL Performance Intelligence™',
  description: 'Terms of Service for SQL Performance Intelligence software.',
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
          <div className="bg-white rounded-xl p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By downloading, installing, and using SQL Performance Intelligence™, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the software.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">2. License Grant</h2>
              <p className="text-gray-700 leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable license to use SQL Performance Intelligence for analysis and reporting of Microsoft SQL Server performance data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">3. Restrictions</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">You may not:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Reverse engineer, decompile, or disassemble the software</li>
                <li>Sublicense, rent, lease, or lend the software</li>
                <li>Use the software for competitive analysis or benchmarking</li>
                <li>Modify or create derivative works</li>
                <li>Remove proprietary notices or labels</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">4. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content, features, and functionality of SQL Performance Intelligence are owned by us, our licensors, or other providers of such material and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">5. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">7. Database Access and Security</h2>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for controlling access to your database credentials and ensuring authorized use of SQL Performance Intelligence. The software operates with read-only access to databases.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">8. User Content</h2>
              <p className="text-gray-700 leading-relaxed">
                You retain all rights to any data, reports, or analysis you create using SQL Performance Intelligence. You grant us the right to use feedback or reports for product improvement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate your license if you violate these terms. Upon termination, your rights cease immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by and construed in accordance with applicable law, and you irrevocably submit to the exclusive jurisdiction of the courts.
              </p>
            </div>

            <div className="border-t pt-8">
              <p className="text-sm text-gray-600">
                For questions about these terms, please contact us through our Contact page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
