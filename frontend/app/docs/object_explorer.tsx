export default function ObjectExplorerTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Object Explorer is the main browsing and inspection surface for SQL Server objects in the currently selected
          database. It is built for read-oriented investigation so you can locate an object, inspect its definition,
          review lightweight statistics, trace dependencies, and launch AI Tune from one workflow.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Browse user objects by database and object type.</li>
              <li>Search by object name with multi-term matching.</li>
              <li>Inspect source code or generated table definitions.</li>
              <li>Review cached execution or table-level metadata.</li>
              <li>Trace dependencies and launch AI-assisted analysis.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Supported Objects</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stored Procedures</li>
              <li>Views</li>
              <li>Functions</li>
              <li>Triggers</li>
              <li>Tables</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">High-Level Layout</div>
        <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Left Panel</div>
            <p className="mb-3">The left side is the navigation and filtering area for database objects.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Database selector</li>
              <li>Object Type filter</li>
              <li>Search box</li>
              <li>Object list in <span className="font-mono">schema.object_name</span> format</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Right Panel</div>
            <p className="mb-3">The right side shows detail tabs for the currently selected object.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Source Code</li>
              <li>Statistics</li>
              <li>Relations</li>
              <li>AI Tune</li>
            </ol>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-700">
          Selecting an object triggers the module to load source, statistics, and relations immediately, and it also
          prepares the object context for AI Tune.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Left Panel Controls</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1 text-gray-900">Database Filter</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Loads accessible online databases and excludes system-only cases like <span className="font-mono">tempdb</span> and <span className="font-mono">model</span>.</li>
              <li>Attempts to preselect the active database from the current connection.</li>
              <li>Changing the selection refreshes the object list for that database.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1 text-gray-900">Object Type Filter</div>
            <p className="text-sm text-gray-700 mb-3">
              Narrow the list to <span className="font-medium">All Objects</span>, <span className="font-medium">Stored Procedures</span>, <span className="font-medium">Views</span>, <span className="font-medium">Triggers</span>, <span className="font-medium">Functions</span>, or <span className="font-medium">Tables</span>.
            </p>
            <p className="text-sm text-gray-700">
              The current implementation maps these options to SQL Server object type codes such as <span className="font-mono">P</span>, <span className="font-mono">V</span>, <span className="font-mono">FN</span>, <span className="font-mono">TR</span>, and <span className="font-mono">U</span>.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1 text-gray-900">Search Box</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Filters the currently loaded list client-side.</li>
              <li>Splits the search text into lowercase terms.</li>
              <li>Keeps only items that match all entered terms.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1 text-gray-900">Object List</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Displays objects in <span className="font-mono">schema.object_name</span> format with type icons.</li>
              <li>Stores schema, name, and SQL Server type metadata for downstream tabs.</li>
              <li>Acts as the main entry point for inspection and analysis.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Detail Tabs</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Source Code</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Loads programmable object definitions from SQL module metadata.</li>
              <li>Generates a best-effort <span className="font-mono">CREATE TABLE</span> script for tables.</li>
              <li>Falls back to a read-only message when source is not available.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Statistics</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Shows cached execution metrics for procedures, views, functions, and triggers.</li>
              <li>Shows row count, size, columns, indexes, and recent read/write metadata for tables.</li>
              <li>Cached-plan metrics are useful for quick triage but are not full historical totals.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Relations</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Shows both <span className="font-medium">Depends On</span> and <span className="font-medium">Used By</span> lists.</li>
              <li>Supports double-click navigation into related objects.</li>
              <li>Dependency results are best-effort and may miss dynamic SQL references.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">AI Tune</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Builds context from source, metadata, execution stats, relations, and plan signals.</li>
              <li>Supports Standard Analysis, Deep Analysis, and optional force refresh behavior.</li>
              <li>Provides progress, logs, confidence indicators, and export actions after analysis.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">AI Tune Workflow</div>
        <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Before Analysis</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Select an object from the left list.</li>
              <li>Open the <span className="font-medium">AI Tune</span> tab.</li>
              <li>Review the selected object label and collection status.</li>
              <li>Start analysis after the module prepares the object context.</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">After Analysis</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Review progress logs, status, and the confidence badge.</li>
              <li>Re-run or deepen the analysis when evidence is incomplete.</li>
              <li>Export reports as HTML, Markdown, or Text.</li>
              <li>Save the LLM request payload for audit or debugging when needed.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Typical Workflow</div>
        <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-1">
          <li>Select the target database.</li>
          <li>Filter by object type and use search to find the object.</li>
          <li>Inspect definition or generated table script in Source Code.</li>
          <li>Review cached execution data or table metadata in Statistics.</li>
          <li>Check dependencies in Relations.</li>
          <li>Open AI Tune for deeper analysis and save the result if needed.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Interpretation Notes &amp; Safety
        </div>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>No source definition does not always mean the object is unsupported; tables use generated scripts instead.</li>
          <li>No execution data in Statistics does not automatically mean the object is unused.</li>
          <li>Relations can be incomplete when dependency metadata cannot resolve dynamic SQL.</li>
          <li>AI Tune produces recommendations only and does not apply automatic changes.</li>
          <li>The module is read-only and intended for inspection, analysis, and evidence collection.</li>
        </ul>
      </div>
    </div>
  )
}
