import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('scheduled-jobs')

export default function ScheduledJobsModulePage() {
  return <ModulePage slug="scheduled-jobs" />
}
