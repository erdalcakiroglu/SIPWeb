type DashboardMetric = {
  name: string
  meaning: string
  interpretation: string
}

type DashboardMetricSection = {
  title: string
  description: string
  metrics: DashboardMetric[]
}

const metricSections: DashboardMetricSection[] = [
  {
    title: 'Server Health',
    description: 'These metrics tell you whether the host and SQL Server are under CPU or session pressure.',
    metrics: [
      {
        name: 'CPU %',
        meaning:
          'Shows total operating system CPU utilization. Use it to see whether the host itself is CPU-bound, including pressure from non-SQL processes.',
        interpretation: 'Below 70 is normal, 70-89 is warning, and 90 or higher is bad.',
      },
      {
        name: 'SQL CPU %',
        meaning:
          'Shows CPU utilization for the SQL Server process. If this is high, CPU-heavy queries, parallelism, or compile and recompile activity may be contributing.',
        interpretation: 'Below 70 is normal, 70-89 is warning, and 90 or higher is bad.',
      },
      {
        name: 'Active Sessions',
        meaning:
          'Counts currently active user sessions. Sudden increases can indicate connection storms, long-running requests, or pooling issues.',
        interpretation: 'Below 50 is normal, 50-99 is warning, and 100 or more is bad.',
      },
      {
        name: 'Runnable Queue',
        meaning:
          'Shows CPU scheduler pressure. When tasks are ready to run but cannot get CPU time, this value rises and becomes a strong CPU bottleneck signal.',
        interpretation: 'Below 5 is good, 5-19 is warning, and 20 or more is bad.',
      },
    ],
  },
  {
    title: 'Memory Health',
    description: 'These metrics show buffer pool pressure, memory demand, and cache efficiency.',
    metrics: [
      {
        name: 'Total Memory',
        meaning:
          'Shows how much memory SQL Server has currently committed for its memory manager. In a steady state it usually approaches Target Memory.',
        interpretation:
          'A Total/Target ratio of 0.90 or higher is good, 0.75-0.89 is warning, and below 0.75 is bad.',
      },
      {
        name: 'Target Memory',
        meaning:
          'Shows how much memory SQL Server wants to use under current conditions. It should be interpreted together with Total Memory rather than alone.',
        interpretation: 'There is no separate built-in alert threshold for this metric in the current UI.',
      },
      {
        name: 'PLE',
        meaning:
          'Page Life Expectancy estimates how long a data page stays in the buffer pool. Sharp drops can indicate buffer churn or memory pressure.',
        interpretation: 'Above 300 is good, 61-300 is warning, and 60 or lower is bad.',
      },
      {
        name: 'Buffer Hit Ratio',
        meaning:
          'Shows how often reads are served from memory instead of disk. Trend is usually more meaningful than a single snapshot.',
        interpretation: 'Above 95 is good, 91-95 is warning, and 90 or lower is bad.',
      },
    ],
  },
  {
    title: 'Workload',
    description: 'These metrics describe throughput, transaction activity, and compile behavior over the last refresh interval.',
    metrics: [
      {
        name: 'Batch/sec',
        meaning:
          'A high-level throughput signal that reflects how many batches SQL Server is processing. Spikes often correlate with higher CPU and IO demand.',
        interpretation: 'There is no built-in alert threshold for this metric in the current UI.',
      },
      {
        name: 'Transactions/sec',
        meaning:
          'Shows transactional throughput. Comparing it with Batch/sec helps distinguish request volume from true transaction activity.',
        interpretation: 'There is no built-in alert threshold for this metric in the current UI.',
      },
      {
        name: 'Compilations/sec',
        meaning:
          'Shows how often SQL Server is compiling plans. High values relative to Batch/sec can indicate ad hoc workloads, weak parameterization, or plan cache churn.',
        interpretation: 'Below 1000 is normal, 1000-4999 is warning, and 5000 or more is bad.',
      },
      {
        name: 'Recomp/sec',
        meaning:
          'Shows how often plans are being recompiled. Sustained increases can add CPU overhead and point to plan stability issues.',
        interpretation: '0 is good, 1-99 is warning, and 100 or more is bad.',
      },
    ],
  },
  {
    title: 'IO',
    description: 'These metrics show storage latency and pending IO pressure.',
    metrics: [
      {
        name: 'IO Read Latency',
        meaning:
          'Shows average read latency in milliseconds. High values can indicate storage pressure or read-heavy random IO patterns.',
        interpretation: 'Below 5 ms is good, 5-19 ms is warning, and 20 ms or higher is bad.',
      },
      {
        name: 'IO Write Latency',
        meaning:
          'Shows average write latency in milliseconds. Sustained increases can affect checkpoint activity, TempDB behavior, and overall throughput.',
        interpretation: 'Below 5 ms is good, 5-19 ms is warning, and 20 ms or higher is bad.',
      },
      {
        name: 'Log Write Latency',
        meaning:
          'Shows write latency for transaction log files only. This is especially important when commit latency or WRITELOG waits are suspected.',
        interpretation: 'Below 5 ms is good, 5-19 ms is warning, and 20 ms or higher is bad.',
      },
      {
        name: 'Disk Queue Length',
        meaning:
          'A best-effort proxy for pending IO requests. Sustained higher values suggest that the storage layer is falling behind demand.',
        interpretation: 'Below 2 is good, 2-9 is warning, and 10 or more is bad.',
      },
    ],
  },
  {
    title: 'TempDB',
    description: 'These metrics show TempDB space pressure, log growth, and allocation contention.',
    metrics: [
      {
        name: 'TempDB Usage',
        meaning:
          'Shows the percentage of TempDB data file space currently in use. High values may be caused by temp tables, spills, version store growth, or large index operations.',
        interpretation: 'Below 50 is good, 50-79 is warning, and 80 or higher is bad.',
      },
      {
        name: 'TempDB Log Used',
        meaning:
          'Shows TempDB transaction log utilization. Rapid growth can point to long-running transactions or heavy version store activity.',
        interpretation: 'Below 50 is good, 50-79 is warning, and 80 or higher is bad.',
      },
      {
        name: 'PFS/GAM Waits',
        meaning:
          'A TempDB allocation contention signal. Non-zero values suggest waits on TempDB allocation bitmap pages.',
        interpretation: '0 is good, 1-9 is warning, and 10 or more is bad.',
      },
    ],
  },
]

