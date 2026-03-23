import ModulePage, { getModuleMetadata } from '../module_page'

export const metadata = getModuleMetadata('security-audit')

export default function SecurityAuditModulePage() {
  return <ModulePage slug="security-audit" />
}
