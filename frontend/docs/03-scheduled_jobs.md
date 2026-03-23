# Scheduled Jobs

This document explains the **Scheduled Jobs** module in detail. It was cross-checked against the current implementation in `app/ui/views/jobs_view.py`, `app/services/jobs_service.py`, `app/database/queries/jobs_queries.py`, `app/ui/main_window.py`, `app/ui/components/sidebar.py`, and the current English labels in `app/locales/en.json`.

In the current UI, the navigation label is **Scheduled Jobs**, while the module title resolves to **SQL Agent Jobs**. Functionally, this screen is a read-only monitoring and triage surface for **SQL Server Agent jobs**.

## 1. Purpose of the Module

The module is used to:

- list SQL Agent jobs for the active SQL Server instance
- show each job's latest status, last run, next run, owner, category, and run context
- identify disabled, failed, never-run, overdue, or long-running jobs
- inspect job steps and recent execution history
- review grouped failures in an alert-oriented inbox
- open quick diagnostics for Database Mail-related failures
- export recent failure evidence and copy read-only remediation SQL

This module does **not** execute jobs, stop jobs, edit schedules, or change SQL Agent configuration. Its purpose is monitoring, investigation, and operator guidance.

## 2. Main Screen Layout

The current screen has three main areas:

1. **Top toolbar**
2. **Left jobs list panel**
3. **Right details and alert panel**

### 2.1 Top Toolbar

The toolbar contains:

- `Last refresh` timestamp
- `Refresh interval` combobox
- `Pause Auto Refresh` toggle button
- `Refresh` button

### 2.2 Left Jobs List Panel

The left panel contains:

- the `All Jobs` header
- search and filter controls
- status chip buttons
- quick filter checkboxes
- the main jobs table

### 2.3 Right Panel

The right panel uses a top-level tab control with two tabs:

1. `Job Details`
2. `Alert Inbox`

Inside `Alert Inbox`, there is a second tab control with three tabs:

1. `Running`
2. `Failed`
3. `Mail Health`

## 3. Data Sources and Refresh Behavior

The module reads job metadata and runtime state from SQL Server system objects in `msdb` and server-level configuration views.

### 3.1 Main Job Data

The current implementation uses objects such as:

- `msdb.dbo.sysjobs`
- `msdb.dbo.sysjobactivity`
- `msdb.dbo.sysjobhistory`
- `msdb.dbo.sysjobsteps`
- `msdb.dbo.sysjobschedules`
- `msdb.dbo.sysschedules`
- `msdb.dbo.syscategories`
- `msdb.dbo.sysproxies`

### 3.2 Database Mail Diagnostics

For mail-related failure analysis, the module also reads:

- `sys.configurations`
- `msdb.dbo.sysmail_profile`
- `msdb.dbo.sysmail_principalprofile`
- `msdb.dbo.sysmail_event_log`

### 3.3 Refresh Model

The screen refresh is manual plus optional auto-refresh.

Current behavior:

- refresh runs only when the view is initialized and visible
- if there is no active database connection, refresh is skipped
- successful refresh updates the `Last refresh` timestamp
- auto-refresh stops when the view is hidden
- auto-refresh also stops when the interval is `Off` or when `Pause Auto Refresh` is enabled

### 3.4 Permission Fallback

The summary query prefers `msdb.dbo.sysjobactivity` so the screen can show currently running jobs. If the caller does not have permission to read `sysjobactivity`, the service falls back to a reduced summary that sets `running_jobs` to `0`.

This means:

- the module still loads basic job data
- running-job visibility may be incomplete
- some live runtime indicators can degrade when permissions are limited

## 4. Primary Controls

This section explains the main visible comboboxes, checkboxes, and buttons on the screen.

### 4.1 Combobox Controls

| Control | Type | Current Options | Purpose |
| --- | --- | --- | --- |
| `Refresh interval` | Combobox | `10s`, `30s`, `60s`, `Off` | Controls the auto-refresh timer interval for the visible view. Default is `30s`. `Off` disables the timer but does not disable manual refresh. |
| `Category` | Combobox | `All Categories` plus categories found in the current dataset | Filters the jobs table by SQL Agent job category. The list is rebuilt from the currently loaded jobs after refresh. |
| `Failure window` | Combobox | `24h`, `7d` | Works together with `Only failures`. It is disabled until `Only failures` is checked. It filters by jobs whose latest job outcome is `Failed` within the selected time window. |

