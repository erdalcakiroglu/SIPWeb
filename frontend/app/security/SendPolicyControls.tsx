'use client'

import { useState } from 'react'

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div>
      <div className="text-sm font-semibold text-gray-800">{label}</div>
      {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/25 ${
        checked ? 'bg-cta' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
)

export default function SendPolicyControls() {
  const [sendProcedureText, setSendProcedureText] = useState(true)
  const [maskLiterals, setMaskLiterals] = useState(true)
  const [maskObjects, setMaskObjects] = useState(false)
  const [cloudConfirmed, setCloudConfirmed] = useState(false)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Send policy controls</h3>
      <div className="divide-y divide-gray-100">
        <ToggleRow
          label="Send procedure text to AI"
          description="Controls whether stored procedure text is included in AI requests."
          checked={sendProcedureText}
          onChange={setSendProcedureText}
        />
        <ToggleRow
          label="Mask literals before sending"
          description="Numbers/strings are masked prior to transmission."
          checked={maskLiterals}
          onChange={setMaskLiterals}
        />
        <ToggleRow
          label="Mask object names (optional)"
          description="Optionally mask schemas, tables, and object names."
          checked={maskObjects}
          onChange={setMaskObjects}
        />
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <label className="flex items-start gap-3 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={cloudConfirmed}
            onChange={(e) => setCloudConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-200"
          />
          <span>
            Cloud mode confirmation: This may transmit code or prompts to a third-party provider.
          </span>
        </label>
      </div>
    </div>
  )
}
