export default function QueryStatisticsTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Query Statistics is the query-centric performance review module. It helps you find the highest-impact queries,
          inspect source and execution plans, review deterministic scoring signals, run AI analysis, and pivot into
          related modules such as Wait Statistics or Index Advisor.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Rank queries by impact, latency, CPU, reads, executions, or risk.</li>
              <li>Inspect source code, query text, and execution plans.</li>
              <li>Review trend, regression, and plan stability signals.</li>
              <li>Run AI analysis for one query or a selected batch.</li>
              <li>Export, compare, and hand off findings for tuning work.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Main Screen Areas</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Query Store Health banner</li>
              <li>Filter toolbar</li>
              <li>Batch operations bar</li>
              <li>Results list</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Data Source &amp; Health
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Preferred Source</div>
            <p className="mb-3">
              The module prefers Query Store when it is available and healthy because it provides richer historical
              coverage.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Query Store queries, plans, and runtime statistics</li>
              <li>More reliable trend and regression context</li>
              <li>Better depth for impact and stability analysis</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Fallback Source</div>
            <p className="mb-3">
              If Query Store is unavailable or unhealthy, the service can fall back to DMV-based data with more limited
              historical depth.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-mono">sys.dm_exec_query_stats</span></li>
              <li><span className="font-mono">sys.dm_exec_sql_text</span></li>
              <li><span className="font-mono">sys.dm_exec_query_plan</span></li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Health Banner</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Green</span>: Query Store is operational and recent.</li>
              <li><span className="font-medium">Yellow</span>: Query Store is available but stale or partial.</li>
              <li><span className="font-medium">Red</span>: Query Store is disabled, unavailable, or permission-blocked.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Why It Matters</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fallback mode can reduce historical coverage.</li>
              <li>Missing permissions can limit source access or disable the module.</li>
              <li>Health and warning banners explain degraded or partial results.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Filters &amp; Batch Controls
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Filter Toolbar</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Duration</span>: Last 24 Hours, Last 7 Days, Last 30 Days</li>
              <li><span className="font-medium">Order By</span>: Impact Score, Average Duration, Total CPU, Execution Count, Logical Reads, Risk Score</li>
              <li><span className="font-medium">Limit</span>: Top 500, 1000, 2000, or 5000</li>
              <li><span className="font-medium">Search</span>: client-side filtering by query display name</li>
              <li><span className="font-medium">Reset to Defaults</span>: restores per-database defaults and reloads the list</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Visibility Controls</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Show System Queries</span> is off by default.</li>
              <li><span className="font-medium">Show Sensitive Data</span> is off by default and requires explicit confirmation.</li>
              <li>Filter state is persisted per active connection and database.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Batch Operations Bar</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Batch Operations</li>
              <li>Select Top 10 by CPU</li>
              <li>Clear Selection</li>
              <li>Selected: N counter</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Batch Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Analyze Selected with AI</li>
              <li>Export Selected to CSV</li>
              <li>Compare Selected Queries</li>
              <li>Batch AI currently analyzes only the first 10 selected queries.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Results List &amp; Indicators
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Query Cards</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Priority color bar and selection checkbox</li>
              <li>Query display name and optional CPU or IO flags</li>
              <li>Average duration, average CPU, executions, and plan count</li>
              <li>Last execution time, risk score, impact score, trend, and stability</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Main Signals</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Impact Score</span> prioritizes workload importance, not just latency.</li>
              <li><span className="font-medium">Trend %</span> compares the current window with the prior window.</li>
              <li><span className="font-medium">Risk Score</span> is a deterministic 0-100 signal.</li>
              <li><span className="font-medium">Stability</span> is derived from plan count and variability.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Quick Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>View opens Source Code.</li>
              <li>Plan opens Execution Plan.</li>
              <li>AI and Details &amp; Recommendations open AI Analysis.</li>
              <li>Related pivots into Wait Statistics.</li>
              <li>Watch pivots into Index Advisor.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Extra Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Right-click opens module shortcuts such as missing indexes or wait analysis.</li>
              <li>A warning line appears for unstable multi-plan behavior.</li>
              <li>Load More fetches the next page when more results exist.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Query Detail Dialog
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Header Controls</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Back returns to the list.</li>
              <li>Analyze with AI starts analysis for the current query.</li>
              <li>Cancel stops the current AI run when active.</li>
              <li>The header also shows AI status and query identity.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Tabs</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Source Code</li>
              <li>Execution Plan</li>
              <li>AI Analysis</li>
            </ol>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Source &amp; Plan Behavior</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Source first tries the object definition, then falls back to query text.</li>
              <li>Execution Plan loads and parses plan XML through the viewer.</li>
              <li>Plan tab can surface warnings or missing-index signals.</li>
              <li>When sensitive data is hidden, SQL literals and plan values are sanitized.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">AI Analysis Output</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows context quality, bottleneck classification, and progress details.</li>
              <li>Provides Copy Text, Save Report, and Save LLM Request after successful runs.</li>
              <li>Report export formats include HTML, Markdown, and Text.</li>
              <li>LLM request export is available as JSON when present.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          AI, Security &amp; Practical Workflow
        </div>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Sensitive Data Rules</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>If sensitive data is off, the module uses redacted SQL and plan context.</li>
              <li>If sensitive data is on with a local provider, raw context can be used.</li>
              <li>If sensitive data is on with a cloud provider, the UI asks for explicit additional consent.</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Permissions &amp; Warnings</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-mono">VIEW SERVER STATE</span> is required for full module functionality.</li>
              <li>Source viewing additionally depends on definition access.</li>
              <li>The warning banner surfaces fallback mode, stale Query Store, hidden system queries, and permission gaps.</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Typical Workflow</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Review the Query Store Health banner first.</li>
              <li>Adjust Duration, Order By, Limit, and optional visibility settings.</li>
              <li>Search for the target query or object.</li>
              <li>Open View, Plan, or AI depending on the next question.</li>
              <li>Use Related or Watch to move into Wait Statistics or Index Advisor when needed.</li>
              <li>Export results or run batch actions for broader review.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
