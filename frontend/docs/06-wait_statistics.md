# Wait Statistics

This document explains the **Wait Statistics** module in detail. It was cross-checked against the current implementation in `app/ui/views/wait_stats_view.py`, `app/ui/workers/wait_stats_refresh_worker.py`, `app/services/wait_stats_service.py`, `app/database/queries/wait_stats_queries.py`, `app/ui/main_window.py`, `app/ui/components/sidebar.py`, and the current English labels in `app/locales/en.json`.

The Wait Statistics module is the application's wait-centric diagnostics screen. It combines cumulative SQL Server wait data, active waiting sessions, blocking-chain analysis, historical trend snapshots, and optional query-context correlation to help users identify the dominant source of performance pressure.

## 1. Purpose of the Module

The module is used to:

- inspect the most significant SQL Server wait types
- summarize signal wait versus resource wait pressure
- see which wait categories dominate total server wait time
- review active waiting sessions and blocking chains
- compare the current state against a saved baseline
- compare explicit `BEFORE` and `AFTER` snapshots
- configure lightweight alert monitoring and scheduled snapshots
- create custom regex-based wait categories
- export the current analysis to `HTML`, `JSON`, or `Markdown`
- correlate waits with a specific query and execution plan when the module receives query context

This module is primarily an analysis and monitoring surface. Its only destructive action is the admin-only `Clear Wait Stats (Manual Admin)` command, which resets SQL Server wait counters and is deliberately locked behind extra confirmation.

## 2. High-Level Layout

The current screen has four practical areas:

1. **Header card**
2. **Filter bar**
3. **Main content tabs**
4. **Right-side insight panel**

### 2.1 Header Card

The header contains:

- optional `Focus context` label
- `Refresh` button
- `Set Baseline` button
- `Export` button

### 2.2 Filter Bar

The filter bar contains:

- `Trend Window` combobox
- `DB Filter` combobox
- `App Filter` combobox
- `Min Wait` numeric filter
- `Apply Filter` button
- a right-aligned status/progress label

### 2.3 Main Content Tabs

The center area uses a three-tab layout:

1. `Top Waits`
2. `Trend & Blocking`
3. `Automation`

### 2.4 Right-Side Insight Panel

The right side is not tabbed. It is a stacked panel area with:

- `Summary`
- `Wait Categories`
- `Insights`

Inside `Insights`, the screen shows multiple named blocks:

- `Alerts`
- `Signature`
- `Before / After`
- `Actions`
- `Wait / Plan`
- `Monitoring`
- `Actionable Intelligence`

## 3. Data Sources and Analysis Model

### 3.1 Core Wait Data

The main wait summary is collected from SQL Server DMVs such as:

- `sys.dm_os_wait_stats`
- `sys.dm_exec_requests`
- `sys.dm_exec_sessions`
- `sys.dm_exec_sql_text`

Current query usage:

- `TOP_WAITS` reads top cumulative waits from `sys.dm_os_wait_stats`
- `WAIT_SUMMARY` calculates total wait metrics
- `WAITS_BY_CATEGORY` supports category aggregation
- `CURRENT_WAITS` reads currently waiting requests

### 3.2 Historical Trend

The module prefers Query Store history for long-window trend analysis by using:

- `sys.query_store_wait_stats`
- `sys.query_store_runtime_stats_interval`

Important current behavior:

- Query Store trend is preferred when supported
- if Query Store wait history is unavailable or unsupported, the module falls back to locally persisted refresh snapshots
- the local fallback is built from snapshots the module writes after refresh

### 3.3 Blocking and Chain Analysis

The `Trend & Blocking` tab and some right-side panels use the shared blocking service. This means wait analysis is not limited to cumulative counters; it also tries to explain live contention chains and blocked sessions.

### 3.4 Query Context and Plan Correlation

If the module receives an `AnalysisContext` with a `query_id`, it can:

