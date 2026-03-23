import GettingStartedPage, { getGettingStartedMetadata } from '../getting_started_page'

export const metadata = getGettingStartedMetadata('quickstart')

export default function QuickstartPage() {
  return <GettingStartedPage slug="quickstart" />
}
