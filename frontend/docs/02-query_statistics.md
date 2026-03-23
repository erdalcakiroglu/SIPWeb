# Query Statistics

This document explains the **Query Statistics** module in detail. It was cross-checked against the current implementation in `app/ui/views/query_stats_view.py`, `app/ui/views/query_stats_controllers.py`, `app/services/query_stats_service.py`, `app/database/queries/query_store_queries.py`, and `app/models/query_stats_models.py`.

The Query Statistics module is the application’s query-centric performance review screen. It is designed to help users identify the highest-impact queries, inspect their source and execution plans, review deterministic scoring signals, and run AI-assisted analysis on individual or multiple queries.

## 1. Purpose of the Module

The module is used to:

- list the most important or expensive queries for the current database
- sort queries by workload impact, latency, CPU, reads, execution count, or risk
- inspect source code or query text
- inspect execution plans
- review plan stability and regression signals
- run AI analysis for a single query
- run batch AI analysis for selected queries
- export selected results
- jump from a query into related modules such as Wait Statistics or Index Advisor

The service prefers **Query Store** when it is available and operational. If Query Store is unavailable or a Query Store query fails, the module can fall back to DMV-based data with more limited historical depth.

## 2. Main Screen Layout

The main Query Statistics screen has four practical areas:

1. **Query Store Health banner**
2. **Filter toolbar**
3. **Batch operations bar**
4. **Results list**

There are no tabs on the main list screen itself. The tabs appear inside the **query detail dialog** that opens when a query is viewed.

## 3. Data Source Behavior

### 3.1 Preferred Source

When possible, the module uses Query Store data from views such as:

- `sys.query_store_query`
- `sys.query_store_plan`
- `sys.query_store_runtime_stats`
- `sys.query_store_runtime_stats_interval`

### 3.2 Fallback Source

If Query Store is not available, not operational, or the Query Store path fails, the service can fall back to DMV-based data such as:

- `sys.dm_exec_query_stats`
- `sys.dm_exec_sql_text`
- `sys.dm_exec_query_plan`

### 3.3 Why This Matters

This affects what the module can show:

- Query Store usually provides richer historical coverage
- DMV fallback is useful, but more dependent on cache state and server uptime
- some warnings in the UI are explicitly there to tell the user when results are degraded or partial

## 4. Query Store Health Banner

At the top of the screen, the module shows a **Query Store Health** banner.

This banner summarizes:

- whether the module can run at all
- whether Query Store is healthy
- whether Query Store is recent enough to trust
- whether the module is using Query Store or DMV fallback
- whether source code access is limited by permission

### 4.1 Health States

Current health states are:

- **GREEN**: Query Store is operational and recent data exists
- **YELLOW**: Query Store is available but has stale or partial issues
- **RED**: Query Store is disabled, non-operational, permission-blocked, or not connected

### 4.2 Typical Reasons for RED or YELLOW

- no active database connection
- missing `VIEW SERVER STATE`
- Query Store disabled
- Query Store not in `READ_WRITE`
- stale Query Store data
- source code permissions missing

## 5. Filter Toolbar

The filter toolbar is the main control strip for shaping the query list.

### 5.1 Combobox Controls

| Control | Type | Current Options | Purpose |
| --- | --- | --- | --- |
| `Duration` | Combobox | `Last 24 Hours`, `Last 7 Days`, `Last 30 Days` | Sets the analysis window used when loading query data. In code, these map to `1`, `7`, and `30` days. |
| `Order By` | Combobox | `Impact Score`, `Average Duration`, `Total CPU`, `Execution Count`, `Logical Reads`, `Risk Score` | Controls how the top queries are ranked before being shown. |
| `Limit` | Combobox | `Top 500`, `Top 1000`, `Top 2000`, `Top 5000` | Sets the overall result cap for the current filter. Default is `Top 1000`. |

### 5.2 Checkbox Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Show System Queries` | Checkbox | Includes or hides internal/system-like SQL text patterns from the list. | OFF by default. When OFF, ad hoc queries against `sys.*` and `INFORMATION_SCHEMA` are hidden unless the row is tied to a named object. |
| `Show Sensitive Data` | Checkbox | Controls whether SQL literals and plan values are shown in raw form instead of redacted form. | OFF by default. Turning it ON requires explicit confirmation and only applies to the current session. Turning it OFF also clears cloud-AI sensitive opt-in state. |

