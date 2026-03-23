import Link from 'next/link'
import { ArrowUpRight, Check, ShieldCheck, Cpu, Database } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CopyButton from './CopyButton'
import release from './release.json'

export const metadata = {
  title: 'Download — SQL Performance Intelligence™',
  description: 'Download the Windows installer for SQL Performance Intelligence. 30-day full-feature trial. Offline-first and read-only by design.',
}

const downloadHighlights = [
  'Windows desktop app',
  'Read-only SQL analysis',
  'No agents',
  'No schema changes',
  'Local LLM supported',
  'No outbound telemetry',
]

export default function DownloadPage() {
  return (
    <main>
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-gradientFrom via-primary to-primary-gradientTo px-6 py-16 pt-32 lg:px-10">
        <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-60" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[12%] top-1/4 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-5">
            Download SQL Performance Intelligence™
          </h1>

          <div className="max-w-3xl space-y-3 text-lg leading-relaxed text-white/85">
            <p>Start a 30-day full-feature trial.</p>
            <p>
              Offline-first SQL Server performance diagnostics with AI-assisted analysis.
              No agents. No schema changes. No telemetry.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/downloads/SQL%20Performance%20Intelligence.exe"
              className="inline-flex items-center gap-2 px-8 py-4 bg-cta text-white font-bold rounded-xl shadow-cta hover:bg-cta-hover hover:shadow-cta-hover hover:-translate-y-0.5 transition-all"
            >
              Download SQL Performance Intelligence.exe
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10"
            >
              Installation Guide
            </Link>
          </div>

          <ul className="mt-8 space-y-3 text-white/90">
            {downloadHighlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base font-medium">
                <Check className="h-5 w-5 flex-shrink-0 text-emerald-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-1" />
            <div>
              <div className="font-semibold text-gray-900">Read-Only by Design</div>
              <div className="text-gray-600">No automatic schema changes. No background agents.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Cpu className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <div className="font-semibold text-gray-900">Offline-First Architecture</div>
              <div className="text-gray-600">All analysis remains local unless cloud mode is enabled.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <div className="font-semibold text-gray-900">Enterprise Compatible</div>
              <div className="text-gray-600">Digitally signed installer. Change-control friendly.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10 bg-white">
        <div className="max-w-6xl mx-auto space-y-8">

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Latest Release</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Version</div>
                <div className="text-2xl font-bold text-gray-900">{release.version}</div>
                <div className="text-sm text-gray-500 mt-1">Released: {release.released}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">System Requirements</div>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ Windows 10 (Build 1909+) or Windows 11</li>
                  <li>✓ 4GB RAM minimum, 8GB recommended</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">SHA-256 Verification</h3>
            {release.sha256 ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-xs text-gray-700 break-all">
                    {release.sha256}
                  </div>
                  <CopyButton text={release.sha256} label="Copy hash" />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Compare this hash with the one from your downloaded file to ensure integrity.
                </p>
              </>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                Hash not yet generated. After placing the installer in <code className="bg-amber-100 px-1 rounded">public/downloads/</code>, run <code className="bg-amber-100 px-1 rounded">npm run download:hash</code> and rebuild.
              </p>
            )}

            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">How to verify (Windows)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Download the installer and note the folder (e.g. <code className="bg-gray-100 px-1 rounded">Downloads</code>).</li>
                <li>Open Command Prompt or PowerShell and go to that folder, e.g. <code className="bg-gray-100 px-1 rounded">cd %USERPROFILE%\Downloads</code>.</li>
                <li>Run: <code className="bg-gray-100 px-1 rounded">certUtil -hashfile &quot;SQL Performance Intelligence.exe&quot; SHA256</code>.</li>
                <li>The output hash must match the SHA-256 value shown above exactly.</li>
              </ol>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="flex-1 min-w-0 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                  certUtil -hashfile &quot;SQL Performance Intelligence.exe&quot; SHA256
                </code>
                <CopyButton
                  text='certUtil -hashfile "SQL Performance Intelligence.exe" SHA256'
                  label="Copy command"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm text-gray-700">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              Installer is digitally signed.
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}
