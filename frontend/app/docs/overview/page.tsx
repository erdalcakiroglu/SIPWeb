import GettingStartedPage, { getGettingStartedMetadata } from '../getting_started_page'

export const metadata = getGettingStartedMetadata('overview')

export default function OverviewPage() {
  return <GettingStartedPage slug="overview" />
}
