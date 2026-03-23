import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('index-advisor')

export default function IndexAdvisorModulePage() {
  return <ModulePage slug="index-advisor" />
}
