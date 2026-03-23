# Settings

The **Settings** window is the central place for configuring application behavior, AI integrations, database connectivity, licensing, and interface preferences. Most users will visit this page when setting up the product for the first time, connecting to a new SQL Server, adjusting query-related limits, or reviewing license and security options.

Some changes affect the application immediately after you click **Save Settings**. Others affect only future actions, such as new database connections, AI requests, or Query Statistics analyses. Administrative options such as AI prompt rules, licensing, and local app lock should be changed carefully.

## 1. Overview

Use the Settings window when you want to:

- configure startup behavior
- control which modules appear in the left navigation
- tune Query Statistics bottleneck thresholds
- add or edit AI providers
- manage saved database connections
- adjust cache and timeout behavior
- review license status or activate a trial
- change font and editor display preferences

In general, the Settings page is not a monitoring screen. It is a configuration screen. Users typically open it during initial setup, after an infrastructure change, or when troubleshooting application behavior.

## 2. Settings Window Layout

The Settings window is organized into five top-level tabs:

- **General**: startup options, module visibility, query-analysis thresholds, and application metadata
- **AI / LLM**: provider setup, generation temperatures, and advanced prompt configuration
- **Database**: saved connections, timeouts, and cache controls
- **License**: license status, activation details, and local app lock settings
- **Appearance**: theme and font-related display preferences

At the bottom of the window, two global actions are available:

- **Reset to Defaults** restores the main application settings to their default values. It does not delete saved database connection profiles, and it does not reset AI prompt-rule YAML files; use **Reset Prompt Rules** separately for prompt templates.
- **Save Settings** writes the current configuration to the application settings store and persists any AI prompt-rule edits made in the current session.

Important behavior notes:

- Changing values in the window does not persist them until you click **Save Settings**, unless the tab provides its own immediate action.
- Some actions inside individual tabs are immediate and separate from the global Save button. Examples include testing a connection, testing an AI provider, generating a device ID, validating a license, or clearing cache.
- Some settings are stored as preferences for startup or future editor behavior and may not produce an immediate visible change in every build or screen.
- Interface language is currently fixed to **English**, even though the language section is visible.

## 3. General Tab

The **General** tab contains application-wide preferences that affect everyday usability rather than one specific subsystem. If you want to control startup behavior, simplify the visible module list, or influence how Query Statistics classifies bottlenecks, this is the tab you will use most often.

This tab is divided into five logical sections:

- **Language**
- **Startup**
- **Navigation Menu**
- **Query Analysis (Bottleneck Thresholds)**
- **Application Info**

Important scope note:

- Settings in this tab do **not** change SQL Server configuration.
- Settings in this tab do **not** change server-side query execution behavior.
- The bottleneck thresholds affect how the application interprets and labels workloads inside **Query Statistics** analysis.

### Language

The **Language** section contains the **Interface Language** selector.

| Setting | Current Value | Meaning |
| --- | --- | --- |
| Interface Language | English | Controls the display language of the application UI |

Current behavior:

- The selector is visible, but it is intentionally locked.
- The current production interface language is **English only**.
- This setting is present for future expansion and documentation continuity.

What users should know:

- No action is required here today.
- Changing this setting is not part of the current supported workflow.
- Future releases may expand this section when additional UI languages are officially supported.

### Startup

The **Startup** section stores preferences related to launch-time behavior.

Current implementation note:

- These options are persisted in the settings file.
- The application records the last successful connection profile when you connect from the **Database** tab.
- In the current build, you should treat these as startup policy flags rather than guaranteed visible actions on every launch path.

#### Settings in this section

| Setting | Default | Type | What it controls |
| --- | --- | --- | --- |
| Auto-connect to last server | Off | Checkbox | Stores whether startup workflows may reuse the most recently connected saved profile |
| Check for updates on startup | On | Checkbox | Stores whether startup update checks are allowed |

#### Auto-connect to last server

When this option is enabled, the preference allows future startup automation to reconnect using the last remembered saved profile.

Operational note:

- This depends on both a saved connection profile and a recorded last connection ID.
- The current build records the last profile after a successful manual connection from **Database Connections**.
- Automatic reconnection is not guaranteed on every launch path yet, so enabling the checkbox may not create an immediate visible change.

Recommended use cases:

- You always work with the same SQL Server or the same development environment.
- You want a faster start-of-day workflow.
- You are the only user of the machine or environment.

Cases where you may want it disabled:

- You frequently switch between development, test, and production servers.
- You want to verify the target server manually before connecting.
- Your environment has stricter operational or security review requirements.

#### Check for updates on startup

When enabled, this preference indicates that startup update checks are allowed.

Current behavior note:

- The setting is saved and exposed in the UI.
- A user-visible update-check workflow is not currently surfaced from every startup path in the desktop app.
- Treat this as a deployment preference rather than a guaranteed prompt on each launch.

Recommended use cases:

- Normal workstation or analyst usage
- Teams that want users to stay reasonably current

Cases where you may want it disabled:

- Your organization controls upgrades centrally
- You work in isolated or restricted environments where update checks are intentionally limited

### Navigation Menu

The **Navigation Menu** section controls which modules are visible in the left sidebar. This is a UI simplification feature. It does not uninstall a module or remove its code. It only changes visibility in the navigation.

This is helpful when:

- you want a cleaner interface for non-technical users
- your team uses only a subset of modules
- you want to reduce distraction and focus on a smaller workflow

#### Menu groups

The section is separated into:

- **Main Menu**
- **Tools**

#### Modules you can control

Typical visible modules include:

- Dashboard
- Object Explorer
- Query Statistics
- Performance Advisor / Index Advisor
- Blocking Analysis
- Security Audit
- Scheduled Jobs
- Wait Statistics

Additional behavior:

- The **Chat** module is intentionally locked off and cannot currently be enabled.
- The application requires at least one menu item to remain enabled.
- The **Settings** module is always kept accessible so you cannot lock yourself out of configuration.

#### How to use this section

Use this area to tailor the product to a role or audience.

Examples:

- Show only **Dashboard**, **Query Statistics**, and **Wait Statistics** for performance analysts.
- Keep **Security Audit** and **Blocking Analysis** visible only for senior DBAs.
- Hide rarely used modules in training or demo environments.

Recommended practice:

- Hide only what is genuinely unnecessary.
- Keep core analysis modules visible unless you have a documented reason to simplify the UI.
- Revisit menu visibility after onboarding or role changes.

### Query Analysis (Bottleneck Thresholds)

This is the most advanced part of the General tab. These settings influence deterministic bottleneck classification used by **Query Statistics** analysis.

In practical terms, these values help the application answer questions such as:

- Is this query mostly CPU-bound?
- Is the dominant problem waits?
- Does the workload look storage-latency driven?
- Are high reads the main reason a query looks expensive?

These values are not SQL Server server settings. They are interpretation thresholds used by the application.

#### Threshold parameters

| Parameter | Default | Accepted Range | Purpose |
| --- | --- | --- | --- |
| Dominant Wait Threshold (%) | 40.0 | 0.0 to 100.0 | Defines when waits are dominant enough to drive bottleneck classification |
| Signal Wait Threshold (%) | 15.0 | 0.0 to 100.0 | Defines when signal waits are significant enough to influence CPU-pressure interpretation |
| Storage IO Latency (ms) | 15 | 0 to 5000 | Defines when storage latency is considered materially high |
| Log Write Latency (ms) | 10 | 0 to 5000 | Defines when transaction log write latency is considered materially high |
| CPU High (per exec, ms) | 50 | 0 to 10000 | Defines when per-execution CPU cost is considered high |
| CPU Low Reads | 5000 | 0 to 1000000 | Helps distinguish CPU-heavy queries from high-read queries |
| IO High Reads | 20000 | 0 to 1000000 | Defines when read volume is high enough to support I/O-heavy classification |

#### Dominant Wait Threshold (%)

Default: **40.0**

This controls how strongly wait activity must dominate before the analysis classifies a query as primarily wait-driven.

Lower values:

- make the system more willing to classify waits as dominant
- can be useful in environments where waits are consistently a primary bottleneck

Higher values:

- make the system more conservative
- can reduce over-classification of wait-driven patterns

#### Signal Wait Threshold (%)

Default: **15.0**

Signal waits often indicate scheduler pressure or CPU contention rather than raw resource waits. This threshold helps the application decide when signal waits should materially influence interpretation.

Lower values:

- make CPU-pressure interpretation more sensitive

