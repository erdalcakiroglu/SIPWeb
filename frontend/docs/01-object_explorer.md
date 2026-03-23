# Object Explorer

This document explains the **Object Explorer** module in detail. It was cross-checked against the current implementation in `app/ui/views/sp_explorer_view.py`, related navigation wiring in `app/ui/main_window.py` and `app/ui/components/sidebar.py`, and the current English labels in `app/locales/en.json`.

The Object Explorer module is the main database object browsing and inspection screen in the application. It is designed to help users locate database objects quickly, inspect their source or generated definitions, review lightweight statistics, examine dependencies, and run AI-assisted analysis from a single workflow.

## 1. Purpose of the Module

Object Explorer is intended for read-oriented investigation of SQL Server objects inside the currently connected server and selected database.

In the current build, the module is used to:

- browse user objects by database and object type
- search by object name
- inspect object source code or generated table definition
- review cached execution statistics or table metadata
- inspect object dependencies and references
- launch AI Tune analysis for the selected object

This module does not directly change object definitions. It is primarily an inspection and analysis surface.

## 2. High-Level Layout

The screen is split into two main areas:

- **Left panel**: filters and object list
- **Right panel**: detail tabs for the selected object

The right side contains four tabs:

1. `Source Code`
2. `Statistics`
3. `Relations`
4. `AI Tune`

Selecting an object from the list triggers the module to load source, statistics, and relations immediately for that selection.

## 3. Left Panel

### 3.1 Database Filter

The **Database** drop-down controls which database the object list is populated from.

Current behavior from code:

- databases are loaded from `sys.databases`
- only databases with `state = 0` and `HAS_DBACCESS(name) = 1` are listed
- `model` and `tempdb` are excluded
- if the active connection already has a current database, the UI tries to preselect it

When the user changes the database:

- the active connection is switched with `USE [database]`
- the connection profile database value is updated
- the object list is refreshed

### 3.2 Object Type Filter

The **Object Type** drop-down limits which objects are shown in the list.

Available filter values in the UI:

- `All Objects`
- `Stored Procedures`
- `Views`
- `Triggers`
- `Functions`
- `Tables`

Current implementation filters `sys.objects` by type code:

- Stored Procedures: `P`, `PC`
- Views: `V`
- Functions: `FN`, `IF`, `TF`, `FS`, `FT`
- Triggers: `TR`
- Tables: `U`
- All Objects: `P`, `V`, `FN`, `IF`, `TF`, `TR`, `U`

Note: the “All Objects” branch currently includes the most common core object types, but it is not identical to the full per-type filter set.

### 3.3 Search Box

The **Search** box filters the currently loaded object list by name.

Current behavior:

- search is client-side after the list is loaded
- the search text is split into lowercase terms
- an object remains visible only if all search terms exist in the item text

This means multi-word searches behave as an AND filter.

### 3.4 Object List

The **Objects** list displays items in `schema.object_name` format with a type icon.

Examples of icons used in the current UI:

- `🔷` stored procedures and triggers
- `🔶` views
- `🟢` functions
- `📋` tables

Each row stores internal metadata such as:

- full object name
- schema
- object name
- SQL Server type code
- SQL Server type description

That metadata is used by the right-side tabs and the context menu.

## 4. Object Selection Flow

When the user clicks an object in the list, the module:

- records the selected object type code
- updates the selected object label inside the AI Tune tab
- enables AI Tune preparation for that object
- loads the object source
- loads the object statistics
- loads the object relations
- optionally prepares the AI Tune panel if the AI Tune tab is already open

This makes object selection the main entry point for all detail views.

## 5. Source Code Tab

The **Source Code** tab is the first detail tab and uses a read-only code editor.

### 5.1 What It Shows

For programmable objects such as procedures, views, functions, and supported triggers, the tab loads the object definition from:

- `sys.sql_modules`

If source code is available, the full module definition is shown.

If source code is not available for the selected type, the editor displays a fallback message:

- `-- Source code not available for this object type.`

### 5.2 Table Handling

Tables do not have source stored in `sys.sql_modules`, so the module generates a **best-effort `CREATE TABLE` script** instead.

The generated table script currently includes:

