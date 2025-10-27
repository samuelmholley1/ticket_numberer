'use client'

import { useState, useEffect } from 'react'

interface ExportProgressProps {
  isOpen: boolean
  onClose: () => void
  totalTickets: number
  onTicketGenerated?: (index: number, dataUrl: string) => void
  onComplete?: (dataUrls: string[]) => void
  onError?: (error: Error) => void
  exportSettings: {
    startNumber: number
    numberFormat: string
    ticketWidth: number
    ticketHeight: number
    fontSize: number
    fontColor: string
  }
  imageSrc: string
  position: { x: number; y: number }
}

interface TicketProgress {
  index: number
  status: 'pending' | 'generating' | 'completed' | 'error'
  dataUrl?: string
  error?: string
}

export function ExportProgress({
  isOpen,
  onClose,
  totalTickets,
  onTicketGenerated,
  onComplete,
  onError,
  exportSettings,
  imageSrc,
  position
}: ExportProgressProps) {
  const [progress, setProgress] = useState<TicketProgress[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    if (isOpen && totalTickets > 0) {
      initializeProgress()
      startGeneration()
    }
  }, [isOpen, totalTickets])

  const initializeProgress = () => {
    const initialProgress: TicketProgress[] = Array.from({ length: totalTickets }, (_, i) => ({
      index: i,
      status: 'pending'
    }))
    setProgress(initialProgress)
    setCurrentIndex(0)
    setCompletedCount(0)
    setErrorCount(0)
  }

  const formatNumber = (num: number, format: string): string => {
    switch (format) {
      case '001':
        return num.toString().padStart(3, '0')
      case '0001':
        return num.toString().padStart(4, '0')
      case '1':
        return num.toString()
      default:
        return num.toString().padStart(3, '0')
    }
  }

  const generateTicket = async (ticketIndex: number): Promise<string> => {
    const canvas = document.createElement('canvas')
    canvas.width = exportSettings.ticketWidth
    canvas.height = exportSettings.ticketHeight
    const ctx = canvas.getContext('2d')!

    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageSrc
    })

    // Draw the background image
    ctx.drawImage(img, 0, 0, exportSettings.ticketWidth, exportSettings.ticketHeight)

    // Draw the number
    ctx.fillStyle = exportSettings.fontColor
    ctx.font = `bold ${exportSettings.fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const ticketNumber = exportSettings.startNumber + ticketIndex
    const formattedNumber = formatNumber(ticketNumber, exportSettings.numberFormat)
    ctx.fillText(formattedNumber, position.x, position.y)

    // Convert to data URL
    return canvas.toDataURL('image/png', 0.98)
  }

  const startGeneration = async () => {
    setIsGenerating(true)

    const dataUrls: string[] = []

    for (let i = 0; i < totalTickets; i++) {
      setCurrentIndex(i)

      // Update progress to generating
      setProgress(prev => prev.map(p =>
        p.index === i ? { ...p, status: 'generating' } : p
      ))

      try {
        const dataUrl = await generateTicket(i)
        dataUrls.push(dataUrl)

        // Update progress to completed
        setProgress(prev => prev.map(p =>
          p.index === i ? { ...p, status: 'completed', dataUrl } : p
        ))

        setCompletedCount(prev => prev + 1)
        onTicketGenerated?.(i, dataUrl)

        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 10))

      } catch (error) {
        console.error(`Failed to generate ticket ${i + 1}:`, error)

        // Update progress to error
        setProgress(prev => prev.map(p =>
          p.index === i ? {
            ...p,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          } : p
        ))

        setErrorCount(prev => prev + 1)
        onError?.(error instanceof Error ? error : new Error('Unknown error'))
      }
    }

    setIsGenerating(false)

    if (completedCount + errorCount === totalTickets) {
      onComplete?.(dataUrls)
    }
  }

  const retryTicket = async (ticketIndex: number) => {
    setProgress(prev => prev.map(p =>
      p.index === ticketIndex ? { ...p, status: 'generating', error: undefined } : p
    ))

    try {
      const dataUrl = await generateTicket(ticketIndex)

      setProgress(prev => prev.map(p =>
        p.index === ticketIndex ? { ...p, status: 'completed', dataUrl, error: undefined } : p
      ))

      setCompletedCount(prev => prev + 1)
      setErrorCount(prev => Math.max(0, prev - 1))
      onTicketGenerated?.(ticketIndex, dataUrl)

    } catch (error) {
      console.error(`Failed to retry ticket ${ticketIndex + 1}:`, error)

      setProgress(prev => prev.map(p =>
        p.index === ticketIndex ? {
          ...p,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : p
      ))
    }
  }

  const progressPercentage = totalTickets > 0 ? ((completedCount + errorCount) / totalTickets) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="p-6">
            <h3 className="text-center text-lg font-bold text-gray-900 mb-4">
              Generating Tickets
            </h3>

            {/* Overall Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{completedCount + errorCount} / {totalTickets}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{completedCount} completed</span>
                <span>{errorCount} errors</span>
              </div>
            </div>

            {/* Current Status */}
            {isGenerating && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  Generating ticket #{exportSettings.startNumber + currentIndex}...
                </div>
              </div>
            )}

            {/* Ticket List */}
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {progress.map((ticket) => (
                  <div key={ticket.index} className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-3">
                        #{formatNumber(exportSettings.startNumber + ticket.index, exportSettings.numberFormat)}
                      </span>
                      {ticket.status === 'pending' && (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                      {ticket.status === 'generating' && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-2"></div>
                          <span className="text-xs text-gray-600">Generating...</span>
                        </div>
                      )}
                      {ticket.status === 'completed' && (
                        <span className="text-xs text-green-600">✓ Completed</span>
                      )}
                      {ticket.status === 'error' && (
                        <div className="flex items-center">
                          <span className="text-xs text-red-600 mr-2">✗ Failed</span>
                          <button
                            onClick={() => retryTicket(ticket.index)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                    {ticket.error && (
                      <div className="text-xs text-red-600 max-w-32 truncate" title={ticket.error}>
                        {ticket.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              {!isGenerating && (
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}