Higher values:

- reduce sensitivity to smaller signal-wait proportions

#### Storage IO Latency (ms)

Default: **15 ms**

This threshold tells the application when storage latency should be treated as notable enough to contribute to an I/O bottleneck interpretation.

Increase this value if:

- your environment has a naturally higher but accepted storage baseline
- the analysis is flagging storage pressure too aggressively

Keep or reduce it if:

- you want early sensitivity to storage problems
- low-latency storage is expected in your environment

#### Log Write Latency (ms)

Default: **10 ms**

This setting focuses specifically on transaction log write behavior. It is useful in systems where heavy write workloads, commit pressure, or slow log storage can distort performance.

Consider adjusting it if:

- your workload is write-heavy
- transaction log throughput is a known constraint
- the app is over- or under-emphasizing log-related latency

#### CPU High (per exec, ms)

Default: **50 ms**

This threshold defines when a single execution is considered materially expensive from a CPU perspective.

Lower values:

- classify CPU intensity more aggressively

Higher values:

- focus only on more obviously expensive executions

This is useful in environments where query executions are frequent and you need to distinguish modest CPU usage from truly costly CPU patterns.

#### CPU Low Reads

Default: **5000**

This parameter helps the application separate queries that are expensive because of CPU cost from queries that are expensive mainly because of read volume.

If reads are below this boundary, CPU-heavy interpretation is easier to justify. If reads are well above it, the analysis may lean more toward I/O-heavy reasoning.

#### IO High Reads

Default: **20000**

This threshold helps identify when read volume is large enough to support an I/O-heavy classification.

This is particularly useful for:

- large reporting workloads
- wide scans
- warehouse-style read activity
- environments where expensive reads are common but not always problematic

#### When should you change these thresholds?

You should consider changing them only if:

- your workload patterns are consistently different from the defaults
- analysis results look systematically too sensitive or not sensitive enough
- you have enough operational knowledge to interpret the outcome of the change

You should usually avoid changing them if:

- you are still learning the product
- you do not yet have a stable baseline
- you are troubleshooting a one-off query instead of a recurring classification pattern

#### Safe tuning workflow

Use this process if Query Statistics classifications do not match your environment well.

1. Open **Settings > General**.
2. Review the current bottleneck thresholds.
3. Change only one related threshold at a time.
4. Save settings.
5. Return to **Query Statistics** and compare analysis results on known workloads.
6. Keep the change only if it improves clarity and consistency.
7. Document the reason for the change if multiple people use the same environment.

### Application Info

The **Application Info** section is read-only and support-oriented. It helps users and administrators identify the installed build and access supporting artifacts.

#### Items in this section

| Item | Purpose |
| --- | --- |
| Version | Shows the installed application version |
| Build | Shows the build identifier used for release tracking |
| Author | Shows package metadata author information |
| View License Agreement | Opens the product license agreement text |
| Show Application Logs | Opens or reveals application logs used for diagnostics |

Typical reasons to use this section:

- confirming exactly which build is installed
- gathering information before opening a support issue
- reviewing logs after a failed connection, AI request, or licensing problem
- reviewing the license agreement from inside the application

### Recommended Defaults For Most Users

For most users, the safest approach in the General tab is:

- leave **Interface Language** unchanged
- leave the two **Startup** options at their defaults unless your deployment policy requires otherwise
- keep all **Query Analysis thresholds** at defaults unless you are intentionally tuning classification behavior
- hide only modules that are genuinely unnecessary for your team

### Summary

The General tab is best understood as the place where you control:

- startup convenience
- interface simplification
- analysis sensitivity
- product metadata and diagnostics access

Most users will only need to change startup and navigation settings. The bottleneck thresholds are powerful, but they should be adjusted carefully and only with a clear reason.

## 4. AI / LLM Tab

The **AI / LLM** tab controls how the application connects to language models and how those models behave across different workflows. This tab is primarily used during product setup, provider changes, or advanced AI tuning.

It contains three inner tabs:

- **Providers**
- **Generation**
- **AI Prompt Rules**

Important scope note:

- The **Providers** tab controls which LLM backends the application can call.
- The **Generation** tab controls response style and determinism through temperature settings.
- The **AI Prompt Rules** tab controls the internal prompt templates used by the application.

For most users, the normal workflow is:

1. configure one provider in **Providers**
2. keep **Generation** values near defaults
3. avoid changing **AI Prompt Rules** unless you are an advanced user

### 4.1 Providers

The **Providers** tab is where you add, test, edit, and choose the default AI model backend used by the application.

This tab is designed for environments that may use:

- a local model such as **Ollama**
- a hosted API such as **OpenAI**, **Anthropic**, **Azure OpenAI**, or **DeepSeek**
- multiple providers for flexibility, testing, or failover planning

#### What you see in this tab

The Providers tab includes:

- a header with **Add AI Model**
- a provider summary table
- provider action buttons

The provider table contains these columns:

| Column | Meaning |
| --- | --- |
| Default | Shows which provider is the active default provider |
| Name | Friendly display name for the provider |
| Type | Provider family, such as Ollama or OpenAI |
| Model | Model name configured for that provider |

Below the table, the main actions are:

- **Set Default**
- **Edit**

#### Default provider behavior

Exactly one provider should act as the default provider at any given time. The default provider is the one used by the application unless a workflow explicitly overrides it.

If no custom providers are configured, the application creates a default local provider:

| Field | Default |
| --- | --- |
| Provider ID | `default_ollama` |
| Type | Ollama |
| Name | Default Ollama |
| Host | `http://localhost:11434` |
| Model | `codellama` |

This means the application can start in a usable local-first state even before cloud credentials are added.

#### Add AI Model

Use **Add AI Model** to create a new provider definition.

When you add a provider, you will typically specify:

- **Provider**
- **Name**
- **Model**
- provider-specific connection fields

The dialog also includes:

- **Test**
- **Cancel**
- **Add**

When editing an existing provider, the dialog changes to:

- **Test**
- **Remove**
- **Cancel**
- **Save**

Important behavior:

- The dialog suggests an initial model name based on provider type, such as `codellama`, `gpt-4o`, `claude-3-5-sonnet-20241022`, or `deepseek-chat`.
- **Test** validates the current dialog values but does not save the provider.
- When editing an existing provider, the provider type is fixed and cannot be changed in place.
- If you need a different provider type, it is usually cleaner to create a new provider entry.
- If you remove the last remaining provider, the application recreates the built-in **Default Ollama** fallback.

#### Example: Add a new AI model and make it the default

The most common setup flow is:

1. Open **Settings**.
2. Go to **AI / LLM > Providers**.
3. Click **Add AI Model**.
4. In the dialog, choose the provider type from the **Provider** dropdown.
5. Enter a friendly **Name** so the provider is easy to recognize later.
6. Enter the target **Model** name.
7. Fill in the provider-specific connection field values.
8. Click **Test** to validate the configuration.
9. If the test succeeds, click **Add**.
10. Back in the Providers table, select the new provider row.
11. Click **Set Default**.
12. Confirm that the provider now shows as the default in the **Default** column.
13. Click **Save Settings** at the bottom of the Settings window to persist the new provider and default selection.

Important note:

- Adding a provider or changing the default inside the Providers tab updates the current Settings view.
- The configuration is only saved permanently after you click **Save Settings** in the main Settings window.

##### Example: Add a new Ollama model

If you want to add a local Ollama model, the dialog typically looks like this:

- **Provider**: `Ollama`
- **Name**: a friendly label such as `Local Ollama - SQL`
- **Model**: the model name you want the app to call, such as `codellama`
- **Host**: the Ollama server URL, such as `http://localhost:11434`

Recommended Ollama workflow:

1. Make sure the Ollama service is running.
2. Confirm the model is already installed in Ollama.
3. Enter the host and model name exactly as available in your Ollama environment.
4. Click **Test**.
5. If the test result confirms connectivity and model availability, click **Add**.
6. Select the provider in the table.
7. Click **Set Default**.
8. Click **Save Settings**.

##### Example: Add a cloud provider

For providers such as **OpenAI**, **Anthropic**, **Azure OpenAI**, or **DeepSeek**, the flow is similar, but the provider-specific fields change.

Typical pattern:

- choose the provider type
- enter a friendly name
- enter the model name
- enter the required credential values
- for Azure OpenAI, also enter **Endpoint** and **Deployment**
- click **Test**
- click **Add**
- select the provider row
- click **Set Default**
- click **Save Settings**

