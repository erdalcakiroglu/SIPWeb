import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('query-statistics')

export default function QueryStatisticsModulePage() {
  return <ModulePage slug="query-statistics" />
}
