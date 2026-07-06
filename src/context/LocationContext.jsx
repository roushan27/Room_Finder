import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext()

// Fixed reference point — change these coordinates/name to your actual university location
const FIXED_LOCATION = {
  lat: 23.347778,
  lng: 85.417513,
  label: 'Sarala Birla University',
}

export function LocationProvider({ children }) {
  const [referenceLocation, setReferenceLocation] = useState(FIXED_LOCATION)

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

 const useFixedLocation = () => {
    updateReferenceLocation(FIXED_LOCATION)
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
      value={{ referenceLocation, updateReferenceLocation, useMyLocation, useFixedLocation }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
