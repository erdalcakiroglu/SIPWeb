# Blocking Analysis

This document explains the **Blocking Analysis** module in detail. It was cross-checked against the current implementation in `app/ui/views/blocking_view.py`, `app/services/blocking_service.py`, `app/models/blocking_models.py`, `app/database/queries/blocking_queries.py`, `app/ui/main_window.py`, `app/ui/components/sidebar.py`, and the current English labels in `app/locales/en.json`.

The Blocking Analysis module is the application's real-time blocking investigation screen. It combines a live blocking snapshot, head-blocker identification, historical snapshot tracking, alerting helpers, export actions, and a session inspector so DBAs can understand who is blocking whom and decide whether intervention is safe.

## 1. Purpose of the Module

The module is used to:

- detect active blocking chains in the current SQL Server database context
- identify head blockers and blocked sessions
- visualize blocking as both a graph and a tree
- inspect SQL text, lock details, execution-plan summaries, and session impact
- track short-term blocking history captured by the application
- export live snapshots, reports, audit logs, and history
- raise local alerts and optionally send webhook notifications
- kill a selected session when the user decides intervention is necessary

This module is an investigation and response surface. It helps the user decide what to do, but it does not auto-kill sessions or auto-resolve blocking without explicit user action.

## 2. High-Level Layout

The screen has five practical layers:

1. **Top action bar**
2. **Severity and quick-action area**
3. **Main work area with left-side view tabs**
4. **Right-side Session Inspector**
5. **Footer status and summary cards**

### 2.1 Top Action Bar

The top row contains the main operational actions:

- `Auto-Refresh: ON/OFF`
- `Refresh Now`
- `Export CSV`
- `Report`
- `Audit CSV`
- `History CSV`
- `AI Brief`

This area controls how often data is collected and how the current or recent state is exported.

### 2.2 Severity and Quick-Action Area

Under the top row, the module shows:

- a colored severity banner
- a compact quick summary label
- a `Quick Action Panel`

The banner summarizes the highest blocking pressure detected in the latest refresh. The quick summary label shows the current count of `Critical`, `High`, `Medium`, and `Low` sessions.

The Quick Action Panel recommends a likely top blocker and exposes two fast actions:

- `Investigate`
- `Kill Top Blocker`

### 2.3 Main Work Area

The main content is split horizontally:

- **Left side**: module-level tabs
- **Right side**: `Session Inspector`

The left side contains five main tabs:

1. `Filter`
2. `Graph`
3. `Tree`
4. `Timeline`
5. `Details`

### 2.4 Session Inspector

The right-side inspector updates when a session is selected from the graph, tree, or quick actions.

It contains five inspector tabs:

1. `SQL Statement`
2. `Locks`
3. `Execution Plan`
4. `Impact Analysis`
5. `History`

### 2.5 Footer

The footer shows:

- a status label
- four summary cards: `Total Blocking`, `Head Blockers`, `Max Wait`, `Affected Sessions`

These values are recalculated during refresh. They are not continuously recomputed on every later filter interaction.

## 3. Data Sources and Refresh Behavior

### 3.1 Live Snapshot Source

The module uses a background worker and service layer to collect blocking data without freezing the UI.

The current SQL sources include:

- `sys.dm_exec_requests`
- `sys.dm_exec_sessions`
- `sys.dm_exec_sql_text(...)`
- `sys.dm_tran_locks`
- `sys.dm_exec_query_plan(...)`

### 3.2 What Refresh Collects

Each refresh retrieves:

- active blocking sessions
- head blockers
- grouped lock details for blocker sessions

The service then derives:

- chain count
- maximum chain depth
- total wait time
- critical blockers
- lock grouping by session

### 3.3 Auto-Refresh Behavior

The module supports automatic refresh every **5 seconds** when auto-refresh is enabled.

Important behavior:

- if the view is shown and a connection exists, the module refreshes immediately
- if auto-refresh is enabled, the timer starts when the view is shown
- if the view is hidden, the timer stops
- if no active database connection exists, auto-refresh is turned off and the module shows a disconnected hint

### 3.4 Severity Model

