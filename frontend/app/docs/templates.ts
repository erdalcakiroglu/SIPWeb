import OverviewTemplate from './overview'
import InstallationTemplate from './installation'
import QuickstartTemplate from './quickstart'
import DashboardTemplate from './dashboard'
import QueryStatisticsTemplate from './query_statistics'
import IndexAdvisorTemplate from './index_advisor'
import BlockingAnalysisTemplate from './blocking_analysis'
import WaitStatisticsTemplate from './wait_statistics'
import SecurityAuditTemplate from './security_audit'
import ScheduledJobsTemplate from './scheduled_jobs'
import ObjectExplorerTemplate from './object_explorer'

export type DocsTemplateComponent = () => JSX.Element

export const gettingStartedTemplates: Record<string, DocsTemplateComponent> = {
  overview: OverviewTemplate,
  installation: InstallationTemplate,
  quickstart: QuickstartTemplate,
}

export const moduleTemplates: Record<string, DocsTemplateComponent> = {
  dashboard: DashboardTemplate,
  'query-statistics': QueryStatisticsTemplate,
  'index-advisor': IndexAdvisorTemplate,
  'blocking-analysis': BlockingAnalysisTemplate,
  'wait-statistics': WaitStatisticsTemplate,
  'security-audit': SecurityAuditTemplate,
  'scheduled-jobs': ScheduledJobsTemplate,
  'object-explorer': ObjectExplorerTemplate,
}
