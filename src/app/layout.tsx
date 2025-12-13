import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { VersionCheck } from '@/components/VersionCheck'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ticket Numberer - Batch Export Tool',
  description: 'Create and export custom tickets in bulk. Generate PNG, JPEG, and PDF tickets with flexible numbering and professional layouts.',
  manifest: '/site.webmanifest',
  other: {
    // Force cache invalidation
    'cache-control': 'no-cache, no-store, must-revalidate',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6', // Blue theme for ticket builder
  viewportFit: 'cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VersionCheck />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}