Blocking severity is currently based on wait time:

| Severity | Current Rule |
| --- | --- |
| `Low` | wait is below 5 seconds |
| `Medium` | wait is between 5 and 30 seconds |
| `High` | wait is between 30 and 60 seconds |
| `Critical` | wait is 60 seconds or higher |

This severity model drives:

- the severity filter
- the top severity banner
- quick summary counts
- some alert and recommendation text

### 3.5 Application-Captured History

The module also maintains its own history files in the application data directory.

These are used for:

- `Timeline` tab content
- recurring blocker detection
- `History CSV` export
- kill audit export

This means history in this module is based on application-captured snapshots, not a built-in SQL Server blocking history feature.

## 4. Main Controls

This section explains the visible buttons, comboboxes, and toggle states in the current UI.

### 4.1 Button Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Auto-Refresh: ON/OFF` | Checkable button | Enables or disables periodic automatic refresh. | ON by default. When ON, the refresh timer runs every 5 seconds. |
| `Refresh Now` | Button | Collects a fresh live blocking snapshot immediately. | Starts the background worker and updates all views on completion. |
| `Export CSV` | Button | Exports the current live blocking snapshot to CSV. | Saves one row per blocking session with wait, severity, chain depth, safety, and SQL text fields. |
| `Report` | Button | Generates a Markdown blocking report. | Includes summary metrics, head blockers, blocking sessions, and lock summary. |
| `Audit CSV` | Button | Exports the kill-session audit log. | Uses previously recorded kill attempts and outcomes. |
| `History CSV` | Button | Exports recent blocking-history snapshots to CSV. | Uses application-captured history, currently exported for the last 30 days. |
| `AI Brief` | Button | Opens a readable summary dialog with recommendations. | In the current build this is a local heuristic brief generated by the blocking service, not a separate chat/LLM workflow. |
| `Investigate` | Button | Focuses the top recommended blocker in the Session Inspector. | Selects the current top blocker and switches the inspector to `Impact Analysis`. |
| `Kill Top Blocker` | Button | Opens a kill confirmation flow for the currently recommended top blocker. | Disabled until a top blocker exists. |
| `Critical Only` | Checkable button | Restricts the visible session set to critical severity only. | Client-side filter only. |
| `Production DB` | Checkable button | Restricts the visible session set to likely production databases. | Uses a simple name heuristic: database name contains `prod`, `prd`, or `live`. |
| `Head Blockers` | Checkable button | Focuses the filtered result on blocker-side sessions. | Uses head-blocker identification from the current session graph. |
| `Apply Saved` | Button | Applies the currently selected saved filter preset. | Restores saved filter values and immediately reapplies filtering. |
| `Save Current` | Button | Saves the current filter state under a user-entered name. | Persists the current filter payload in the app data directory. |
| `Delete` | Button | Deletes the currently selected saved filter preset. | Removes the saved preset from local storage. |
| `Sound` | Checkable button | Enables or disables the desktop beep for alert notifications. | ON by default in the current UI. |
| `Save Rules` | Button | Persists Smart Alert notification rules. | Saves minimum severity, minimum chain count, and database-name matching rules. |
| `Webhook Enabled` | Checkable button | Turns webhook delivery on or off for blocking alerts. | Controls whether webhook sending is active. |
| `Save Webhook` | Button | Saves the current webhook configuration. | Persists enabled state, URL, and channel. |
| `Test Webhook` | Button | Sends a test webhook message. | If no active alerts exist, the module builds a test alert payload. |
| `Export PNG` | Button | Exports the current graph visualization to a PNG image. | Works only when the graph contains visible data. |
| `Kill Session` | Button | Kills the session currently selected in the Session Inspector. | Disabled until a session is selected and enabled only when allowed by the UI state. |

### 4.2 Combobox Controls