const interpretationGuide = [
  'If CPU % is high but SQL CPU % is low, pressure is more likely coming from a non-SQL process.',
  'If SQL CPU % and Runnable Queue are both high, CPU pressure inside SQL Server is more likely to be real.',
  'If Total Memory, PLE, and Buffer Hit Ratio all deteriorate together, investigate buffer pool pressure.',
  'If Compilations/sec or Recomp/sec rises, review plan cache behavior and query design.',
  'If IO read, write, log latency, and disk queue are elevated together, storage latency is a likely factor.',
  'If TempDB Usage, TempDB Log Used, and PFS/GAM Waits rise together, review TempDB sizing, file layout, and spill-heavy workloads.',
]

export default function DashboardTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Dashboard is the high-level monitoring screen for CPU, memory, workload, IO, and TempDB conditions on the
          connected SQL Server instance. It is designed for fast triage, so if a metric looks abnormal, the next step
          is usually to open the relevant deeper module.
        </p>
        <div className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">What It Tells You</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>Whether the host or SQL Server process is under CPU pressure.</li>
              <li>Whether memory, buffer pool, or TempDB conditions are deteriorating.</li>
              <li>Whether workload volume or compile activity has shifted.</li>
              <li>Whether storage latency is becoming a bottleneck.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">General Behavior</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>Batch/sec, Transactions/sec, Compilations/sec, and Recomp/sec are rate metrics averaged over the last refresh interval.</li>
              <li>The first refresh can temporarily show 0 for rate-based counters until a prior sample exists.</li>
              <li>The page is for fast monitoring, not full root-cause analysis.</li>
            </ul>
          </div>
        </div>
      </div>

      {metricSections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{section.title}</div>
          <p className="text-sm text-gray-700 mb-4">{section.description}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {section.metrics.map((metric) => (
              <div key={metric.name} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="font-semibold mb-2 text-gray-900">{metric.name}</div>
                <p className="text-sm text-gray-700">{metric.meaning}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">How To Read It</div>
                <p className="mt-1 text-sm text-gray-700">{metric.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Quick Interpretation Guide</div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          {interpretationGuide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Workflow</div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
          <li>Open Dashboard first to check the current operating picture.</li>
          <li>Compare abnormal metrics across CPU, memory, IO, workload, and TempDB instead of reading one metric alone.</li>
          <li>Use the quick interpretation guide to decide which subsystem looks most suspicious.</li>
          <li>Jump into Query Statistics, Wait Statistics, Blocking Analysis, or another module for deeper analysis.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Operating Principles &amp; Safety
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Read-only monitoring with no automatic remediation.</li>
          <li>Designed to guide investigation, not apply changes.</li>
          <li>Best used as the starting point before drilling into a specialized module.</li>
        </ul>
      </div>
    </div>
  )
}
