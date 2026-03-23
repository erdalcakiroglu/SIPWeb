import { gettingStartedPages } from '../data'
import GettingStartedPage, { getGettingStartedMetadata } from '../getting_started_page'

type PageProps = {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return gettingStartedPages.map((page) => ({ slug: page.slug }))
}

export function generateMetadata({ params }: PageProps) {
  const rawSlug = typeof params?.slug === 'string' ? params.slug : ''
  return getGettingStartedMetadata(rawSlug)
}

export default function DocsGettingStartedPage({ params }: PageProps) {
  const rawSlug = typeof params?.slug === 'string' ? params.slug : ''
  return <GettingStartedPage slug={rawSlug} />
}