Recommended best practice:

- test the provider before making it default
- use clear names, especially if you maintain multiple providers
- keep one stable default provider for everyday use
- add experimental providers separately rather than constantly replacing the main one

#### Provider-specific fields

Each provider type has different required fields.

##### Ollama

Fields:

- **Host**
- **Model**

Use this provider when:

- you want a local model running on your own machine or server
- you prefer local control over data flow
- you are testing without relying on a cloud API

Typical host example:

- `http://localhost:11434`

##### OpenAI

Fields:

- **API Key**
- **Model**

Use this provider when:

- you want managed cloud-hosted models
- your team already uses OpenAI operationally
- you want a simple cloud provider setup with minimal infrastructure

##### Anthropic

Fields:

- **API Key**
- **Model**

Use this provider when:

- your use case benefits from Anthropic models
- your organization already standardizes on Anthropic

##### Azure OpenAI

Fields:

- **API Key**
- **Endpoint**
- **Deployment**
- **Model**

Use this provider when:

- your organization uses Azure-hosted OpenAI services
- you need enterprise governance, Azure integration, or controlled deployment naming

Important distinction:

- Azure OpenAI often requires a deployment-specific endpoint pattern rather than a simple public model API flow.

##### DeepSeek

Fields:

- **API Key**
- **Model**

Use this provider when:

- your team uses DeepSeek models
- you want an additional cloud option for comparison or cost/performance evaluation

#### Test connection

The **Test** action validates the provider configuration as far as possible based on provider type.

Examples:

- For **Ollama**, the application checks whether the Ollama service is reachable and whether the selected model appears to exist.
- For hosted API providers, the application validates connectivity and credentials using a lightweight API request.

What a successful test means:

- the endpoint is reachable
- the credentials appear valid
- the configuration is likely usable

What a successful test does **not** guarantee:

- that the provider is the best choice for your workload
- that latency or cost is acceptable
- that every model-specific workflow will behave identically

Recommended practice:

- Always test a new provider before making it the default.
- Re-test after changing API keys, endpoints, model names, or deployments.

#### Set Default

Use **Set Default** to make the selected provider the primary AI backend for the application.

A provider should usually be the default if:

- it is the most stable option in your environment
- it is the provider your team has validated operationally
- it is the lowest-risk choice for normal daily use

Recommended strategy:

- keep one dependable default provider
- add secondary providers for testing, comparison, or backup
- avoid frequently changing the default unless you are validating behavior deliberately

#### Edit and Remove

Use **Edit** to modify an existing provider's name, model, or connection fields.

Use **Remove** when:

- the provider is no longer needed
- credentials have been retired
- the entry was created for temporary testing

Recommended caution:

- avoid removing the only working provider until a replacement is tested
- confirm which provider is currently default before removing it

#### Local vs cloud provider tradeoffs

Use **local providers** such as Ollama when:

- you want local control
- you prefer reduced external dependency
- you are experimenting in development environments

Use **cloud providers** when:

- you want managed infrastructure
- you need access to specific hosted models
- your team already has operational processes around API-based AI services

There is no universal best provider. The right choice depends on governance, latency tolerance, cost sensitivity, model quality expectations, and operational simplicity.

### 4.2 Generation

The **Generation** tab controls response determinism for different AI workflows. All settings in this tab are temperature-based.

#### What temperature means

Temperature controls how variable or creative model output is.

Lower temperature:

- more deterministic
- more stable
- more repeatable
- generally better for structured analysis and operational guidance

Higher temperature:

- more variation
- more exploration
- more expressive wording
- potentially less predictable output

Because this product is focused on SQL Server performance analysis, most default values are intentionally low.

#### Core Analysis Temperatures

These settings affect the most common AI workflows.

| Setting | Default | Range | Purpose |
| --- | --- | --- | --- |
| Default / Chat | 0.10 | 0.00 to 2.00 | General-purpose default behavior, including chat-like interactions |
| Standard Analysis | 0.06 | 0.00 to 2.00 | Structured analysis tasks where consistency is important |
| Deep Analysis | 0.02 | 0.00 to 2.00 | More rigorous analysis workflows that benefit from highly stable output |
| Query Analysis | 0.10 | 0.00 to 2.00 | Query-focused interpretation and explanation workflows |
| Code Optimization | 0.10 | 0.00 to 2.00 | Stored procedure or SQL rewrite suggestions |

##### Default / Chat

Default: **0.10**

Used for broad conversational or default AI behavior. It remains low because even chat-style workflows in this product are expected to remain practical and precise.

##### Standard Analysis

Default: **0.06**

Used for routine analytical workflows where stable phrasing and repeatable structure are more important than creativity.

##### Deep Analysis

Default: **0.02**

Used for higher-rigor workflows. This is intentionally very low to reduce output drift and keep reasoning stable across repeated runs.

##### Query Analysis

Default: **0.10**

Used when the application analyzes query-level behavior and performance symptoms.

##### Code Optimization

Default: **0.10**

Used when the system generates optimized SQL or procedure suggestions. A low value helps preserve practical, implementation-oriented output.

#### Advanced Workflow Temperatures

These settings affect more specialized internal workflows.

| Setting | Default | Range | Purpose |
| --- | --- | --- | --- |
| Index Recommendation | 0.10 | 0.00 to 2.00 | Controls model variability during index recommendation workflows |
| Index Advisor (Preclassified) | 0.10 | 0.00 to 2.00 | Controls index-advisor behavior when deterministic preclassification already exists |
| Self-Reflection Refinement | 0.05 | 0.00 to 2.00 | Used in secondary refinement or critique passes |
| AI Safety Validation | 0.00 | 0.00 to 2.00 | Used in validation-style workflows where consistency is critical |
| SQL Continuation | 0.10 | 0.00 to 2.00 | Used when continuing SQL-oriented output |
| Report Continuation | 0.10 | 0.00 to 2.00 | Used when continuing report-style output |

##### Self-Reflection Refinement

Default: **0.05**

This is used in secondary passes that refine or improve an earlier model output. The default remains low to reduce unnecessary variation while still allowing slight improvement flexibility.

##### AI Safety Validation

Default: **0.00**

This is the strictest setting in the tab. It is designed for validation-like behavior where consistency matters more than style.

#### When should you change temperature values?

You should consider changing them only if:

- you are deliberately tuning AI behavior
- outputs are consistently too rigid or too variable
- you understand which workflow a setting actually affects

You should usually avoid changing them if:

- you are not sure which workflow is causing the behavior you dislike
- you are still validating providers
- you want broad improvement but do not yet have baseline examples

Recommended method:

1. change one temperature only
2. test the exact workflow it affects
3. compare before and after outputs
4. keep the change only if the result is clearly better

For most production use, values close to the defaults are the safest choice.

### 4.3 AI Prompt Rules

The **AI Prompt Rules** tab is the most advanced and most sensitive part of the AI settings area. It controls internal prompt templates used by the application across different workflows.

This tab is intended for advanced users, prompt engineers, or administrators who understand the consequences of changing system and user prompt structure.

Important warning:

- Changes here can materially affect output quality, tone, structure, and reliability.
- Incorrect changes can make results worse even if the provider itself is working correctly.
- These are not routine end-user settings.

#### What this tab contains

The tab includes:

- **Reset Prompt Rules**
- placeholder guidance text
- a set of prompt-specific inner tabs

Current prompt tabs include:

- **Global**
- **Query Analysis**
- **SP Analysis**
- **SP Code Only**
- **Index Recommendation**
- **Index Preclassified**
- **Chat Assistant**
- **Deep Analysis**
- **Self-Reflection**

Prompt rules are currently loaded and reset using the English prompt pack, independent of the fixed interface-language selector.

In practice, this tab lets advanced users influence how the application frames tasks before sending them to the model. That means changes here can alter response tone, structure, strictness, technical depth, and even the consistency of recommendations.

#### Reset Prompt Rules

Use **Reset Prompt Rules** to restore the prompt definitions for the currently supported prompt-rules locale, which is presently **English**.

Recommended use cases:

- a prompt change caused poor results
- you want to return to the supported baseline
- you are comparing custom prompts against product defaults

#### Placeholder help

The tab displays placeholder guidance for supported variables, such as:

- `{global_instructions}`
- `{sql_version}`
- `{message}`
- `{server_name}`
- `{database_name}`
- `{detected_intent}`
- `{collected_data}`
- `{warning_text}`

These placeholders allow the application to inject runtime context into prompts.

Important note:

