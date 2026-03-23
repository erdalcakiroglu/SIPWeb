# Index Advisor

This document explains the **Index Advisor** module in detail. It was cross-checked against the current implementation in `app/ui/views/index_advisor_view.py`, `app/services/index_analyzer_service.py`, `app/ui/main_window.py`, `app/ui/components/sidebar.py`, and the current English labels in `app/locales/en.json`.

The Index Advisor module is the application's index-focused review and maintenance planning screen. It combines deterministic analysis, Query Store-backed historical evidence, and optional AI interpretation to help users decide which indexes should be kept, maintained, validated, or considered for removal.

## 1. Purpose of the Module

The module is used to:

- collect index metadata and workload signals for the active database
- classify indexes with a deterministic scoring model
- identify indexes that are effective, weak, maintenance-heavy, or unnecessary
- estimate drop safety using Query Store evidence and guardrails
- generate review scripts and batch maintenance/drop candidates
- export a compact analysis report
- run AI analysis for a selected index

This module is primarily an analysis and decision-support surface. It does not execute maintenance or drop actions by itself.

## 2. High-Level Layout

The screen has four practical areas:

1. **Header area**
2. **Deterministic analysis table**
3. **Right-side detail tabs**
4. **Footer summary cards**

### 2.1 Header Area

The top area shows:

- a status label
- an optional **Focus context** label when the module is opened from another workflow
- the `Refresh` button

The status label is used heavily by the module. It reports connection problems, refresh progress, completion summaries, and export/save results.

The focus context label appears when another module sends an `AnalysisContext` into Index Advisor. In that case, the next refresh tries to focus the matching object or query-related indexes.

### 2.2 Main Analysis Area

The left side contains a card titled **Deterministic Index Analysis**. This is the main working area of the module.

It includes:

- filter controls
- the analyzed index table
- batch-selection and export/script actions

### 2.3 Right Detail Area

The right side contains the **Index Details** panel with four tabs:

1. `Script`
2. `Metrics`
3. `AI Analysis`
4. `History`

Selecting a row in the table refreshes these tabs for the chosen index.

### 2.4 Footer Summary Cards

At the bottom-right, the module shows three summary cards:

- `Analyzed`
- `Needs Action`
- `Avg Score`

These cards reflect the last refresh dataset, not the currently filtered visible rows. The code explicitly keeps these values tied to the analyzed result set.

## 3. Data Sources and Analysis Model

### 3.1 Base Collection

On refresh, the module gathers deterministic index inputs from SQL Server metadata and DMVs. The implementation uses system objects and DMV signals such as:

- `sys.indexes`
- `sys.objects`
- `sys.schemas`
- `sys.dm_db_index_usage_stats`
- `sys.dm_db_index_physical_stats`
- `sys.dm_db_stats_properties`
- operational and storage metadata used by the analyzer

If the primary collection query fails, the refresh worker can switch to a legacy fallback path. That fallback is visible in telemetry and status flow.

### 3.2 Query Store Enrichment

The module adds historical and workload-impact evidence from Query Store for the selected index. In the current code, this includes:

- 30-day usage trend data by day
- dependent Query Store queries whose plans referenced the selected index
- a workload impact simulation for making the index unavailable

This means the module is not limited to static metadata. For selected rows, it also tries to answer:

- Is this index actively used over time?
- Which queries depend on it?
- How risky would a drop be?

### 3.3 Deterministic Classifications

The analyzer service currently assigns one of these main classes:

| Classification | Meaning |
| --- | --- |
| `EFFECTIVE` | Healthy and useful index with strong or acceptable workload value. |
| `EFFECTIVE_MANDATORY` | Index is effectively mandatory, typically because it is tied to a primary key or unique constraint. |
| `WEAK` | Index has some value, but usage or efficiency signals are not strong enough to treat it as clearly effective. |
| `WEAK_BUT_NECESSARY_FK` | Index may look weak from direct usage, but it is kept important because it supports foreign key behavior. |
| `NEEDS_MAINTENANCE` | Index appears useful enough to keep, but fragmentation, stale statistics, contention, or similar signals require maintenance attention. |
| `UNNECESSARY` | Index appears redundant, low-value, or overly costly relative to observed benefit. |

The service uses signals such as:

- reads versus writes
- user seeks, scans, and lookups
- fragmentation
- key width
- selectivity
- duplicate or left-prefix overlap
- object age
- stale statistics
- special-case rules for PK/unique/FK/filtered/columnstore cases

### 3.4 Drop Safety Decisions

The table also shows a separate drop-safety decision. Current decisions are:

| Decision | Meaning |
| --- | --- |
| `DO_NOT_DROP` | The module believes the index should be kept. Typical reasons are PK/unique/FK guardrails or high dependent-query impact risk. |
| `VALIDATE_BEFORE_DROP` | Evidence is mixed or incomplete. A controlled validation step is required before removal. |
| `SAFE_DROP_CANDIDATE` | The index looks like a lower-risk drop candidate based on redundancy, lack of observed use, and acceptable Query Store impact signals. |

Important interpretation note:

- `SAFE_DROP_CANDIDATE` does **not** mean "drop immediately without review"
- the current code still recommends a disable-and-monitor approach first when appropriate

## 4. Main Controls

This section explains the visible buttons, checkboxes, comboboxes, and the score slider in the current UI.

### 4.1 Button Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Refresh` | Button | Reloads deterministic analysis for the active database. | Starts the background refresh worker. If `Include Low-Usage Risk Pool on Refresh` is enabled, refresh uses a broader hybrid candidate pool. |
| `Generate Selected Action Script` | Button | Builds a maintenance/drop script for the currently selected rows. | Writes the generated script into the `Script` tab. It does not execute anything. |
| `Export Visible / Selected Report` | Button | Exports analysis rows to a Markdown report. | Exports selected rows if any are selected; otherwise exports all currently visible filtered rows. |
| `Copy Script` | Button | Copies the current contents of the `Script` tab to the clipboard. | Useful for pasting single-index DDL or the generated batch action script into another tool. |
| `Analyze` | Button | Starts AI analysis for the selected index. | Runs standard AI analysis with cache bypass enabled in the current implementation. |
| `Save LLM JSON` | Button | Saves the last AI request payload as JSON. | Disabled until an AI request payload exists for the current analysis. |
| `Save HTML` | Button | Saves the rendered AI analysis as HTML. | Disabled until an AI result has been rendered. |

### 4.2 Combobox Controls

| Control | Type | Current Options | Purpose |
| --- | --- | --- | --- |
| `Table` | Combobox | `All` plus all table names found in the current result set | Limits the table to indexes belonging to a specific table. |
| `Class` | Combobox | `All`, `EFFECTIVE`, `EFFECTIVE_MANDATORY`, `WEAK`, `WEAK_BUT_NECESSARY_FK`, `NEEDS_MAINTENANCE`, `UNNECESSARY` | Filters the grid by deterministic classification. |
| `Drop Safety` | Combobox | `All`, `DO_NOT_DROP`, `VALIDATE_BEFORE_DROP`, `SAFE_DROP_CANDIDATE` | Filters the grid by current drop-safety decision. |

### 4.3 Checkbox Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Show Needs Attention Only` | Checkbox | Focuses the table on actionable or review-worthy indexes. | ON by default. It hides rows that the module does not currently consider attention-worthy. |
| `Include Low-Usage Risk Pool on Refresh` | Checkbox | Broadens the refresh candidate pool to include some low-usage but potentially expensive indexes. | OFF by default. Changing it does not immediately reload data; it updates the status label and requires `Refresh`. |
| `Select Visible Needs Action` | Checkbox | Auto-selects visible actionable rows for batch operations. | When checked, it selects only rows currently visible in the table that meet the module's "needs attention" criteria. |

### 4.4 Score Slider

The filter row also includes a `Score >=` slider with a live numeric label.

Purpose:

- keeps only indexes whose deterministic score is greater than or equal to the chosen threshold

Current behavior:

- range is `0` to `100`
- default value is `0`
- moving the slider immediately reapplies the client-side filters

## 5. Results Table

The main table is a sortable row-based analysis grid. It supports:

- row selection
- multi-selection
- sorting
- tooltips
- right-click context actions

### 5.1 Current Columns

