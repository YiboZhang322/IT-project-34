'use client'

import { useEffect, useState } from 'react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({ 
  id, 
  type, 
  title, 
  message, 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100)
    
    // Auto close
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  const typeStyles = {
    success: {
      bg: 'bg-emerald-500 border-emerald-500',
      icon: 'text-white',
      iconPath: 'M5 13l4 4L19 7'
    },
    error: {
      bg: 'bg-red-500 border-red-500',
      icon: 'text-white',
      iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    warning: {
      bg: 'bg-amber-500 border-amber-500',
      icon: 'text-white',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
    },
    info: {
      bg: 'bg-blue-500 border-blue-500',
      icon: 'text-white',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  }

  const style = typeStyles[type]

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isVisible && !isExiting
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-12 opacity-0 scale-95'
      }`}
    >
      <div className={`${style.bg} rounded-2xl p-5 border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-80 max-w-md backdrop-blur-xl`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className={`w-5 h-5 ${style.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-base mb-1 tracking-tight">{title}</h4>
            {message && (
              <p className="text-white/95 text-sm leading-relaxed font-medium">{message}</p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white/60 hover:text-white transition-all duration-200 p-2 hover:bg-white/15 rounded-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-0.5 bg-white/25 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-white transition-all duration-${duration} ease-linear`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 p-6 space-y-4 pointer-events-none">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{ 
            transform: `translateY(${index * 6}px)`,
            zIndex: 50 - index
          }}
        >
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