### 4.2 Checkbox Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Needs Attention` | Checkbox | Focuses the list on jobs that likely require operator review. | A job is treated as needing attention when it is disabled, has a latest status of `Failed`, `Retry`, or `Canceled`, or has never run. Running jobs are not included in this rule. |
| `Only failures` | Checkbox | Restricts the table to failure-focused rows. | Shows only jobs whose **latest** job outcome is failed and whose `Last Run` is inside the selected `24h` or `7d` window. This is not a full historical failure search for all past runs. |
| `Only disabled` | Checkbox | Limits the table to disabled jobs. | Hides enabled jobs regardless of last outcome. |
| `Only long running (>30m)` | Checkbox | Focuses on long-running work. | Includes jobs that are currently running for at least 30 minutes or whose last recorded run duration was at least 30 minutes. |

### 4.3 Button Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Pause Auto Refresh` | Checkable button | Temporarily stops automatic refresh without changing the selected interval. | When checked, the button text changes to `Resume Auto Refresh`. Manual refresh still works. |
| `Refresh` | Button | Reloads all job data from SQL Server immediately. | Refreshes the jobs table, running inbox, failed inbox, and the selected job drawer. |

## 5. Left Panel Filters and Job List

The left panel is the main working list for job selection and filtering.

### 5.1 Search Box

Although it is not a combobox or checkbox, the search field is an important control.

Purpose:

- filters the currently loaded jobs client-side

Current search scope:

- job name
- category
- owner
- status text
- outcome code
- full last outcome message
- run context text
- schedule text

### 5.2 Status Chip Buttons

The `Status` row uses **checkable buttons**, not checkboxes.

Current chip buttons are:

- `All`
- `Running`
- `Failed`
- `Succeeded`
- `Disabled`
- `Never run`

These chips are mutually exclusive because they are placed in an exclusive `QButtonGroup`.

Current meaning:

- `All`: no status restriction
- `Running`: jobs currently running according to `sysjobactivity`
- `Failed`: jobs whose latest outcome row has `run_status = 0`
- `Succeeded`: jobs whose latest outcome row has `run_status = 1`
- `Disabled`: jobs with `enabled = 0`
- `Never run`: jobs with no recorded last status and no recorded last run date

### 5.3 Job Table Columns

The table uses the following columns:

| Column | Meaning |
| --- | --- |
| `Job` | SQL Agent job name. |
| `Status` | Derived status text such as `Running`, `Failed`, `Succeeded`, `Retry`, `Canceled`, `Never run`, or `Unknown`. |
| `Category` | SQL Agent category name. |
| `Last Run` | Latest job outcome timestamp from `sysjobhistory` job-outcome rows. |
| `Last Dur` | Latest job duration, formatted from SQL Agent `HHMMSS` style duration. |
| `Avg Dur (7d)` | Average job-outcome duration over the last 7 days. |
| `Success (7d)` | Success percentage over the last 7 days using job-outcome rows. |
| `Outcome` | Compact outcome code extracted heuristically from the last outcome message. The full text is shown in the drawer. |
| `Owner` | SQL Agent job owner. |
| `Run As/Proxy` | Combined quick summary of `run as` and proxy context. This is derived from the first step context in the current query. |
| `Schedule` | Compact schedule summary such as `On demand`, `Daily`, `Weekly`, or `Every N min/hour/sec`. |
| `Next Run` | Next scheduled execution time when available. |
| `Enabled` | `Yes` or `No`. Disabled rows are visually emphasized. |

### 5.4 Selection Behavior

When filters change, the view tries to keep the previous job selected. If the previously selected job is no longer visible, the first visible row is selected automatically. The selected row drives the entire `Job Details` drawer.

## 6. Tab Details

This section explains the visible tabs in the current UI.

### 6.1 Top-Level Tab: Job Details

The `Job Details` tab is the evidence drawer for the currently selected job. It has three practical sections inside the scrollable pane:

1. `A) Summary`
2. `B) Steps`
3. `C) History`

#### 6.1.1 A) Summary

The Summary section shows these fields:

- `Name`
- `Status`
- `Enabled`
- `Owner`
- `Run As`
- `Proxy`
- `Category`
- `Description`
- `Last Run`
- `Last Duration`
- `Avg Duration (7d)`
- `Success (7d)`
- `Outcome Code`
- `Next Run`
- `Schedule`

It also shows `Last Outcome Message` in a read-only text box.

Important details:

- the `Status` label is color-coded
- `Enabled = No` is visually highlighted in red
- the drawer loads extra evidence only when the selected job changes
- the schedule label can summarize up to two schedules and then show `+N more`

#### 6.1.2 Buttons in Summary

| Control | Type | Purpose |
| --- | --- | --- |
| `Copy` | Button | Copies the full `Last Outcome Message` to the clipboard. |

#### 6.1.3 B) Steps

The Steps section shows:

- a step table with `Step`, `Subsystem`, and `Command Preview`
- `Last failed step`
- the selected step's latest message in a read-only text box

Current behavior:

- step commands are previewed and truncated when long
- the latest failed step is highlighted when it can be identified from history
- the step message area is driven by the currently selected step row

#### 6.1.4 Buttons in Steps

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Copy` | Button | Copies the active step message. | Copies the selected step's message from recent history. |
| `Search in KB` | Button | Opens an external knowledge search for the current step error. | Opens Microsoft Learn search using a query that starts with `SQL Agent job step error ...`. |

#### 6.1.5 C) History

The History section shows recent job-outcome rows for the selected job.

Visible elements:

- `24h` summary label
- `7d` summary label
- recent history table with `Start`, `End`, `Duration`, and `Outcome`

Important behavior:

- only job-outcome rows are counted for these summaries
- the success-rate labels count `Succeeded` and `Failed` rows for the time window
- the visible history table is limited to the newest 20 outcome rows

### 6.2 Top-Level Tab: Alert Inbox

The `Alert Inbox` tab is the triage-oriented side of the module. It contains three nested tabs:

1. `Running`
2. `Failed`
3. `Mail Health`

In the current implementation, the nested tab control opens on `Failed` by default.

#### 6.2.1 Nested Tab: Running

The `Running` tab lists currently executing jobs.

Columns:

- `Job`
- `Start`
- `Elapsed`
- `Current Step`
- `Estimated End`

Important behavior:

- `Elapsed` is based on the current runtime in seconds
- `Current Step` shows `step_id - step_name` when possible
- `Estimated End` is based on the job's average historical duration and may be blank when no reliable average exists

This tab is informational only. The current UI does not expose a stop, kill, or open-from-running action here.

#### 6.2.2 Nested Tab: Failed

The `Failed` tab groups recent failed step executions from the last 24 hours.

Current grouping key:

- job name
- step id
- normalized error message

Visible elements:

- `Top root causes` summary label
- grouped failure table with `Job`, `Step`, `Count`, `Root Cause`, `Last Seen`, and `Error Preview`
- full error message area
- operator action buttons

##### Root-Cause Heuristics

The current code classifies grouped failures into these root-cause buckets:

- `Database Mail failure`
- `Proxy permission`
- `Timeout`
- `Login failed`
- `Other`

This is heuristic text classification. It is useful for triage, but it is not a guaranteed root-cause engine.

##### Buttons in Failed

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Open job details` | Button | Jumps from the selected grouped failure to the related job in the main jobs table. | Selects the matching job and switches the right panel to `Job Details`. |
| `Copy error` | Button | Copies the full grouped error message. | Uses the selected grouped failure. |
| `Export 20 CSV` | Button | Exports recent raw failure evidence to CSV. | Exports the first 20 rows from the module's raw failed-jobs dataset, not only the selected grouped failure. |
| `Export 20 JSON` | Button | Exports recent raw failure evidence to JSON. | Exports the first 20 rows from the raw failed-jobs dataset. |
| `Show msdb refs` | Button | Shows `msdb` references for the selected grouped failure. | Displays job id, step id, run date, and run time values collected from grouped raw failures. |
| `Copy remediation SQL` | Button | Copies a read-only SQL diagnostic script. | Builds a helper script tailored to the selected grouped failure and its classified cause. The app does not execute the script. |
| `Open docs/KB` | Button | Opens external troubleshooting documentation. | Uses cause-specific Microsoft Learn pages for known causes, otherwise falls back to a Learn search query. |
| `Generate incident note` | Button | Creates a reusable operator summary. | Copies an incident note with job name, step, last seen, repeat count, heuristic cause, error preview, and a suggested action. |

#### 6.2.3 Nested Tab: Mail Health

The `Mail Health` tab is a focused helper for Database Mail-related failures.

Visible elements:

- `Mail classification` label
- `DB Mail Health quick checks (read-only)` text panel
- `Copy checks` button

Current behavior:

- when the selected failed group is not mail-related, the panel clearly says that no DB Mail quick checks were run
- when the error looks mail-related, the module reads a lightweight snapshot of Database Mail state
- the panel can show whether Database Mail XPs are enabled, how many profiles exist, how many default profiles exist, and the most recent mail event or error
- the panel also appends a manual SQL reference block for follow-up investigation

Current mail classifications are:

- `Permission`
- `Profile`
- `SMTP`
- `Database Mail`
- `Not mail-related`

##### Buttons in Mail Health

| Control | Type | Purpose |
| --- | --- | --- |
| `Copy checks` | Button | Copies the current DB Mail health text panel to the clipboard. |

## 7. Detailed Control Reference

This section lists the visible buttons, checkboxes, and comboboxes together in one place for quick help-authoring use.

### 7.1 Buttons

| Control | Area | Notes |
| --- | --- | --- |
| `Pause Auto Refresh` / `Resume Auto Refresh` | Top toolbar | Checkable button that pauses or resumes timer-based refresh. |
| `Refresh` | Top toolbar | Forces immediate reload. |
| `All` | Left filter area | Checkable status chip for no status restriction. |
| `Running` | Left filter area | Checkable status chip for running jobs only. |
| `Failed` | Left filter area | Checkable status chip for latest failed jobs only. |
| `Succeeded` | Left filter area | Checkable status chip for latest successful jobs only. |
| `Disabled` | Left filter area | Checkable status chip for disabled jobs only. |
| `Never run` | Left filter area | Checkable status chip for jobs without any recorded run. |
| `Copy` | Job Details > Summary | Copies the last outcome message. |
| `Copy` | Job Details > Steps | Copies the selected step message. |
| `Search in KB` | Job Details > Steps | Opens Microsoft Learn search for the step error. |
| `Open job details` | Alert Inbox > Failed | Jumps from grouped failure to the related job drawer. |
| `Copy error` | Alert Inbox > Failed | Copies the selected grouped error. |
| `Export 20 CSV` | Alert Inbox > Failed | Saves recent raw failures as CSV. |
| `Export 20 JSON` | Alert Inbox > Failed | Saves recent raw failures as JSON. |
| `Show msdb refs` | Alert Inbox > Failed | Displays grouped `msdb` evidence references. |
| `Copy remediation SQL` | Alert Inbox > Failed | Copies read-only investigation SQL. |
| `Open docs/KB` | Alert Inbox > Failed | Opens cause-specific docs or Learn search. |
| `Generate incident note` | Alert Inbox > Failed | Copies a structured incident summary. |
| `Copy checks` | Alert Inbox > Mail Health | Copies the current DB Mail health panel. |

### 7.2 Checkboxes

| Control | Area | Notes |
| --- | --- | --- |
| `Needs Attention` | Left filter area | Focuses on disabled, failed, retry, canceled, or never-run jobs. |
| `Only failures` | Left filter area | Enables failure-window filtering based on the latest failed run. |
| `Only disabled` | Left filter area | Shows disabled jobs only. |
| `Only long running (>30m)` | Left filter area | Shows jobs running at least 30 minutes, or jobs whose last run lasted at least 30 minutes. |

### 7.3 Comboboxes

| Control | Area | Notes |
| --- | --- | --- |
| `Refresh interval` | Top toolbar | Controls the timer interval or disables auto-refresh. |
| `Category` | Left filter area | Filters the current jobs dataset by category. |
| `Failure window` | Left filter area | Supports `Only failures` with `24h` or `7d` scope. |

## 8. Operator Notes and Limitations

Important current limitations:

- the module is read-only from an operational perspective; it does not run or stop jobs
- `Only failures` is based on the **latest** job outcome, not a full all-runs historical match
- grouped failures are derived from the last 24 hours of failed step rows
- root-cause labels and mail classifications are heuristic and may require manual validation
- `Run As/Proxy` in the jobs table is a compact summary, not a full per-step security breakdown
- `Estimated End` for running jobs depends on historical averages and may be unavailable
- if `sysjobactivity` access is limited, live running-job visibility may be reduced

## 9. Typical Workflow

A typical use of the module is:

1. refresh the screen and review the jobs list
2. narrow the list with status chips, category, or quick checkboxes
3. select a job and inspect its summary, steps, and history
4. open `Alert Inbox > Failed` to review repeated step failures
5. use `Open job details`, `Copy remediation SQL`, or `Generate incident note` for deeper triage
6. if the failure is mail-related, check `Mail Health` and copy the DB Mail checks for escalation or manual validation
