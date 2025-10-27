'use client'

import { useState, useCallback, useEffect } from 'react'
import { CanvaImport } from '@/components/CanvaImport'
import { NumberingPreview, ExportSettings } from '@/components/NumberingPreview'
import { ExportProgress } from '@/components/ExportProgress'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastContainer, toast } from '@/components/Toast'
import { createZipFromDataUrls } from '@/lib/zipExport'
import { exportTicketWithNumber } from '@/lib/zipExport'

export default function TicketBuilder() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [numberPosition, setNumberPosition] = useState({ x: 300, y: 750 }) // Center bottom
  const [count, setCount] = useState(3)
  const [numberFormat, setNumberFormat] = useState('001')
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(null)
  const [toasts, setToasts] = useState<any[]>([])

  // Subscribe to toast updates
  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts)
    return unsubscribe
  }, [])

  const handleImageUpload = useCallback((file: File | null) => {
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setUploadedImage(null)
      setUploadedFile(null)
    }
  }, [])

  const handlePreviewConfirm = (settings: ExportSettings) => {
    setExportSettings(settings)
    setShowProgress(true)
  }

  const handleTicketGenerated = (index: number, dataUrl: string) => {
    // Could show individual progress updates if needed
  }

  const handleExportComplete = async (dataUrls: string[]) => {
    try {
      const images = dataUrls.map((dataUrl, index) => {
        const ticketNumber = exportSettings!.startNumber + index
        const formattedNumber = formatNumber(ticketNumber, exportSettings!.numberFormat)
        return {
          dataUrl,
          filename: `ticket_${formattedNumber}.png`
        }
      })

      await createZipFromDataUrls(images, 'numbered_tickets.zip')
      toast.success('Export Complete', 'Your numbered tickets have been downloaded successfully!')
    } catch (error) {
      console.error('ZIP creation failed:', error)
      toast.error('Export Failed', 'Failed to create ZIP file. Please try again.')
    } finally {
      setShowProgress(false)
      setExportSettings(null)
    }
  }

  const handleExportError = (error: Error) => {
    toast.error('Generation Error', error.message)
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

  const handleExport = () => {
    if (!uploadedImage) {
      toast.error('No Design', 'Please upload a Canva design first.')
      return
    }
    setShowPreview(true)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[840px] mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              🎫 Ticket Numberer
            </h1>
            <p className="text-gray-600">
              Upload your Canva design and add sequential numbering
            </p>
          </div>

          <CanvaImport
            onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            numberPosition={numberPosition}
            onPositionChange={setNumberPosition}
          />

          {uploadedImage && (
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold">Numbering Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Tickets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    disabled={isExporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number Format
                  </label>
                  <select
                    value={numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                    disabled={isExporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="001">001, 002, 003...</option>
                    <option value="0001">0001, 0002, 0003...</option>
                    <option value="1">1, 2, 3...</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || !uploadedImage}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isExporting ? 'Generating...' : `Generate ${count} Numbered Tickets`}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Preview: {Array.from({ length: Math.min(count, 5) }, (_, i) =>
                  formatNumber(i + 1, numberFormat)
                ).join(', ')}{count > 5 && `... +${count - 5} more`}
              </p>
            </div>
          )}

          {/* Preview Section */}
          {uploadedImage && (
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold">Position Preview</h3>
              <div className="text-sm text-gray-600">
                Click on the design above to position the ticket numbers. Here&apos;s how ticket #001 will look:
              </div>
              <div className="relative border rounded-lg overflow-hidden mx-auto max-w-xs">
                <img
                  src={uploadedImage}
                  alt="Ticket design"
                  className="w-full h-auto"
                />
                <div
                  className="absolute text-4xl font-bold text-black bg-white bg-opacity-80 px-2 py-1 rounded pointer-events-none"
                  style={{
                    left: numberPosition.x,
                    top: numberPosition.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  001
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                600×1500px (2″×5″ @ 300 DPI) • Position: ({numberPosition.x}, {numberPosition.y})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NumberingPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handlePreviewConfirm}
        imageSrc={uploadedImage || ''}
        position={numberPosition}
        ticketCount={count}
        numberFormat={numberFormat}
      />

      {exportSettings && (
        <ExportProgress
          isOpen={showProgress}
          onClose={() => {
            setShowProgress(false)
            setExportSettings(null)
          }}
          totalTickets={count}
          onTicketGenerated={handleTicketGenerated}
          onComplete={handleExportComplete}
          onError={handleExportError}
          exportSettings={exportSettings}
          imageSrc={uploadedImage || ''}
          position={numberPosition}
        />
      )}

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => toast.remove(id)}
      />
    </ErrorBoundary>
  )
}
