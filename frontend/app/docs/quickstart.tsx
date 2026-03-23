const quickstartFlow = [
  'Open Settings and complete AI / LLM first, so analysis features have a working model backend.',
  'Add one saved SQL Server connection in Settings > Database.',
  'Test the connection, save it, then click Connect.',
  'Start with Dashboard to confirm the instance is reachable and metrics are loading.',
  'Move to Query Statistics or Object Explorer for your first deeper analysis.',
]

const localOllamaSteps = [
  'Open Settings > AI / LLM > Providers.',
  'Click Add AI Model.',
  'Choose Provider = Ollama.',
  'Enter a clear Name such as Local Ollama - SQL.',
  'Enter Host as your Ollama URL, usually http://localhost:11434.',
  'Enter the exact installed model name, for example codellama.',
  'Click Test. If the test succeeds, click Add.',
  'Select the provider in the list, click Set Default, then click Save Settings.',
]

const cloudSteps = [
  'Open Settings > AI / LLM > Providers and click Add AI Model.',
  'Choose a cloud provider such as OpenAI, Azure OpenAI, Anthropic, or DeepSeek.',
  'Enter a clear Name so you can distinguish production and test providers later.',
  'Enter the target Model value exactly as required by that provider.',
  'Enter the API key or credential field.',
  'If you use Azure OpenAI, also fill in Endpoint and Deployment.',
  'Click Test. If the test succeeds, click Add.',
  'Select the provider, click Set Default, then click Save Settings.',
]

const connectionSteps = [
  'Open Settings > Database.',
  'Click Add Connection.',
  'Enter a clear Connection Name.',
  'Enter Server / Instance and confirm the correct Port.',
  'Choose the Default Database you want the profile to open first.',
  'Select SQL Server Authentication or Windows Authentication.',
  'If you chose SQL authentication, enter Username and Password.',
  'Leave ODBC Driver on auto-select unless your DBA requires a specific driver.',
  'Keep Encrypt Connection enabled unless you have a documented reason not to.',
  'Enable Trust Server Certificate only when your environment explicitly requires it.',
  'Click Test Connection.',
  'If the test succeeds, click Save, then select the profile and click Connect.',
]

export default function QuickstartTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">First 15 Minutes</div>
        <p className="text-sm text-gray-700">
          If you want the shortest successful first run, follow this order. It avoids the most common beginner mistake:
          trying to analyze before the app has both a working SQL connection and a working AI provider.
        </p>
        <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          {quickstartFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Add A New Database Connection
        </div>
        <p className="text-sm text-gray-700">
          In this product, <span className="font-semibold">Add Connection</span> means add a saved connection profile.
          It does not create a new SQL database on the server.
        </p>
        <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          {connectionSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Tip</div>
          If you use Windows Authentication, run the app with the Windows account that already has the required SQL
          permissions. Do not expect the dialog to impersonate a different Windows user by typing credentials.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Add Local AI With Ollama
        </div>
        <p className="text-sm text-gray-700">
          Choose this path if you want model traffic to stay local. Make sure Ollama is already running and the model
          is already installed before you test it inside the app.
        </p>
        <pre className="mt-4 rounded-xl bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto">
{`ollama serve
ollama pull codellama`}
        </pre>
        <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          {localOllamaSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Add A Cloud LLM
        </div>
        <p className="text-sm text-gray-700">
          Choose this path if your team already uses a managed provider or if you want a centralized model backend.
          The exact fields vary by provider, but the workflow stays almost the same.
        </p>
        <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          {cloudSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Typical OpenAI Style Fields</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>API Key</li>
              <li>Model</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Typical Azure OpenAI Style Fields</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>API Key</li>
              <li>Endpoint</li>
              <li>Deployment</li>
              <li>Model label used by your deployment policy</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Your First Real Check
        </div>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>After you connect, open Dashboard first.</li>
          <li>Confirm that CPU, memory, IO, and TempDB metrics are populated.</li>
          <li>Then open Query Statistics for query-level evidence.</li>
          <li>If you want to inspect one procedure, function, or table, open Object Explorer.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Common First-Run Problems</div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Connection Test Fails</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Re-check server name, port, and authentication mode.</li>
              <li>Confirm the account has the expected SQL permissions.</li>
              <li>Review encryption and certificate settings with your DBA.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">AI Provider Test Fails</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>For Ollama, confirm the service is running and the model is installed.</li>
              <li>For cloud providers, re-check the API key, model, endpoint, or deployment fields.</li>
              <li>Do not forget to click Save Settings after the provider test and add flow succeed.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Query Statistics Looks Too Empty</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check whether Query Store is enabled for the target database.</li>
              <li>Remember that DMV fallback has less historical depth.</li>
              <li>Ask the DBA to enable Query Store if the database is new to the platform.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">You Changed Settings But Nothing Happened</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Click Save Settings after changing providers or connection defaults.</li>
              <li>Some settings affect only future connections or future analyses.</li>
              <li>Retry the action after saving instead of assuming the setting is already active.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
