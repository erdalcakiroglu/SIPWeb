import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { gettingStartedPages } from './data'
import { gettingStartedTemplates } from './templates'
import DocsRightMenu from './right_menu'

export type GettingStartedPageProps = {
  slug: string
}

export function getGettingStartedMetadata(slug: string) {
  const normalizedSlug = slug.replace(/_/g, '-')
  const page = gettingStartedPages.find((item) => item.slug === normalizedSlug)

  if (!page) {
    return {
      title: 'Docs — SQL Performance Intelligence™',
    }
  }

  return {
    title: `${page.title} — Docs — SQL Performance Intelligence™`,
    description: page.summary,
  }
}

export default function GettingStartedPage({ slug }: GettingStartedPageProps) {
  const normalizedSlug = slug.replace(/_/g, '-')
  const page = gettingStartedPages.find((item) => item.slug === normalizedSlug)
  if (!page) {
    notFound()
  }

  const Template =
    gettingStartedTemplates[page.slug] ?? gettingStartedTemplates[normalizedSlug] ?? DefaultGettingStartedTemplate

  return (
    <main>
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-gradientFrom via-primary to-primary-gradientTo px-6 py-12 pt-32 lg:px-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/5 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/75">
            <Link href="/docs" className="hover:text-white">
              Docs
            </Link>
            <span>/</span>
            <span className="font-semibold text-white">{page.title}</span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">{page.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-white/85">{page.summary}</p>
        </div>
      </section>

      <section className="py-10 px-6 lg:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
            <DocsRightMenu />

            <div className="space-y-10">
              <Template />

              <div className="flex items-center justify-between text-sm text-gray-500">
                <Link href="/docs" className="hover:text-gray-900">
                  Back to Docs
                </Link>
                <Link href="/download" className="hover:text-gray-900">
                  Download
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function DefaultGettingStartedTemplate() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Overview</div>
        <p className="text-sm text-gray-700">
          Add a concise explanation, key steps, or prerequisites for this topic. Keep it short and action-focused.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Help Content</div>
        <p className="text-sm text-gray-700">
          Drop your help files, screenshots, or longer guides here. This section is intentionally flexible.
        </p>
      </div>
    </div>
  )
}
