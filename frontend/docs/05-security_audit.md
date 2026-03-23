# Security Audit

This document explains the **Security Audit** module in detail. It was cross-checked against the current implementation in `app/ui/views/security_view.py`, `app/services/security_service.py`, `app/database/queries/security_queries.py`, `app/services/security_controls.json`, `app/ui/main_window.py`, `app/ui/components/sidebar.py`, and the current English labels in `app/locales/en.json`.

The Security Audit module is the application's read-only SQL Server security review screen. It collects server-level and current-database security signals, turns them into structured findings, and summarizes the result with risk counts, login inventory, and a maturity score.

## 1. Purpose of the Module

The module is used to:

- run a consolidated security posture audit against the active SQL Server connection
- highlight risky findings with severity and category labels
- show server logins and their basic health state
- summarize security posture with issue counts, maturity level, and maturity score
- export the audit result as a structured HTML report

This module is an assessment and reporting surface. It does not remediate findings automatically and does not change security configuration by itself.

## 2. High-Level Layout

The current Security Audit screen does **not** use in-app tabs. The live Qt view is a split layout with a top action row and a footer summary row.

The screen has four practical areas:

1. **Top action area**
2. **Left findings panel**
3. **Right logins panel**
4. **Footer summary cards**

### 2.1 Top Action Area

The top-right action area contains:

- an audit progress indicator
- `Save HTML`
- `Run Audit`

Important behavior:

- the module does **not** auto-run when the view becomes visible
- the user must click `Run Audit`

### 2.2 Left Findings Panel

The left side is the **Security Issues** panel.

This panel shows:

- a placeholder before the first audit
- issue cards after an audit
- a success message when no findings are returned

Each issue is shown as a card with a risk-colored left border.

### 2.3 Right Logins Panel

The right side is the **Server Logins** panel.

This panel lists up to the first **30** logins returned by the service and shows a compact state per login such as:

- `Active`
- `Disabled`
- `Locked`
- `Expired`

If more than 30 logins exist, the panel shows a `... and N more` notice.

### 2.4 Footer Summary Cards

At the bottom-right, the module shows eight summary cards:

- `Critical`
- `High`
- `Medium`
- `Low`
- `Total Logins`
- `Sysadmins`
- `Maturity`
- `Score`

The `Maturity` and `Score` cards include a small `?` info button tooltip in the current implementation.

## 3. Data Sources and Audit Scope

### 3.1 SQL Sources

The service collects data from SQL Server security catalogs, configuration views, and server properties. Current sources include, among others:

- `sys.server_principals`
- `sys.server_role_members`
- `sys.server_permissions`
- `sys.database_principals`
- `sys.database_permissions`
- `sys.configurations`
- `sys.credentials`
- `sys.endpoints`
- `SERVERPROPERTY(...)`
- best-effort registry reads for Force Encryption

### 3.2 What the Audit Collects

At a high level, the service builds:

- server login counts
- sysadmin counts
- db_owner and orphaned-user signals
- login inventory
- security findings
- maturity score, maturity level, and category breakdown

### 3.3 Finding Families

The audit logic in `SecurityService._run_security_checks()` covers a broad range of security themes. Representative areas include:

- **Authentication**
  - `sa` enabled
  - empty or weak passwords
  - weak password policy settings
  - login impersonation
  - locked logins
  - NTLM/Kerberos-related observations
- **Authorization**
  - excessive sysadmins
  - orphaned users
  - public object/schema permissions
  - schema-level control grants
  - EXECUTE AS patterns
- **Surface Area / Execution**
  - risky features enabled
  - `xp_cmdshell`
  - CLR strict security and unsafe assemblies
  - external scripts
  - risky extended stored procedures
  - SQL Agent and proxy-related security signals
- **Network / Endpoints / Encryption**
  - extra endpoints
  - linked server risks
  - Force Encryption posture
  - unencrypted or fallback-authentication signals
- **Monitoring / Audit**
  - SQL Server Audit status
  - login auditing posture
- **Patch / Database Configuration**
  - update-level and patch posture
  - TRUSTWORTHY and cross-database chaining style risks
  - guest access and related database configuration concerns

