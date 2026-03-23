'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

const plans = [
  {
    name: 'Developer',
    description: 'For individual developers and DBAs',
    monthlyPrice: 39,
    annualPrice: 402,
    annualMonthly: 33.50,
    features: [
      { text: '1 user license', included: true },
      { text: 'Connect to multiple SQL Servers per user license.', included: true, bold: true },
      { text: 'All core modules', included: true },
      { text: 'Full AI reports with confidence scoring', included: true },
      { text: 'Local LLM (offline)', included: true },
      { text: 'Optional cloud LLM (user-controlled)', included: true },
      { text: 'Cancel anytime', included: true },
      { text: 'No credit card required (trial)', included: true },
    ],
    cta: 'Start 30-Day Free Trial',
    popular: false,
  },
  {
    name: 'Team',
    description: 'For development teams (5 users)',
    monthlyPrice: 119,
    annualPrice: 1199,
    annualMonthly: 99.90,
    savings: 811,
    features: [
      { text: '5 user licenses', included: true, bold: true },
      { text: 'Connect to multiple SQL Servers per user license.', included: true, bold: true },
      { text: 'All core modules', included: true },
      { text: 'Full AI reports with confidence scoring', included: true },
      { text: 'Priority email support', included: true },
      { text: 'License management portal', included: true },
      { text: 'Local LLM (offline)', included: true },
      { text: 'Optional cloud LLM (user-controlled)', included: true },
    ],
    cta: 'Start 30-Day Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large teams (20+ users)',
    customPricing: true,
    features: [
      { text: '20+ user licenses', included: true, bold: true },
      { text: 'Everything in Team', included: true },
      { text: 'Volume discounts', included: true },
      { text: 'Security review support (questionnaire + docs)', included: true },
      { text: 'On-prem / air-gapped friendly deployment (optional)', included: true },
      { text: 'Dedicated onboarding', included: true },
      { text: 'Optional support SLA', included: true },
      { text: 'Invoice billing (NET 30)', included: true },
      { text: 'Advanced High Availability Monitoring (coming soon)', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 bg-gray-100 px-6 py-16 lg:px-10"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-2 bg-primary-light text-primary text-sm font-semibold rounded-full uppercase tracking-wide mb-5">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5 text-gray-900">
            Simple per-user pricing. No server limits.
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            One license per user. Connect to multiple SQL Servers per user license.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span 
            className={`text-sm font-medium cursor-pointer transition-colors ${!isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </span>
          
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
          
          <span 
            className={`text-sm font-medium cursor-pointer transition-colors ${isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}
            onClick={() => setIsAnnual(true)}
          >
            Annual
          </span>
          
          <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
            Save 20%
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative flex flex-col bg-white rounded-3xl p-6 lg:p-8 border-2 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                plan.popular 
                  ? 'border-primary shadow-xl shadow-primary/10' 
                  : 'border-gray-100'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-extrabold uppercase tracking-wide px-6 py-2 rounded-full shadow-xl shadow-primary/40 ring-2 ring-white/90">
                  Best Value
                </span>
              )}

              {/* Plan info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
                {plan.name === 'Team' && (
                  <p className="text-xs text-primary font-semibold mt-2">
                    Ideal for growing engineering teams.
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="mb-2">
                {plan.customPricing ? (
                  <>
                    <span className="text-4xl font-extrabold tracking-tight">Custom</span>
                    <span className="text-gray-400 ml-2">volume pricing</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${isAnnual ? plan.annualPrice?.toLocaleString() : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-400 ml-2">/ {isAnnual ? 'year' : 'month'}</span>
                  </>
                )}
              </div>

              {/* Annual note */}
              <div className="text-sm text-gray-400 mb-5 min-h-[20px]">
                {plan.customPricing 
                  ? 'Flexible billing options'
                  : isAnnual 
                    ? (
                      <span>
                        Billed annually
                        <span className="text-xs text-gray-400"> (${plan.annualMonthly}/mo)</span>
                      </span>
                    )
                    : 'Billed monthly'
                }
              </div>

              {/* Savings badge */}
              {plan.savings && isAnnual && (
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-lg text-center mb-6">
                  Save ${plan.savings}/year vs individual licenses
                </div>
              )}

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'} ${feature.bold ? 'font-semibold' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                <Link 
                  href={plan.name === 'Enterprise' ? 'mailto:sales@dbperfstudio.com' : '/download'}
                  className={`block w-full py-3 px-6 rounded-xl font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-cta text-white shadow-cta hover:bg-cta-hover hover:shadow-cta-hover hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/35'
                      : plan.name === 'Developer'
                        ? 'bg-white border-2 border-teal-300 text-teal-800 hover:bg-teal-50/80 hover:border-teal-400'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  {plan.cta}
                </Link>

                {plan.name === 'Developer' && (
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Perfect for individual SQL Server developers.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-12 text-center p-6 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-600">
            All plans include a <span className="font-semibold text-primary">30-day free trial</span> with full features. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