| Column | Meaning |
| --- | --- |
| `Table` | The table name for the index, stored with row payload for detail loading. |
| `Index` | The index name. |
| `Class` | Deterministic classification. Tooltip also shows the classification reason. |
| `Drop Safety` | User-facing rendering of the drop decision. The UI maps `DO_NOT_DROP` to `KEEP`, `VALIDATE_BEFORE_DROP` to `VALIDATE`, and `SAFE_DROP_CANDIDATE` to `SAFE DROP`. |
| `Score` | Deterministic classification score from `0` to `100`. |
| `Read/Write` | Read-to-write ratio. Higher is generally better for retained value. |
| `Frag %` | Fragmentation percentage. |
| `Seeks` | User seek count. |
| `Writes` | User update count. |

### 5.2 Color Meaning

The code uses color emphasis for several fields:

- score color changes by score band
- class color changes by classification family
- drop-safety color changes by decision

This is a quick visual aid, not an execution instruction.

### 5.3 Selection Behavior

When a row is selected, the module:

- clears previous AI export state
- refreshes the `Script`, `Metrics`, and deterministic AI preview
- starts loading Query Store usage trend data
- starts loading Query Store dependency data

This means the right-side tabs get richer after selection, even before the user clicks `Analyze`.

## 6. Batch Actions

The row below the table is intended for multi-index workflows.

### 6.1 Select Visible Needs Action

This checkbox is a convenience selector for batch work.

Use it when you want to:

- select only visible rows that need review
- avoid manually clicking many rows
- generate a script or export only likely action items

The selection is based on the module's current "needs attention" logic, not just the visible class text.

### 6.2 Generate Selected Action Script

This button creates a combined script for the selected rows.

Current script behavior:

- for maintenance-oriented indexes, it can script `ALTER INDEX ... REBUILD` or `REORGANIZE`
- for stats-oriented recommendations, it can script `UPDATE STATISTICS`
- for unnecessary indexes, it scripts `DROP INDEX` only when drop safety is `SAFE_DROP_CANDIDATE`
- for primary key indexes or unsafe drops, it writes review/skip comments instead of destructive commands

The generated result is displayed in the `Script` tab so the user can inspect it before copying it.

### 6.3 Export Visible / Selected Report

This exports a Markdown report.

Current report content includes:

- generation timestamp
- row count
- a Markdown table with table, index, classification, score, read/write ratio, and fragmentation
- consolidation notes when available

This export is intended for sharing, review, or lightweight audit documentation.

## 7. Detail Tabs

### 7.1 Script Tab

The `Script` tab is a read-only code editor.

### What It Shows

For a selected index, the tab builds a best-effort `CREATE INDEX` style script from the deterministic model output.

The generated script can include:

- `UNIQUE` when appropriate
- index type
- schema and table name
- key columns
- included columns
- filter definition
- `WITH (...)` options such as `ONLINE` and `FILLFACTOR`

Important interpretation note:

- this is a reconstructed script based on current metadata
- it is not guaranteed to be byte-for-byte identical to the original deployment script

### ONLINE Option Behavior

The current code sets `ONLINE = ON` only for editions/environments it considers capable, such as:

- Azure SQL
- Enterprise
- Enterprise Core
- Developer
- Evaluation

Otherwise it scripts `ONLINE = OFF`.

### Button in This Tab

- `Copy Script`: copies the current script text to the clipboard

### 7.2 Metrics Tab

The `Metrics` tab is a read-only text snapshot of the selected index.

It is much more detailed than the main table and currently includes sections such as:

- `Current Stats`
- `Score Model`
- `Index Value`
- `Usage`
- `Index Behavior Metrics`
- `Storage`
- `Design`
- `Diagnostics`
- `Lifetime Analysis`
- `Query Dependency`
- `Query Impact Simulation`
- `Drop Safety`
- `Column Heatmap`
- `Overlap Analysis`
- `Consolidation Candidate`

Use this tab when you want a deterministic explanation of **why** the index received its score and class.

This tab is especially useful for:

- understanding fragmentation and maintenance signals
- checking duplicate/overlap evidence
- seeing usage versus write cost
- reviewing Query Store-based impact context

There are no buttons, checkboxes, or comboboxes inside this tab in the current implementation.

### 7.3 AI Analysis Tab

The `AI Analysis` tab combines deterministic context and optional LLM output.

### Initial Behavior

