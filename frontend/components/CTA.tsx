import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-16 px-6 lg:px-10 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5 text-gray-900">
          Optimize SQL Server — Without Risk.
        </h2>
        
        <p className="text-lg text-gray-600 mb-10">
          Full features. No credit card required. Cancel anytime.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/download" 
            className="px-8 py-4 bg-cta text-white font-bold rounded-xl shadow-cta hover:bg-cta-hover hover:shadow-cta-hover hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/35 transition-all"
          >
            Start Free Trial
          </Link>
          <Link 
            href="/download" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-teal-200 text-teal-900 font-semibold rounded-xl hover:bg-teal-50/80 hover:border-teal-300 transition-all"
          >
            Download Now
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-6 max-w-2xl mx-auto text-sm text-gray-600 leading-relaxed">
          Recommendations are guidance only. You control all changes. Performance improvements are estimates and may vary by workload. Offline mode keeps data local. Cloud LLM is optional and user-enabled.
        </p>
      </div>
    </section>
  )
}