### 5.3 Search Box

Although not a combobox or checkbox, the **Search** text box is an important filter control.

Purpose:

- filters the currently loaded query list by query display name

Current behavior:

- filtering is client-side after data is loaded
- the search filter is persisted per active database context

### 5.4 Button Controls in the Filter Toolbar

| Control | Type | Purpose |
| --- | --- | --- |
| `Reset to Defaults` | Button | Restores the current database’s Query Statistics filters to default values, clears persisted filter memory for that database, invalidates cached top-query results, and reloads the list. |

### 5.5 Filter Persistence

The module persists filter state by active connection/database key.

In the current code, this includes:

- duration
- sort order
- top-N limit
- search text
- whether system queries are included

This means different databases can keep different remembered filter states.

## 6. Batch Operations Bar

Below the filter toolbar, the module shows a dedicated selection and batch-action row.

### 6.1 Button Controls in the Batch Bar

| Control | Type | Purpose |
| --- | --- | --- |
| `Batch Operations` | Button | Opens a menu for bulk actions on selected queries. |
| `Select Top 10 by CPU` | Button | Automatically checks the top 10 loaded queries ranked by average CPU time. |
| `Clear Selection` | Button | Clears both checkbox-based selection and row selection. |

### 6.2 Selection Counter

The `Selected: N` label shows how many queries are currently selected.

Important behavior:

- if any query checkboxes are checked, the selected count is based on checked IDs
- otherwise it falls back to list row selection count

This is useful because the module supports both row highlighting and explicit checkbox selection.

### 6.3 Batch Operations Menu

The `Batch Operations` button opens a menu with these actions:

- `Analyze Selected with AI`
- `Export Selected to CSV`
- `Compare Selected Queries`

Purpose of each action:

- **Analyze Selected with AI**: runs AI analysis for selected queries in batch mode
- **Export Selected to CSV**: exports selected query metrics to a CSV file
- **Compare Selected Queries**: opens a comparison dialog that puts multiple selected queries side by side

### 6.4 Batch AI Limits

In the current implementation, batch AI analysis uses only the first **10** selected queries.

This limit is important for user expectations:

- you can select more than 10 queries
- the batch AI worker currently analyzes only the top 10 from that selected set

## 7. Results List

The lower part of the module is the query results list.

Each row is a custom query card rather than a plain table row.

### 7.1 What Each Query Card Shows

A query card currently includes:

- priority color bar
- selection checkbox
- query display name
- optional CPU-bound icon
- optional IO-bound icon
- average duration
- average CPU
- execution count
- plan count
- last execution time
- deterministic risk score and risk level
- impact score
- trend percentage
- plan stability status

### 7.2 Meaning of the Main Indicators

| Indicator | Meaning |
| --- | --- |
| `Impact Score` | A workload-importance score derived from query duration and execution volume. In the QueryMetrics model, impact is based on `P95 duration × execution count × trend coefficient / 1000`. |
| `Trend %` | Change versus the prior comparison window. Positive values are treated as regression, negative values as improvement. |
| `Risk Score` | Deterministic 0–100 score based on latency, frequency, IO/CPU intensity, plan instability, regression, and waits when available. |
| `Stability` | Derived from plan count. `Stable` means 1 plan, `Attention` means 2–3 plans, and `Problem` means 4 or more plans. |

### 7.3 Warning Line Inside a Query Card

If a query has unstable plan behavior, the list can show:

- `Multiple plans detected - possible parameter sniffing`

This warning is triggered when plan stability is classified as `Problem`.

### 7.4 Checkbox in Each Query Card

Each query card includes a checkbox.

Purpose:

- explicit selection for batch operations

Tooltip in current code:

- `Select for batch operations`

This is the most reliable selection method when preparing bulk AI analysis, CSV export, or compare actions.

## 8. Quick Action Buttons on Each Query Card

Every query card includes inline quick action buttons.