- Remove or alter placeholders carefully.
- If a prompt depends on contextual placeholders and they are misused, output quality can degrade.

#### Prompt tabs and what they do

Each sub-tab targets a different AI workflow inside the application.

| Sub-tab | One-sentence explanation |
| --- | --- |
| Global | Defines shared high-level instructions that influence multiple AI workflows across the product. |
| Query Analysis | Controls how the model analyzes slow, expensive, or problematic queries and how it explains bottlenecks. |
| SP Analysis | Controls how the model evaluates stored procedures from a broader performance-analysis perspective. |
| SP Code Only | Focuses the model on procedure code review and improvement rather than broader narrative analysis. |
| Index Recommendation | Shapes how the model reasons about missing, helpful, or candidate index recommendations. |
| Index Preclassified | Refines index-related reasoning when the application has already classified the scenario before prompting the model. |
| Chat Assistant | Controls the behavior and tone of the interactive chat assistant inside the product. |
| Deep Analysis | Extends or strengthens deeper reasoning passes when a more rigorous analytical answer is needed. |
| Self-Reflection | Guides the model's second-pass refinement behavior when the application asks it to review or improve an earlier result. |

These tabs are intentionally separated because each workflow has different goals. A chat interaction, an index recommendation, and a stored procedure review should not all use the exact same prompt structure.

The **Chat Assistant** prompt tab remains available even though the Chat module itself is currently hidden in the left navigation.

##### Global

Contains shared instructions that influence multiple AI workflows. This is the broadest prompt layer in the tab.

Use this only when you want to change high-level behavior consistently across analyses.

##### Query Analysis

Contains:

- **System Prompt**
- **User Prompt**

Used for query-focused diagnostic workflows.

Change this only if you need to alter how the application frames query bottlenecks, performance interpretation, or query recommendation output.

##### SP Analysis

Contains:

- **System Prompt**
- **User Prompt**

Used for stored procedure analysis workflows.

##### SP Code Only

Contains:

- **System Prompt**
- **User Prompt**

Used when the application focuses on code-oriented stored procedure output rather than broader narrative analysis.

##### Index Recommendation

Contains:

- **System Prompt**
- **User Prompt**

Used for general index recommendation workflows.

##### Index Preclassified

Contains:

- **System Prompt**
- **User Prompt**

Used in index-related workflows where the application already has deterministic preclassification context before prompting the model.

##### Chat Assistant

Contains:

- **System Prompt**
- **User Prompt**

Used for chat-oriented AI assistance inside the product.

##### Deep Analysis

Contains:

- **Enhancement Prompt**

Used to enhance or extend deeper analytical reasoning workflows.

##### Self-Reflection

Contains:

- **System Prompt**
- **User Prompt**

Used for refinement or second-pass reflection workflows.

#### When should you edit AI Prompt Rules?

You should consider editing prompt rules only if:

- you have a repeatable quality issue that provider changes and temperature tuning did not solve
- you want to enforce a different reporting style or stricter instruction pattern
- you are deliberately tuning one specific workflow, not all AI behavior at once

You should usually avoid editing prompt rules if:

- you are still setting up providers
- you are not sure which workflow is producing the undesired result
- you want a quick fix without having test cases to compare against

Recommended safe approach:

1. Identify the exact workflow that needs improvement.
2. Change only the matching prompt sub-tab.
3. Save the original prompt text before editing.
4. Test with representative real-world examples.
5. Revert or reset if output quality drops.

#### Best practices for prompt changes

Use these rules if you decide to customize prompt behavior:

- change one prompt area at a time
- keep a copy of the original prompt before editing
- test with real representative workloads
- compare output quality before and after changes
- reset to defaults if results become less reliable

#### Recommended usage by user type

| User Type | Recommendation |
| --- | --- |
| Standard user | Do not change prompt rules |
| DBA / analyst | Usually stay on defaults unless there is a specific quality issue |
| Advanced admin / prompt engineer | Change carefully and test methodically |

#### Summary

The AI / LLM tab is where you define:

- which model provider the application uses
- how deterministic or variable outputs should be
- how internal AI prompt behavior is structured

For most environments, the safest approach is:

- configure one reliable provider
- keep low generation temperatures near defaults
- avoid prompt customization unless you have a strong operational reason

## 5. Database Tab

The **Database** tab is where you manage saved SQL Server connection profiles and configure core database access behavior for the application.

This tab contains three sections:

- **Database Connections**
- **General Query Settings**
- **Cache Settings**

Use this tab when you want to:

- add a new SQL Server connection profile
- switch between environments more easily
- edit authentication or connectivity details
- adjust query and connection timeout behavior
- control client-side query result caching

Important scope note:

- The **Database** tab manages how the application connects to SQL Server.
- It does **not** create a new SQL Server database on the server.
- **Add Connection** means "add a saved connection profile," not "provision a new database."

### 5.1 Database Connections

The **Database Connections** section stores reusable connection profiles. A profile contains the information the application needs to connect to a SQL Server instance and optionally open a preferred default database.

#### What you see in this section

This section includes:

- an **Add Connection** button
- a saved connections table
- row-level actions such as **Connect**, **Disconnect**, **Edit**, and **Delete**

The connection table includes these columns:

| Column | Meaning |
| --- | --- |
| Name | Friendly connection profile name |
| Server | SQL Server host or instance name |
| Auth | Authentication method for that profile |
| Connection Actions | Available actions such as Connect, Disconnect, Edit, and Delete |

Additional behavior:

- The currently active connection is shown with a visual indicator in the **Name** column.
- Only one active database connection is intended at a time through the main connection manager workflow.

#### Add Connection

Use **Add Connection** to create a new saved SQL Server connection profile.

This is the normal workflow when:

- you connect to a server for the first time
- you want a separate profile for development, test, or production
- you need to save different authentication styles for different environments

When you click **Add Connection**, the application opens the **Add Connection** dialog.

#### Add Connection dialog fields

The dialog includes the following fields and actions.

| Field | Default / Behavior | Purpose |
| --- | --- | --- |
| Connection Name | Empty | Friendly label used in the saved profile list |
| Server / Instance | Empty | SQL Server host, IP, or instance name |
| Port | `1433` | TCP port used for SQL Server connectivity |
| Default Database | `master` | Database the application will target first for this profile |
| Authentication | SQL Server Authentication or Windows Authentication | Determines how credentials are handled |
| Username | Enabled for SQL Authentication | SQL login name |
| Domain (optional) | Enabled for SQL Authentication | Optional domain prefix if you want `DOMAIN\user` formatting |
| Password | Empty | Password for SQL Authentication; stored separately if provided |
| ODBC Driver | Auto-select best available | Lets the application choose or use a specific installed ODBC driver |
| Encrypt Connection | On | Enables encrypted connection behavior |
| Trust Server Certificate | Off by default | Accepts server certificate without full validation when needed |

Actions in the dialog:

- **Test Connection**
- **Cancel**
- **Save**

#### How to add a new database connection

Use this sequence when you want to add a new saved connection profile for a SQL Server database environment.

1. Open **Settings**.
2. Go to **Database**.
3. In **Database Connections**, click **Add Connection**.
4. Enter a clear **Connection Name** such as `Production SQL`, `Reporting Server`, or `QA Instance`.
5. In **Server / Instance**, enter the SQL Server hostname, IP address, or instance name.
6. Keep **Port** at `1433` unless your SQL Server listens on a different port.
7. In **Default Database**, enter the database you want the application to open first, such as `master`, `MyAppDb`, or `Reporting`.
8. Choose the correct **Authentication** method.
9. If you selected **SQL Server Authentication**, enter **Username**, optional **Domain**, and **Password**.
10. Leave **ODBC Driver** on **Auto-select best available** unless your environment requires a specific driver.
11. Leave **Encrypt Connection** enabled unless you have a controlled reason to disable it.
12. Enable **Trust Server Certificate** only if your environment requires it.
13. Click **Test Connection**.
14. If the test succeeds, click **Save**.

After saving:

- the new connection appears in the saved connections table
- it becomes available for quick **Connect** operations
- it can later be edited or deleted from the same section

#### Authentication methods

The dialog currently supports:

- **SQL Server Authentication**
- **Windows Authentication**

##### SQL Server Authentication

Use this method when you connect with a SQL login and password.

Behavior:

- **Username**, **Domain**, and **Password** are used
- if **Domain** is entered, the application can prefix the username as `DOMAIN\user`

Use this method when:

- you have a dedicated SQL login
- the application is used across environments where Windows session identity is not sufficient

##### Windows Authentication

Use this method when you want the application to connect using the current Windows session.

Behavior:

- **Username**, **Domain**, and **Password** fields are ignored
- the application relies on the Windows identity used to run the app

Use this method when:

- your SQL Server environment uses integrated Windows security
- the current signed-in Windows account already has the required SQL permissions

Important note:

- To use a different Windows or domain account, you generally need to run the application as that user rather than typing alternate credentials into the dialog.

#### Field-by-field guidance

##### Connection Name

This is the label users see in the saved connections list. Choose a name that is obvious and stable.

Recommended examples:

- `Production SQL`
- `Dev SQL 01`
- `Finance Reporting`

Avoid generic names such as:

- `Server1`
- `Test`
- `New Connection`

##### Server / Instance

This identifies the SQL Server target.

Examples:

- `localhost`
- `10.0.0.15`
- `SQLPROD01`
- `SQLPROD01\\INSTANCE1`

Use the exact value required by your environment.

##### Port

Default: **1433**

Most SQL Server environments use `1433`, but some use custom ports.

Change this only if:

- your SQL Server instance is configured on a non-default TCP port
- your DBA or infrastructure team gave you a specific port to use

##### Default Database

Default: **master**

This is the database the application uses as the initial target for the profile.

Use cases:

- keep `master` if you want a safe default starting point
- use an application database if your work is centered on one specific database

This field does not create a database. It only tells the application which database to prefer after connecting.

##### ODBC Driver

Default behavior: **Auto-select best available**

This is the recommended option for most users because the application will choose the most suitable installed driver automatically.

Choose a specific driver only if:

- your environment is standardized on a specific ODBC driver
- troubleshooting requires driver isolation
- compatibility testing needs a fixed driver version

##### Encrypt Connection

Default: **Enabled**

This enables encrypted communication behavior between the application and SQL Server.

Recommended guidance:

- keep this enabled in almost all environments
- disable it only if you have a specific compatibility issue and understand the security implications

##### Trust Server Certificate

Default: **Disabled**

This option is relevant when encryption is used but certificate validation is not fully trusted or not fully configured.

Use it only if:

- your environment uses self-signed certificates
- your SQL Server certificate chain is not fully trusted on the client machine
- your DBA explicitly told you this is required

Avoid enabling it casually in security-sensitive environments.

#### Test Connection

Use **Test Connection** before saving a new profile.

When the test succeeds, the dialog returns server details such as:

- server name
- server version
- edition

What a successful test means:

- the server is reachable
- authentication worked
- the current connection details are likely valid

What a failed test may indicate:

- incorrect server name or port
- wrong credentials
- missing permissions
- certificate or encryption issues
- driver problems
- SQL Server not reachable from the current machine

#### Connect, Disconnect, Edit, Delete

After a profile is saved, it can be managed directly from the connections table.

##### Connect

Connects the application to the selected saved profile.

Typical result:

- the selected profile becomes active
- the connection table shows it as active
- the app uses that connection for compatible modules

##### Disconnect

Disconnects the currently active database session from the selected profile.

Use this when:

- you are switching environments
- you want to clear the current active connection

##### Edit

Opens the existing profile in the connection editor so you can change items such as:

- server name
- port
- default database
- authentication mode
- encryption options

##### Delete

Removes the saved connection profile and deletes the stored password associated with it.

Use this when:

- the server is retired
- the profile was only temporary
- the saved connection is no longer needed

Recommended caution:

- confirm you are deleting the correct profile
- avoid deleting frequently used production profiles without a replacement

#### Read-Only SQL Permissions and Query Store Setup

Many users ask what SQL permissions are required before they can use the application safely. The product is designed to work with a **read-only monitoring account** that can see performance metadata and object definitions without reading business tables or changing application data.

For this reason, two helper scripts are now included in the repository:

- `scripts/create_perftuninguser.sql`
- `scripts/enable_query_store.sql`

Use them as DBA-run setup scripts, not as something the end user should execute from inside the application.

##### Why the application user is a login plus mapped database user

The application is not only a single-database browser. Several modules read:

- server-level DMVs
- target-database Query Store and metadata
- `msdb` backup history
- `msdb` SQL Agent job and Database Mail diagnostics

Because of that, a **server login** plus **mapped users** in the target database and `msdb` is the most practical least-privilege design for full performance monitoring coverage.

##### What the read-only script grants and why

The `scripts/create_perftuninguser.sql` script creates a SQL login such as `PerfTuningUser` and then grants only the read-oriented permissions the application needs.

| Permission / Access | Scope | Why it is granted |
| --- | --- | --- |
| `VIEW SERVER STATE` | Server | Allows the app to read server-level DMVs used by modules such as Dashboard, Wait Statistics, Blocking Analysis, Query Statistics DMV fallback, and runtime parts of Object Explorer. |
| `VIEW SERVER PERFORMANCE STATE` | Server, when supported | Newer SQL Server versions use this permission for some performance views. The script grants it conditionally so the account keeps working consistently on newer builds without adding data access. |
| `VIEW DATABASE STATE` | Target database | Allows reading Query Store state and database-scoped DMVs used by Query Statistics, Index Advisor, Object Explorer, and other per-database performance views. |
| `VIEW DEFINITION` | Target database | Allows the app to show stored procedure, function, view, and other object definitions without granting table-data read access. This supports source-code style tabs and object inspection. |
| `SELECT` on `msdb.dbo.backupset` | `msdb` | Allows backup-history checks used by dashboard- and security-related summaries. |
| `SELECT` on `msdb.dbo.sysjobs`, `sysjobactivity`, `sysjobhistory`, `sysjobsteps`, `sysjobschedules`, `sysschedules`, `syscategories`, `sysproxies` | `msdb` | Allows the Scheduled Jobs module and job-related dashboard widgets to read SQL Agent metadata, history, schedules, proxies, and current activity. |
| `SELECT` on `msdb.dbo.sysmail_profile`, `sysmail_principalprofile`, `sysmail_event_log` | `msdb` | Allows the Scheduled Jobs `Mail Health` diagnostics to inspect Database Mail configuration signals and recent mail events in a read-only way. |

Just as important as what **is** granted is what is **not** granted. The script intentionally does **not** grant:

- `db_owner`
- `db_datareader` on user schemas
- `INSERT`, `UPDATE`, or `DELETE`
- `ALTER` on user objects
- SQL Agent job start, stop, or edit rights

This means the application account does not receive direct `SELECT` rights on business tables and it cannot change application content. It can still see the metadata that SQL Server exposes through DMVs and catalog views, such as wait information, query text fragments, and object definitions when those features are enabled.

##### Important note about source code visibility

`VIEW DEFINITION` is included because many users expect to see stored procedure and view text inside the product.

If your organization treats SQL object definitions as sensitive, a DBA can remove that grant and keep the account even more restricted. The application will still connect, but source-code style views will become limited.

##### Important note about Security Audit

The least-privilege script is optimized for **performance and diagnostics modules**. Some **Security Audit** checks may still show partial results under a tightly restricted account, because some server-security catalogs expose more detail only to broader administrative or security-review principals.

For many organizations, the safest pattern is:

- use `PerfTuningUser` for normal day-to-day performance analysis
- use a separate, more tightly controlled security-review account only when a full security audit is required

##### Why Query Store should be enabled

The `scripts/enable_query_store.sql` script turns on Query Store for one database and applies a practical default configuration.

Query Store is enabled because it gives the application better historical evidence than live DMVs alone. In plain terms, it helps the product:

- rank important queries more accurately over time
- compare plans and detect plan instability or regressions
- show richer history in Query Statistics
- give Index Advisor better workload evidence
- support wait-history and query-correlation scenarios more reliably

Without Query Store, some modules still work, but they may have one or more of these limitations:

- less historical depth
- more dependence on cache state and recent uptime
- weaker regression detection
- reduced plan-history context

##### What the Query Store script configures

The `scripts/enable_query_store.sql` script:

- enables Query Store for the selected database
- sets `OPERATION_MODE = READ_WRITE`
- uses `QUERY_CAPTURE_MODE = AUTO`
- enables automatic cleanup behavior
- keeps a practical retention window
- enables wait-stat capture when the SQL Server version supports it

This is meant to be a sensible starting point for end-user analysis. A DBA can still tune storage size, retention, or capture policy later if the environment requires it.

##### Recommended setup workflow for end users

