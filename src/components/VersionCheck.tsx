'use client'

import { useEffect } from 'react'

const APP_VERSION = Date.now().toString()

export function VersionCheck() {
  useEffect(() => {
    // Store current version
    const storedVersion = localStorage.getItem('app-version')
    
    console.log('[VersionCheck] Current version:', APP_VERSION)
    console.log('[VersionCheck] Stored version:', storedVersion)
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('[VersionCheck] Version mismatch detected! Clearing cache and reloading...')
      
      // Clear all caches
      localStorage.clear()
      sessionStorage.clear()
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister()
            console.log('[VersionCheck] Unregistered service worker')
          })
        })
      }
      
      // Clear cache storage
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
            console.log('[VersionCheck] Deleted cache:', name)
          })
        })
      }
      
      // Store new version and force reload
      localStorage.setItem('app-version', APP_VERSION)
      
      // Force hard reload
      window.location.reload()
    } else {
      // First time or same version - just store it
      localStorage.setItem('app-version', APP_VERSION)
    }
  }, [])
  
  return null
}