| Button | Purpose |
| --- | --- |
| `View` | Opens the query detail dialog on the **Source Code** tab. |
| `Plan` | Opens the query detail dialog on the **Execution Plan** tab. |
| `AI` | Opens the query detail dialog on the **AI Analysis** tab. |
| `Related` | Navigates to the **Wait Statistics** module with query context. |
| `Watch` | Navigates to the **Index Advisor** module with query context. |
| `Details & Recommendations` | Opens the query detail dialog directly on the **AI Analysis** tab. |

Notes:

- `Related` is effectively a cross-module wait-analysis shortcut
- `Watch` is effectively a missing-index / index-advisor shortcut
- `AI` and `Details & Recommendations` currently both route to the AI tab

## 9. Right-Click Context Menu on Query Cards

The list also supports a right-click context menu.

Current actions:

- `Find Missing Indexes for This Query`
- `Analyze Wait Stats for This Query`
- `Deep Dive into Execution Plan`

These are alternative entry points for the same cross-module and detail workflows.

## 10. Load More Button

At the bottom of the results panel, the module may show a `Load More` button.

Purpose:

- loads the next page of results without resetting the list

Current behavior:

- page size is `100`
- the button appears only when more results are available under the current `Top N` limit

## 11. Query Detail Dialog

Double-clicking a query or using one of the detail actions opens the **Query Detail Dialog**.

This dialog has:

- a header with query identity and AI controls
- three content tabs
- a footer showing summary metrics

## 12. Detail Dialog Header Buttons

| Control | Type | Purpose |
| --- | --- | --- |
| `← Back` | Button | Closes the detail dialog and returns to the list. |
| `Analyze with AI` | Button | Starts AI analysis for the current query. |
| `Cancel` | Button | Cancels the currently running AI analysis. Disabled unless an AI worker is active. |

The header also contains:

- an `AI: Ready` style badge that changes as analysis state changes
- query identification text such as query ID and object name

## 13. Detail Tabs

The detail dialog currently contains three tabs:

1. `📝 Source Code`
2. `📊 Execution Plan`
3. `🤖 AI Analysis`

### 13.1 Source Code Tab

Purpose:

- display the source definition or query text associated with the selected query

Current loading logic:

- if source code permission is missing, the tab shows a permission message
- if the query is tied to an object name, the service first tries to load the object definition
- if no object definition is available, it falls back to stored query text
- if both fail, a fallback “not available” message is shown

Sensitive-data effect:

- when `Show Sensitive Data` is OFF, SQL literals are redacted before display
- when it is ON, raw values can be shown

### 13.2 Execution Plan Tab

Purpose:

- display the execution plan for the selected query using the plan viewer widget

Current loading logic:

- gets plan XML from the service
- parses it through the plan parser
- updates the plan viewer
- changes the tab title to `Execution Plan ⚠️` if warnings or missing-index signals are present

Sensitive-data effect:

- when `Show Sensitive Data` is OFF, execution plan literals and plan expressions are sanitized
- when it is ON, raw values can be shown

### 13.3 AI Analysis Tab

Purpose:

- generate and display a deterministic + LLM-assisted analysis report for the query

The AI tab has two visible sections:

- **status/context card**
- **analysis output card**

#### Status / Context Area

Current fields shown:

- `Context Quality`
- `Bottleneck`
- AI status message
- progress bar
- progress detail label

The bottleneck label is a deterministic classification badge generated before or during AI analysis.

#### Analysis Output Area

This area begins in an empty “ready” state and then switches to a result view once analysis starts or finishes.

Current bottom-row buttons:

| Control | Type | Purpose |
| --- | --- | --- |
| `Copy Text` | Button | Copies the analysis output text to the clipboard. Enabled after a successful result exists. |
| `Save Report` | Button | Saves the AI result to disk. Enabled after a successful result exists. Current save formats are `HTML`, `Markdown`, and `Text`. |
| `Save LLM Request` | Button | Saves the raw LLM request payload used for the run, if available. Current save format is `JSON`. |

### 13.4 AI Analysis Workflow

When `Analyze with AI` is clicked:

- query context is built from deterministic service data
- optional dashboard/server metrics may be added
- a deterministic bottleneck classification is computed
- the dialog switches to the AI tab
- progress reporting begins
- the worker returns either a result, an error, or a cancelled state

### 13.5 Sensitive Data and AI

The AI path has an extra protection layer:

- if `Show Sensitive Data` is OFF, AI uses redacted context
- if `Show Sensitive Data` is ON and the active provider is local, raw context can be used
- if `Show Sensitive Data` is ON and the provider is cloud-based, the UI asks for a second explicit consent before sending unredacted context

This is important because raw SQL text and plan XML can contain literals, PII, or secrets.

## 14. Loading Overlay and Cancel Control

When the module is actively loading query data or running batch AI analysis, it can show a loading overlay on top of the main view.

Current visible elements:

- status text
- progress indicator
- `Cancel` button

Purpose of the overlay `Cancel` button:

- cancels the current query load when possible
- cancels active batch AI work when applicable

If the user cancels a normal load before data is shown, the module may display a cancellation placeholder instead of query results.

## 15. Compare Selected Queries Dialog

The **Compare Selected Queries** dialog opens from the Batch Operations menu.

Purpose:

- compare selected queries side by side in a compact metric table

Current columns:

- Query
- Avg Duration (ms)
- P95 Duration (ms)
- Avg CPU (ms)
- Avg Reads
- Executions
- Plans
- Impact
- Risk

Requirement:

- at least 2 queries must be selected

## 16. Batch AI Results Dialog

After batch AI analysis completes, the module opens a **Batch AI Analysis Results** dialog.

Purpose:

- summarize batch AI outcomes for multiple queries
- provide export options

Current controls in that dialog:

| Control | Type | Purpose |
| --- | --- | --- |
| `Export CSV` | Button | Saves the batch AI summary to CSV. |
| `Export HTML` | Button | Saves the batch AI summary to HTML. |
| `Close` | Button | Closes the dialog. |

The dialog also contains a result table and a markdown summary area.

## 17. Permissions and Security Model

The module checks permissions proactively.

### 17.1 Minimum Permissions

For the full module:

- `VIEW SERVER STATE`

For source code viewing:

- `VIEW DEFINITION`
- or `SELECT` on `sys.sql_modules`

### 17.2 Graceful Degradation

Current degradation behavior:

- if `VIEW SERVER STATE` is missing, the module is effectively disabled for that connection
- if source code permissions are missing, the module can still load query statistics, but the Source Code tab becomes limited
- the health banner and warning banner both surface these conditions

## 18. Runtime Warning Banner

The module includes a warning banner below the batch bar.

Purpose:

- show degraded-mode warnings and data quality notices

Typical examples include:

- Query Store fallback occurred
- source code permissions are missing
- system queries were hidden
- Query Store is stale or partially unhealthy

## 19. Practical Usage Workflow

A typical user workflow is:

1. Open `Query Statistics`.
2. Review the Query Store Health banner.
3. Adjust `Duration`, `Order By`, and `Limit`.
4. Use `Show System Queries` only when internal/system activity matters.
5. Use `Show Sensitive Data` only when necessary and appropriate.
6. Search for a specific object or query name.
7. Check one or more queries for batch operations, or open a single query directly.
8. Use `View`, `Plan`, or `AI` based on what you need next.
9. Use `Related` or `Watch` to pivot into Wait Statistics or Index Advisor.
10. Save or export results when needed.

## 20. Practical Interpretation Notes

- `Impact Score` is the main workload-priority indicator, not just a raw latency measure.
- `Risk Score` is deterministic and can surface problematic queries even if they are not at the top of pure duration sorting.
- `Stability: Problem` is a strong hint to inspect plan variability and parameter sensitivity.
- If the health banner says DMV fallback is in use, the result set may have less historical depth than normal Query Store mode.
- If Source Code is missing but the query still appears in the list, the statistics path is working even if definition access is limited.
- `Show Sensitive Data` affects both the visible SQL/plan text and, with additional consent logic, the AI analysis context.

## 21. Cross-Check Notes

- Main view and dialogs: `app/ui/views/query_stats_view.py`
- Controllers and list actions: `app/ui/views/query_stats_controllers.py`
- Service logic and fallback behavior: `app/services/query_stats_service.py`
- SQL generation: `app/database/queries/query_store_queries.py`
- Data models and scoring: `app/models/query_stats_models.py`

This document reflects the current implementation. If filters, tabs, actions, permissions, or AI behavior change in code, this help page should be updated in the same change set.