Before AI is run, selecting an index already fills this tab with a **deterministic analysis snapshot**. That means the tab is useful even if AI is not configured.

The deterministic preview includes:

- executive summary
- classification and score details
- value, heat, and behavior signals
- lifetime and dependency information
- query impact simulation
- drop safety reasoning
- flags, warnings, and computed recommendations

### Buttons in This Tab

| Control | Purpose | Current Behavior |
| --- | --- | --- |
| `Analyze` | Runs AI analysis for the selected index. | Uses the selected index as the target object, starts an AI worker, and bypasses cache in the current implementation. |
| `Save LLM JSON` | Saves the exact request payload sent for the last AI run. | Disabled until payload data exists. Useful for auditing or debugging prompts. |
| `Save HTML` | Saves the rendered AI result. | Disabled until an AI result is available. Useful for sharing styled analysis output. |

### Status and Messaging

The tab also contains:

- an inline hint label that tells the user which index is ready for analysis
- a status banner used for partial/fallback AI outcomes
- a read-only result area

If no index is selected, the tab prompts the user to select one first.

### 7.4 History Tab

The `History` tab is a read-only Query Store trend panel.

### What It Shows

When Query Store data is available, the tab shows:

- a reads sparkline
- number of day-level data points
- total executions
- total logical reads
- recent daily execution/read entries

This data is currently collected from Query Store runtime stats and plan XML matching for the selected index over the last 30 days.

### Empty or Error States

If no data is found, the tab shows a message explaining that no Query Store trend data exists in the last 30 days and suggests checking whether Query Store is enabled and workload has executed.

If trend loading fails, the tab shows a Query Store-specific error message.

There are no buttons, checkboxes, or comboboxes inside this tab in the current implementation.

## 8. Context Menu

Right-clicking a row in the analysis table opens a small context menu.

Current actions are:

- `Copy Script`
- `Analyze with AI`

These actions are shortcuts to the same functionality already available in the detail tabs.

## 9. Summary Cards

The footer cards are quick summary indicators:

| Card | Meaning |
| --- | --- |
| `Analyzed` | Total analyzed indexes from the last refresh. |
| `Needs Action` | Count of analyzed indexes the module currently treats as actionable or review-worthy. |
| `Avg Score` | Average deterministic score across analyzed indexes. |

Important behavior:

- these cards are refresh-level summaries
- table filters do not change these values

## 10. Typical Workflow

A practical Index Advisor workflow usually looks like this:

1. Connect to a SQL Server instance and select the target database.
2. Open `Index Advisor`.
3. Click `Refresh` to collect the latest deterministic analysis.
4. Narrow the table with `Table`, `Class`, `Drop Safety`, and `Score >=`.
5. Keep `Show Needs Attention Only` enabled when focusing on action items.
6. Select an index to inspect `Script`, `Metrics`, `AI Analysis`, and `History`.
7. If deeper interpretation is needed, click `Analyze`.
8. For multi-row work, use `Select Visible Needs Action`.
9. Generate a batch script or export a report.
10. Validate any removal candidate before making production changes.

## 11. Interpretation Notes and Limitations

- The module is decision support, not an automatic tuner. Generated scripts are not executed by the UI.
- `SAFE_DROP_CANDIDATE` is still a recommendation category, not a production guarantee.
- Query Store-dependent sections such as `History`, dependency insights, and drop-impact simulation are only as good as the available Query Store evidence.
- The `Include Low-Usage Risk Pool on Refresh` checkbox changes the next refresh candidate set. It does nothing until refresh is run again.
- The `Script` tab can show either a single-index reconstructed script or a batch action script, depending on the last action the user took.
- If database connection is missing, refresh cannot run and historical detail loading will be unavailable.
- Summary cards represent the full analyzed refresh set, not only the filtered table view.

## 12. Cross-Check Notes

- Main module implementation: `app/ui/views/index_advisor_view.py`
- Deterministic analyzer rules: `app/services/index_analyzer_service.py`
- View registration and refresh on database context: `app/ui/main_window.py`
- Sidebar route and module label: `app/ui/components/sidebar.py`
- English locale keys: `app/locales/en.json`

This document reflects the current implementation. If the control set, tab structure, scoring model, or export/AI flow changes in code, this help page should be updated in the same change set.
