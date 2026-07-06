import { useState } from 'react'

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const request = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        })
        setLoading(false)
      },
      err => {
        setError(
          err.code === 1 ? 'Location permission denied — allow in Safari settings' :
          err.code === 2 ? 'Location unavailable — check GPS signal' :
          'Location request timed out'
        )
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  return { location, error, loading, request }
}
