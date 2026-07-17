import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext()

const TOAST_STYLES = {
  success: {
    border: 'border-brand-sage/20',
    iconBg: 'bg-gradient-to-br from-brand-sage to-[#5a8a6b]',
    iconShadow: 'shadow-[0_4px_12px_rgba(118,159,134,0.4)]',
    text: 'text-slate-700',
  },
  error: {
    border: 'border-brand-coral/20',
    iconBg: 'bg-gradient-to-br from-brand-coral to-[#b05a45]',
    iconShadow: 'shadow-[0_4px_12px_rgba(200,122,101,0.4)]',
    text: 'text-slate-700',
  },
  info: {
    border: 'border-orange-200/60',
    iconBg: 'bg-gradient-to-br from-brand-gold to-[#8a6540]',
    iconShadow: 'shadow-[0_4px_12px_rgba(166,124,82,0.4)]',
    text: 'text-slate-700',
  },
}

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    return id
  }, [removeToast])

  const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    info: (message, duration) => showToast(message, 'info', duration),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <style>{`
        @keyframes toast-check-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes toast-icon-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[100] flex flex-col gap-2.5 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 bg-white border ${style.border} rounded-2xl pl-3.5 pr-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-top-2 duration-300`}
            >
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full ${style.iconBg} ${style.iconShadow} flex items-center justify-center`}
                style={{ animation: 'toast-icon-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {t.type === 'success' && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="M5 12l4 4L19 7"
                      style={{
                        strokeDasharray: 20,
                        strokeDashoffset: 20,
                        animation: 'toast-check-draw 0.4s ease-out 0.15s forwards',
                      }}
                    />
                  </svg>
                )}
                {t.type === 'error' && (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                )}
                {t.type === 'info' && (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                )}
              </span>
              <p className={`${style.text} text-xs font-semibold leading-snug flex-1`}>
                {t.message}
              </p>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 font-bold text-sm transition"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)