- load query-level wait distribution through Query Statistics service
- build a `Wait / Plan` correlation view
- replace the displayed wait rows with query-correlated waits

This is why the module can behave in two different modes:

- **server-level mode**
- **query-context mode**

### 3.5 Baseline and Comparison State

The service persists several kinds of local state:

- a saved baseline snapshot
- saved `before` / `after` comparative snapshots
- local trend history snapshots
- scheduled automation configuration
- custom category rules
- monitoring targets
- alert thresholds

## 4. Main Tabs

### 4.1 Tab: Top Waits

This tab is the primary wait list.

It shows a scrollable set of wait rows rather than a plain table.

Each visible wait row currently includes:

- wait type name
- resolved wait category
- a detail line with `Impact`, `Signal/Resource`, `Baseline`, and `Action`
- a small ASCII trend sparkline
- `Wait Time`
- `Tasks`
- `Percent`
- `Max Wait`

Important behavior:

- in normal mode, rows come from the top cumulative waits on the server
- when DB/App/Min Wait filters are active, the displayed rows can be rebuilt from **current waiting sessions** grouped by wait type
- when query context is available, the displayed rows can switch to **query wait correlation** instead
- the screen renders up to 15 visible wait rows, depending on source

The `Action=` hint in each row is heuristic. For example, I/O waits suggest checking disk latency, lock waits suggest inspecting blockers, and CX waits suggest reviewing `MAXDOP`.

### 4.2 Tab: Trend & Blocking

This tab has two major parts:

1. historical trend text output
2. blocking chain tree

#### Trend Area

The trend area is controlled by the `Display` combobox and can show:

- `Daily Summary`
- `Dominant Category`
- `Category Breakdown`

Current meaning:

- `Daily Summary`: one line per day with total wait time and dominant category
- `Dominant Category`: one line per day showing dominant category share
- `Category Breakdown`: one line per day showing the top categories and their shares

The text output also includes the trend source, such as:

- `query_store`
- `local_history`
- `none`

#### Blocking Tree

The lower part of the tab shows a tree with columns:

- `Session`
- `Wait`
- `Wait ms`
- `Database`
- `Login`

Current behavior:

- root items represent root blockers
- child items represent blocked sessions
- the tree is filtered by `DB Filter`, `App Filter`, and `Min Wait`
- if the tree grows too large, the view truncates the render at a safety limit for responsiveness

### 4.3 Tab: Automation

This tab is a control surface for scheduling, alerting, custom categorization, admin-only actions, and multi-server comparison.

The tab contains five practical cards:

1. `Scheduled Snapshot`
2. `5s Alert Monitor`
3. `Custom Category Rules`
4. `Admin Tools`
5. `Multi-Server Wait Time Comparison`

#### 4.3.1 Scheduled Snapshot

Purpose:

- enable periodic snapshot/report generation

Visible controls:

- `Scheduled Snapshot Enabled` checkbox
- interval spin control
- `Save Schedule` button

Current behavior:

- enabling this does not immediately create a snapshot
- when the module refreshes and the schedule interval is due, a background automation worker writes a scheduled snapshot and reports
- the current UI allows saving `enabled` and `interval`
- report formats exist in the service config, but the current screen does not expose a visible format picker

#### 4.3.2 5s Alert Monitor

Purpose:

- enable lightweight periodic refresh monitoring every 5 seconds

Visible controls:

- `Enable 5s Monitor` checkbox
- threshold inputs for `Total Wait >=`, `Lock >=`, and `Blocked >=`
- `Save Thresholds` button

Current behavior:

- when enabled, the view auto-refreshes every 5 seconds while visible
- the service alert model supports additional threshold fields such as I/O wait percent, chain depth, single wait duration, and cooldown, but the current screen exposes only part of that configuration

#### 4.3.3 Custom Category Rules

Purpose:

- create operator-defined regex-based wait groups

Visible controls:

- read-only custom rule summary text area
- `Add Category` button
- `Remove Category` button

Current behavior:

- rules are regex based
- only enabled rules contribute to the current custom-category totals
- totals are computed from current wait rows after refresh

#### 4.3.4 Admin Tools

Purpose:

- expose the manual wait-counter reset operation

Visible controls:

- `Enable Admin Tools for this session` checkbox
- `Clear Wait Stats (Manual Admin)` button

Current behavior:

- admin tools start locked
- the clear button remains disabled until admin tools are armed
- clearing wait stats requires:
  - enabled admin tools
  - active database connection
  - a warning confirmation
  - typing the exact phrase `CLEAR WAIT STATS`
- the action is audit-logged

#### 4.3.5 Multi-Server Wait Time Comparison

Purpose:

- review accumulated snapshots across multiple server/database pairs

Visible controls:

- `Add Server Target`
- `Remove Target`
- `Push Metrics Now`
- a comparison tree with `Server`, `Database`, `Total Wait`, `Signal %`, `Top Category`, `Delta(window)`

Current behavior:

- the comparison is built from locally stored history snapshots
- `Push Metrics Now` sends metrics to configured monitoring targets
- adding a monitoring target opens dialogs for target name, URL, and payload format

## 5. Right-Side Panels

This section covers the right-side panels one by one, as they appear in the current UI.

### 5.1 Panel: Summary

Purpose:

- provide a compact health summary of the current wait profile

Visible fields:

- `Total Wait`
- `Signal Wait`
- `Resource Wait`
- `Current Waiters`

Current behavior:

- `Total Wait` is formatted into seconds, minutes, hours, or days
- `Signal Wait` and `Resource Wait` are shown as percentages
- `Current Waiters` reflects the count of active waiting sessions currently held in the view state
- the health badge text is driven mainly by `Resource Wait %`

Current health logic:

- `HEALTHY` when resource wait percent is below 60%
- `WARNING` when resource wait percent is 60% or higher
- `CRITICAL` when resource wait percent is 80% or higher

Important scope note:

- `Total Wait`, `Signal Wait`, and `Resource Wait` come from cumulative server wait stats
- filters such as DB/App/Min Wait do **not** fully re-scope those summary totals

### 5.2 Panel: Wait Categories

Purpose:

- show how total wait time is distributed by category

Current visible categories:

- `CPU`
- `I/O`
- `Lock`
- `Latch`
- `Memory`
- `Network`
- `Buffer`
- `Other`

Each row shows:

- wait time
- a progress bar
- percentage of visible category total

Important note:

- the service supports `CLR` as a category, but the current right-side category panel does not display `CLR` as a separate row

### 5.3 Panel: Insights > Alerts

Purpose:

- highlight threshold breaches and live risk signals

Current behavior:

- when there are no active alerts, the panel shows the current threshold values
- when alerts exist, the block changes visual tone to warning or critical
- the panel shows up to three alert lines directly and then a `+N more` summary if needed

Current alert examples from service logic include:

- total wait threshold breached
- total wait growth since baseline
- lock wait pressure
- I/O wait pressure
- high resource wait ratio
- blocked session count high
- blocking chain depth high
- long individual wait detected

### 5.4 Panel: Insights > Signature

Purpose:

- describe the dominant diagnosed wait pattern

Current behavior:

- shows the top detected signature with confidence
- includes short evidence text
- also embeds the current baseline summary string

Current signature families include:

- `CPU Pressure`
- `I/O Bottleneck`
- `Lock Contention`
- `Memory Grant Pressure`
- `Latch Contention`
- `Network Throughput Pressure`
- `Balanced Wait Profile`

### 5.5 Panel: Insights > Before / After

Purpose:

- summarize the explicit `before` / `after` comparison state

Current behavior:

- if only one side exists, the panel stays in an insufficient-data state
- once both snapshots exist, the panel shows `improved`, `degraded`, or `stable`
- the panel text includes delta wait time and delta signal wait percent

Important distinction:

- this panel is **not** the same as baseline comparison
- baseline comparison uses `Set Baseline`
- this panel uses the `Save Before` and `Save After` buttons

### 5.6 Panel: Insights > Actions

Purpose:

- expose quick operator actions directly related to comparison and custom categorization

Visible buttons:

- `Save Before`
- `Save After`
- `Compare`
- `Custom Category`
- `Remove Custom`

Current meaning:

- `Save Before`: stores the current wait summary as the `before` snapshot
- `Save After`: stores the current wait summary as the `after` snapshot
- `Compare`: refreshes the `Before / After` panel from stored snapshots
- `Custom Category`: opens a dialog to add a regex-based custom rule
- `Remove Custom`: opens a selection dialog to remove an existing custom rule

### 5.7 Panel: Insights > Wait / Plan

Purpose:

- correlate waits with a specific query plan

Current behavior:

- without query context, the panel tells the user to navigate from Query Statistics
- with query context, the panel shows:
  - query id
  - confidence
  - dominant wait categories
  - findings
  - one recommended action

The correlation engine currently looks for relationships such as:

- lock waits with table/index scans
- I/O waits with lookups, spills, or sort warnings
- CPU waits with parallel plans
- memory waits with sort/hash pressure

### 5.8 Panel: Insights > Monitoring

Purpose:

- summarize configured outbound monitoring targets

Current behavior:

- when no targets exist, the panel says so clearly
- when targets exist, it shows enabled target count and a compact list such as `name(format)`
- the target list shown here is informational; target add/remove actions live in the `Automation` tab

### 5.9 Panel: Insights > Actionable Intelligence

Purpose:

- produce a compact operator playbook from the current diagnostics

Current output sections are:

- `[Alert Detail]`
- `[Possible Root Cause]`
- `[Recommended Checks]`
- `[Quick Fix Actions]`

The text is generated from:

- current waits
- active alerts
- signatures
- baseline delta
- trend direction

This is the panel that turns raw wait data into a short operational next-step list.

## 6. Control Reference

This section explains the visible buttons, checkboxes, and comboboxes in the current UI.

### 6.1 Buttons

| Control | Area | Purpose |
| --- | --- | --- |
| `Refresh` | Header | Starts a background refresh of the module. |
| `Set Baseline` | Header | Saves the current summary as the persistent baseline for future comparison. |
| `Export` | Header | Exports the current analysis to `HTML`, `JSON`, or `Markdown`. |
| `Apply Filter` | Filter bar | Re-runs refresh using the current DB/App/Min Wait filter values. |
| `Save Before` | Right panel > Actions | Saves the current summary as the `before` snapshot. |
| `Save After` | Right panel > Actions | Saves the current summary as the `after` snapshot. |
| `Compare` | Right panel > Actions | Recomputes and shows the explicit before/after comparison. |
| `Custom Category` | Right panel > Actions | Opens a dialog to add a custom regex category rule. |
| `Remove Custom` | Right panel > Actions | Opens a dialog to remove a custom regex category rule. |
| `Save Schedule` | Automation > Scheduled Snapshot | Saves scheduled snapshot settings. |
| `Save Thresholds` | Automation > 5s Alert Monitor | Saves the currently visible alert thresholds. |
| `Add Category` | Automation > Custom Category Rules | Adds a custom regex category rule. |
| `Remove Category` | Automation > Custom Category Rules | Removes a saved custom category rule. |
| `Clear Wait Stats (Manual Admin)` | Automation > Admin Tools | Runs the admin-only clear-wait-counters action after explicit confirmation. |
| `Add Server Target` | Automation > Multi-Server Wait Time Comparison | Adds a monitoring target definition. |
| `Remove Target` | Automation > Multi-Server Wait Time Comparison | Removes a saved monitoring target. |
| `Push Metrics Now` | Automation > Multi-Server Wait Time Comparison | Pushes the latest metrics to enabled monitoring targets immediately. |

