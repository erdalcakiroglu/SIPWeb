import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('blocking-analysis')

export default function BlockingAnalysisModulePage() {
  return <ModulePage slug="blocking-analysis" />
}
