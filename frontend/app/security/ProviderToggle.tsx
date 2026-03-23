'use client'

import { useState } from 'react'

export default function ProviderToggle() {
  const [mode, setMode] = useState<'local' | 'cloud'>('local')

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm font-semibold text-gray-700">AI Provider</div>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setMode('local')}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/25 ${
              mode === 'local'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-pressed={mode === 'local'}
          >
            Local (Offline)
          </button>
          <button
            type="button"
            onClick={() => setMode('cloud')}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/25 ${
              mode === 'cloud'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-pressed={mode === 'cloud'}
          >
            Cloud (Optional)
          </button>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        {mode === 'cloud'
          ? 'Cloud mode may transmit prompts to a third-party provider.'
          : 'Offline mode keeps prompts and metadata inside your environment.'}
      </div>
    </div>
  )
}
