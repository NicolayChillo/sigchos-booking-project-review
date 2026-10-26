'use client'

import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '@/lib/config/env'

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void
  onError?: (error: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  isLoading?: boolean
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'signin_with',
  isLoading = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let interval: any = null

    const initGoogle = () => {
      const g = (window as any).google
      if (g && g.accounts && g.accounts.id) {
        if (interval) clearInterval(interval)
        setIsLoaded(true)

        if (!GOOGLE_CLIENT_ID) {
          console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado en las variables de entorno.')
          return
        }

        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential)
            } else {
              onError?.('No se obtuvo credencial de Google')
            }
          },
          auto_select: false,
        })

        if (containerRef.current) {
          g.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: containerRef.current.clientWidth || 350,
          })
        }
      }
    }

    // Intentar inicializar inmediatamente
    initGoogle()

    // O sondear cada 100ms hasta que el script de Google esté cargado
    interval = setInterval(() => {
      initGoogle()
    }, 100)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [onSuccess, onError, text])

  // Redibujar el botón al cambiar de tamaño para mantener la responsividad
  useEffect(() => {
    const handleResize = () => {
      const g = (window as any).google
      if (g && g.accounts && g.accounts.id && containerRef.current && isLoaded) {
        g.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: containerRef.current.clientWidth || 350,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isLoaded, text])

  return (
    <div className="w-full flex flex-column align-items-center justify-content-center my-2">
      <div
        ref={containerRef}
        className="w-full flex justify-content-center transition-all transition-duration-300"
        style={{
          minHeight: '44px',
          opacity: isLoading ? 0.5 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      />
    </div>
  )
}
