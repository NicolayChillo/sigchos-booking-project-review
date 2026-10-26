'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from 'primereact/button'
import { Sidebar } from 'primereact/sidebar'
import { Menu } from 'primereact/menu'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  isAnchor?: boolean
}

type LandingPublicHeaderProps = {
  variant?: 'sticky' | 'static'
  additionalNavItems?: NavItem[]
}

export function LandingPublicHeader({
  variant = 'sticky',
  additionalNavItems,
}: LandingPublicHeaderProps) {
  const { isAuthenticated, signOut, user } = useAuth()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isUserMenuOpen) return

    const handleDocumentClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen])

  const fullUserName =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()

  const headerStyle: React.CSSProperties = {
    background: 'rgba(42, 50, 61, 1)',
    backdropFilter: 'blur(8px)',
    ...(variant === 'sticky'
      ? { position: 'sticky' as const, top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,0.08)' }
      : { borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }),
  }

  return (
    <>
      <header style={headerStyle}>
        <div
          className="flex align-items-center justify-content-between gap-3 px-4 py-3 mx-auto md:px-6 lg:px-8"
          style={{ maxWidth: '1280px' }}
        >
          {/* Mobile menu toggle */}
          <Button
            icon={isNavOpen ? 'pi pi-times' : 'pi pi-bars'}
            className="p-button-text p-button-rounded lg:hidden"
            style={{ color: 'white' }}
            onClick={() => setIsNavOpen((v) => !v)}
            aria-label={isNavOpen ? 'Cerrar menú' : 'Abrir menú'}
          />

          {/* Brand */}
          <Link className="no-underline flex-1 min-w-0 flex align-items-center gap-3" href="/landing">
            <img src="/images/logo/logo-gad.png" alt="Sigchos Logo" style={{ height: '2.8rem', width: 'auto', objectFit: 'contain' }} />
            <div className="flex flex-column justify-content-center">
              <span className="text-base md:text-lg font-bold text-white uppercase m-0" style={{ letterSpacing: '0.12em', lineHeight: '1.2' }}>
                SIGCHOS BOOKING
              </span>
              <span className="text-xs m-0" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.2' }}>
                Alojamiento y turismo en Sigchos
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex align-items-center gap-4 text-sm" style={{ color: '#ffffffcc' }}>
            <Link className="no-underline hover:text-white transition-colors transition-duration-200" href="/landing" style={{ color: 'inherit' }}>
              Inicio
            </Link>
            <Link className="no-underline hover:text-white transition-colors transition-duration-200" href="/landing/membership-request" style={{ color: 'inherit' }}>
              Solicitar unirse
            </Link>
            {additionalNavItems?.map((item) =>
              item.isAnchor ? (
                <a key={item.label} className="no-underline hover:text-white transition-colors transition-duration-200" href={item.href} style={{ color: 'inherit' }}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} className="no-underline hover:text-white transition-colors transition-duration-200" href={item.href} style={{ color: 'inherit' }}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex align-items-center gap-2">
            {!mounted ? (
              <div style={{ width: '150px' }} />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  className="p-button-outlined p-button-sm"
                  style={{ color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                >
                  <i className="pi pi-user mr-2"></i>
                  <span className="white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ maxWidth: '180px' }}>
                    {fullUserName}
                  </span>
                </Button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 surface-card border-round-lg shadow-4 p-2"
                    style={{ width: '13rem', zIndex: 50 }}
                  >
                    <Link
                      className="block border-round-lg px-3 py-2 text-sm text-900 no-underline hover:surface-hover transition-colors transition-duration-200"
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Ir a mi panel
                    </Link>
                    <button
                      className="w-full border-round-lg px-3 py-2 text-left text-sm text-900 border-none surface-card cursor-pointer hover:surface-hover transition-colors transition-duration-200"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        signOut()
                      }}
                      type="button"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    label="Iniciar sesión"
                    className="p-button-outlined p-button-sm"
                    style={{ color: 'white', borderColor: 'var(--primary-color)' }}
                  />
                </Link>
                <Link href="/auth/register">
                  <Button
                    label="Registrarse"
                    className="p-button-sm"
                  />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <Sidebar
        visible={isNavOpen}
        onHide={() => setIsNavOpen(false)}
        className="w-16rem"
      >
        <div className="flex flex-column h-full">
          <Menu
            className="w-full border-none p-0"
            model={[
              {
                label: 'Navegación',
                items: [
                  { label: 'Inicio', icon: 'pi pi-home', command: () => { router.push('/landing'); setIsNavOpen(false); } },
                  { label: 'Solicitar unirse', icon: 'pi pi-id-card', command: () => { router.push('/landing/membership-request'); setIsNavOpen(false); } },
                  ...(additionalNavItems?.map(item => ({
                    label: item.label,
                    icon: 'pi pi-link',
                    command: () => {
                      if (item.isAnchor) window.location.href = item.href;
                      else router.push(item.href);
                      setIsNavOpen(false);
                    }
                  })) || [])
                ]
              },
              ...(mounted && isAuthenticated && user ? [{
                label: 'Mi Cuenta',
                items: [
                  { label: 'Ir a mi panel', icon: 'pi pi-th-large', command: () => { router.push('/dashboard'); setIsNavOpen(false); } },
                  { label: 'Cerrar sesión', icon: 'pi pi-power-off', command: () => { signOut(); setIsNavOpen(false); } }
                ]
              }] : [])
            ]}
          />

          {!mounted ? null : isAuthenticated && user ? (
            <div className="mt-auto pt-4 border-top-1 border-300">
              <div className="flex align-items-center gap-3 px-3">
                <span
                  className="inline-flex align-items-center justify-content-center border-circle flex-shrink-0"
                  style={{ width: '2.5rem', height: '2.5rem', background: 'var(--primary-color)', color: 'white' }}
                >
                  <i className="pi pi-user text-lg"></i>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">{fullUserName}</div>
                  <div className="text-xs text-600 white-space-nowrap overflow-hidden text-overflow-ellipsis">{user?.role}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-auto pt-4 border-top-1 border-300 flex flex-column gap-3 px-3">
              <Button label="Iniciar sesión" icon="pi pi-sign-in" className="p-button-outlined w-full" onClick={() => { router.push('/auth/login'); setIsNavOpen(false); }} />
              <Button label="Registrarse" icon="pi pi-user-plus" className="w-full" onClick={() => { router.push('/auth/register'); setIsNavOpen(false); }} />
            </div>
          )}
        </div>
      </Sidebar>
    </>
  )
}
