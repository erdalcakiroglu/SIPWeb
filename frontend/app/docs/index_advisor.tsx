export default function IndexAdvisorTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Index Advisor is the index-focused review and maintenance planning module. It combines deterministic
          classification, Query Store-backed evidence, and optional AI interpretation to help you decide which indexes
          should be kept, maintained, validated, or considered for removal.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What You Can Do</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Collect index metadata and workload signals for the active database.</li>
              <li>Classify indexes with a deterministic scoring model.</li>
              <li>Identify effective, weak, maintenance-heavy, or unnecessary indexes.</li>
              <li>Estimate drop safety with Query Store evidence and guardrails.</li>
              <li>Generate scripts, export reports, and run AI analysis for a selected index.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Main Screen Areas</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Header area</li>
              <li>Deterministic analysis table</li>
              <li>Right-side detail tabs</li>
              <li>Footer summary cards</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Analysis Model &amp; Data Sources
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Base Collection</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Collects index metadata, usage, physical stats, and storage signals.</li>
              <li>Uses index metadata, DMV usage counters, fragmentation, and statistics freshness inputs.</li>
              <li>Can fall back to a legacy path if the primary collection query fails.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Query Store Enrichment</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adds 30-day usage trend evidence for the selected index.</li>
              <li>Finds dependent queries whose plans referenced the index.</li>
              <li>Estimates workload impact if the index becomes unavailable.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Deterministic Classes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Effective and Effective Mandatory</li>
              <li>Weak and Weak But Necessary FK</li>
              <li>Needs Maintenance</li>
              <li>Unnecessary</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Drop Safety</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do Not Drop</li>
              <li>Validate Before Drop</li>
              <li>Safe Drop Candidate</li>
              <li>Safe Drop Candidate still means review first, not immediate removal.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Controls &amp; Filters
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Primary Buttons</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Refresh</li>
              <li>Generate Selected Action Script</li>
              <li>Export Visible / Selected Report</li>
              <li>Copy Script</li>
              <li>Analyze, Save LLM JSON, and Save HTML</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Combobox Filters</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Table</li>
              <li>Class</li>
              <li>Drop Safety</li>
            </ul>
            <p className="mt-3">
              These filters are applied against the current analyzed dataset to narrow the review surface.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Checkboxes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Show Needs Attention Only</li>
              <li>Include Low-Usage Risk Pool on Refresh</li>
              <li>Select Visible Needs Action</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Score Slider</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Filters by deterministic score threshold.</li>
              <li>Range is 0 to 100.</li>
              <li>Updates the client-side filtered table immediately.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Results Table &amp; Batch Actions
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Main Columns</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Table and Index</li>
              <li>Class and Drop Safety</li>
              <li>Score</li>
              <li>Read/Write ratio</li>
              <li>Fragmentation, seeks, and writes</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Selection Behavior</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Selecting a row refreshes Script, Metrics, and deterministic AI preview.</li>
              <li>The module also starts loading Query Store usage trend and dependency data.</li>
              <li>Right-click actions provide Copy Script and Analyze with AI shortcuts.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Batch Script Generation</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Scripts rebuild, reorganize, or update statistics for maintenance-focused rows.</li>
              <li>Scripts drop indexes only for safe drop candidates.</li>
              <li>Unsafe or protected cases produce review comments instead of destructive SQL.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Report Export</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Exports selected rows if any are selected.</li>
              <li>Otherwise exports all currently visible filtered rows.</li>
              <li>Produces a Markdown report for sharing or audit review.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Detail Tabs
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Script</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows a reconstructed best-effort CREATE INDEX style script.</li>
              <li>Can include uniqueness, index type, key columns, included columns, filters, and options.</li>
              <li>ONLINE option is decided according to edition or environment capability.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Metrics</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Explains score model, value, usage, storage, design, and diagnostics.</li>
              <li>Includes overlap analysis, column heatmap, dependency context, and drop safety reasoning.</li>
              <li>Best place to understand why an index got its class and score.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">AI Analysis</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows a deterministic preview even before AI is run.</li>
              <li>Analyze starts AI interpretation for the selected index.</li>
              <li>Save LLM JSON and Save HTML become available after usable output exists.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">History</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Shows Query Store trend data for the last 30 days when available.</li>
              <li>Includes reads sparkline, data points, executions, logical reads, and recent daily entries.</li>
              <li>Explains missing-data or Query Store error states when history is unavailable.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Summary, Workflow &amp; Safety
        </div>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Summary Cards</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Analyzed</li>
              <li>Needs Action</li>
              <li>Avg Score</li>
            </ul>
            <p className="mt-3">These cards reflect the last full refresh dataset, not only the currently filtered rows.</p>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Typical Workflow</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Refresh the active database analysis.</li>
              <li>Narrow the table with Table, Class, Drop Safety, and Score.</li>
              <li>Keep Needs Attention enabled when focusing on action items.</li>
              <li>Select an index and inspect Script, Metrics, AI Analysis, and History.</li>
              <li>Use batch selection, script generation, or export when working across multiple rows.</li>
              <li>Validate any drop candidate before making production changes.</li>
            </ol>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Interpretation Notes</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>The module is decision support only and does not execute generated scripts.</li>
              <li>Safe Drop Candidate is a recommendation category, not a production guarantee.</li>
              <li>Query Store-dependent history and impact sections are only as good as the available evidence.</li>
              <li>Include Low-Usage Risk Pool changes the next refresh candidate set and does nothing until refresh is run again.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
