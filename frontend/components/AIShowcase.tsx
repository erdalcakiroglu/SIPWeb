import Link from 'next/link'
import { Check, FileText, Zap } from 'lucide-react'

const aiFeatures = [
  { title: 'Executive summary for fast production decisions', description: 'Clear overview of impact' },
  { title: 'Deterministic confidence scoring for safe prioritization', description: 'Know reliability per recommendation' },
  { title: 'Evidence pointers for traceability', description: 'Trace every claim to evidence' },
  { title: 'Copy-paste scripts', description: 'You review. You execute. We never auto-deploy.' },
]

export default function AIShowcase() {
  return (
    <section className="relative px-6 py-16 lg:px-10">
      <div className="max-w-7xl mx-auto flex justify-center mb-16">
        <span className="inline-block px-4 py-2 bg-white/15 text-white text-sm font-semibold rounded-full uppercase tracking-wide">
          AI Analysis
        </span>
      </div>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Content */}
        <div className="text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5">
            Deterministic, Evidence-Backed SQL Recommendations
          </h2>
          
          <p className="text-lg text-white/75 leading-relaxed mb-8">
            We analyze execution plans, Query Store, and wait signals to generate AI-assisted, audit-ready tuning recommendations.
          </p>

          {/* Feature list */}
          <ul className="space-y-4 mb-10">
            {aiFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-4 py-4">
                <span className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
                <span className="text-white/80">
                  <strong className="font-semibold">{feature.title}</strong> — {feature.description}
                </span>
              </li>
            ))}
          </ul>

          <Link 
            href="/download" 
            className="inline-flex px-8 py-4 bg-cta text-white font-bold rounded-xl shadow-cta hover:bg-cta-hover hover:shadow-cta-hover hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/35 transition-all"
          >
            Start 30-Day Free Trial
          </Link>
        </div>

        {/* Report Preview */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          {/* Report header */}
          <div className="bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5" />
              <span className="font-bold">AI Performance Analysis Report</span>
            </div>
            <span className="text-sm opacity-85">dbo.usp_OrderSearch • SalesDB</span>
          </div>

          {/* Report body */}
          <div className="p-6 space-y-6">
            {/* Issues */}
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                🧨 Identified Issues
              </h4>
              <div className="space-y-3">
                <div className="bg-rose-50 border-l-[3px] border-rose-400 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 mb-1">
                    <span>P1: Cursor-based RBAR pattern</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      Impact: High
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Row-by-row processing detected (high IO).</div>
                  <div className="text-[11px] text-gray-500">Causing repeated table scans with 14,950 logical reads per execution.</div>
                </div>
                <div className="bg-rose-50 border-l-[3px] border-rose-400 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 mb-1">
                    <span>P1: Parameter sniffing risk</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      Impact: High
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">High variance detected (CV &gt;165%)</div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                💡 Top Recommendation
              </h4>
              <div className="bg-green-50 border-l-[3px] border-green-500 p-4 rounded-r-lg">
                <div className="text-sm font-semibold text-green-800 mb-1">Eliminate Cursor with Set-Based Rewrite</div>
                <div className="text-xs text-gray-600">Estimated: up to 90% fewer logical reads, 85% lower CPU time</div>
              </div>
            </div>

            {/* Confidence */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Confidence: 81% (High)</span>
            </div>
            <div className="text-sm text-gray-700 font-medium mt-2">
              Based on execution plan + Query Store + wait stats.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