| Control | Type | Current Options | Purpose |
| --- | --- | --- | --- |
| `Database` | Searchable combobox | `All` plus database names found in the current result set | Filters sessions by database name. |
| `User` | Searchable combobox | `All` plus login names found in the current result set | Filters sessions by SQL login. |
| `Application` | Searchable combobox | `All` plus program names found in the current result set | Filters sessions by client application name. |
| `Severity` | Combobox | `All`, `Critical`, `High`, `Medium`, `Low` | Filters sessions by calculated wait-time severity. |
| `Saved Filters` | Combobox | Placeholder plus locally saved filter names | Lets the user load or manage previously saved filter presets. |
| `Min Severity` | Combobox | `critical`, `warning`, `info` | Controls which alert severities are eligible for desktop/webhook notification. |

### 4.3 Checkbox Controls

The current Blocking Analysis screen does **not** use standalone `QCheckBox` widgets.

Instead, the UI uses **checkable buttons** for ON/OFF and chip-style states, including:

- `Auto-Refresh: ON/OFF`
- `Critical Only`
- `Production DB`
- `Head Blockers`
- `Sound`
- `Webhook Enabled`

If you are documenting controls strictly by widget type, these are toggle buttons, not checkboxes.

### 4.4 Other Filter and Configuration Inputs

Although not requested specifically, these inputs are part of the module workflow:

| Control | Type | Purpose |
| --- | --- | --- |
| `Min Wait (ms)` | Spin box | Hides rows below the chosen wait threshold. |
| `Max Wait (ms)` | Spin box | Hides rows above the chosen maximum threshold. `0` behaves as no upper limit. |
| `DB contains` | Text input | Limits notifications to databases whose names contain this token. |
| `Min Chain` | Spin box | Requires at least this many blocking chains before sending notifications. |
| `Cooldown(s)` | Spin box | Prevents repeated alert notifications within a cooldown window. |
| `URL` | Text input | Stores the webhook endpoint URL. |
| `Channel` | Text input | Stores the target webhook channel name when supported. |

## 5. Main Module Tabs

### 5.1 Filter Tab

The `Filter` tab is the operational control panel for visibility, alerting, and saved filter management.

It contains five groups:

- `Quick Filters`
- `Advanced Filters`
- `Saved Filters`
- `Smart Alerts`
- `Webhook`

### Quick Filters

These are the fastest way to narrow the current dataset:

- `Critical Only`
- `Production DB`
- `Head Blockers`

These do not re-query SQL Server. They filter the current in-memory snapshot on the client side.

### Advanced Filters

This area lets the user filter by:

- database
- login/user
- application name
- severity
- minimum wait
- maximum wait

These filters affect:

- graph rendering
- tree rendering
- visible head blockers
- quick-action candidate selection

### Saved Filters

Saved filters are stored locally in a JSON file.

The saved payload currently includes:

- quick-filter toggle states
- selected database, user, application, and severity
- min/max wait thresholds

This means saved filters restore analysis focus, not snapshot data itself.

### Smart Alerts

This group controls notification eligibility, not alert detection thresholds themselves.

Current visible settings:

- `DB contains`
- `Min Severity`
- `Min Chain`
- `Cooldown(s)`
- `Sound`
- `Save Rules`

Important distinction:

- the service still has its own built-in threshold logic for generating raw alerts
- this panel controls when those alerts are allowed to notify the user

### Webhook

This group controls outbound webhook delivery for blocking alerts.

Visible controls:

- `Webhook Enabled`
- `URL`
- `Channel`
- `Save Webhook`
- `Test Webhook`

The current implementation sends a compact text payload suitable for Slack/Teams-style webhook endpoints.

### 5.2 Graph Tab

The `Graph` tab renders blocking chains visually.

### What It Shows

The graph contains:

- blocker and blocked-session nodes
- connecting edges
- severity-oriented visual emphasis

If there is no active blocking, the graph shows a `No Active Blocking` message instead of a chain.

### User Interaction

- clicking a graph node selects that session
- selection updates the Session Inspector on the right
- the minimap gives a smaller overview of the current graph scene

### Button in This Tab

- `Export PNG`: saves the current graph scene as an image

### 5.3 Tree Tab

The `Tree` tab renders the same blocking relationships as a hierarchical tree.

Current columns are:

- `Session ID`
- `Wait Type`
- `Wait Time`
- `Depth`
- `Database`
- `Login`
- `Host`