If you are onboarding a new SQL Server target, the cleanest workflow is:

1. Ask your DBA to run `scripts/create_perftuninguser.sql` for the database you want to analyze.
2. Ask your DBA to run `scripts/enable_query_store.sql` for that same database.
3. In **Settings > Database**, create a new connection profile that uses the new login or approved Windows account.
4. Test the connection.
5. Save the profile and connect.

If you use **Windows Authentication** instead of a SQL login, the same permission model still applies. In that case, your DBA maps the grants to your Windows login or group instead of creating a SQL password-based login.

### 5.2 General Query Settings

This section controls two core timeout behaviors for database operations.

| Setting | Default | Range | Purpose |
| --- | --- | --- | --- |
| Query Timeout | 30 seconds | 1 to 600 | Maximum time a SQL query is allowed to run before timing out |
| Connection Timeout | 15 seconds | 1 to 120 | Maximum time the application waits while trying to establish a connection |

#### Query Timeout

Default: **30 seconds**

This controls how long the application will wait for query execution before treating the request as timed out.

Increase this when:

- you intentionally run heavy analysis queries
- your environment is large and metadata collection naturally takes longer

Decrease this when:

- you want faster failure behavior during troubleshooting
- you want to avoid long waits on unreliable environments

#### Connection Timeout

Default: **15 seconds**

This controls how long the application waits when opening a database connection.

Increase this when:

- connections cross slower networks
- your environment is remote or has higher connection latency

Keep or reduce it when:

- connections should succeed quickly in your environment
- you want faster feedback when a server is unreachable

### 5.3 Cache Settings

This section controls client-side query result caching used by the application.

| Setting | Default | Range | Purpose |
| --- | --- | --- | --- |
| Enable query result caching | On | Checkbox | Allows the application to reuse cached query results where appropriate |
| Cache TTL | 300 seconds | 60 to 86400 | Defines how long cached results remain valid |

Actions:

- **Clear Cache**
- **Cache Info**

#### Enable query result caching

Default: **Enabled**

When enabled, the application can reuse previously retrieved results instead of fetching the same information again immediately.

Benefits:

- faster repeated access
- reduced repeated workload against SQL Server
- smoother navigation in repeated workflows

You may want to disable it when:

- you are validating fresh-changing data
- you suspect stale cached results
- you are troubleshooting data consistency questions

#### Cache TTL

Default: **300 seconds** (5 minutes)

This defines how long cached query results remain usable before the application refreshes them again.

Lower values:

- fresher data
- more server queries

Higher values:

- fewer repeated queries
- more reuse of previously collected results

#### Clear Cache

Use **Clear Cache** when you want to immediately remove cached results and force fresh retrieval in later operations.

Typical use cases:

- results look stale
- you changed environment state and want a clean refresh
- you are troubleshooting unexpected UI data

#### Cache Info

Use **Cache Info** when you want visibility into the current cache state and behavior.

This is mainly useful for troubleshooting or understanding cache usage.

#### Recommended defaults for most users

For most users, the safest Database tab approach is:

- keep **Port** at `1433` unless your server uses a different one
- keep **ODBC Driver** on auto-select
- keep **Encrypt Connection** enabled
- use **Trust Server Certificate** only when required
- keep **Query Timeout** at 30 seconds
- keep **Connection Timeout** at 15 seconds
- leave caching enabled with the default **300-second** TTL unless you need fresher data

#### Example: Add and use a new connection profile

1. Open **Settings > Database**.
2. Click **Add Connection**.
3. Enter the connection details for the SQL Server and default database.
4. Test the connection.
5. Save the profile.
6. Back in the connection table, click **Connect**.
7. Use the application against that environment.

This is the standard workflow for onboarding a new SQL Server target into the application.

## 6. License Tab

The **License** tab combines two related but distinct areas of control:

- **online licensing and trial state**
- **local application access protection**

This tab is used when you want to:

- review current license or trial status
- enter license server and token details
- generate the device fingerprint used for license workflows
- start a trial
- validate a purchased license
- protect the application locally with an app-lock password
- clear saved local auto sign-in state

Important distinction:

- **License** controls product entitlement and validation state.
- **Local App Lock (Offline)** controls who can open the application on the current machine.
- These two systems are related from an operational perspective, but they are not the same feature.

### 6.1 License Status

The **License Status** section is read-only status output that shows the current licensing state stored for the machine.

#### Fields in this section

| Field | Meaning |
| --- | --- |
| Status | Current interpreted license or trial state |
| Trial Expires | Trial expiration timestamp, if a trial is active |
| Last Validated | Last successful validation timestamp |
| License Count | Number of licenses associated with the current entitlement record |
| Allowed Devices | Number of devices allowed by the entitlement |

#### Status field behavior

The application may display values such as:

- **Active**
- **Trial Active**
- **Trial Expired**
- **Inactive**
- **Unknown**

General meaning:

- **Active** means a validated license is currently stored as active.
- **Trial Active** means the product is running under a valid trial window.
- **Trial Expired** or **Inactive** means the saved state is not currently usable as an active entitlement.
- **Unknown** usually means the machine does not yet have a validated or activated state stored locally.

#### Trial Expires

This shows the trial expiration timestamp when a trial exists.

Use this field when:

- you want to know how much trial time remains
- you are troubleshooting why a previously working trial no longer appears active

#### Last Validated

This shows the last recorded validation timestamp for the machine.

Use this field when:

- checking whether a recent validation succeeded
- confirming that the current license state is recent and not stale

#### License Count and Allowed Devices

These values provide entitlement context.

They are useful for:

- administrators validating deployment scope
- checking whether the stored entitlement data looks correct
- troubleshooting mismatches between expected and actual activation state

### 6.2 License Configuration

The **License Configuration** section contains the fields required for trial activation and token-based validation.

#### Fields in this section

| Field | Purpose |
| --- | --- |
| Server URL | License service endpoint used for trial and validation workflows |
| Email | Contact or entitlement email used during license operations |
| License Token | Token used for direct license validation |
| Device ID | Machine fingerprint used to identify the local device |

#### Server URL

Placeholder example:

- `https://license.yourcompany.com`

This is the endpoint the application uses when interacting with the licensing service.

Use this field when:

- your organization provides a license server URL
- trial and validation actions need to target a specific licensing endpoint

Recommended guidance:

- enter the exact URL provided by your licensing or deployment process
- avoid guessing alternate endpoints

#### Email

Placeholder example:

- `name@company.com`

This field is used for trial activation and may also be used when persisting license state locally.

Use a real, valid email address because:

- trial activation requires it
- validation workflows may depend on it
- it helps keep saved entitlement state traceable

#### License Token

This field is used for direct license validation.

Use this when:

- you already received a token from your licensing process
- you want to activate or validate a non-trial entitlement

Important note:

- A trial can be started without manually entering a token.
- Token-based validation requires a token to be present.

#### Device ID

The **Device ID** is a machine fingerprint used by the licensing workflow.

It is:

- generated locally
- shown as read-only text
- used to identify the current device during licensing operations
- preserved when you use **Clear License**

#### Generate

Use **Generate** to create and immediately save the machine-specific device identifier.

Use this action when:

- the field is empty
- a licensing workflow requires a device ID
- you are preparing the machine before validation

Recommended practice:

- generate the device ID before trial or token validation if the field is empty
- this button persists the value right away and does not require a later **Save Settings** click

### 6.3 Local App Lock (Offline)

The **Local App Lock (Offline)** section protects access to the application on the current machine. It is a local security control, not an online license control.

This section is useful when:

- the device is shared
- you want to require a password before the application opens
- you want a lightweight local access layer separate from SQL Server permissions

#### Fields in this section

| Field | Purpose |
| --- | --- |
| Enable local app lock | Turns local app-lock protection on or off |
| Configured | Shows whether a local app-lock password has been configured |
| Name Surname | Stores the local profile identity for the lock configuration |
| Company Name | Stores optional organization identity information |
| Email Address | Stores the app-lock identity email and is required when local app lock is enabled |
| New Password | Lets you create or replace the local app-lock password |
| Confirm Password | Confirms the new password value |
| Auto Sign-In | Shows whether local remember-me access is currently stored |
| Clear Remember Me | Clears the saved remember-me token for the current machine |

#### Enable local app lock

When enabled, the application expects local app-lock behavior to be active.

Important requirement:

- an **Email Address** is required if local app lock is enabled

#### Configured

This field indicates whether a local password has already been set up.

Typical meaning:

