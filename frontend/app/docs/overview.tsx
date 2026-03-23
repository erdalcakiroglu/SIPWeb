const firstDaySteps = [
  'Install the desktop app and complete license or trial activation.',
  'Ask your DBA to prepare a read-only SQL login or approved Windows account.',
  'Enable Query Store on the database you want to analyze.',
  'Add one database connection profile in Settings > Database.',
  'Add one AI provider in Settings > AI / LLM, either local Ollama or a cloud model.',
  'Connect and start with Dashboard, then move into Query Statistics or Object Explorer.',
]

const queryStoreBenefits = [
  'Query Statistics can rank important queries with better historical evidence.',
  'Index Advisor can estimate dependency and drop risk with stronger workload context.',
  'Wait Statistics can use richer query-correlation and wait-history scenarios.',
  'Regression and plan-change analysis become more trustworthy than DMV-only snapshots.',
]

const localVsCloud = [
  {
    title: 'Local (Ollama)',
    points: [
      'Best when data should stay on your own machine or inside your own network.',
      'Works well for offline or controlled environments.',
      'Requires a running Ollama service and an installed local model.',
    ],
  },
  {
    title: 'Cloud LLM',
    points: [
      'Best when you already operate OpenAI, Azure OpenAI, Anthropic, or DeepSeek.',
      'Usually easier to scale and easier to standardize across many users.',
      'Requires API credentials and, for some providers, endpoint or deployment fields.',
    ],
  },
]

export default function OverviewTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What This Product Is</div>
        <p className="text-sm text-gray-700">
          SQL Performance Intelligence is a read-only analysis application for SQL Server. It helps you inspect CPU,
          waits, blocking, indexes, SQL Agent jobs, security posture, and object-level SQL details without applying
          automatic schema changes.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What It Does</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reads performance metadata, Query Store history, and object definitions.</li>
              <li>Builds evidence-backed findings and exportable reports.</li>
              <li>Lets you add either a local or cloud LLM for deeper interpretation.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What It Does Not Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>It does not create or alter your application schema automatically.</li>
              <li>It does not need table-data read access to business rows for normal usage.</li>
              <li>It does not start with a full setup by itself; first-run settings must be completed by the user.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">If This Is Your First Day</div>
        <p className="text-sm text-gray-700">
          Follow this order. It is the fastest way to reach a working first analysis without guessing which setting
          matters first.
        </p>
        <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          {firstDaySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Before You Start</div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">1. SQL Access</div>
            <p>
              Ask your DBA for a read-only SQL login or a Windows account that has the minimum monitoring permissions.
              For most first-time users, the important permissions are <span className="font-mono">VIEW SERVER STATE</span>,{' '}
              <span className="font-mono">VIEW DATABASE STATE</span>, and <span className="font-mono">VIEW DEFINITION</span>.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">2. Query Store</div>
            <p>
              Ask for Query Store to be enabled on the database you want to analyze. Modules such as Query Statistics,
              Index Advisor, and wait-to-plan correlation work better when historical Query Store evidence exists.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">3. Decide Your AI Mode</div>
            <p>
              Decide early whether you want a local model such as Ollama or a cloud provider such as OpenAI, Azure
              OpenAI, Anthropic, or DeepSeek. That choice affects which credentials and fields you need later.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">4. Keep The First Run Simple</div>
            <p>
              Do not start by tuning thresholds, prompt rules, or advanced caching. First make one connection, one AI
              provider, and one successful analysis. Optimize later.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Why Query Store Matters</div>
        <p className="text-sm text-gray-700">
          Query Store is not required for every screen, but it is strongly recommended for real analysis. Without it,
          the app falls back to more limited live DMV data and loses historical depth.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700 space-y-1">
          {queryStoreBenefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Important</div>
          If Query Store is disabled, the application can still connect and some modules still work, but regression
          detection, plan history, and historical ranking are weaker.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Choose Your AI Path</div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          {localVsCloud.map((option) => (
            <div key={option.title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="font-semibold mb-1">{option.title}</div>
              <ul className="list-disc pl-5 space-y-1">
                {option.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-700">
          You can configure multiple providers, but keep one clear default provider for daily work. For a new user,
          one working provider is better than many partially tested providers.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Recommended First Module Order</div>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>Open Dashboard to see whether CPU, memory, IO, or TempDB pressure is already obvious.</li>
          <li>Open Query Statistics if the problem looks query-driven or workload-driven.</li>
          <li>Open Object Explorer when you need source code, object stats, dependencies, or AI Tune for one object.</li>
          <li>Open Wait Statistics or Blocking Analysis when contention is the main symptom.</li>
        </ol>
      </div>
    </div>
  )
}