### What It Shows

The tree starts from root blocker nodes and nests blocked children underneath.

The current implementation also:

- colors wait-time cells based on heat
- uses severity color emphasis
- expands root items automatically
- marks root items as blockers

### Context Menu

Right-clicking a row opens a context menu with:

- `Kill Session`

This is a shortcut to the same kill flow used elsewhere in the module.

### 5.4 Timeline Tab

The `Timeline` tab shows the application's captured blocking history for the last 24 hours.

### What It Shows

The summary label currently includes:

- number of snapshots
- average total wait
- peak chain depth
- latest total wait

The timeline table contains:

- capture timestamp
- chain count
- maximum chain depth
- total wait time
- kill marker

The kill marker is shown when a successful kill audit event aligns with a recorded snapshot time bucket.

### Important Limitation

This tab depends on the application's own stored history snapshots. If the application was not open or the module was not refreshing, this timeline will be sparse or empty.

### 5.5 Details Tab

The `Details` tab on the left side is a **head blocker list**, not the full session inspector.

Current columns are:

- `Session`
- `Login`
- `Host`
- `Program`
- `Blocked Count`
- `CPU (s)`

Use this tab when you want a compact head-blocker list without switching to the graph or tree.

### Context Menu

Right-clicking a head blocker opens a context menu with:

- `Kill Head Blocker`

## 6. Session Inspector Tabs

The right-side inspector is the detailed analysis area for the currently selected session.

### 6.1 SQL Statement Tab

This tab shows:

- a session summary label
- the current SQL statement text

When a session is selected, the module fills this area with:

- session id
- blocker id
- wait type and wait time
- database, login, host, and program
- CPU time
- severity
- safe-to-kill result
- direct blocked-session count
- chain depth
- lock summary text

The SQL text box shows the current statement or a fallback message if none is available.

### 6.2 Locks Tab

This tab contains the lock details table for the selected session.

Current columns are:

- `Resource Type`
- `Lock Mode`
- `Status`
- `Resource`
- `Count`

The table is grouped and sorted by lock count in descending order.

Current visual behavior:

- lock mode cells are color-coded by mode family
- waiting/converting statuses are color-emphasized
- selecting a lock row updates the footer status text with session, mode, status, and resource

If no session is selected, the tab shows a placeholder row. If the selected session has no lock rows, it shows `No lock details`.

### 6.3 Execution Plan Tab

This tab shows an execution-plan summary for the selected session when available.

The current build displays:

- a summary text
- optional warnings
- an XML preview of the plan, truncated when large

If the repository cannot retrieve a plan, the tab explains that the plan is unavailable.

### 6.4 Impact Analysis Tab

This tab estimates the impact of killing the selected session.

Current output includes:

- number of sessions that may unblock
- peak impacted wait
- aggregate impacted wait
- risk assessment
- estimated recovery time

If the selected session fails safety checks, the tab also warns that the session is unsafe to kill.

This is a heuristic impact summary, not a guaranteed prediction.

### 6.5 History Tab

This tab shows recurring-blocker history for the selected session over recent history captured by the application.

Current columns are:

- `First Seen`
- `Last Seen`
- `Occurrences`
- `Peak Wait (ms)`

If the session does not appear in recurring-blocker history, the tab shows a placeholder row.

## 7. Quick Actions and Kill Safety

### 7.1 Top Blocker Recommendation

The Quick Action Panel chooses a likely top blocker from the currently visible session set.

At a high level, the module prioritizes blockers that:

- block more sessions
- contribute more total blocked wait time

This is why the quick-action recommendation may change when filters change.

### 7.2 Investigate

The `Investigate` button:

- selects the recommended top blocker
- refreshes the Session Inspector for that session
- switches the inspector to `Impact Analysis`

This is the fastest way to move from overview to triage.

### 7.3 Kill Actions

Kill entry points in the current UI are:

- `Kill Top Blocker`
- `Kill Session`
- tree context menu `Kill Session`
- details context menu `Kill Head Blocker`

All of them go through the same confirmation and service kill flow.

### 7.4 Kill Safety Rules

