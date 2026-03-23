export type DocsPage = {
  slug: string
  title: string
  summary: string
}

export const gettingStartedPages: DocsPage[] = [
  {
    slug: 'overview',
    title: 'Overview',
    summary:
      'A high-level look at what SQL Performance Intelligence™ does, what it avoids, and why its read-only approach is safe for production.',
  },
  {
    slug: 'installation',
    title: 'Installation',
    summary:
      'Install the Windows desktop app, use the offline installer when required, and verify signed binaries for change control.',
  },
  {
    slug: 'quickstart',
    title: 'Quickstart',
    summary:
      'Connect to a SQL Server instance, choose an object, run the analysis, and open your first evidence-backed report.',
  },
]

export const modulePages: DocsPage[] = [
  {
    slug: 'dashboard',
    title: 'Dashboard',
    summary: 'Monitor server health, memory, IO, TempDB, and workload trends in real time.',
  },
  {
    slug: 'query-statistics',
    title: 'Query Statistics',
    summary: 'Surface top regressions, patterns, and hot paths across your workload.',
  },
  {
    slug: 'index-advisor',
    title: 'Index Advisor',
    summary: 'Prioritize index recommendations with evidence, impact, and validation notes.',
  },
  {
    slug: 'blocking-analysis',
    title: 'Blocking Analysis',
    summary: 'Trace blocking chains and pinpoint root causes with clear timelines.',
  },
  {
    slug: 'wait-statistics',
    title: 'Wait Statistics',
    summary: 'Understand wait categories and spot performance bottlenecks quickly.',
  },
  {
    slug: 'security-audit',
    title: 'Security Audit',
    summary: 'Verify read-only posture and compliance checks without schema changes.',
  },
  {
    slug: 'scheduled-jobs',
    title: 'Scheduled Jobs',
    summary: 'Run recurring analyses on a controlled cadence for consistent insights.',
  },
  {
    slug: 'object-explorer',
    title: 'Object Explorer',
    summary: 'Browse procedures, views, and dependencies to pick the right target.',
  },
]
