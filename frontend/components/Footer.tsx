import Link from 'next/link'
import CookiePreferencesLink from './CookiePreferencesLink'

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Download', href: '/download' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'FAQ', href: '/faq' },
  ],
  company: [
    { label: 'Contact', href: '/contact' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
    { label: 'Analytics disclosure', href: '/analytics-disclosure' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-900 px-6 py-14 text-white lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 border-b border-slate-800 pb-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.65fr))]">
          <div className="max-w-md">
            <div className="flex flex-col gap-1 leading-tight">
              <span className="text-xl font-bold">SQL Performance Intelligence™</span>
              <span className="text-sm text-slate-400">AI-Powered SQL Server Performance Tuning</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Read-only SQL Server diagnostics with deterministic, evidence-backed, audit-ready recommendations.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookiePreferencesLink />
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Legal &amp; Privacy</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-sm text-slate-500 md:text-left">
            © 2026 SQL Performance Intelligence™. All rights reserved.
          </p>

          <p className="text-center text-[12px] text-slate-500">
            Offline-first architecture. Cloud LLM is optional and user-controlled. This website uses anonymous analytics to improve the product experience.{' '}
            <Link href="/analytics-disclosure" className="text-slate-400 underline hover:text-white">Analytics disclosure</Link>.
          </p>

          <div className="flex justify-center md:justify-end">
            <a
              href="https://linkedin.com/company/sql-performance-intelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-all hover:bg-[#0A66C2] hover:text-white"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
