'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

interface AuthShellProps {
  title: string
  subtitle: string
  asideTitle: string
  asideText: string
  actionText: string
  actionLabel: string
  actionTo: string
  children: ReactNode
}

export function AuthShell({
  title,
  subtitle,
  asideTitle,
  asideText,
  actionText,
  actionLabel,
  actionTo,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen w-full flex flex-column" style={{ background: 'var(--surface-ground)' }}>
      {/* Header */}
      <header className="w-full" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(42, 50, 61, 1)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex align-items-center justify-content-between gap-3 px-4 py-3 mx-auto md:px-6 lg:px-8" style={{ maxWidth: '1280px' }}>
          <Link className="no-underline min-w-0 flex align-items-center gap-3" href="/landing">
            <img src="/images/logo/logo-gad.png" alt="Sigchos Logo" style={{ height: '2.5rem', width: 'auto', objectFit: 'contain' }} />
            <div className="flex flex-column justify-content-center hidden sm:flex">
              <span className="text-base md:text-lg font-bold text-white uppercase m-0" style={{ letterSpacing: '0.12em', lineHeight: '1.2' }}>
                SIGCHOS BOOKING
              </span>
              <span className="text-xs m-0 text-white-alpha-70" style={{ lineHeight: '1.2' }}>
                Alojamiento y turismo en Sigchos
              </span>
            </div>
          </Link>
          <Link
            className="inline-flex align-items-center border-1 border-white-alpha-30 border-round-lg px-3 py-2 text-sm font-semibold text-white no-underline hover:bg-white-alpha-10 transition-colors transition-duration-200"
            href="/landing"
          >
            <i className="pi pi-arrow-left mr-2 text-sm hidden sm:inline-block"></i>
            <span className="hidden sm:inline-block">Regresar a página principal</span>
            <span className="sm:hidden"><i className="pi pi-arrow-left"></i></span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex align-items-center justify-content-center p-4 md:p-4">
        <section className="surface-card border-round-lg w-full overflow-hidden shadow-2 surface-card p-4 md:p-6 lg:p-7" style={{ maxWidth: '40rem' }}>
            <h1 className="text-3xl md:text-4xl text-900">{title}</h1>
            <p className="mt-2 text-sm md:text-base text-600">{subtitle}</p>

            <div className="mt-5">{children}</div>

            <p className="mt-4 text-sm text-600 text-center">
              {actionText}{' '}
              <Link
                className="font-semibold no-underline hover:underline"
                href={actionTo}
                style={{ color: 'var(--primary-color)' }}
              >
                {actionLabel}
              </Link>
            </p>
        </section>
      </main>
    </div>
  )
}
