const installSteps = [
  'Download the Windows installer that matches your environment.',
  'Run the installer with a normal interactive setup, or use a silent install flow if your deployment policy requires it.',
  'Launch the app and complete trial or license validation before deeper setup.',
  'Open Settings and complete Database plus AI / LLM configuration before attempting analysis.',
]

const prepChecklist = [
  'A reachable SQL Server host or instance name',
  'The correct SQL port if it is not 1433',
  'A read-only SQL login or approved Windows account',
  'A target database name',
  'A decision on local Ollama or cloud LLM usage',
]

const sqlUserScript = `-- DBA example: create a read-only monitoring login
CREATE LOGIN [PerfTuningUser] WITH PASSWORD = 'ChangeThisStrongPassword!';
GRANT VIEW SERVER STATE TO [PerfTuningUser];

USE [YourDatabase];
CREATE USER [PerfTuningUser] FOR LOGIN [PerfTuningUser];
GRANT CONNECT TO [PerfTuningUser];
GRANT VIEW DATABASE STATE TO [PerfTuningUser];
GRANT VIEW DEFINITION TO [PerfTuningUser];

USE [msdb];
CREATE USER [PerfTuningUser] FOR LOGIN [PerfTuningUser];
GRANT SELECT ON dbo.sysjobs TO [PerfTuningUser];
GRANT SELECT ON dbo.sysjobactivity TO [PerfTuningUser];
GRANT SELECT ON dbo.sysjobhistory TO [PerfTuningUser];`

const queryStoreScript = `ALTER DATABASE [YourDatabase] SET QUERY_STORE = ON;
ALTER DATABASE [YourDatabase] SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    QUERY_CAPTURE_MODE = AUTO,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30)
);

-- Optional on supported SQL Server versions:
-- ALTER DATABASE [YourDatabase] SET QUERY_STORE (WAIT_STATS_CAPTURE_MODE = ON);`

export default function InstallationTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Installation Path</div>
        <p className="text-sm text-gray-700">
          If you are installing the product for the first time, do not stop at the installer. A successful setup also
          includes SQL access, Query Store preparation, and at least one working AI provider.
        </p>
        <ol className="mt-4 list-decimal pl-5 text-sm text-gray-700 space-y-1">
          {installSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <pre className="mt-4 rounded-xl bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto">
{`# Example silent install
"SQL Performance Intelligence.exe" /quiet /norestart`}
        </pre>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Before You Install</div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          {prepChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Practical Advice</div>
          For a new user, gather these items before opening the app. It prevents half-finished setup and failed test
          connections later.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Step 1: Create A Read-Only SQL User
        </div>
        <p className="text-sm text-gray-700">
          The application works best with a dedicated read-only monitoring login. This is the safest setup because the
          app can inspect performance metadata and object definitions without receiving write rights on business tables.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What The DBA Should Grant</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-mono">VIEW SERVER STATE</span> for server-level DMVs</li>
              <li><span className="font-mono">VIEW DATABASE STATE</span> for Query Store and database-scoped DMVs</li>
              <li><span className="font-mono">VIEW DEFINITION</span> for procedure, view, and function text</li>
              <li>Read-only <span className="font-mono">msdb</span> access for jobs, mail health, and related diagnostics</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What Not To Grant</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>No <span className="font-mono">db_owner</span></li>
              <li>No direct read access to business schemas unless your policy requires it</li>
              <li>No INSERT, UPDATE, or DELETE</li>
              <li>No SQL Agent job start or stop rights for normal onboarding</li>
            </ul>
          </div>
        </div>
        <pre className="mt-4 rounded-xl bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto">{sqlUserScript}</pre>
        <p className="mt-4 text-sm text-gray-700">
          If your environment uses Windows Authentication, the same principle applies. Instead of creating a SQL login,
          your DBA can map the required grants to your Windows login or AD group.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Step 2: Enable Query Store And Understand Why
        </div>
        <p className="text-sm text-gray-700">
          Query Store should be enabled on every database you want to analyze seriously. It gives the app historical
          evidence, better ranking, plan-history context, and stronger regression detection.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Enable it per database, not once for the whole SQL Server instance.</li>
          <li>Use <span className="font-mono">READ_WRITE</span> mode so the database continues collecting runtime history.</li>
          <li>Keep <span className="font-mono">QUERY_CAPTURE_MODE = AUTO</span> for a practical default starting point.</li>
          <li>If your SQL Server version supports it, enable wait-stat capture too.</li>
        </ul>
        <pre className="mt-4 rounded-xl bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto">{queryStoreScript}</pre>
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Why This Matters</div>
          Without Query Store, the app still works, but Query Statistics, Index Advisor, and wait-history scenarios lose
          historical depth and become more dependent on recent uptime and cache state.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Step 3: Prepare AI Prerequisites
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Local Ollama</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Install Ollama on the machine that will run the app or on an approved internal host.</li>
              <li>Make sure the service is running.</li>
              <li>Pull at least one model before opening the provider test inside the app.</li>
            </ul>
            <pre className="mt-3 rounded-lg bg-slate-900 p-3 text-xs text-slate-100 overflow-x-auto">
{`ollama serve
ollama pull codellama`}
            </pre>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-semibold mb-1">Cloud Providers</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Collect the API key before opening Settings.</li>
              <li>For Azure OpenAI, also collect the endpoint and deployment name.</li>
              <li>Decide which provider should be your daily default before adding experimental ones.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Step 4: First Launch</div>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
          <li>Open the application.</li>
          <li>Go to <span className="font-medium">Settings &gt; License</span>.</li>
          <li>Generate a device ID if the field is empty.</li>
          <li>Start a trial or validate your license token.</li>
          <li>Then continue with Database and AI / LLM setup.</li>
        </ol>
      </div>
    </div>
  )
}