- **Yes** means the local app lock has been configured
- **No** means the feature exists in settings but no password has been fully established yet

#### Name Surname, Company Name, Email Address

These fields identify the local app-lock owner or user profile.

Use them to:

- keep the lock configuration tied to a known user identity
- make support and administration easier on shared machines

The **Email Address** field should contain a valid email format when app lock is enabled.

#### New Password and Confirm Password

These fields are used only when you want to set or change the local app-lock password.

Important behavior:

- leaving both fields empty keeps the existing password unchanged
- the new password must be at least 6 characters
- the confirmation must match exactly

Recommended guidance:

- only change the password intentionally
- do not enter partial values unless you are ready to save a full new password

#### Auto Sign-In and Clear Remember Me

The **Auto Sign-In** row shows whether a local remember-me token is stored.

If remember-me is enabled, the UI may show the remembered account identity. If not, it shows that auto sign-in is disabled.

Use **Clear Remember Me** when:

- you want to force manual sign-in again
- the remembered identity changed
- the machine is shared or being reassigned

Important note:

- clearing remember-me affects local convenience access, not the online license itself

### 6.4 License Actions

The **License Actions** section contains the operational buttons used to start, validate, clear, and refresh licensing state.

#### Start Trial

Use **Start Trial** to request and persist a trial activation for the current email address.

Requirements:

- **Email** must be filled in first

Typical workflow:

1. enter **Server URL** if required by your deployment
2. enter **Email**
3. generate **Device ID** if needed
4. click **Start Trial**

Expected result:

- the UI reloads the current status
- the feedback area shows the result message
- a success dialog is displayed if activation succeeds

Important behavior:

- If no license server URL is configured, or if the online request fails, the application can fall back to an offline local trial.
- Because of that fallback, **Start Trial** is more flexible than token validation in restricted environments.

#### Validate License

Use **Validate License** when you already have a license token.

Requirements:

- **License Token** must be provided

Typical workflow:

1. enter **Server URL** if required
2. enter **Email** if applicable
3. paste the **License Token**
4. generate **Device ID** if needed
5. click **Validate License**

Expected result:

- the saved state is updated
- the status section reflects the new result
- the feedback area displays the validation message

Important behavior:

- Token validation depends on the license-server workflow and does not provide the same offline fallback behavior as **Start Trial**.

#### Clear License

Use **Clear License** to remove saved token and license state from the current machine.

This action clears stored values such as:

- email
- token
- status
- trial expiration
- license count
- allowed devices
- last validated timestamp

Use this when:

- the machine is being reassigned
- you need to reset local license state for troubleshooting
- you want to remove stale or incorrect entitlement information

Recommended caution:

- this clears local saved state on the machine
- it does not necessarily revoke an entitlement on the license server
- the saved **Device ID** is intentionally preserved

#### Refresh Status

Use **Refresh Status** to reload the visible license information from saved settings.

This is useful when:

- you updated fields and want the UI to reflect current saved values
- you want to re-check the displayed local state without performing a new activation or validation request

#### View License Agreement

Use **View License Agreement** to open the product license text directly from the application.

This is useful when:

- reviewing legal terms
- confirming what agreement applies to the installed product

### 6.5 Feedback Area

At the bottom of the License tab, the application shows a feedback label that displays short status messages after actions such as:

- device ID generation
- trial activation
- token validation
- remember-me clearing
- local state refresh

This message area is useful for quickly understanding what just happened without relying only on popup dialogs.

### 6.6 Recommended Workflow For Most Users

If you are setting up licensing on a new machine, the safest order is:

1. open **Settings > License**
2. enter the **Server URL** if your environment requires one
3. enter your **Email**
4. click **Generate** to create a **Device ID** if the field is empty
5. either click **Start Trial** or paste a **License Token** and click **Validate License**
6. review the **License Status** section
7. configure **Local App Lock** only if the machine needs local access protection

### 6.7 Summary

The License tab is the operational center for:

- license activation and validation
- trial state review
- machine identity generation
- local application access protection

For most users, the primary tasks are generating a device ID, starting a trial or validating a token, and then confirming that the status changes to the expected active state.

## 7. Appearance Tab

The **Appearance** tab stores visual preference settings inside the application. This tab does not affect SQL Server behavior, AI logic, license state, or saved connection details. It is purely about how the interface looks and how easy it is to read.

In the current build, **UI Font Size** is the setting with the clearest global effect, because it is applied when the desktop app starts. **Code Font Size** and **Show line numbers in code editor** are currently saved as preferences for editor-style surfaces, but not every view re-reads them dynamically yet.

Use this tab when you want to:

- improve readability on high-resolution displays
- make the UI more comfortable for long work sessions
- review or stage editor-related display preferences

Important scope note:

- Settings here are visual only.
- They do not change query execution, analysis thresholds, or model behavior.
- Some options behave as next-launch or stored preferences rather than immediate per-view updates.
- They are intended for comfort, accessibility, and day-to-day usability.

### 7.1 Theme

The **Theme** section contains the application's theme selector.

#### Available setting

| Setting | Current Value | Meaning |
| --- | --- | --- |
| Theme | Light | Controls the overall visual theme of the application |

Current behavior:

- The application currently supports **Light** theme only.
- The theme selector remains visible for future extensibility.
- There is no active dark or system theme workflow at this time.

Practical guidance:

- You do not need to change anything in this section today.
- If additional themes are introduced in future releases, this section will become the central place to switch between them.

### 7.2 Fonts

The **Fonts** section controls text sizing across the general interface and code-oriented views.

#### Font settings

| Setting | Default | Range | Purpose |
| --- | --- | --- | --- |
| UI Font Size | 13 px | 10 to 24 px | Controls general interface text size on application startup |
| Code Font Size | 12 px | 10 to 24 px | Saved preference for code/editor text size |
| Show line numbers in code editor | On | Checkbox | Saved preference for line-number visibility in editor-style surfaces |

Current implementation note:

- **UI Font Size** is applied when the application starts.
- **Code Font Size** and **Show line numbers in code editor** are saved in configuration, but support across editor widgets is still partial.

#### UI Font Size

Default: **13 px**

This setting controls general text sizing across the application's standard interface elements, such as labels, panels, and many interactive controls.

Implementation note:

- Because the application font is applied during startup, the most reliable effect is usually seen on the next application launch.

Increase this setting when:

- you use a high-DPI or high-resolution monitor
- the default interface text feels too small
- you want easier reading during long sessions

Decrease this setting when:

- you need to fit more content into limited screen space
- you prefer a denser interface layout

Recommended usage:

- make small changes first, such as moving from `13 px` to `14 px` or `15 px`
- avoid large jumps unless readability is currently a serious issue

#### Code Font Size

Default: **12 px**

This setting is stored as a code-editor preference for SQL, prompts, or other editor-like views where monospaced readability matters more than compact layout.

Current behavior note:

- In this build, not every SQL or prompt surface reads this preference dynamically yet.

Increase this setting when:

- you spend a lot of time reading SQL text
- long procedures or query output are difficult to scan
- line-by-line comparison work is common in your workflow

Keep it near the default when:

- you want to preserve more visible code on screen
- the current size is already comfortable

Recommended guidance:

- if SQL or code is hard to read, increase **Code Font Size** before increasing general **UI Font Size**
- adjust UI and code sizes independently rather than forcing both to large values immediately

#### Show line numbers in code editor

Default: **Enabled**

This preference controls whether line numbers should be shown in code-editor style areas.

Current behavior note:

- The value is saved in configuration, but some editor widgets still use their own built-in line-number behavior.

Line numbers are useful when:

- reviewing stored procedures or SQL scripts
- discussing a specific line with a teammate
- comparing generated or optimized code
- tracing an issue to a specific location in a block of text

You may want to disable line numbers when:

- you prefer a cleaner editor area
- you rarely work with long code blocks
- screen width is limited and you want slightly more horizontal space

For most technical users, leaving line numbers enabled is the better default.

### 7.3 Recommended Defaults

For most users, the safest Appearance settings are:

- keep **Theme** on **Light**
- keep **UI Font Size** at `13 px` unless readability is an issue
- keep **Code Font Size** at `12 px` unless you are standardizing a preferred editor default
- keep **Show line numbers in code editor** enabled as the saved default

### 7.4 High-DPI and Readability Guidance

If you use a laptop with a dense display or a 4K monitor, the best adjustment path is usually:

