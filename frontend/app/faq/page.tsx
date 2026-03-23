import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'FAQ — SQL Performance Intelligence™',
  description: 'Frequently asked questions about SQL Performance Intelligence features, installation, and usage.',
}

const faqs = [
  {
    question: 'What is SQL Performance Intelligence?',
    answer: 'SQL Performance Intelligence is an offline, read-only SQL Server performance analysis platform. It provides evidence-backed recommendations, audit-ready reports, and uses local LLM by default with optional cloud LLM functionality. It runs on Windows 10 and 11.',
  },
  {
    question: 'How do I install it?',
    answer: 'Visit our documentation at /docs/installation for detailed step-by-step instructions for your operating system.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. The application runs offline by default with read-only access to databases. Cloud LLM features are optional and user-controlled. See our Security page for audit details.',
  },
  {
    question: 'What databases are supported?',
    answer: 'SQL Performance Intelligence supports Microsoft SQL Server (2016 and later) and runs on Windows 10 and Windows 11 only. See the documentation for specific version compatibility.',
  },
  {
    question: 'Can I use it in a regulated environment?',
    answer: 'Yes. Our offline-first architecture and audit-ready reports make it suitable for regulated environments. Review the Security & Trust section for compliance details.',
  },
  {
    question: 'What modules are included?',
    answer: 'The platform includes: Blocking Analysis, Index Advisor, Query Statistics, Wait Statistics, Scheduled Jobs Analysis, Security Audit, and Object Explorer.',
  },
  {
    question: 'Do you offer support?',
    answer: 'Yes. Contact us at our /contact page for support inquiries, features requests, or technical assistance.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Visit our /download page to access the latest release and get started.',
  },
]

export default function FAQPage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about SQL Performance Intelligence.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 p-8 bg-blue-50 rounded-2xl border border-blue-100">
            <h3 className="text-xl font-bold mb-2">Didn't find your answer?</h3>
            <p className="text-gray-600 mb-4">
              Contact us directly for more information and support.
            </p>
            <Link
              href="/contact"
              className="inline-flex px-6 py-3 bg-cta text-white font-semibold rounded-xl hover:bg-cta-hover transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
      <summary className="flex items-center justify-between font-semibold text-gray-900">
        <span>{question}</span>
        <ChevronDown className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" />
      </summary>
      <p className="mt-4 text-gray-600 leading-relaxed">{answer}</p>
    </details>
  )
}
