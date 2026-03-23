'use client'

import { resetCookieConsentAndReload } from './CookieConsent'

export default function CookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={resetCookieConsentAndReload}
      className="text-sm text-slate-400 transition-colors hover:text-white"
    >
      Cookie preferences
    </button>
  )
}
