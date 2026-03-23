'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Download', href: '/download' },
    { label: 'Docs', href: '/docs' },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-b border-gray-200 transition-shadow duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="SQL Performance Intelligence" 
            width={42} 
            height={42}
            className="w-10 h-10"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-base tracking-tight text-gray-900">
              SQL Performance
            </span>
            <span className="text-xs font-semibold tracking-wide text-gray-500 self-end">
              Intelligence™
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA + Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <Link 
            href="/download" 
            className="hidden sm:block px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-cta shadow-cta hover:bg-cta-hover hover:shadow-cta-hover hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-cta/35 transition-all"
          >
            Start Trial
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/download"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full px-4 py-2.5 rounded-xl text-center text-white bg-cta hover:bg-cta-hover font-semibold transition-colors"
          >
            Start Free Trial
          </Link>
        </nav>
      )}
    </header>
  )
}
