export default function SecurityAuditTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Security Audit is the read-only SQL Server security review module. It collects server-level and current
          database security signals, turns them into structured findings, and summarizes the posture with severity
          counts, login inventory, maturity level, and maturity score.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Run a consolidated security posture audit for the active connection.</li>
              <li>Review risky findings with severity and category labels.</li>
              <li>Inspect server login inventory and basic login health state.</li>
              <li>Summarize security posture with maturity level and score.</li>
              <li>Export the result as a structured HTML audit report.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Live Screen Areas</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Top action area</li>
              <li>Left findings panel</li>
              <li>Right logins panel</li>
              <li>Footer summary cards</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Audit Scope &amp; Data Sources
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">SQL Sources</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Server principals, role memberships, and permissions</li>
              <li>Database principals and database permissions</li>
              <li>Configuration views, credentials, and endpoints</li>
              <li>Server properties and best-effort Force Encryption reads</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Collected Outputs</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Server login and sysadmin counts</li>
              <li>Login inventory and account state</li>
              <li>Security findings with category and severity</li>
              <li>Maturity score, maturity level, and category breakdown</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Finding Families</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authentication and authorization posture</li>
              <li>Surface area and execution risk</li>
              <li>Network, endpoints, and encryption</li>
              <li>Monitoring, audit, patch, and database configuration signals</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Module Boundary</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module is assessment and reporting only.</li>
              <li>It does not remediate findings automatically.</li>
              <li>It does not change SQL Server security configuration by itself.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Controls &amp; Live Panels
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Top Action Area</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Audit progress indicator</li>
              <li>Save HTML</li>
              <li>Run Audit</li>
            </ul>
            <p className="mt-3">The audit does not auto-run when the page becomes visible. It starts only after Run Audit is clicked.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Progress Behavior</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The progress bar is hidden while idle.</li>
              <li>It becomes visible during audit execution.</li>
              <li>It uses an indeterminate style rather than a percentage.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Security Issues Panel</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows a placeholder before the first audit.</li>
              <li>Shows issue cards after an audit completes.</li>
              <li>Shows a success message when no findings exist.</li>
              <li>Issue cards use risk-colored borders and structured metadata.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Server Logins Panel</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lists up to the first 30 returned server logins.</li>
              <li>Shows login name, login type, and health state.</li>
              <li>Status labels include Active, Disabled, Locked, and Expired.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Findings, Severity &amp; Maturity
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Finding Metadata</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Title, description, category, and risk badge</li>
              <li>Why and attack scenario text</li>
              <li>Compliance and control references</li>
              <li>Optional detail snippets and recommendation text</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Risk Levels</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Critical</li>
              <li>High</li>
              <li>Medium</li>
              <li>Low</li>
              <li>Info</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Footer Summary Cards</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Critical, High, Medium, and Low finding counts</li>
              <li>Total Logins and Sysadmins</li>
              <li>Maturity and Score</li>
              <li>Maturity and Score cards include tooltip help in the live UI.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Maturity Model</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Computes a score from 0 to 100 and a maturity level from L1 to L5.</li>
              <li>Applies weighted penalties based on finding severity.</li>
              <li>Supports profile variants such as standard, hardened, and banking.</li>
              <li>Can cap maturity level when foundational controls fail.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          HTML Report &amp; Export
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Live UI vs HTML Report</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The live module has no in-app tabs.</li>
              <li>The saved HTML report does have tabs.</li>
              <li>This distinction matters when comparing the screen with the exported output.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">HTML Report Tabs</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Summary</li>
              <li>Issues</li>
              <li>Cross-Mapping</li>
              <li>Logins</li>
            </ol>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">What Save HTML Contains</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generated timestamp and top summary cards</li>
              <li>Environment and connection context</li>
              <li>Issue list and framework cross-mapping</li>
              <li>Logins table, surface-area configuration, and maturity breakdown</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Export Notes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verification queries appear in the HTML report, not the live issue cards.</li>
              <li>Some contextual fields may be unavailable depending on permissions.</li>
              <li>Save HTML stays disabled until a successful audit result exists.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Workflow &amp; Interpretation Notes
        </div>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Typical Workflow</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Connect to the target SQL Server and database.</li>
              <li>Open Security Audit and click Run Audit.</li>
              <li>Review footer cards for severity and maturity context.</li>
              <li>Read issue cards from highest risk downward.</li>
              <li>Check the login inventory for disabled, locked, or expired accounts.</li>
              <li>Save the result as HTML when the findings need to be shared or archived.</li>
            </ol>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Interpretation Notes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module is read-only and does not apply fixes.</li>
              <li>Some checks are best-effort and can be affected by SQL permissions or environment limits.</li>
              <li>The right login panel is capped at 30 visible rows in the live UI.</li>
              <li>Force Encryption and some contextual export details may be unavailable depending on access rights.</li>
              <li>The live issue list is intentionally shorter than the exported HTML evidence set.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