- columns
- SQL data types
- nullability
- identity properties
- default constraints
- computed columns
- persisted computed columns
- primary key definition

The generated output is explicitly labeled as a best-effort script. It should be treated as a practical inspection aid, not as a guaranteed schema scripting replacement for SSMS.

### 5.3 When This Tab Is Most Useful

Use the Source Code tab when you want to:

- read stored procedure or view logic quickly
- inspect functions before tuning
- confirm table structure without leaving the app
- jump to a related object and inspect its definition

## 6. Statistics Tab

The **Statistics** tab changes behavior depending on whether the selected object is a table or a programmable object.

### 6.1 Execution Statistics for Programmable Objects

For non-table objects, the visible group is:

- `Execution Statistics (Cached Plans)`

The current UI displays:

- `Execution Count`
- `Total CPU Time`
- `Total Duration`
- `Total Logical Reads`
- `Total Logical Writes`
- `Total Physical Reads`
- `Plan Creation Time`
- `Last Execution`

These values are gathered from:

- `sys.dm_exec_query_stats`
- `sys.dm_exec_sql_text`

Important interpretation note:

- these are cached-plan-driven statistics
- they are not guaranteed to represent full historical lifetime behavior
- values may be reset by restart, cache eviction, or recompilation

If no matching cached execution data is found, the tab shows the reset/default values rather than historical totals from Query Store.

### 6.2 Table Statistics

For tables, the execution stats group is hidden and the tab shows:

- `Table Statistics`

The current UI displays:

- `Row Count`
- `Reserved (MB)`
- `Used (MB)`
- `Columns`
- `Indexes`
- `Create Date`
- `Modify Date`
- `Last User Read`
- `Last User Write`

These values are currently derived from:

- `sys.objects`
- `sys.dm_db_partition_stats`
- `sys.columns`
- `sys.indexes`
- `sys.dm_db_index_usage_stats`

This makes the table view more metadata-oriented than execution-oriented.

### 6.3 When to Use This Tab

Use the Statistics tab when you want to:

- check whether a procedure appears active in the plan cache
- compare CPU and duration at a quick object level
- see if a table is large or recently used
- validate whether a selected object is hot enough to justify deeper tuning

## 7. Relations Tab

The **Relations** tab shows object dependencies in two directions.

If no dependency information is available, the tab shows the placeholder:

- `Object relations will appear here...`

When data exists, the tab shows two lists:

- `Depends On (Objects used by this object)`
- `Used By (Objects using this object)`

### 7.1 Depends On

The module first tries to collect dependencies from:

- `sys.dm_sql_referenced_entities`

If that fails, it falls back to:

- `sys.sql_expression_dependencies`

This list answers the question:

- What does this object reference?

### 7.2 Used By

The reverse dependency list is collected from:

- `sys.dm_sql_referencing_entities`
- joined to `sys.objects` for type information

This list answers the question:

- What objects reference the selected object?

### 7.3 Double-Click Behavior

Items in either relations list can be double-clicked.

Current behavior:

- if the related object is a table, the module loads its generated table script
- if the related object has source code, the Source Code tab is opened and populated
- if the related type does not have a viewable source definition, the editor shows a fallback message

This makes the Relations tab useful for lightweight impact tracing and navigation.

### 7.4 Limitations

Dependency metadata in SQL Server is not always perfect. Relations may be incomplete when:

- dynamic SQL is used
- objects reference names indirectly
- SQL Server cannot fully resolve dependency metadata

The module already includes fallback logic, but the results should still be treated as best-effort metadata.

## 8. AI Tune Tab

The **AI Tune** tab is the most advanced part of the module. It embeds an analysis workflow directly into the Object Explorer screen rather than opening a separate popup by default.

### 8.1 Initial User Experience

Before analysis starts, the tab shows:

- a short explanation of what AI Tune does
- a selected object label
- collection status and collection log area
- a hidden or auto-prepared analysis panel

The placeholder guidance in the current UI instructs the user to:

1. select an object from the left list
2. open the `AI Tune` tab
3. click `Start Analysis`

The tab is also designed to prepare automatically when the user selects an object and then opens the AI Tune tab.

### 8.2 Preparation Behavior

When AI Tune preparation runs, the module gathers structured context about the selected object. The current code collects or attempts to collect:

