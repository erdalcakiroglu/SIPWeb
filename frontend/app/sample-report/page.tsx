import { Metadata } from 'next'
import Link from 'next/link'
import { Download, FileText, Shield, TrendingUp } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Sample Security Report — SQL Performance Intelligence™',
  description: 'View a sample security audit report from SQL Performance Intelligence to understand the level of detail and insights provided.',
}

export default function SampleReportPage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Sample Security Report
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Explore what kind of insights and recommendations SQL Performance Intelligence provides for database security audits and performance analysis.
          </p>
        </div>
      </section>

      {/* Report Preview */}
      <section className="py-16 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-10 h-10" />
                <h2 className="text-2xl font-bold">Security Audit Report</h2>
              </div>
              <p className="text-slate-300">SQL Performance Intelligence™ - Database: Production</p>
              <p className="text-slate-400 text-sm mt-2">Generated: February 28, 2026</p>
            </div>

            {/* Report Content */}
            <div className="p-8 space-y-8">
              {/* Executive Summary */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Executive Summary</h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    This report provides a comprehensive security audit of your SQL Server database. The analysis covers authentication mechanisms, permission configurations, encryption status, and potential vulnerabilities.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Findings</p>
                      <p className="text-2xl font-bold text-green-700">24</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <p className="text-2xl font-bold text-yellow-700">Medium</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Compliance</p>
                      <p className="text-2xl font-bold text-blue-700">78%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Findings */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Key Findings</h3>
                <div className="space-y-3">
                  {[
                    { icon: '⚠️', title: 'Default Accounts Active', severity: 'High', desc: 'Default system accounts are still active.' },
                    { icon: '✓', title: 'TDE Enabled', severity: 'Resolved', desc: 'Transparent Data Encryption is properly configured.' },
                    { icon: '⚡', title: 'Suspicious Queries', severity: 'Medium', desc: 'Some queries lack proper indexing.' },
                    { icon: '🔒', title: 'Backup Security', severity: 'Low', desc: 'Backups could use additional encryption.' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          item.severity === 'High' ? 'bg-red-100 text-red-700' :
                          item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          item.severity === 'Resolved' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Recommendations</h3>
                <div className="space-y-3 text-gray-700">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Disable or rename default administrator accounts</li>
                    <li>Implement role-based access control (RBAC) for all users</li>
                    <li>Enable backup encryption for all database backups</li>
                    <li>Review and optimize query performance for high-impact queries</li>
                    <li>Implement audit logging for sensitive operations</li>
                    <li>Conduct regular security assessments using this tool</li>
                  </ol>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t pt-6 text-gray-600 text-sm">
                <p>
                  <strong>Note:</strong> This is a sample report demonstrating the format and insights provided by SQL Performance Intelligence. Your actual reports will contain data specific to your database environment.
                </p>
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="mt-12 text-center space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Get Your Database Report</h3>
            <p className="text-lg text-gray-600">
              Download SQL Performance Intelligence and run security audits on your databases today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Now
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                <FileText className="w-5 h-5" />
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">What's Analyzed</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Authentication & Permissions', icon: '👤' },
              { title: 'Data Encryption Status', icon: '🔐' },
              { title: 'Audit Logging Configuration', icon: '📋' },
              { title: 'Database Backup Security', icon: '💾' },
              { title: 'User Access Patterns', icon: '👥' },
              { title: 'SQL Injection Risks', icon: '⚠️' },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                <p className="text-3xl mb-2">{feature.icon}</p>
                <p className="font-semibold text-gray-900">{feature.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
