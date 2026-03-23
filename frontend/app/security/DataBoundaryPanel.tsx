'use client'

import { useState } from 'react'

type ProviderMode = 'local' | 'cloud'
type PolicyLevel = 'L0' | 'L1' | 'L2' | 'L3'

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) => (
  <div className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-60' : ''}`}>
    <div>
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      {description && <div className="mt-1 text-xs text-slate-500">{description}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/25 ${
        checked ? 'bg-cta' : 'bg-gray-200'
      } ${disabled ? 'pointer-events-none' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
)

const PolicyCard = ({
  level,
  title,
  description,
  selected,
  disabled,
  onSelect,
}: {
  level: PolicyLevel
  title: string
  description: React.ReactNode
  selected: boolean
  disabled?: boolean
  onSelect: (level: PolicyLevel) => void
}) => (
  <button
    type="button"
    onClick={() => !disabled && onSelect(level)}
    className={`text-left rounded-2xl border p-5 transition-all ${
      selected
        ? 'border-primary/30 bg-primary-light/60 shadow-sm'
        : 'border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg'}`}
  >
    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{level}</div>
    <div className="mb-2 text-sm font-bold text-slate-900">{title}</div>
    <div className="text-xs leading-relaxed text-slate-600">{description}</div>
  </button>
)

export default function DataBoundaryPanel() {
  const [providerMode, setProviderMode] = useState<ProviderMode>('local')
  const [policyLevel, setPolicyLevel] = useState<PolicyLevel>('L0')

  const [sendProcedureText, setSendProcedureText] = useState(false)
  const [maskLiterals, setMaskLiterals] = useState(true)
  const [removeComments, setRemoveComments] = useState(true)
  const [maskPII, setMaskPII] = useState(true)
  const [maskObjectNames, setMaskObjectNames] = useState(false)

  const controlsDisabled = providerMode === 'local'

  const handleModeChange = (mode: ProviderMode) => {
    setProviderMode(mode)
    setPolicyLevel(mode === 'cloud' ? 'L1' : 'L0')
  }

  const handlePolicyChange = (level: PolicyLevel) => {
    if (level === 'L0') {
      setProviderMode('local')
      setPolicyLevel('L0')
      return
    }
    setProviderMode('cloud')
    setPolicyLevel(level)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-700">Mode</div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('local')}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/25 ${
                providerMode === 'local'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-pressed={providerMode === 'local'}
            >
              Offline
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('cloud')}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/25 ${
                providerMode === 'cloud'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-pressed={providerMode === 'cloud'}
            >
              Cloud
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {providerMode === 'cloud'
            ? 'Cloud mode: selected context may be sent to a third-party provider.'
            : 'Offline mode: no prompts or context leave your environment.'}
        </p>
      </div>

      <details className="group rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 md:text-base">
          <span>Send Policy (L0–L3)</span>
          <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <PolicyCard
            level="L0"
            title="Cloud disabled"
            description="Nothing is sent."
            selected={policyLevel === 'L0'}
            onSelect={handlePolicyChange}
          />
          <PolicyCard
            level="L1"
            title="Metrics only (no code)"
            description="L1 (Recommended): Sends only summary metrics and rule hits. No procedure code, full query text, or plan XML."
            selected={policyLevel === 'L1'}
            disabled={providerMode === 'local'}
            onSelect={handlePolicyChange}
          />
          <PolicyCard
            level="L2"
            title="Redacted code excerpts"
            description="Medium risk. Mask literals + PII."
            selected={policyLevel === 'L2'}
            disabled={providerMode === 'local'}
            onSelect={handlePolicyChange}
          />
          <PolicyCard
            level="L3"
            title="Full context (highest risk)"
            description="L3 (High Risk): Full context. Requires admin override and per-run confirmation."
            selected={policyLevel === 'L3'}
            disabled={providerMode === 'local'}
            onSelect={handlePolicyChange}
          />
        </div>
      </details>

      <details className="group rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 md:text-base">
          <span>Redaction toggles</span>
          <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="mt-3 divide-y divide-slate-100">
          <ToggleRow
            label="Send procedure/query text to Cloud AI"
            description="Off by default. Use only with L2+."
            checked={sendProcedureText}
            onChange={setSendProcedureText}
            disabled={controlsDisabled}
          />
          <ToggleRow
            label="Mask literals (numbers/strings)"
            description="On by default in cloud mode."
            checked={maskLiterals}
            onChange={setMaskLiterals}
            disabled={controlsDisabled}
          />
          <ToggleRow
            label="Remove comments"
            description="On by default in cloud mode."
            checked={removeComments}
            onChange={setRemoveComments}
            disabled={controlsDisabled}
          />
          <ToggleRow
            label="Mask PII patterns"
            description="Email, phone, IBAN, and ID patterns."
            checked={maskPII}
            onChange={setMaskPII}
            disabled={controlsDisabled}
          />
          <ToggleRow
            label="Mask object names (optional)"
            description="Schemas, tables, columns, procedures."
            checked={maskObjectNames}
            onChange={setMaskObjectNames}
            disabled={controlsDisabled}
          />
        </div>
      </details>

      {providerMode === 'cloud' && (
        <details className="group rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 md:text-base">
            <span>Advanced</span>
            <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary"
            >
              Preview payload
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary"
            >
              Copy payload
            </button>
          </div>
        </details>
      )}
    </div>
  )
}
