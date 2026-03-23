import GettingStartedPage, { getGettingStartedMetadata } from '../getting_started_page'

export const metadata = getGettingStartedMetadata('installation')

export default function InstallationPage() {
  return <GettingStartedPage slug="installation" />
}
