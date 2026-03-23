type BlockingMetric = {
  name: string
  meaning: string
  interpretation: string
}

type BlockingMetricSection = {
  title: string
  description: string
  metrics: BlockingMetric[]
}

const blockingMetricSections: BlockingMetricSection[] = [
  {
    title: 'Severity & Summary Statistics',
    description:
      'These are the top-level numbers that tell you how serious the current blocking picture is before you inspect individual sessions.',
    metrics: [
      {
        name: 'Critical / High / Medium / Low Sessions',
        meaning:
          'Counts blocking sessions by wait-time severity. The severity banner and quick summary use the latest live snapshot, not long-term history.',
        interpretation:
          'Low is under 5 seconds, Medium is 5-30 seconds, High is 30-60 seconds, and Critical is 60 seconds or more.',
      },
      {
        name: 'Total Blocking',
        meaning:
          'Shows the total number of blocking sessions detected in the current refresh. It is the fastest indicator of whether the problem is isolated or widespread.',
        interpretation:
          'Rising totals usually mean more of the workload is being delayed, even if one head blocker is responsible.',
      },
      {
        name: 'Head Blockers',
        meaning:
          'Counts sessions that sit at the top of a blocking chain and are directly or indirectly blocking others.',
        interpretation:
          'A small head-blocker count with many blocked sessions usually points to a concentrated root cause.',
      },
      {
        name: 'Max Wait',
        meaning:
          'Shows the highest single wait time seen in the current blocking snapshot.',
        interpretation:
          'This is a fast severity signal. A high Max Wait means at least one session has been blocked long enough to deserve immediate review.',
      },
      {
        name: 'Affected Sessions',
        meaning:
          'Counts how many sessions are impacted by current blocking, not only how many sessions are themselves blockers.',
        interpretation:
          'Use this together with Head Blockers to estimate blast radius. One blocker can affect many sessions.',
      },
      {
        name: 'Chain Count',
        meaning:
          'Shows how many separate blocking chains exist in the current snapshot.',
        interpretation:
          'More chains usually mean the issue is broad or concurrent, while one chain suggests a concentrated incident.',
      },
      {
        name: 'Max Chain Depth',
        meaning:
          'Shows the deepest blocker-to-blocked hierarchy currently visible.',
        interpretation:
          'A deeper chain means delays are cascading through multiple downstream sessions.',
      },
      {
        name: 'Total Wait Time',
        meaning:
          'Represents the combined blocked wait time across the current blocking set.',
        interpretation:
          'Use it to gauge total pain, not just the worst single session.',
      },
    ],
  },
  {
    title: 'Tree, Details & Session Statistics',
    description:
      'These numbers help you understand each blocker or blocked session in more detail after you move past the summary level.',
    metrics: [
      {
        name: 'Wait Time',
        meaning:
          'Shows how long the selected or listed session has been waiting on its current blocking condition.',
        interpretation:
          'Use this to prioritize urgent cases. Longer wait usually means higher user-facing impact.',
      },
      {
        name: 'Depth',
        meaning:
          'Shows how far down the session appears in the current blocking hierarchy.',
        interpretation:
          'Depth 0 or root-level items are usually the origin side of the chain. Higher depth values are downstream victims.',
      },
      {
        name: 'Blocked Count',
        meaning:
          'Counts how many sessions are directly or indirectly blocked by the selected head blocker.',
        interpretation:
          'Higher blocked count means the session has a wider operational impact.',
      },
      {
        name: 'CPU (s)',
        meaning:
          'Shows CPU time associated with the session in seconds on the head blocker list.',
        interpretation:
          'High CPU on a blocker can suggest that the blocking session is both expensive and disruptive.',
      },
      {
        name: 'Direct Blocked Sessions',
        meaning:
          'Shows how many sessions the selected session is blocking immediately, before counting deeper descendants.',
        interpretation:
          'Use this to distinguish a direct head blocker from a session that is only part of a larger chain.',
      },
      {
        name: 'Safe To Kill',
        meaning:
          'Indicates whether the current UI and model consider the session a safe kill candidate.',
        interpretation:
          'Safe does not mean risk-free. Unsafe sessions are blocked or warned due to system, replication, backup, restore, or protected-command rules.',
      },
      {
        name: 'Chain Depth',
        meaning:
          'Appears in the Session Inspector summary to show how deep the selected session is inside the current chain.',
        interpretation:
          'Use it together with Direct Blocked Sessions and Blocked Count to understand whether the session is a root cause or a downstream victim.',
      },
      {
        name: 'Lock Count / Lock Grouping',
        meaning:
          'Groups lock details by resource type, lock mode, status, resource, and count for the selected session.',
        interpretation:
          'Large counts or waiting and converting lock states usually mean the session is holding or requesting contested resources.',
      },
    ],
  },
  {
    title: 'Timeline & Impact Statistics',
    description:
      'These numbers help you understand whether blocking is recurring, getting worse, or likely to improve if intervention happens.',
    metrics: [
      {
        name: 'Snapshots',
        meaning:
          'Shows how many application-captured blocking snapshots exist for the recent timeline window.',
        interpretation:
          'Low snapshot count can simply mean the app was not open or the module was not refreshing.',
      },
      {
        name: 'Avg Total Wait',
        meaning:
          'Shows the average combined wait time across the captured timeline snapshots.',
        interpretation:
          'Use this to judge whether the incident is a spike or part of a persistent pattern.',
      },
      {
        name: 'Peak Chain Depth',
        meaning:
          'Shows the deepest blocking chain observed across recent saved snapshots.',
        interpretation:
          'A high peak suggests that at least one prior incident cascaded far beyond a simple two-session block.',
      },
      {
        name: 'Latest Total Wait',
        meaning:
          'Shows the most recent total blocked wait seen in the timeline snapshot series.',
        interpretation:
          'Compare it with Avg Total Wait to see whether the current state is better or worse than the recent norm.',
      },
      {
        name: 'Sessions That May Unblock',
        meaning:
          'Estimated number of sessions that could be released if the selected blocker is removed.',
        interpretation:
          'This is a heuristic estimate, useful for triage but not a guarantee.',
      },
      {
        name: 'Peak Impacted Wait',
        meaning:
          'Shows the highest blocked wait that may be relieved by intervening on the selected session.',
        interpretation:
          'High peak impacted wait means at least one downstream session is suffering heavily.',
      },
      {
        name: 'Aggregate Impacted Wait',
        meaning:
          'Shows the combined blocked wait that may be improved if the selected blocker is removed.',
        interpretation:
          'Use this to estimate overall benefit instead of focusing on only one downstream victim.',
      },
      {
        name: 'Estimated Recovery Time',
        meaning:
          'A heuristic estimate of how quickly blocking pressure may unwind after killing or resolving the selected session.',
        interpretation:
          'Treat this as guidance only. Real recovery depends on rollback cost, workload shape, and transaction state.',
      },
    ],
  },
]