1. increase **UI Font Size** slightly
2. restart the application and re-check readability
3. treat **Code Font Size** and line-number preference as saved editor defaults that may be adopted gradually across views

This approach improves readability without over-scaling the entire interface too quickly.

### 7.5 Summary

The Appearance tab is a lightweight but useful configuration area for improving comfort and readability.

Its current purpose is to help users manage:

- theme selection
- general UI text sizing
- saved editor font preferences
- saved line-number preference

## 8. Typical Workflows

This section provides quick, practical workflows for the most common Settings-related tasks.

### Workflow 1: Add a new SQL Server connection

Use this workflow when onboarding a new database environment into the application.

1. Open **Settings > Database**.
2. Click **Add Connection**.
3. Enter a clear **Connection Name**.
4. Enter **Server / Instance** and confirm the correct **Port**.
5. Choose a **Default Database**.
6. Select the correct **Authentication** method.
7. Enter credentials if using **SQL Server Authentication**.
8. Leave **ODBC Driver** on auto-select unless you need a specific driver.
9. Review **Encrypt Connection** and **Trust Server Certificate**.
10. Click **Test Connection**.
11. If the test succeeds, click **Save**.
12. Back in the connection list, click **Connect** when you are ready to use it.

### Workflow 2: Set up a new AI provider

Use this workflow when you want the application to use a local or cloud AI backend.

1. Open **Settings > AI / LLM > Providers**.
2. Click **Add AI Model**.
3. Choose the provider type such as **Ollama**, **OpenAI**, **Anthropic**, **Azure OpenAI**, or **DeepSeek**.
4. Enter a clear provider **Name**.
5. Enter the target **Model**.
6. Fill in the provider-specific connection fields.
7. Click **Test**.
8. If the test succeeds, click **Add**.
9. Select the provider in the table.
10. Click **Set Default**.
11. Click **Save Settings**.

### Workflow 3: Change query timeout or cache behavior

Use this workflow when data loads feel too slow, too aggressive, or possibly stale.

1. Open **Settings > Database**.
2. In **General Query Settings**, adjust **Query Timeout** or **Connection Timeout** if needed.
3. In **Cache Settings**, decide whether caching should remain enabled.
4. Adjust **Cache TTL** if you need fresher data or more reuse.
5. Click **Save Settings**.
6. If you suspect old data is still cached, click **Clear Cache**.

### Workflow 4: Start a trial or validate a license

Use this workflow when preparing a new machine or activating purchased access.

1. Open **Settings > License**.
2. Enter the **Server URL** if your environment requires one.
3. Enter your **Email**.
4. Click **Generate** if the **Device ID** is empty.
5. For trial usage, click **Start Trial**.
6. For a purchased entitlement, paste the **License Token** and click **Validate License**.
7. Review the **License Status** section to confirm the result.

### Workflow 5: Configure local app lock

Use this workflow when the machine needs local access protection.

1. Open **Settings > License**.
2. In **Local App Lock (Offline)**, enable **Enable local app lock**.
3. Enter **Name Surname**, optional **Company Name**, and a valid **Email Address**.
4. Enter a **New Password** and matching **Confirm Password**.
5. Click **Save Settings**.
6. Confirm that **Configured** reflects the expected state.
7. If needed later, use **Clear Remember Me** to remove saved local auto sign-in state.

## 9. Best Practices

The Settings window contains both everyday preferences and powerful advanced controls. The following practices help keep the application predictable and supportable.

### Keep one stable default AI provider

Even if you maintain multiple providers, keep one provider as the clearly trusted default for normal daily use.

Recommended approach:

- use one tested provider for routine work
- keep experimental providers separate
- avoid switching defaults repeatedly unless you are intentionally comparing outcomes

### Use descriptive names for connection and provider entries

Names should make sense to another person looking at the environment later.

Good examples:

- `Production SQL`
- `QA Reporting`
- `Local Ollama - SQL`

This reduces mistakes when switching environments or validating AI backends.

### Leave advanced prompt rules alone unless you have a reason

The **AI Prompt Rules** tab is not a casual tuning area.

Only change it when:

- there is a clear, repeated quality problem
- you understand which workflow is affected
- you can compare results before and after the change

### Change thresholds and temperatures gradually

Whether you are adjusting Query Analysis thresholds or AI temperatures, avoid large jumps.

Recommended method:

- change one setting at a time
- test the exact workflow it affects
- keep changes only if the result is clearly better

### Keep encryption enabled unless you know why it must change

In database connection settings, **Encrypt Connection** should usually remain enabled.

Change encryption behavior only when:

- compatibility issues require it
- your environment has a clearly documented exception

### Use Trust Server Certificate only when required

This option is useful in some controlled environments, but it should not be enabled casually.

Use it only if:

- your certificate chain is not fully trusted on the client machine
- self-signed certificate behavior is expected
- your DBA or infrastructure team told you it is required

### Use cache clearing intentionally

Do not clear cache by default every time.

Use **Clear Cache** when:

- results appear stale
- you changed environments or data state significantly
- you are actively troubleshooting a data freshness issue

### Protect local app-lock credentials

If you enable **Local App Lock**, treat those credentials as an application access control, not as a cosmetic setting.

Recommended practice:

- use a password you can manage securely
- do not enable remember-me casually on shared machines
- clear remember-me when ownership or machine usage changes

### Document non-default team settings

If multiple people use the same environment, document:

- custom Query Analysis thresholds
- AI generation changes
- custom prompt rules
- special connection requirements
- license server expectations

This helps avoid confusion and simplifies troubleshooting.

## 10. Troubleshooting

Below are common issues users may encounter while working in the Settings window.

### Why can’t I connect to my server?

Check the following:

- confirm **Server / Instance** is correct
- confirm the **Port** is correct
- verify the selected **Authentication** method
- if using SQL authentication, verify username and password
- if using Windows authentication, confirm the current Windows account has access
- check whether **Encrypt Connection** or **Trust Server Certificate** settings need to match your environment
- test whether the server is reachable from the current machine

If the problem continues:

- try **Test Connection**
- try a specific **ODBC Driver** if your environment requires one
- check with your DBA for firewall, TLS, or permission constraints

### Why does AI provider test fail?

The most common causes are:

- incorrect API key
- incorrect model name
- incorrect endpoint
- missing Azure deployment name
- local Ollama service not running
- model not installed in Ollama
- outbound network or API restrictions

Recommended checks:

- re-enter credentials carefully
- confirm the exact model name
- re-test after correcting host, endpoint, or deployment
- verify that the provider works outside the application if needed

### Why is the app still showing old cached results?

Possible causes:

- cached results are still within the current **Cache TTL**
- the workflow is reusing client-side cached data

What to do:

- click **Clear Cache**
- reduce **Cache TTL** if fresher data is needed more often
- temporarily disable caching if you are validating changing data

### Why is the license shown as inactive or unknown?

Check the following:

- confirm the **Server URL** is correct
- confirm **Email** is present if required
- confirm **License Token** is valid if using token validation
- generate a **Device ID** if the field is empty
- run **Validate License** again if necessary

Important note:

- **Unknown** usually means the machine has no current validated state stored locally
- **Inactive** usually means a previously stored state is not currently active

### Why can’t I change interface language?

Current behavior:

- the interface language selector is visible but fixed
- the production interface currently supports **English only**

This is expected behavior at this stage.

### Why didn’t my Settings change take effect?

Possible reasons:

- you changed values but did not click **Save Settings**
- you changed a provider or default selection inside **Providers** but did not save the main Settings window
- the setting affects only future actions, not the already open workflow
- some settings are stored preferences for startup or editor behavior and do not trigger an immediate visible change in every screen

Recommended check:

- return to the tab
- confirm the value is still present
- click **Save Settings**
- retry the affected action

### Why did Reset to Defaults not remove my saved connections or custom prompt rules?

Current behavior:

- saved database connection profiles are stored separately from the main settings payload
- AI prompt rules are stored in YAML and are reset with **Reset Prompt Rules**, not the global **Reset to Defaults** button

What to do:

- delete unwanted connection profiles from **Database Connections**
- use **AI / LLM > AI Prompt Rules > Reset Prompt Rules** to restore prompt templates

## Final Notes

The **Settings** window is the operational control center for the application. It covers startup behavior, AI configuration, database connectivity, licensing, local access protection, and visual preferences.

For most users, the safest path is:

- keep defaults unless you have a clear reason to change them
- test before saving high-impact connection or provider changes
- change advanced settings gradually
- document non-default configurations in shared environments
