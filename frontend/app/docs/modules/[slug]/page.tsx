import { modulePages } from '../../data'
import ModulePage, { getModuleMetadata } from '../module_page'

export const dynamicParams = true

type PageProps = {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return modulePages.map((page) => ({ slug: page.slug }))
}

export function generateMetadata({ params }: PageProps) {
  const rawSlug = typeof params?.slug === 'string' ? params.slug : ''
  return getModuleMetadata(rawSlug)
}

export default function DocsModulePage({ params }: PageProps) {
  const rawSlug = typeof params?.slug === 'string' ? params.slug : ''
  return <ModulePage slug={rawSlug} />
}
