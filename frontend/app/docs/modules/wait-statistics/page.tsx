import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('wait-statistics')

export default function WaitStatisticsModulePage() {
  return <ModulePage slug="wait-statistics" />
}
