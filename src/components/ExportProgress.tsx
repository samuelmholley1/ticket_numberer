'use client'

import { useState, useEffect } from 'react'
import { renderTicketToDataUrl, formatTicketNumber } from '@/lib/ticketRenderer'

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
    fx: number
    fy: number
    fontSize: number
    fontColor: string
    fontFamily: string
    exportFormat: 'zip' | 'pdf' | 'individual'
  }
  imageSrc: string
  imageDimensions: { width: number; height: number } | null
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
  imageDimensions
}: ExportProgressProps) {
  const [progress, setProgress] = useState<TicketProgress[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [isCancelled, setIsCancelled] = useState(false)

  useEffect(() => {
    if (isOpen && totalTickets > 0) {
      initializeProgress()
      startGeneration()
    }
    return () => {
      setIsCancelled(true)
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
    setIsCancelled(false)
  }

  const generateTicket = async (ticketIndex: number, retryCount = 0): Promise<string> => {
    if (isCancelled) throw new Error('Generation cancelled')

    const ticketNumber = exportSettings.startNumber + ticketIndex
    
    // Get actual image dimensions
    const imgWidth = imageDimensions?.width || exportSettings.ticketWidth
    const imgHeight = imageDimensions?.height || exportSettings.ticketHeight

    try {
      // Use the unified ticket renderer
      return await renderTicketToDataUrl(imageSrc, ticketNumber, {
        width: imgWidth,
        height: imgHeight,
        fx: exportSettings.fx,
        fy: exportSettings.fy,
        fontSize: exportSettings.fontSize,
        fontColor: exportSettings.fontColor,
        fontFamily: exportSettings.fontFamily,
        numberFormat: exportSettings.numberFormat,
        startNumber: exportSettings.startNumber
      })
    } catch (error) {
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          throw new Error('Image loading failed due to CORS policy. Try uploading the image directly instead of using a URL.')
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error while loading image. Check your internet connection and try again.')
        }
        if (error.message.includes('memory') || error.message.includes('out of memory')) {
          throw new Error('Out of memory. Try reducing the image size or font size.')
        }
        if (error.message.includes('canvas') || error.message.includes('context')) {
          throw new Error('Canvas rendering failed. This might be due to very large images. Try a smaller image.')
        }
      }
      
      // Re-throw with more context
      throw new Error(`Failed to generate ticket #${ticketNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const processBatch = async (startIndex: number, batchSize: number): Promise<void> => {
    const endIndex = Math.min(startIndex + batchSize, totalTickets)
    const batchPromises: Promise<void>[] = []

    for (let i = startIndex; i < endIndex; i++) {
      if (isCancelled) return

      const promise = (async () => {
        setCurrentIndex(i)

        // Update progress to generating
        setProgress(prev => prev.map(p =>
          p.index === i ? { ...p, status: 'generating' } : p
        ))

        try {
          const dataUrl = await generateTicket(i)

          // Update progress to completed
          setProgress(prev => prev.map(p =>
            p.index === i ? { ...p, status: 'completed', dataUrl } : p
          ))

          setCompletedCount(prev => prev + 1)
          onTicketGenerated?.(i, dataUrl)

        } catch (error) {
          if (isCancelled) return

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
      })()

      batchPromises.push(promise)
    }

    // Wait for all tickets in this batch to complete
    await Promise.all(batchPromises)

    // Yield control back to the browser to prevent UI freezing
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  const startGeneration = async () => {
    setIsGenerating(true)

    try {
      // Process tickets in batches of 5 to prevent UI blocking
      const batchSize = 5
      for (let batchStart = 0; batchStart < totalTickets; batchStart += batchSize) {
        if (isCancelled) break
        await processBatch(batchStart, batchSize)
      }

      if (!isCancelled) {
        setIsGenerating(false)

        // Collect all successfully generated tickets
        const dataUrls: string[] = progress
          .filter(p => p.status === 'completed' && p.dataUrl)
          .map(p => p.dataUrl!)
          .sort((a, b) => {
            const indexA = progress.findIndex(p => p.dataUrl === a)
            const indexB = progress.findIndex(p => p.dataUrl === b)
            return indexA - indexB
          })

        console.log('Generation complete. Total tickets:', dataUrls.length, 'Errors:', errorCount)
        if (dataUrls.length > 0) {
          console.log('Calling onComplete with', dataUrls.length, 'dataUrls')
          onComplete?.(dataUrls)
        }
      }
    } catch (error) {
      console.error('Batch generation failed:', error)
      setIsGenerating(false)
    }
  }

  const handleCancel = () => {
    setIsCancelled(true)
    setIsGenerating(false)
    onClose()
  }

  const retryTicket = async (ticketIndex: number, retryCount = 0) => {
    if (isCancelled) return

    setProgress(prev => prev.map(p =>
      p.index === ticketIndex ? { ...p, status: 'generating', error: undefined } : p
    ))

    try {
      const dataUrl = await generateTicket(ticketIndex, retryCount)

      setProgress(prev => prev.map(p =>
        p.index === ticketIndex ? { ...p, status: 'completed', dataUrl, error: undefined } : p
      ))

      setCompletedCount(prev => prev + 1)
      setErrorCount(prev => Math.max(0, prev - 1))
      onTicketGenerated?.(ticketIndex, dataUrl)

    } catch (error) {
      console.error(`Failed to retry ticket ${ticketIndex + 1}:`, error)

      // If this is the first retry and it's a recoverable error, try once more with delay
      if (retryCount === 0 && !(error instanceof Error && error.message.includes('cancelled'))) {
        console.log(`Retrying ticket ${ticketIndex + 1} in 2 seconds...`)
        setTimeout(() => retryTicket(ticketIndex, 1), 2000)
        return
      }

      setProgress(prev => prev.map(p =>
        p.index === ticketIndex ? {
          ...p,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : p
      ))
    }
  }

  const retryAllFailed = () => {
    const failedTickets = progress.filter(p => p.status === 'error')
    failedTickets.forEach(ticket => {
      retryTicket(ticket.index)
    })
  }

  const progressPercentage = totalTickets > 0 ? ((completedCount + errorCount) / totalTickets) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={isGenerating ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-progress-title"
          aria-describedby="export-progress-description"
        >
          <div className="p-6">
            {/* Title */}
            <h3
              id="export-progress-title"
              className="text-center text-lg font-bold text-gray-900 mb-4"
            >
              Generating Tickets
            </h3>

            {/* Description */}
            <p
              id="export-progress-description"
              className="sr-only"
            >
              Progress dialog showing the generation of numbered tickets. {completedCount} completed, {errorCount} failed, {totalTickets - completedCount - errorCount} remaining.
            </p>

            {/* Overall Progress */}
            <div className="mb-6" role="region" aria-labelledby="progress-heading">
              <h4 id="progress-heading" className="sr-only">Generation Progress</h4>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span aria-live="polite" aria-atomic="true">
                  {completedCount + errorCount} of {totalTickets} tickets processed
                </span>
              </div>
              <div
                className="w-full bg-gray-200 rounded-full h-2"
                role="progressbar"
                aria-valuenow={Math.round(progressPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Generation progress: ${Math.round(progressPercentage)}% complete`}
              >
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span aria-live="polite">{completedCount} completed</span>
                <span aria-live="polite">{errorCount} errors</span>
              </div>
            </div>

            {/* Current Status */}
            {isGenerating && (
              <div className="text-center mb-4" aria-live="polite" aria-atomic="true">
                <div className="inline-flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2" aria-hidden="true"></div>
                  Generating ticket #{exportSettings.startNumber + currentIndex}...
                </div>
              </div>
            )}

            {/* Ticket List */}
            <div
              className="max-h-60 overflow-y-auto border rounded-lg"
              role="region"
              aria-labelledby="ticket-list-heading"
              aria-live="polite"
              aria-atomic="false"
            >
              <h4 id="ticket-list-heading" className="sr-only">Ticket Generation Status</h4>
              <div className="divide-y">
                {progress.map((ticket) => (
                  <div key={ticket.index} className="p-3 flex items-center justify-between" role="listitem">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-3">
                        #{formatTicketNumber(exportSettings.startNumber + ticket.index, exportSettings.numberFormat)}
                      </span>
                      {ticket.status === 'pending' && (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                      {ticket.status === 'generating' && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-2" aria-hidden="true"></div>
                          <span className="text-xs text-gray-600">Generating...</span>
                        </div>
                      )}
                      {ticket.status === 'completed' && (
                        <span className="text-xs text-green-600" aria-label="Completed">✓ Completed</span>
                      )}
                      {ticket.status === 'error' && (
                        <div className="flex items-center">
                          <span className="text-xs text-red-600 mr-2" aria-label="Failed">✗ Failed</span>
                          <button
                            onClick={() => retryTicket(ticket.index)}
                            className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label={`Retry generating ticket #${formatTicketNumber(exportSettings.startNumber + ticket.index, exportSettings.numberFormat)}`}
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                    {ticket.error && (
                      <div
                        className="text-xs text-red-600 max-w-32 truncate"
                        title={ticket.error}
                        role="alert"
                        aria-live="assertive"
                      >
                        {ticket.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {!isGenerating && errorCount > 0 && (
                <button
                  onClick={retryAllFailed}
                  className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  aria-describedby="retry-all-help"
                >
                  Retry All Failed ({errorCount})
                </button>
              )}
              {!isGenerating && errorCount > 0 && (
                <div id="retry-all-help" className="sr-only">
                  Retry generating all tickets that failed during the previous attempt
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-describedby="cancel-progress-help"
                >
                  {isGenerating ? 'Cancel' : 'Close'}
                </button>
                <div id="cancel-progress-help" className="sr-only">
                  {isGenerating ? 'Stop the current ticket generation process' : 'Close this progress dialog'}
                </div>
                {!isGenerating && completedCount > 0 && (
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    aria-describedby="done-help"
                  >
                    Done
                  </button>
                )}
                {!isGenerating && completedCount > 0 && (
                  <div id="done-help" className="sr-only">
                    Close this dialog and proceed with the generated tickets
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}