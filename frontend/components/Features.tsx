import { Database, BarChart3, Layers, Shield, AlertTriangle, Clock, Calendar, FileText } from 'lucide-react'

const features = [
  {
    icon: Database,
    title: 'Object Explorer',
    description: 'Analyze stored procedures with AI-assisted, read-only tuning insights.',
    tag: 'AI-Assisted',
    color: 'teal',
    category: 'developer',
  },
  {
    icon: BarChart3,
    title: 'Query Statistics',
    description: 'Identify high-impact queries using CPU, duration, and logical read scoring.',
    tag: 'Context-Aware',
    color: 'purple',
    category: 'developer',
  },
  {
    icon: Layers,
    title: 'Index Advisor',
    description: 'Context-aware index analysis — not just missing index DMVs.',
    tag: 'Evidence-Based',
    color: 'amber',
    category: 'developer',
  },
  {
    icon: FileText,
    title: 'AI Report',
    description: 'Export structured HTML reports for review, approval, and audit.',
    tag: 'Read-Only Safe',
    color: 'blue',
    category: 'developer',
  },
  {
    icon: Clock,
    title: 'Wait Statistics',
    description: 'Analyze wait types (PAGEIOLATCH, CXPACKET, SOS_SCHEDULER_YIELD) and compare trends with baseline snapshots.',
    tag: 'Baseline Tracking',
    color: 'blue',
    category: 'ops',
  },
  {
    icon: AlertTriangle,
    title: 'Blocking Analysis',
    description: 'Identify root blocking sessions and reduce production impact.',
    tag: 'Timeline View',
    color: 'rose',
    category: 'ops',
  },
  {
    icon: Shield,
    title: 'Security Audit',
    description: 'Review SQL Server configuration risks and permission exposure.',
    tag: 'Compliance-Ready',
    color: 'emerald',
    category: 'ops',
  },
  {
    icon: Calendar,
    title: 'Scheduled Jobs Monitor',
    description: 'Track SQL Agent job outcomes, failures, and runtimes. Set alert rules for critical jobs and regressions.',
    tag: 'Alerting',
    color: 'orange',
    category: 'ops',
  },
]

const colorClasses: Record<string, string> = {
  teal: 'from-primary-light to-cyan-100 text-primary',
  purple: 'from-violet-100 to-purple-100 text-violet-600',
  amber: 'from-amber-100 to-yellow-100 text-amber-600',
  emerald: 'from-emerald-100 to-green-100 text-emerald-600',
  rose: 'from-rose-100 to-pink-100 text-rose-600',
  blue: 'from-blue-100 to-sky-100 text-blue-600',
  orange: 'from-orange-100 to-amber-100 text-orange-600',
}

export default function Features() {
  const developerFeatures = features.filter((feature) => feature.category === 'developer')
  const opsFeatures = features.filter((feature) => feature.category === 'ops')

  return (
    <section id="features" className="bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-gradientFrom via-primary to-primary-gradientTo px-6 py-16 pt-32 lg:px-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/5 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto -mt-4 max-w-3xl text-center text-white">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5">
            <span className="block">Two Integrated Toolkits</span>
            <span className="mt-3 block">One Unified Platform</span>
          </h2>
          <p className="text-lg text-white/80 leading-relaxed">
            All features included in the current edition.
          </p>
        </div>
      </div>

      <div className="px-6 py-16 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Developer Toolkit */}
          <div className="-mt-4">
            <div className="-mt-2 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">Core Performance Toolkit (Developer-First)</h3>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-primary-light text-primary uppercase tracking-wide whitespace-nowrap">
                Core
              </span>
            </div>
            <p className="text-gray-600 mb-8 max-w-2xl">Everything you need to tune stored procedures and analyze query performance.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {developerFeatures.map((feature, index) => (
                <div 
                  key={`dev-${index}`}
                  className="group h-full flex flex-col bg-gradient-to-br from-white to-slate-50/60 rounded-2xl p-8 border border-gray-200 hover:border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Top border on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[feature.color]} flex items-center justify-center mb-6`}>
                    <feature.icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h4 className="text-lg font-bold mb-3">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed mb-4 min-h-[72px]">
                    {feature.description}
                  </p>
                  
                  {/* Tag */}
                  <span className="mt-auto inline-block self-start px-3 py-1.5 bg-gray-100 rounded-md text-xs font-semibold text-gray-500">
                    {feature.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ops & Compliance */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">Advanced Production Insights (DBA-Ready)</h3>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600 uppercase tracking-wide whitespace-nowrap">
                Professional Edition
              </span>
            </div>
            <p className="text-gray-600 mb-2 max-w-2xl">Production-grade insights for DBA and operations teams.</p>
            <p className="text-xs text-gray-500 mb-8 italic max-w-2xl">Included in Professional Edition (currently enabled for all users)</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {opsFeatures.map((feature, index) => (
                <div 
                  key={`ops-${index}`}
                  className="group h-full flex flex-col bg-gradient-to-br from-white to-slate-50/60 rounded-2xl p-8 border border-gray-200 hover:border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Top border on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[feature.color]} flex items-center justify-center mb-6`}>
                    <feature.icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h4 className="text-lg font-bold mb-3">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed mb-4 min-h-[72px]">
                    {feature.description}
                  </p>
                  
                  {/* Tag */}
                  <span className="mt-auto inline-block self-start px-3 py-1.5 bg-gray-100 rounded-md text-xs font-semibold text-gray-500">
                    {feature.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
