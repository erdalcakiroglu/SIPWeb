'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export const COOKIE_CONSENT_STORAGE_KEY = 'cookie_consent'
const STORAGE_KEY = COOKIE_CONSENT_STORAGE_KEY
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-7P384RE0KJ'

type ConsentStatus = 'granted' | 'denied' | null

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function updateConsent(analyticsStorage: 'granted' | 'denied', adStorage: 'granted' | 'denied') {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', {
    analytics_storage: analyticsStorage,
    ad_storage: adStorage,
  })
  window.gtag('config', GA_ID)
}

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentStatus | null
    if (stored === 'granted' || stored === 'denied') {
      setStatus(stored)
      if (stored === 'granted') {
        updateConsent('granted', 'granted')
      }
    } else {
      setStatus(null)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'granted')
    setStatus('granted')
    updateConsent('granted', 'granted')
  }

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'denied')
    setStatus('denied')
    updateConsent('denied', 'denied')
  }

  if (!mounted || status !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          This website uses anonymous analytics to improve the product experience. We use cookies only for analytics when you consent. By continuing, you accept our use of cookies as described in our{' '}
          <Link href="/cookie-policy" className="font-medium text-primary underline hover:text-primary-dark">
            Cookie Policy
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="font-medium text-primary underline hover:text-primary-dark">
            Privacy Policy
          </Link>.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reject}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-xl bg-cta px-4 py-2.5 text-sm font-semibold text-white shadow-cta transition-colors hover:bg-cta-hover hover:shadow-cta-hover"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}

/** Call to reset stored consent and reload so the banner shows again (e.g. "Cookie preferences" in footer). */
export function resetCookieConsentAndReload() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  window.location.reload()
}
