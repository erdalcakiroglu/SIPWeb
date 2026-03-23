import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DocsRightMenu from './right_menu'
import DocsMobileMenu from './mobile-menu'

export const metadata = {
  title: 'Docs — SQL Performance Intelligence™',
  description: 'Install, connect, and run your first analysis with SQL Performance Intelligence™.',
}

export default function DocsPage() {
  return (
    <main>
      <Header />

      {/* Docs Layout */}
      <section className="pt-32 pb-12 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Menu */}
          <DocsMobileMenu />

          <div className="grid md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
            <DocsRightMenu />

            <article className="space-y-12">
              {/* Getting Started */}
              <section id="getting-started" className="space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Documentation</h1>
                  <p className="text-sm text-gray-600">
                    Practical setup and module usage guide for SQL Performance Intelligence.
                  </p>
                </div>

                <div id="before-you-begin" className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="text-2xl font-bold mb-3">Before You Begin</h2>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                    <li>Add at least one SQL Server connection in <span className="font-semibold">Settings &gt; Database</span>.</li>
                    <li>Activate the connection with <span className="font-semibold">Connect</span>.</li>
                    <li>
                      From the Info Bar, select active <span className="font-semibold">Server</span>,{' '}
                      <span className="font-semibold">Database</span>, and (if needed) <span className="font-semibold">AI Model</span>.
                    </li>
                  </ol>
                </div>

                <div id="overview" className="space-y-3">
                  <h3 className="text-xl font-semibold">Overview</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        What it does
                      </div>
                      <ul className="space-y-2">
                        <li>Analyzes SQL Server objects, plans, and query signals.</li>
                        <li>Generates evidence-backed, audit-ready reports.</li>
                        <li>Runs offline by default with Local LLM support.</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        What it doesn&apos;t do
                      </div>
                      <ul className="space-y-2">
                        <li>No automatic schema changes or auto-apply actions.</li>
                        <li>No background agents or persistent collectors.</li>
                        <li>No table/row data extraction as a collection step.</li>
                      </ul>
                    </div>
                  </div>
                  <Link className="text-sm font-semibold text-primary hover:text-primary-dark" href="/docs/overview">
                    Read the Overview
                  </Link>
                </div>

                <div id="installation" className="space-y-3">
                  <h3 className="text-xl font-semibold">Installation</h3>
                  <p className="text-sm text-gray-700">
                    Use the standard Windows installer for desktop environments. Offline installer is available for
                    controlled networks.
                  </p>
                  <pre className="rounded-xl bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto">
{`# Example silent install
"SQL Performance Intelligence.exe" /quiet /norestart`}
                  </pre>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1">Note</div>
                    Signed binaries are provided for enterprise change-control workflows.
                  </div>
                  <Link
                    className="text-sm font-semibold text-primary hover:text-primary-dark"
                    href="/docs/installation"
                  >
                    View installation details
                  </Link>
                </div>

                <div id="database-permissions" className="space-y-3">
                  <h3 className="text-xl font-semibold">Database User Permissions</h3>
                  <p className="text-sm text-gray-700">
                    The application operates in <span className="font-semibold">read-only</span> mode. Minimum required
                    permissions may vary by environment; these are recommended for initial setup.
                  </p>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1">Note</div>
                    Grant only required permissions and remove unnecessary privileges.
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    <li>CONNECT (connection to target database)</li>
                    <li>VIEW SERVER STATE (instance-level performance metrics)</li>
                    <li>VIEW DATABASE STATE (database-level performance metrics)</li>
                    <li>VIEW DEFINITION (procedure/view/function definitions)</li>
                    <li>SELECT on system catalog views (system metadata access)</li>
                  </ul>
                </div>

                <div id="quickstart" className="space-y-3">
                  <h3 className="text-xl font-semibold">Quickstart</h3>
                  <ol className="space-y-2 text-sm text-gray-700 list-decimal pl-4">
                    <li>Open the target module (Dashboard, Object Explorer, Query Statistics, or another module).</li>
                    <li>Set filters and scope (time range, object type, search, or severity).</li>
                    <li>Run analysis or refresh data.</li>
                    <li>Review findings and supporting evidence.</li>
                    <li>Export report/script output when needed.</li>
                  </ol>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1">Tip</div>
                    Start with Local mode (default). No prompts or context leave your network.
                  </div>
                  <Link className="text-sm font-semibold text-primary hover:text-primary-dark" href="/docs/quickstart">
                    Open the quickstart guide
                  </Link>
                </div>
              </section>

              {/* Modules */}
              <section id="modules" className="space-y-4">
                <h2 className="text-2xl font-bold">Modules</h2>
                <p className="text-sm text-gray-600">
                  Each module is designed for a specific operational question. Start with the module that matches your immediate need.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
                  <Link
                    href="/docs/modules/dashboard"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Dashboard</div>
                    <p>Monitor server health, memory, IO, TempDB, and workload trends in real time.</p>
                  </Link>
                  <Link
                    href="/docs/modules/query-statistics"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Query Statistics</div>
                    <p>Analyze high-impact queries with trend, risk, and plan stability indicators.</p>
                  </Link>
                  <Link
                    href="/docs/modules/index-advisor"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Index Advisor</div>
                    <p>Prioritize index actions, generate maintenance scripts, and export reports.</p>
                  </Link>
                  <Link
                    href="/docs/modules/blocking-analysis"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Blocking Analysis</div>
                    <p>Visualize blocking chains, identify head blockers, and export audit snapshots.</p>
                  </Link>
                  <Link
                    href="/docs/modules/wait-statistics"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Wait Statistics</div>
                    <p>Categorize waits, set baselines, compare snapshots, and export findings.</p>
                  </Link>
                  <Link
                    href="/docs/modules/security-audit"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Security Audit</div>
                    <p>Run read-only security checks and export HTML audit outputs.</p>
                  </Link>
                  <Link
                    href="/docs/modules/scheduled-jobs"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Scheduled Jobs</div>
                    <p>Track SQL Agent job health, failures, and runtime behavior.</p>
                  </Link>
                  <Link
                    href="/docs/modules/object-explorer"
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="font-semibold mb-1">Object Explorer</div>
                    <p>Browse procedures/views/functions, inspect source, and run AI Tune per object.</p>
                  </Link>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="font-semibold mb-1">Settings &amp; Info Bar</div>
                    <p>Manage DB/AI/license settings and switch active server, database, and model quickly.</p>
                  </div>
                </div>
              </section>

              <section id="workflow" className="space-y-3">
                <h2 className="text-2xl font-bold">Standard Analysis Workflow</h2>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                    <li>Connect and verify active context from the Info Bar.</li>
                    <li>Run module-specific analysis (query, index, blocking, waits, or security).</li>
                    <li>Validate evidence and confidence before applying changes.</li>
                    <li>Export report/script outputs for review and audit traceability.</li>
                  </ol>
                </div>
              </section>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
