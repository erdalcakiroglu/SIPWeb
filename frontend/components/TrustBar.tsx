import { Cpu, CloudOff, ShieldCheck, Ban } from 'lucide-react'

const badges = [
  {
    icon: Cpu,
    text: 'Offline-capable',
    description: 'Local LLM mode, no Internet required',
  },
  {
    icon: CloudOff,
    text: 'Cloud-optional',
    description: 'User-controlled, not forced',
  },
  {
    icon: ShieldCheck,
    text: 'Read-only by design',
    description: 'SELECT-only, zero write risk',
  },
  {
    icon: Ban,
    text: 'No schema changes',
    description: 'Safe for production environments',
  },
  {
    icon: Ban,
    text: 'No agents required',
    description: 'No installation on SQL Server hosts',
  },
]

type TrustBarProps = {
  variant?: 'default' | 'divider'
}

export default function TrustBar({ variant = 'default' }: TrustBarProps) {
  const isDivider = variant === 'divider'

  if (isDivider) {
    return (
      <section
        aria-hidden="true"
        className="bg-white border-y border-slate-200/80 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      />
    )
  }

  return (
    <section className="bg-white border-b border-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-3">
              <badge.icon className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{badge.text}</div>
                <div className="text-xs text-gray-500">{badge.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