This list is not exhaustive, but it reflects the current audit families in code.

## 4. Main Controls

This section explains the visible controls in the current Security Audit screen.

### 4.1 Button Controls

| Control | Type | Purpose | Current Behavior |
| --- | --- | --- | --- |
| `Run Audit` | Button | Starts the security audit for the active connection. | Launches a background worker, disables itself while running, shows progress, and updates the UI on completion. |
| `Save HTML` | Button | Exports the most recent audit as an HTML report. | Disabled until at least one audit has completed successfully. |
| `?` on `Maturity` | Tool button | Explains the meaning of the maturity level card. | Shows a tooltip describing the 1–5 maturity scale. |
| `?` on `Score` | Tool button | Explains the meaning of the maturity score card. | Shows a tooltip describing the 0–100 score. |

### 4.2 Checkbox Controls

The current Security Audit screen has **no visible standalone checkboxes**.

### 4.3 Combobox Controls

The current Security Audit screen has **no visible comboboxes**.

### 4.4 Progress Indicator

Although it is not a button, checkbox, or combobox, the top progress bar is important.

Purpose:

- indicates that the audit is currently running in the background

Current behavior:

- it is hidden when idle
- it becomes visible during audit execution
- it uses an indeterminate progress style rather than a percentage

## 5. Live Screen Sections

Because the current module has no in-app tabs, this section explains the screen by visible panels instead.

### 5.1 Security Issues Panel

This is the main result area of the module.

#### Before the First Audit

The panel shows a placeholder:

- `Click 'Run Audit' to analyze security`

#### When No Issues Are Found

The panel shows a positive status message:

- `No security issues found!`

#### When Issues Exist

Each result is shown as an **Issue Card**.

Current issue card content includes:

- risk badge
- category label
- title
- description
- `Why`
- `Attack`
- control/compliance/CIS reference line
- optional detail snippets
- recommendation text when available

Important note:

- the UI card intentionally does **not** show the verification query inline
- the verification query is included in the HTML report instead

### 5.2 Server Logins Panel

This panel shows a compact inventory of server logins.

Current row content includes:

- login name
- login type
- status label

Status rules in the current UI:

- `Disabled` if the login is disabled
- `Locked` if the login is locked
- `Expired` if the login is expired
- otherwise `Active`

This panel is intended as a quick operational reference, not a full login-management screen.

### 5.3 Footer Summary Cards

The footer gives a fast posture summary after each audit.

| Card | Meaning |
| --- | --- |
| `Critical` | Number of critical findings in the current audit. |
| `High` | Number of high-risk findings. |
| `Medium` | Number of medium-risk findings. |
| `Low` | Number of low-risk findings. |
| `Total Logins` | SQL logins plus Windows logins returned by the audit summary. |
| `Sysadmins` | Count of sysadmin members from the summary query. |
| `Maturity` | Security maturity level shown as `L1` to `L5`. |
| `Score` | Security maturity score from `0` to `100`. |

The `Maturity` card accent color changes by level in the current implementation.

## 6. Findings and Severity Interpretation

### 6.1 Risk Levels

The service uses these risk levels:

- `Critical`
- `High`
- `Medium`
- `Low`
- `Info`

Only `Critical`, `High`, `Medium`, and `Low` are surfaced in the footer cards.

### 6.2 Finding Metadata

Each `SecurityIssue` can carry structured metadata such as:

- `control_id`
- `compliance_ref`
- `cis_ref`
- `iso_27001_annex_a`
- `nist_800_53`
- `why_matters`
- `attack_scenario`
- `verification_query`

The view uses only part of this metadata directly, while the HTML report uses more of it.

### 6.3 Issue Ordering

The service sorts issues by risk order before returning them to the view, so higher-severity findings appear earlier in the issue list.

## 7. Maturity Score and Level

The Security Audit module computes a maturity score and level after the audit completes.

### 7.1 Current Output

The summary exposes:

- `maturity_score`
- `maturity_level`
- `maturity_label`
- `maturity_profile`
- `category_scores`

### 7.2 High-Level Scoring Model

The current service subtracts weighted penalties from `100` based on issue severity.

The profile is controlled by:

