import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ContactForm from './ContactForm'

export const metadata = {
  title: 'Contact — SQL Performance Intelligence™',
  description: 'Reach sales for licensing/pricing, or technical support for product help.',
}

export default function ContactPage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 lg:px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          <span className="inline-block px-4 py-2 bg-primary-light text-primary text-sm font-semibold rounded-full uppercase tracking-wide mb-6">
            Contact
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">Contact</h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
            Reach sales for licensing/pricing, or technical support for product help.
          </p>
        </div>
      </section>

      {/* Layout */}
      <section className="py-16 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-8">
          {/* Left cards */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200/70 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-900 mb-1">Sales / Licensing</div>
              <p className="text-sm text-gray-600">
                Licensing, pricing, enterprise rollout, procurement questions.
              </p>
              <div className="mt-3 text-xs text-gray-500">
                Examples: trial activation, pricing, procurement
              </div>
            </div>
            <div className="bg-white border border-gray-200/70 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-900 mb-1">Technical Support</div>
              <p className="text-sm text-gray-600">
                Installation, connectivity, permissions, analysis issues, bug reports.
              </p>
              <div className="mt-3 text-xs text-gray-500">
                Examples: install, permissions, report questions
              </div>
            </div>
          </div>

          {/* Right form */}
          <ContactForm />
        </div>
      </section>

      <Footer />
    </main>
  )
}
