'use client'

import { useState, useRef, useCallback } from 'react'
import TicketTemplate from '@/components/TicketTemplate'
import TicketControls from '@/components/TicketControls'
import BatchExportProgress from '@/components/BatchExportProgress'
import { TicketData, ExportConfig, ExportProgress, BatchExportResult } from '@/types/ticket'
import { generateSequence, validateSequence } from '@/lib/sequence'
import { exportTicketAsImage, downloadDataUrl, createFilename } from '@/lib/exportTicket'
import { createZipFromDataUrls } from '@/lib/zipExport'
import { exportTicketAsPDF, createMultiPagePDF } from '@/lib/pdfExport'

export default function TicketBuilder() {
  const [ticketData, setTicketData] = useState<TicketData>({
    id: 'preview',
    number: '001',
    title: 'Sample Event',
    subtitle: 'Date & Time',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#3b82f6',
    customFields: {
      date: 'December 25, 2024',
      time: '7:00 PM',
      venue: 'Main Hall'
    }
  })

  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    status: 'idle'
  })

  const [showProgress, setShowProgress] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const ticketRef = useRef<HTMLDivElement>(null)

  const handleTicketUpdate = useCallback((updates: Partial<TicketData>) => {
    setTicketData(prev => ({ ...prev, ...updates }))
  }, [])

  const handleExport = async (config: ExportConfig) => {
    const { sequence, options } = config

    // Validate sequence
    const validation = validateSequence(sequence)
    if (!validation.valid) {
      setExportProgress({
        current: 0,
        total: 0,
        status: 'error',
        error: validation.error
      })
      setShowProgress(true)
      return
    }

    // Generate ticket numbers
    const ticketNumbers = generateSequence(sequence)
    const total = ticketNumbers.length

    setExportProgress({
      current: 0,
      total,
      status: 'exporting',
      message: 'Starting export...'
    })
    setShowProgress(true)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const exportedData: Array<{ dataUrl: string; filename: string }> = []

      for (let i = 0; i < ticketNumbers.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Export cancelled')
        }

        const number = ticketNumbers[i]
        const currentTicketData: TicketData = {
          ...ticketData,
          id: `ticket-${number}`,
          number
        }

        setExportProgress(prev => ({
          ...prev,
          current: i + 1,
          message: `Exporting ticket ${number}...`
        }))

        // Update the preview ticket temporarily for export
        setTicketData(currentTicketData)

        // Wait for DOM update
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!ticketRef.current) {
          throw new Error('Ticket template not found')
        }

        let dataUrl: string
        let filename: string

        if (options.format === 'pdf') {
          // Export as image first, then convert to PDF
          const imageDataUrl = await exportTicketAsImage(ticketRef.current, currentTicketData, {
            ...options,
            format: 'png' // Always use PNG for PDF conversion
          })

          const pdfBlob = await exportTicketAsPDF(imageDataUrl, currentTicketData)
          dataUrl = URL.createObjectURL(pdfBlob)
          filename = createFilename(currentTicketData, 'pdf')
        } else {
          // Export as image
          dataUrl = await exportTicketAsImage(ticketRef.current, currentTicketData, options)
          filename = createFilename(currentTicketData, options.format)
        }

        exportedData.push({ dataUrl, filename })
      }

      // Reset to preview
      setTicketData(prev => ({ ...prev, number: '001' }))

      setExportProgress(prev => ({
        ...prev,
        status: 'zipping',
        message: 'Creating download file...'
      }))

      if (options.includeZip || exportedData.length > 1) {
        // Create ZIP file
        await createZipFromDataUrls(exportedData, `tickets_${Date.now()}.zip`)
      } else {
        // Download single file
        const { dataUrl, filename } = exportedData[0]
        downloadDataUrl(dataUrl, filename)
      }

      setExportProgress(prev => ({
        ...prev,
        status: 'complete',
        message: `Successfully exported ${total} ticket${total !== 1 ? 's' : ''}!`
      }))

    } catch (error) {
      console.error('Export error:', error)
      setExportProgress(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown export error'
      }))
    }
  }

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setExportProgress(prev => ({
      ...prev,
      status: 'idle',
      message: 'Export cancelled'
    }))
    setShowProgress(false)
  }

  const handleCloseProgress = () => {
    setShowProgress(false)
    setExportProgress({
      current: 0,
      total: 0,
      status: 'idle'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">🎫 WYSIWYG Ticket Builder</h1>
            <div className="text-sm text-gray-600">
              600×1500px artboard • 2″×5″ @ 300 DPI
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
            <div className="flex justify-center">
              <div className="transform scale-75 origin-top">
                <div ref={ticketRef}>
                  <TicketTemplate
                    ticketData={ticketData}
                    onUpdate={handleTicketUpdate}
                    isPreview={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Template Editor */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Editor</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={ticketData.title || ''}
                    onChange={(e) => handleTicketUpdate({ title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={ticketData.subtitle || ''}
                    onChange={(e) => handleTicketUpdate({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter subtitle"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background
                    </label>
                    <input
                      type="color"
                      value={ticketData.backgroundColor}
                      onChange={(e) => handleTicketUpdate({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text
                    </label>
                    <input
                      type="color"
                      value={ticketData.textColor}
                      onChange={(e) => handleTicketUpdate({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accent
                    </label>
                    <input
                      type="color"
                      value={ticketData.accentColor}
                      onChange={(e) => handleTicketUpdate({ accentColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Export Controls */}
            <TicketControls
              onExport={handleExport}
              isExporting={exportProgress.status === 'exporting' || exportProgress.status === 'zipping'}
            />
          </div>
        </div>
      </div>

      {/* Export Progress Modal */}
      <BatchExportProgress
        progress={exportProgress}
        onCancel={handleCancelExport}
        isOpen={showProgress}
        onClose={handleCloseProgress}
      />
    </div>
  )
}
