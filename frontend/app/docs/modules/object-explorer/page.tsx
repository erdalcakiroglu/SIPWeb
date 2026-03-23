import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('object-explorer')

export default function ObjectExplorerModulePage() {
  return <ModulePage slug="object-explorer" />
}