- source code
- object resolution metadata
- execution statistics from DMVs
- dependency information
- Query Store summary information
- Query Store wait categories
- top Query Store statements
- plan XML from Query Store
- cached plan XML fallback from DMVs
- deterministic plan insights
- missing index suggestions
- existing indexes on referenced tables
- parameter sniffing signals
- historical performance trend
- memory grant information

This preparation is intended to give the AI model a richer context than a simple source-only prompt.

### 8.3 Starting an Analysis

When the user clicks `Start Analysis`, the module opens an options dialog before running the analysis.

The options dialog currently supports:

- `Standard Analysis`
- `Deep Analysis`
- `Force Refresh` to bypass cache

#### Standard Analysis

This is the default option and is intended for normal usage.

The UI describes it as:

- fast and efficient
- suitable for most scenarios
- normal token usage

#### Deep Analysis

This is the heavier analysis mode.

The UI describes it as:

- higher token usage
- enhanced validation / higher accuracy intent
- intended for more complex procedures

Deep Analysis requires an explicit confirmation checkbox before the start button becomes enabled.

### 8.4 Progress and Output

During analysis, the AI Tune panel shows:

- progress bar
- status label
- status badge
- result area
- timestamped log output

The idle-state help text explicitly says the analysis may cover:

- source code review
- execution statistics
- Query Store metrics
- execution plan analysis
- plan insights
- existing index usage
- parameter sniffing detection
- historical performance trends
- memory grant analysis

### 8.5 Confidence Badge

After analysis, the module can display a **confidence badge** with:

- confidence score
- confidence level
- optional validation warnings
- optional evidence breakdown tooltip

If the confidence result recommends it, the UI also reveals a dedicated:

- `Deep Analysis` button

This allows the user to escalate from a standard run to a deeper run.

### 8.6 Available Actions After Analysis

The embedded AI Tune panel currently supports:

- `Re-run Analysis`
- `Save Report`
- `Save LLM Request`
- `Copy Text`

Report export formats:

- `HTML`
- `Markdown`
- `Text`

The HTML export includes styled report formatting and, when available, confidence and plan-signal details.

The LLM request payload can also be saved as JSON. This is useful for audit, debugging, or prompt review.

### 8.7 Logging and Diagnostics

The analysis panel includes a timestamped log area and supports:

- clearing the log
- copying the log

If an analysis fails but the LLM request payload exists, the UI keeps that payload available for export.

## 9. Context Menu Actions

Right-clicking an object in the list opens a context menu with these actions:

- `AI Tune`
- `View Source Code`
- `View Statistics`
- `View Relations`

These actions are shortcuts to the same right-side behaviors and make navigation faster when working through multiple objects.

## 10. Typical Usage Workflow

A practical Object Explorer workflow usually looks like this:

1. Connect to a SQL Server instance.
2. Open `Object Explorer`.
3. Select the target database.
4. Narrow the list with `Object Type`.
5. Use search to find the object.
6. Open `Source Code` to inspect definition or generated table script.
7. Open `Statistics` to review cached execution or table metadata.
8. Open `Relations` to inspect dependencies and impact.
9. Open `AI Tune` for deeper AI-assisted analysis.
10. Save the report if the result needs to be shared or archived.

## 11. Practical Interpretation Notes

- If the Statistics tab shows no execution data, that does not automatically mean the object is unused. It may only mean no matching cached-plan data is currently available.
- Table scripts are generated best-effort and may not include every possible table attribute that a dedicated schema scripting tool would include.
- Relations are dependency-metadata-based and may miss dynamic SQL references.
- AI Tune quality depends on available context. If Query Store is disabled or plan data is missing, the analysis may still work but with more limited evidence.
- Saving the LLM request can be valuable when validating why the model produced a specific recommendation.

## 12. Cross-Check Notes

- Main module implementation: `app/ui/views/sp_explorer_view.py`
- Navigation registration: `app/ui/main_window.py`
- Sidebar label and route key: `app/ui/components/sidebar.py`
- User-visible English labels: `app/locales/en.json`

This document reflects the current implementation. If tabs, labels, data sources, or AI Tune workflow change in code, this help page should be updated in the same change set.