### 6.2 Checkboxes

| Control | Area | Purpose |
| --- | --- | --- |
| `Scheduled Snapshot Enabled` | Automation > Scheduled Snapshot | Enables or disables scheduled snapshot/report automation. |
| `Enable 5s Monitor` | Automation > 5s Alert Monitor | Enables auto-refresh monitoring every 5 seconds while the view is visible. |
| `Enable Admin Tools for this session` | Automation > Admin Tools | Arms the admin-only wait-clear action for the current session. |

These are the only visible checkboxes in the current main screen.

### 6.3 Comboboxes

| Control | Area | Current Options | Purpose |
| --- | --- | --- | --- |
| `Trend Window` | Filter bar | `7 Days`, `30 Days`, `90 Days` | Chooses the historical trend window. Changing it triggers refresh. |
| `DB Filter` | Filter bar | `All Databases` plus discovered database names | Filters active waits and blocking output by database. The list is rebuilt from current wait data after refresh. |
| `App Filter` | Filter bar | `All Applications` plus discovered application names | Filters active waits and blocking output by application/program name. The list is rebuilt from current wait data after refresh. |
| `Display` | `Trend & Blocking` tab | `Daily Summary`, `Dominant Category`, `Category Breakdown` | Changes only the way cached trend data is rendered; it does not trigger a new refresh. |

Important detail:

- `DB Filter` and `App Filter` are editable comboboxes, so users can type filter text instead of selecting only from the dropdown list

## 7. Important Behavior Notes

### 7.1 Filters Do Not Re-scope Everything

The current DB/App/Min Wait filters mainly affect:

- filtered current waits
- blocking-chain rendering
- the displayed wait rows when current-wait grouping is used

They do **not** fully rewrite the cumulative `dm_os_wait_stats` summary totals.

### 7.2 Baseline vs Before/After

These two concepts are different:

- `Set Baseline` creates one reference point used by the `Signature` and baseline-comparison logic
- `Save Before` and `Save After` create a separate two-point change comparison shown in the `Before / After` panel

### 7.3 Query Context Changes the View

When the module receives context from Query Statistics:

- the top visible waits can switch from server waits to query-specific waits
- the `Wait / Plan` panel becomes meaningful
- confidence and plan findings depend on available Query Store and plan XML data

### 7.4 Trend Source Can Change

Trend data may come from:

- `query_store`
- `local_history`
- `none`

This matters because Query Store trend is richer, while local history depends on prior refresh activity.

### 7.5 Admin Clear Is Server-Wide for Wait Counters

`Clear Wait Stats (Manual Admin)` runs:

- `DBCC SQLPERF('sys.dm_os_wait_stats', CLEAR)`

That resets wait-stat counters on the connected server. It is not a cosmetic reset inside the UI.

### 7.6 Some Service Features Are Not Fully Editable in the Current Screen

The service model includes more alert and schedule fields than the visible UI exposes.

Examples:

- I/O wait threshold exists in the service but is not directly editable in the visible threshold card
- chain-depth and single-wait thresholds also exist in the service model
- scheduled export formats exist in config but are not selected through a visible main-screen combobox

## 8. Typical Workflow

A typical use of the module is:

1. click `Refresh`
2. review the right-side `Summary`, `Wait Categories`, and `Alerts`
3. inspect `Top Waits` to identify dominant wait types and their suggested action hints
4. switch to `Trend & Blocking` to check whether the problem is persistent or tied to active blockers
5. if needed, save a baseline or capture `before` / `after` snapshots
6. use `Automation` to enable 5-second monitoring, save thresholds, or configure scheduled snapshots
7. if the module was opened from Query Statistics, use `Wait / Plan` to connect waits with a specific plan shape
