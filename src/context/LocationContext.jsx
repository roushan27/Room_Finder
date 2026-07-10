import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext()

// Fixed reference point — change these coordinates/name to your actual university location
const FIXED_LOCATION = {
  lat: 23.352102,
  lng: 85.412963,
  label: 'Sarala Birla University',
}

export function LocationProvider({ children }) {
  const [referenceLocation, setReferenceLocation] = useState(FIXED_LOCATION)

  useEffect(() => {
  const saved = localStorage.getItem('referenceLocation')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // Only restore a saved location if it's the user's own live GPS pick,
      // not a stale copy of the fixed default — avoids confusion between the two.
      if (parsed.label === 'My current location') {
        setReferenceLocation(parsed)
      }
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
