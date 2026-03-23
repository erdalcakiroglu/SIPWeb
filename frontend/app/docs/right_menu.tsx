import Link from 'next/link'
import { gettingStartedPages, modulePages } from './data'

export default function DocsRightMenu() {
  return (
    <aside className="hidden md:block">
      <div className="sticky top-24 rounded-xl border border-gray-200/70 bg-white p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Getting Started</div>
        <ul className="space-y-2 text-sm text-gray-600">
          {gettingStartedPages.map((page) => (
            <li key={page.slug}>
              <Link className="hover:text-gray-900" href={`/docs/${page.slug}`}>
                {page.title}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Modules</div>
        <ul className="space-y-2 text-sm text-gray-600">
          {modulePages.map((page) => (
            <li key={page.slug}>
              <Link className="hover:text-gray-900" href={`/docs/modules/${page.slug}`}>
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