- environment variable `SQLPERFAI_SECURITY_PROFILE`

Current profile options are:

- `standard`
- `hardened`
- `banking`

### 7.3 Gating Rules

The service also applies level caps in some situations. For example:

- any critical finding can cap the level at `L2`
- any high finding can cap the level at `L4`
- some foundational control failures can cap the level at `L3`

### 7.4 Category Breakdown

The service groups issues into broader categories such as:

- `Access Control`
- `Surface Area`
- `Network`
- `Audit & Monitoring`
- `Encryption`
- `Patch`
- `Database Config`
- `Other`

These category scores are not shown in the live Qt view, but they are included in the HTML report.

## 8. HTML Report Tabs

The live Security Audit module itself has no tabs, but the **exported HTML report does**.

When the user clicks `Save HTML`, the generated report contains client-side tabs:

1. `Summary`
2. `Issues`
3. `Cross-Mapping`
4. `Logins`

This is an important distinction:

- **live module**: no tabs
- **saved HTML report**: tabbed report interface

### 8.1 Summary Tab

The HTML `Summary` tab includes:

- server and database context
- edition and version details
- update level details
- connection and driver hints
- Force Encryption status
- maturity level and score
- collection timestamp
- surface area section
- maturity breakdown table

### 8.2 Issues Tab

The HTML `Issues` tab renders the issue cards in report form.

Compared with the live UI, the HTML output also includes:

- verification query text

### 8.3 Cross-Mapping Tab

This report tab maps findings to security frameworks and references, using fields such as:

- control id
- CIS reference
- ISO 27001 Annex A
- NIST 800-53

### 8.4 Logins Tab

This report tab shows the top 30 logins in table form, including:

- login name
- login type
- status
- password last set time
- bad password count
- bad password time

## 9. Save HTML Output

The `Save HTML` action writes a structured report to disk.

### 9.1 What It Contains

The current HTML report includes:

- generated timestamp
- top summary cards
- tabbed report navigation
- environment and connection context
- issue list
- framework cross-mapping
- logins table
- surface area configuration table
- maturity breakdown

### 9.2 Context Collection

Before exporting, the view attempts a best-effort collection of context such as:

- server name
- database name
- edition
- product version and product level
- update level and update reference
- machine and instance
- collation
- cluster and HADR flags
- integrated-only authentication mode
- Force Encryption registry value when accessible
- connection profile data such as port, auth method, driver, and client encryption settings

Some of this context may be unavailable depending on permissions.

## 10. Typical Workflow

A practical Security Audit workflow usually looks like this:

1. Connect to the target SQL Server and database.
2. Open `Security Audit`.
3. Click `Run Audit`.
4. Review the footer cards for quick severity and maturity context.
5. Read the issue cards in the left panel from highest risk downward.
6. Review the right-side login inventory for disabled, locked, or expired accounts.
7. Save the result as HTML when the findings need to be shared, archived, or reviewed outside the app.

## 11. Interpretation Notes and Limitations

- The module is read-only; it does not apply fixes.
- The view does not auto-run on show; a user action is required.
- The live Qt screen has no tabs even though the saved HTML report does.
- `Save HTML` is unavailable until an audit result exists.
- The right login panel is capped at 30 visible rows in the live UI.
- Some audit checks are best-effort and may be affected by SQL permissions or environment limitations.
- Some contextual export details, such as Force Encryption registry reads, may be unavailable depending on access rights.
- The issue cards do not show verification queries inline; those appear in the HTML report.
- Locale keys in `en.json` include older generic security labels, but the current `SecurityView` implementation uses the split-panel audit layout described here.

## 12. Cross-Check Notes

- Main module implementation: `app/ui/views/security_view.py`
- Security audit logic and scoring: `app/services/security_service.py`
- Security SQL queries: `app/database/queries/security_queries.py`
- Control/compliance mapping: `app/services/security_controls.json`
- View registration: `app/ui/main_window.py`
- Sidebar route and label: `app/ui/components/sidebar.py`
- English locale keys: `app/locales/en.json`

This document reflects the current implementation. If in-app filters, tabs, report sections, or scoring behavior change in code, this help page should be updated in the same change set.
