import { useEffect } from 'react'

export function useModalBackButton(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return

    window.history.pushState({ modal: true }, '')

    const handlePopState = () => {
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])
}