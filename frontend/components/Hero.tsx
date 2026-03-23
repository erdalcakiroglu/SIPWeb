'use client'

import Link from 'next/link'
import { Server, FileText } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 lg:px-10 bg-gradient-to-br from-primary-gradientFrom via-primary to-primary-gradientTo overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/5 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Content */}
        <div className="text-white">
          <h1 className="text-4xl md:text-5xl lg:text-[52px] font-extrabold leading-[1.1] tracking-tight mb-6">
            AI-Powered SQL Server Performance Intelligence.
          </h1>
          
          <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-8 max-w-lg">
            Analyze stored procedures, detect bottlenecks, and generate audit-ready tuning reports — fully read-only.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-12 items-start">
            <Link 
              href="/download" 
              className="group inline-flex flex-col items-center text-center px-8 py-3.5 bg-cta text-white font-bold rounded-xl shadow-cta hover:bg-cta-hover hover:shadow-cta-hover hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/35 transition-all"
            >
              <span>Start 30-Day Free Trial</span>
              <span className="mt-1 text-[11px] leading-none text-white/80 font-medium">
                No credit card required.
              </span>
            </Link>
            <Link 
              href="/features" 
              className="px-8 py-4 bg-white/10 border-2 border-white/30 text-white font-semibold rounded-xl backdrop-blur-sm hover:bg-white/20 hover:border-white/50 hover:shadow-lg hover:shadow-white/10 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Explore Features
            </Link>
          </div>

        </div>

        {/* Visual mockup */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform perspective-1000 rotate-y-[-5deg] hover:rotate-y-[-2deg] transition-transform duration-500">
            {/* Window header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            
            {/* App preview */}
            <div className="p-3 bg-gray-100 min-h-[380px] font-mono text-sm border border-gray-300">
              {/* Window title bar - Windows 11 style */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs mb-2 rounded-t">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="ml-1 font-semibold">Query Performance Analysis - SQL Server</span>
              </div>

              {/* SQL Server UI Grid */}
              <div className="bg-white border border-gray-300 p-2 space-y-2">
                {/* Query metrics table */}
                <div className="bg-white border border-gray-200 text-xs">
                  <div className="flex bg-gray-200 border-b border-gray-300 font-bold">
                    <div className="flex-1 px-2 py-1 border-r border-gray-300">Metric</div>
                    <div className="w-20 px-2 py-1 border-r border-gray-300 text-right">Current</div>
                    <div className="w-20 px-2 py-1 text-right">Recommended</div>
                  </div>
                  <div className="flex border-b border-gray-200 hover:bg-blue-50">
                    <div className="flex-1 px-2 py-1 border-r border-gray-200">Logical Reads</div>
                    <div className="w-20 px-2 py-1 border-r border-gray-200 text-right font-semibold">8,547,120</div>
                    <div className="w-20 px-2 py-1 text-right text-green-700 font-bold">1,254,890</div>
                  </div>
                  <div className="flex border-b border-gray-200 hover:bg-blue-50">
                    <div className="flex-1 px-2 py-1 border-r border-gray-200">Physical Reads</div>
                    <div className="w-20 px-2 py-1 border-r border-gray-200 text-right font-semibold">142,890</div>
                    <div className="w-20 px-2 py-1 text-right text-green-700 font-bold">12,450</div>
                  </div>
                  <div className="flex border-b border-gray-200 hover:bg-blue-50">
                    <div className="flex-1 px-2 py-1 border-r border-gray-200">CPU Time (ms)</div>
                    <div className="w-20 px-2 py-1 border-r border-gray-200 text-right font-semibold">4,521</div>
                    <div className="w-20 px-2 py-1 text-right text-green-700 font-bold">487</div>
                  </div>
                  <div className="flex hover:bg-blue-50">
                    <div className="flex-1 px-2 py-1 border-r border-gray-200">Elapsed Time (ms)</div>
                    <div className="w-20 px-2 py-1 border-r border-gray-200 text-right font-semibold">6,834</div>
                    <div className="w-20 px-2 py-1 text-right text-green-700 font-bold">812</div>
                  </div>
                </div>

                {/* Execution Plan + AI Recommendation */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-2">
                  <div className="text-[11px] font-bold text-blue-900 mb-1">📋 Execution Plan Analysis (Query Store)</div>
                  <div className="text-[10px] text-gray-700 leading-tight mb-2 font-mono bg-white px-1.5 py-1 border border-gray-300 rounded">
                    Wait Type: <span className="font-bold text-orange-700">CXPACKET</span> (58%) | Missing Index: <span className="font-bold">IDX_Customer_ID</span>
                  </div>
                  <div className="text-[10px] font-semibold text-green-700">✓ AI Recommendation:</div>
                  <div className="text-[10px] text-gray-600 leading-tight">Add missing index on columns <code className="bg-gray-200 px-1 rounded">[CustomerID, OrderDate]</code> — Est. improvement: <span className="font-bold">-90% CPU</span>, <span className="font-bold">-85% Reads</span></div>
                </div>

                {/* Confidence Score Badge */}
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 p-2 rounded">
                  <div className="text-2xl">✓</div>
                  <div className="text-[10px]">
                    <div className="font-bold text-green-800">Confidence: 94%</div>
                    <div className="text-gray-600">Based on Execution Plan + Query Store metrics + Wait Statistics</div>
                  </div>
                </div>

                {/* Footer note */}
                <div className="text-[10px] text-gray-500 text-center border-t border-gray-200 pt-2 mt-2">
                  ✓ No agents required • Read-only analysis
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 inline-flex px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <Server className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/90 font-medium">
                Supports SQL Server <span className="font-bold">2016–2022</span> (Enterprise & Standard)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}