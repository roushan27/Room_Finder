import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext()

export function LocationProvider({ children }) {
  const [referenceLocation, setReferenceLocation] = useState(null) // { lat, lng, label }

  useEffect(() => {
    const saved = localStorage.getItem('referenceLocation')
    if (saved) {
      try {
        setReferenceLocation(JSON.parse(saved))
      } catch {
        // ignore corrupt data
      }
    }
  }, [])

  const updateReferenceLocation = (loc) => {
    setReferenceLocation(loc)
    localStorage.setItem('referenceLocation', JSON.stringify(loc))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateReferenceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'My current location',
        })
      },
      () => {
        // permission denied or failed — silently ignore, user can search manually
      }
    )
  }

  return (
    <LocationContext.Provider
      value={{ referenceLocation, updateReferenceLocation, useMyLocation }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
