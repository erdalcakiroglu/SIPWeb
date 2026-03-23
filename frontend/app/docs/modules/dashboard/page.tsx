import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('dashboard')

export default function DashboardModulePage() {
  return <ModulePage slug="dashboard" />
}