const blockingInterpretationGuide = [
  'If Head Blockers is low but Affected Sessions is high, one or two sessions are likely causing a broad outage.',
  'If Max Wait and Total Wait Time are both high, the problem is both severe for individuals and expensive overall.',
  'If Max Chain Depth is rising, blocking is cascading through dependent work rather than staying isolated.',
  'If Blocked Count is high on one session, investigate that blocker before drilling into downstream victims.',
  'If Timeline Avg Total Wait and Latest Total Wait both stay high, the issue is likely recurring rather than a short spike.',
  'If Safe To Kill is negative, review the session carefully before considering intervention.',
]

export default function BlockingAnalysisTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Blocking Analysis is the real-time blocking investigation module. It combines live blocking snapshots,
          head-blocker identification, history captured by the application, export actions, and a detailed Session
          Inspector so you can understand who is blocking whom and decide whether intervention is safe.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Detect active blocking chains and identify head blockers.</li>
              <li>View the same incident as graph, tree, timeline, and head-blocker list.</li>
              <li>Inspect SQL text, locks, plan summaries, and impact analysis for a selected session.</li>
              <li>Export snapshots, reports, audit logs, and captured history.</li>
              <li>Kill a session only after reviewing safety and impact signals.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Main Screen Areas</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Top action bar</li>
              <li>Severity and quick-action area</li>
              <li>Main work area with left-side tabs</li>
              <li>Right-side Session Inspector</li>
              <li>Footer summary cards</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Refresh, Severity &amp; Main Controls
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Refresh Model</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module collects a live blocking snapshot with a background worker.</li>
              <li>Auto-refresh runs every 5 seconds when enabled and the view is visible.</li>
              <li>If no active connection exists, auto-refresh is turned off and the view shows a disconnected hint.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Top Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Auto-Refresh toggle and Refresh Now</li>
              <li>Export CSV, Report, Audit CSV, and History CSV</li>
              <li>AI Brief</li>
              <li>Investigate and Kill Top Blocker</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Severity Model</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Low: wait below 5 seconds</li>
              <li>Medium: 5 to 30 seconds</li>
              <li>High: 30 to 60 seconds</li>
              <li>Critical: 60 seconds or higher</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Filters</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Database, User, Application, and Severity</li>
              <li>Min Wait and Max Wait</li>
              <li>Critical Only, Production DB, and Head Blockers quick filters</li>
              <li>Saved filters, alert rules, and webhook settings</li>
            </ul>
          </div>
        </div>
      </div>

      {blockingMetricSections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{section.title}</div>
          <p className="mb-4 text-sm text-gray-700">{section.description}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {section.metrics.map((metric) => (
              <div key={metric.name} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="font-semibold mb-2 text-gray-900">{metric.name}</div>
                <p className="text-sm text-gray-700">{metric.meaning}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">How To Read It</div>
                <p className="mt-1 text-sm text-gray-700">{metric.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Main Tabs &amp; Session Inspector
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Left-Side Tabs</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Filter controls visibility, notifications, and saved presets.</li>
              <li>Graph renders blocking chains visually and supports PNG export.</li>
              <li>Tree shows exact chain hierarchy with per-session columns.</li>
              <li>Timeline shows application-captured blocking history for the last 24 hours.</li>
              <li>Details shows a compact head-blocker list.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Session Inspector Tabs</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>SQL Statement shows session identity, severity, safety, and current SQL text.</li>
              <li>Locks groups lock details by resource type, mode, status, and count.</li>
              <li>Execution Plan shows plan summary, warnings, and XML preview when available.</li>
              <li>Impact Analysis estimates sessions affected, risk, and recovery considerations.</li>
              <li>History shows recurring-blocker presence captured by the application.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Quick Interpretation Guide</div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          {blockingInterpretationGuide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Workflow</div>
        <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-1">
          <li>Open Blocking Analysis and take a fresh snapshot or leave auto-refresh enabled.</li>
          <li>Read the severity banner and quick summary before drilling into one session.</li>
          <li>Use Graph for shape, Tree for exact hierarchy, and Details for a compact blocker list.</li>
          <li>Select a session and review SQL Statement, Locks, Execution Plan, and Impact Analysis together.</li>
          <li>Use Timeline and History when you need to know whether the blocker is recurring.</li>
          <li>Kill a session only after reviewing safety and likely impact.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Operating Principles &amp; Safety
        </div>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>The module is an investigation and response surface, not an auto-remediation tool.</li>
          <li>Timeline and recurring history depend on snapshots previously captured by this application.</li>
          <li>Production DB is a simple name heuristic, not a formal environment flag.</li>
          <li>AI Brief is a local heuristic summary in the current build, not a full LLM workflow.</li>
          <li>Killing a session always requires explicit confirmation and can still be rejected by safety validation.</li>
        </ul>
      </div>
    </div>
  )
}
