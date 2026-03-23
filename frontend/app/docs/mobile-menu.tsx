'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { gettingStartedPages, modulePages } from './data'

export default function DocsMobileMenu() {
  const [openGettingStarted, setOpenGettingStarted] = useState(false)
  const [openModules, setOpenModules] = useState(false)

  return (
    <div className="md:hidden mb-8 space-y-2">
      {/* Getting Started */}
      <details className="group">
        <summary className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors font-semibold text-gray-900">
          <span>Getting Started</span>
          <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-2 ml-2 space-y-2">
          {gettingStartedPages.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/${page.slug}`}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {page.title}
            </Link>
          ))}
        </div>
      </details>

      {/* Modules */}
      <details className="group">
        <summary className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors font-semibold text-gray-900">
          <span>Modules</span>
          <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-2 ml-2 space-y-2">
          {modulePages.map((page) => (
            <Link
              key={page.slug}
              href={`/docs/modules/${page.slug}`}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {page.title}
            </Link>
          ))}
        </div>
      </details>
    </div>
  )
}
