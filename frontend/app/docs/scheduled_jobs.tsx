export default function ScheduledJobsTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Scheduled Jobs is a read-only monitoring and triage surface for SQL Server Agent jobs. It helps you review
          job status, recent runs, step-level failures, alert-oriented failure groupings, and Database Mail-related
          issues without executing jobs or changing SQL Agent configuration.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>List SQL Agent jobs for the active instance.</li>
              <li>Spot failed, disabled, never-run, overdue, or long-running jobs.</li>
              <li>Inspect steps, recent execution history, and grouped failures.</li>
              <li>Open Database Mail diagnostics for mail-related failures.</li>
              <li>Export evidence and copy read-only remediation SQL.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Main Screen Areas</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Top toolbar</li>
              <li>Left jobs list panel</li>
              <li>Right details and alert panel</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Data Sources &amp; Refresh Model
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Main Job Data</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-mono">msdb.dbo.sysjobs</span></li>
              <li><span className="font-mono">msdb.dbo.sysjobactivity</span></li>
              <li><span className="font-mono">msdb.dbo.sysjobhistory</span></li>
              <li><span className="font-mono">msdb.dbo.sysjobsteps</span> and scheduling metadata</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Mail Diagnostics</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-mono">sys.configurations</span></li>
              <li><span className="font-mono">msdb.dbo.sysmail_profile</span></li>
              <li><span className="font-mono">msdb.dbo.sysmail_event_log</span></li>
              <li>Database Mail profile and permission state</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Refresh Behavior</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supports manual refresh and optional auto-refresh.</li>
              <li>Refresh runs only when the view is initialized and visible.</li>
              <li>Auto-refresh stops when hidden, paused, or set to <span className="font-medium">Off</span>.</li>
              <li>Successful refresh updates the last refresh timestamp.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Permission Fallback</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module prefers live activity data from <span className="font-mono">sysjobactivity</span>.</li>
              <li>If access is limited, it falls back to reduced summary behavior.</li>
              <li>Basic job data still loads, but running-job visibility may be incomplete.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Toolbar, Filters &amp; Job List
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Top Toolbar</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Last refresh timestamp</li>
              <li>Refresh interval: 10s, 30s, 60s, or Off</li>
              <li>Pause Auto Refresh / Resume Auto Refresh</li>
              <li>Manual Refresh</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Primary Filters</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Category</li>
              <li>Needs Attention</li>
              <li>Only failures with 24h or 7d failure window</li>
              <li>Only disabled</li>
              <li>Only long running (&gt;30m)</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Status Chips</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>All</li>
              <li>Running</li>
              <li>Failed</li>
              <li>Succeeded</li>
              <li>Disabled</li>
              <li>Never run</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Job Table</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows job, status, category, last run, durations, success rate, owner, proxy context, schedule, next run, and enabled state.</li>
              <li>Search filters the current dataset client-side across multiple fields.</li>
              <li>The view tries to preserve the previous selection when filters change.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Job Details Tab
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Summary</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows status, enabled state, owner, proxy, category, schedule, and next run.</li>
              <li>Includes last run, last duration, 7-day average duration, success rate, and outcome code.</li>
              <li>Displays the last outcome message in a read-only text area.</li>
              <li>Schedule summaries can collapse multiple schedules into a compact label.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Steps</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lists step name, subsystem, and command preview.</li>
              <li>Highlights the latest failed step when identifiable.</li>
              <li>Shows the selected step&apos;s latest message in a read-only area.</li>
              <li>Supports copying the message or searching the error in Microsoft Learn.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">History</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows 24h and 7d summary labels for job-outcome rows.</li>
              <li>Displays the newest 20 outcome rows with start, end, duration, and outcome.</li>
              <li>Focuses on recent evidence for operator review.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Useful Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Copy the full last outcome message.</li>
              <li>Copy the selected step message.</li>
              <li>Open an external knowledge search for the current step error.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Alert Inbox
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Running</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lists currently executing jobs with start time, elapsed time, current step, and estimated end.</li>
              <li>Estimated end depends on historical averages and may be blank.</li>
              <li>The tab is informational only and does not expose stop actions.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Failed</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Groups recent failed step executions from the last 24 hours.</li>
              <li>Groups by job, step, and normalized error message.</li>
              <li>Shows top root causes, grouped failures, full error text, and operator actions.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Root-Cause Heuristics</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Database Mail failure</li>
              <li>Proxy permission</li>
              <li>Timeout</li>
              <li>Login failed</li>
              <li>Other</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Failure Actions</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Open job details and jump back to the selected job.</li>
              <li>Copy error, export recent evidence, and show related <span className="font-mono">msdb</span> references.</li>
              <li>Copy a read-only remediation SQL helper script.</li>
              <li>Open troubleshooting docs and generate an incident note.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Mail Health, Limits &amp; Workflow
        </div>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Mail Health</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Focuses on Database Mail-related failures with read-only quick checks.</li>
              <li>Can show whether Database Mail XPs are enabled, profile counts, default profile state, and the most recent event or error.</li>
              <li>Supports copying the current quick-check panel for escalation or manual validation.</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Operator Notes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module is read-only and does not run, stop, or edit jobs.</li>
              <li><span className="font-medium">Only failures</span> is based on the latest failed outcome, not full historical matching.</li>
              <li>Root-cause labels and mail classifications are heuristic and may require manual confirmation.</li>
              <li>Live running-job visibility can degrade when access to activity views is limited.</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Typical Workflow</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Refresh the screen and review the jobs list.</li>
              <li>Narrow the list with status chips, category, or quick filters.</li>
              <li>Select a job and inspect its summary, steps, and history.</li>
              <li>Open Alert Inbox &gt; Failed for repeated step failures.</li>
              <li>Use remediation SQL, incident notes, or exports for deeper triage.</li>
              <li>Check Mail Health when the failure looks Database Mail-related.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
