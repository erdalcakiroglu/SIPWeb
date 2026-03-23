import Link from 'next/link'
import { ShieldCheck, Ban, Lock, Building2, Cloud, Network } from 'lucide-react'

const securityItems = [
  {
    icon: ShieldCheck,
    title: 'Read-Only by Design',
    description: ['SELECT-only execution.', 'Zero DDL. Zero DML. Zero modification risk.'],
  },
  {
    icon: Ban,
    title: 'No Schema Changes — Ever',
    description: ['We analyze. We never modify production objects.'],
  },
  {
    icon: Lock,
    title: 'No Agents Required',
    description: ['No background services.', 'No persistent collectors.'],
  },
  {
    icon: Building2,
    title: 'Audit-Ready Reporting',
    description: ['Structured evidence. Severity levels. Executive summary included.'],
  },
  {
    icon: Cloud,
    title: 'User-Controlled AI Deployment',
    description: ['Local LLM (offline) or optional cloud LLM — your choice.'],
  },
  {
    icon: Network,
    title: 'Controlled network surface',
    description: ['Offline mode needs no internet.', 'Cloud mode requires only the endpoints you approve.'],
  },
]

export default function Security() {
  return (
    <section className="bg-gray-100 px-6 py-16 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-1 gap-16 items-center">
          {/* Content */}
          <div className="text-gray-900">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Built for Regulated & High-Security Environments
              </h2>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-primary">
                  No-Change Diagnostics
                </span>
              </div>
            </div>

            <div className="text-center lg:text-left mb-12">
              <p className="text-sm md:text-base font-semibold tracking-wide text-primary mb-3">
                AI-assisted. Deterministic. Fully controlled.
              </p>

              <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Offline-first, SELECT-only SQL Server diagnostics. No agents. No schema changes. Full audit visibility.
              </p>
            </div>

            {/* Security Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {securityItems.map((item, index) => (
                <div
                  key={index}
                  className="flex h-full min-h-[164px] gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-gray-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:min-h-[156px] lg:min-h-[144px] xl:min-h-[136px]"
                >
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold mb-1 text-gray-900">{item.title}</h4>
                    <div className="text-sm text-gray-600 leading-relaxed space-y-1">
                      {item.description.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center lg:text-left mt-10">
              <Link
                href="/security"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                View Security Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
