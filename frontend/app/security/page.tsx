import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DataBoundaryPanel from './DataBoundaryPanel'

export const metadata: Metadata = {
  title: 'Trust & Security - SQL Performance Intelligence',
  description:
    'Security posture, data handling, access controls, and audit readiness for SQL Performance Intelligence.',
}

const defaultConfiguration = [
  'Default mode: Local (Offline)',
  'Cloud: Disabled',
  'Send Policy: L0',
  'Redaction: On (cloud mode)',
]

const systemPrinciples = [
  'No outbound telemetry',
  'No background agents',
  'No automatic schema changes',
  'No automatic updates',
  'Offline by default',
]

const securityPosture = [
  'Read-only diagnostics (SELECT-only)',
  'No schema changes',
  'No agents / no background services',
  'Recommendations only (no auto-apply)',
  'Least privilege access',
  'Offline by default',
]

const reviewSupport = [
  'Security questionnaire support',
  'Architecture documentation available',
  'On-prem deployment supported',
  'Air-gapped environments supported',
]

export default function SecurityPage() {
  return (
    <main className="bg-white">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-gradientFrom via-primary to-primary-gradientTo px-6 py-16 pt-32 lg:px-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[12%] top-1/4 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="text-white">
            <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Security &amp; Compliance by Design for Regulated SQL Server Environments
            </h1>
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
              This page answers common security review questions with auditable details. Offline-first by default,
              read-only diagnostics, and user-controlled optional cloud LLM.
            </p>

            <div className="mb-10 flex flex-wrap gap-4">
              <Link
                href="/sample-report"
                className="inline-flex items-center rounded-xl bg-cta px-8 py-4 font-bold text-white shadow-cta transition-all hover:-translate-y-0.5 hover:bg-cta-hover hover:shadow-cta-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/35"
              >
                View Sample Security Report
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {securityPosture.slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm"
                >
                  <Check className="h-4 w-4 text-white" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Default Security Configuration
            </div>
            <ul className="space-y-3 text-sm text-white/85">
              {defaultConfiguration.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="h-4 w-4 flex-shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <div className="mb-2 text-sm font-bold text-white">Offline-first default</div>
                <p className="text-sm leading-relaxed text-white/75">
                  Local LLM keeps prompts and tuning context inside your environment.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <div className="mb-2 text-sm font-bold text-white">No telemetry or agents</div>
                <p className="text-sm leading-relaxed text-white/75">
                  No background collectors, no outbound telemetry, and no hidden services.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-5 text-sm leading-relaxed text-white/90">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                Critical message
              </div>
              Local LLM keeps all tuning context inside your environment. Cloud LLM is optional, and if enabled only
              selected context is transmitted under Send Policy and Redaction controls.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-6 pb-24 pt-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-6xl text-center">
            <span className="mb-5 inline-block rounded-full bg-primary-light px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary">
              Security Summary
            </span>
            <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:whitespace-nowrap">
              Trust posture and data-handling model at a glance
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 lg:whitespace-nowrap">
              Security content is now grouped into the same strong sections and card patterns used on the homepage.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-8 shadow-sm shadow-slate-200/60">
                <h3 className="mb-5 text-2xl font-extrabold tracking-tight text-gray-900">How data moves</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h4 className="mb-2 text-base font-bold text-gray-900">Offline (default)</h4>
                    <ul className="space-y-2 text-sm leading-relaxed text-gray-600">
                      <li>Runs locally with Local LLM.</li>
                      <li>No prompts or tuning context leave your network.</li>
                      <li>Recommended for regulated environments.</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h4 className="mb-2 text-base font-bold text-gray-900">Cloud (optional)</h4>
                    <ul className="space-y-2 text-sm leading-relaxed text-gray-600">
                      <li>Enabled only by you with a provider and API key.</li>
                      <li>Controlled by Send Policy levels L0 to L3.</li>
                      <li>Redaction can mask literals, comments, and PII patterns.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-8 shadow-sm shadow-slate-200/60">
                <h3 className="mb-5 text-2xl font-extrabold tracking-tight text-gray-900">
                  What we collect and what we do not collect
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">We collect</h4>
                    <ul className="space-y-2 text-sm leading-relaxed text-gray-600">
                      <li>Procedure or query text when enabled for tuning.</li>
                      <li>Plans, Query Store metrics, and metadata.</li>
                      <li>Signals such as IO, CPU, waits, and memory grants.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">We do not collect</h4>
                    <ul className="space-y-2 text-sm leading-relaxed text-gray-600">
                      <li>Table or row contents as part of collection.</li>
                      <li>Credentials or secrets intentionally.</li>
                      <li>Background-harvested database contents.</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  The application does not collect, transmit, or persist table data. If cloud LLM mode is enabled,
                  selected context may be transmitted under user-controlled Send Policy.
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-8 shadow-sm shadow-slate-200/60">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  System Design Principles
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {systemPrinciples.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-8 shadow-sm shadow-slate-200/60">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Security Posture
                </div>
                <div className="flex flex-wrap gap-3">
                  {securityPosture.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 pb-8 pt-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="mb-5 inline-block rounded-full bg-primary-light px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary">
              Review Details
            </span>
            <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
              Deep-dive controls for security reviews and procurement checks
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Detailed answers remain in expandable sections, but now sit inside the same polished card system used
              across the homepage.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-xl shadow-slate-200/40 md:p-6">
            <div className="divide-y divide-slate-200/80">
              <details open className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-gray-900 md:text-lg">
                  <span>LLM Mode Comparison</span>
                  <span className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Local LLM</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Cloud LLM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-900">Internet Required</td>
                        <td className="px-4 py-3 text-gray-700">No</td>
                        <td className="px-4 py-3 text-gray-700">Yes</td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-gray-900">Data Leaves Environment</td>
                        <td className="px-4 py-3 text-gray-700">No</td>
                        <td className="px-4 py-3 text-gray-700">Yes, to the selected provider</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-900">Regulated Suitable</td>
                        <td className="px-4 py-3 text-gray-700">Yes</td>
                        <td className="px-4 py-3 text-gray-700">Depends on policy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>

              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-gray-900 md:text-lg">
                  <span>Controls</span>
                  <span className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="mt-5">
                  <DataBoundaryPanel />
                </div>
              </details>

              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-gray-900 md:text-lg">
                  <span>Encryption, Network, and Deployment</span>
                  <span className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h3 className="mb-2 text-sm font-bold text-gray-900">Encryption</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      In cloud mode, transmitted context is sent over encrypted HTTPS and TLS connections.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h3 className="mb-2 text-sm font-bold text-gray-900">Network Requirements</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Offline mode needs no internet. Cloud mode requires outbound access only to explicitly approved
                      endpoints.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h3 className="mb-2 text-sm font-bold text-gray-900">Deployment Model</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Windows desktop deployment, offline installer options, and no background license agents.
                    </p>
                  </div>
                </div>
              </details>

              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-gray-900 md:text-lg">
                  <span>Access, Logging, and Audit Readiness</span>
                  <span className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h3 className="mb-2 text-sm font-bold text-gray-900">Minimum permissions</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Read-only metadata and performance views, plus optional Query Store access when enabled.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h3 className="mb-2 text-sm font-bold text-gray-900">Supported authentication</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Windows Authentication, SQL Login, and Active Directory where configured.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                    <h3 className="mb-2 text-sm font-bold text-gray-900">Audit logging</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Logins, analysis runs, report generation, configuration changes, and exports.
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-gray-50 px-6 pb-24 pt-2 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-5 inline-block rounded-full bg-primary-light px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary">
            Security Review Support
          </span>
          <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Accelerate procurement and security approvals without reworking the narrative every time
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-gray-600">
            Audit-ready reports and evidence-backed analysis are designed to shorten enterprise security reviews while
            preserving operational control.
          </p>

          <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reviewSupport.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 text-sm font-semibold text-gray-800 shadow-sm shadow-slate-200/50"
              >
                {item}
              </div>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}
