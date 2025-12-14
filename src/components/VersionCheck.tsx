'use client'

import { useEffect, useRef } from 'react'

// Static version - only changes when we manually update it or rebuild
const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_ID || '1.0.0'

export function VersionCheck() {
  const hasChecked = useRef(false)
  
  useEffect(() => {
    // Only check once per mount
    if (hasChecked.current) return
    hasChecked.current = true
    
    // Store current version
    const storedVersion = localStorage.getItem('app-version')
    
    console.log('[VersionCheck] Current version:', APP_VERSION)
    console.log('[VersionCheck] Stored version:', storedVersion)
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('[VersionCheck] Version mismatch detected! Clearing cache...')
      
      // Store new version BEFORE clearing (important!)
      localStorage.setItem('app-version', APP_VERSION)
      
      // Clear other localStorage/sessionStorage except version
      const version = localStorage.getItem('app-version')
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('app-version', version!)
      
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
      
      console.log('[VersionCheck] Cache cleared. Reload manually with Ctrl+Shift+R')
    } else if (!storedVersion) {
      // First time - just store it
      localStorage.setItem('app-version', APP_VERSION)
      console.log('[VersionCheck] First load - version stored')
    } else {
      console.log('[VersionCheck] Version matches, no action needed')
    }
  }, [])
  
  return null
}
