export default function WaitStatisticsTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Wait Statistics is the wait-centric diagnostics module. It combines cumulative SQL Server wait data, active
          waiting sessions, blocking-chain analysis, historical trend snapshots, and optional query-context correlation
          to help you identify the dominant source of performance pressure.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Inspect dominant wait types and category pressure.</li>
              <li>Review active waiting sessions and blocking chains.</li>
              <li>Compare against a saved baseline or explicit before/after snapshots.</li>
              <li>Configure lightweight alerts, scheduled snapshots, and custom categories.</li>
              <li>Correlate waits with a specific query and plan when query context is available.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Main Screen Areas</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Header card</li>
              <li>Filter bar</li>
              <li>Main content tabs</li>
              <li>Right-side insight panel</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Data Sources &amp; Analysis Model
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Core Wait Data</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reads cumulative wait data and active waiting requests from SQL Server DMVs.</li>
              <li>Summarizes total wait, signal wait, resource wait, and active waiting sessions.</li>
              <li>Builds top-wait, category, and current-wait views from the refresh result.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Historical Trend</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prefers Query Store wait history for longer trend windows.</li>
              <li>Falls back to locally persisted refresh snapshots when Query Store wait history is unavailable.</li>
              <li>Trend source can therefore be query-store, local history, or none.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Blocking &amp; Chain Analysis</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Uses shared blocking logic to explain live contention chains.</li>
              <li>Shows root blockers and blocked sessions with filtered tree rendering.</li>
              <li>Complements cumulative wait counters with live session context.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Query Context Mode</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>When a query ID is passed in, the module can switch to query-correlated waits.</li>
              <li>The Wait / Plan panel becomes meaningful only in this mode.</li>
              <li>The module therefore has distinct server-level and query-context behaviors.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Header, Filters &amp; Main Tabs
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Header Card</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Optional focus context label</li>
              <li>Refresh</li>
              <li>Set Baseline</li>
              <li>Export</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Filter Bar</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Trend Window</li>
              <li>DB Filter</li>
              <li>App Filter</li>
              <li>Min Wait and Apply Filter</li>
              <li>Right-aligned status or progress label</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Top Waits</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows scrollable wait rows rather than a plain table.</li>
              <li>Each row includes wait type, category, action hint, sparkline, wait time, tasks, percent, and max wait.</li>
              <li>Rows can come from cumulative waits, grouped current waits, or query-correlated waits depending on mode.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Trend &amp; Blocking</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Displays historical trend text output and a blocking-chain tree.</li>
              <li>The trend display supports Daily Summary, Dominant Category, and Category Breakdown views.</li>
              <li>The blocking tree is filtered by DB, App, and Min Wait, with a safety truncation limit for responsiveness.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Automation &amp; Admin Controls
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Scheduled Snapshot</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supports scheduled snapshot and report generation.</li>
              <li>Exposes enabled state, interval, and Save Schedule in the current UI.</li>
              <li>Execution occurs when refresh runs and the saved interval is due.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">5s Alert Monitor</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Can enable 5-second monitoring while the view is visible.</li>
              <li>Exposes threshold inputs for total wait, lock, and blocked counts.</li>
              <li>The service supports more alert fields than the current screen exposes.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Custom Category Rules</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supports regex-based operator-defined wait groups.</li>
              <li>Uses Add Category and Remove Category actions.</li>
              <li>Only enabled rules contribute to current custom-category totals.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Admin Tools</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Admin tools start locked for the session.</li>
              <li>Clear Wait Stats requires explicit arming, confirmation, and exact phrase entry.</li>
              <li>This action resets server wait counters and is audit-logged.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Right-Side Insights
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Summary &amp; Categories</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Summary shows Total Wait, Signal Wait, Resource Wait, and Current Waiters.</li>
              <li>Health badge is driven mainly by resource-wait percentage.</li>
              <li>Wait Categories break total wait into CPU, I/O, Lock, Latch, Memory, Network, Buffer, and Other.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Alerts &amp; Signature</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Alerts highlight threshold breaches and live risk signals.</li>
              <li>Signature summarizes the dominant diagnosed pattern with confidence and evidence.</li>
              <li>Examples include CPU pressure, I/O bottleneck, lock contention, memory grant pressure, and balanced wait profile.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Before / After &amp; Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Before / After is separate from baseline comparison.</li>
              <li>Actions include Save Before, Save After, Compare, Custom Category, and Remove Custom.</li>
              <li>The panel reports improved, degraded, or stable once both explicit snapshots exist.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Wait / Plan, Monitoring &amp; Intelligence</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Wait / Plan becomes useful only when the module receives query context.</li>
              <li>Monitoring summarizes configured outbound targets.</li>
              <li>Actionable Intelligence turns waits, alerts, signatures, and trend direction into a short operator playbook.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Behavior Notes, Workflow &amp; Safety
        </div>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Important Behavior Notes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>DB, App, and Min Wait filters do not fully rewrite cumulative wait-summary totals.</li>
              <li>Set Baseline and Save Before / Save After are different comparison systems.</li>
              <li>Trend source can change between Query Store, local history, and none.</li>
              <li>Some service fields exist but are not fully editable in the current main screen.</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Typical Workflow</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click Refresh and review Summary, Wait Categories, and Alerts.</li>
              <li>Inspect Top Waits to identify dominant waits and suggested action hints.</li>
              <li>Use Trend &amp; Blocking to decide whether the problem is persistent or tied to live blockers.</li>
              <li>Capture a baseline or explicit before/after snapshots when change tracking matters.</li>
              <li>Use Automation for monitoring, thresholds, scheduled snapshots, or multi-server comparison.</li>
              <li>When opened from Query Statistics, use Wait / Plan to connect waits to a specific plan shape.</li>
            </ol>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Operating Principles &amp; Safety</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module is primarily an analysis and monitoring surface.</li>
              <li>Its only destructive capability is the admin-only Clear Wait Stats command.</li>
              <li>That action is deliberately locked behind extra confirmation because it resets server-wide wait counters.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