The `BlockingSession` model currently treats some sessions as unsafe to kill. The safety logic blocks or warns for cases such as:

- system sessions
- non-user processes
- replication-related programs
- backup/restore activity
- protected commands

This is why a session may be visible but the UI may not present it as a safe kill candidate.

## 8. Alerts, Recommendations, and AI Brief

### 8.1 Alert Generation

The service can generate alerts from the current snapshot based on built-in thresholds such as:

- blocked session count
- chain depth
- total wait time
- maximum wait time
- number of critical blockers

### 8.2 Productivity Insights Panel

The `DBA Productivity Insights` box summarizes:

- active alert status
- cache metrics
- top recommendation text
- recurring blocker hints

This is a compact, continuously refreshed summary panel.

### 8.3 AI Brief

The `AI Brief` action opens a dialog with a plain-text summary.

The current brief includes:

- chain count
- max depth
- total wait
- top recommendations
- top wait types and short explanations

Important note:

- in the current implementation, this is a locally generated recommendation brief
- it is not the same kind of cloud-backed AI analysis workflow used in modules such as Object Explorer or Index Advisor

## 9. Exports and Outputs

### 9.1 Export CSV

This exports the current snapshot of blocking sessions.

Current fields include:

- session ids
- blocker ids
- wait type
- wait time
- severity
- database/login/host/program
- chain depth
- safe-to-kill flag
- current statement

### 9.2 Report

The Markdown report currently includes:

- generation timestamp
- chain count
- max chain depth
- total wait time
- blocking session count
- critical blocker count
- head blocker summary
- blocking session table
- lock summary table

### 9.3 Audit CSV

This export contains kill audit rows such as:

- timestamp
- session id
- killed-by source
- success flag
- error text

### 9.4 History CSV

This export contains recent application-captured history rows such as:

- captured timestamp
- server
- database
- chain count
- max chain depth
- blocked sessions
- critical blockers
- peak wait
- total wait time
- head blocker ids

### 9.5 Export PNG

This exports the current graph visualization exactly as an image. It is useful for attaching a visual chain diagram to incident notes.

## 10. Typical Workflow

A practical Blocking Analysis workflow usually looks like this:

1. Open `Blocking Analysis`.
2. Leave `Auto-Refresh` enabled for live monitoring, or click `Refresh Now` for a manual snapshot.
3. Read the severity banner and quick summary.
4. Use the `Quick Action Panel` if a top blocker is already obvious.
5. Use the `Filter` tab to narrow by database, user, application, severity, or wait range.
6. Inspect `Graph` for shape and `Tree` for exact chain hierarchy.
7. Use `Details` to review head blockers quickly.
8. Select a session and review `SQL Statement`, `Locks`, `Execution Plan`, and `Impact Analysis`.
9. If needed, export the graph, report, or CSV files.
10. Kill a session only after reviewing safety and impact signals.

## 11. Interpretation Notes and Limitations

- No active connection means the module cannot refresh and auto-refresh is stopped.
- `Timeline` and inspector `History` depend on snapshots previously captured by this application.
- Summary cards and the severity banner are updated on refresh, not continuously recalculated after every later filter change.
- `Production DB` is based on a name heuristic, not a formal environment flag.
- `AI Brief` is a deterministic recommendation summary in the current build, not a full LLM analysis workflow.
- Execution plans may be unavailable for some sessions even when blocking exists.
- The module does not use standalone checkboxes; toggle behavior is implemented with checkable buttons.
- Killing a session always requires confirmation and may still be rejected by service-level validation.

## 12. Cross-Check Notes

- Main module implementation: `app/ui/views/blocking_view.py`
- Business logic and exports: `app/services/blocking_service.py`
- Severity and kill-safety model: `app/models/blocking_models.py`
- SQL text sources: `app/database/queries/blocking_queries.py`
- View registration: `app/ui/main_window.py`
- Sidebar route and label: `app/ui/components/sidebar.py`
- English locale keys: `app/locales/en.json`

This document reflects the current implementation. If the tab layout, alert rules, export behavior, or session-inspector flow changes in code, this help page should be updated in the same change set.
