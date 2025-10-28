'use client'

import { useState, useCallback, useEffect } from 'react'
import { CanvaImport } from '@/components/CanvaImport'
import { NumberingPreview, ExportSettings } from '@/components/NumberingPreview'
import { ExportProgress } from '@/components/ExportProgress'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastContainer, toast } from '@/components/Toast'
import { createZipFromDataUrls } from '@/lib/zipExport'
import { export3UpLetterPDF, export8UpLetterPDF, downloadPDF } from '@/lib/pdfExport'
import { exportTicketWithNumber } from '@/lib/zipExport'
import { renderTicketToDataUrl } from '@/lib/ticketRenderer'

export default function TicketBuilder() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  // Store normalized coordinates (0-1 range) - default to bottom-right for typical ticket numbering
  const [numberPosition, setNumberPosition] = useState<{ fx: number; fy: number }>({ fx: 0.95, fy: 0.94 })
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [count, setCount] = useState(3)
  const [numberFormat, setNumberFormat] = useState('001')

  // Generate preview when image or position changes
  useEffect(() => {
    if (uploadedImage && imageDimensions) {
      renderTicketToDataUrl(uploadedImage, 1, {
        width: imageDimensions.width,
        height: imageDimensions.height,
        fx: numberPosition.fx,
        fy: numberPosition.fy,
        fontSize: 48,
        fontColor: '#000000',
        fontFamily: 'Arial',
        numberFormat: '001',
        startNumber: 1
      })
        .then(setPreviewDataUrl)
        .catch(console.error)
    } else {
      setPreviewDataUrl(null)
    }
  }, [uploadedImage, imageDimensions, numberPosition])
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
        const dataUrl = e.target?.result as string
        setUploadedImage(dataUrl)
        
        // Load image to get natural dimensions
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
          console.log(`Image loaded: ${img.naturalWidth}×${img.naturalHeight}px`)
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    } else {
      setUploadedImage(null)
      setUploadedFile(null)
      setImageDimensions(null)
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
      console.log('Export complete, dataUrls length:', dataUrls.length)
      
      const images = dataUrls.map((dataUrl, index) => {
        const ticketNumber = exportSettings!.startNumber + index
        const formattedNumber = formatNumber(ticketNumber, exportSettings!.numberFormat)
        return {
          dataUrl,
          filename: `ticket_${formattedNumber}.png`
        }
      })

      console.log('Export format:', exportSettings!.exportFormat)

      if (exportSettings!.exportFormat === 'zip') {
        console.log('Creating ZIP with', images.length, 'images')
        await createZipFromDataUrls(images, 'numbered_tickets.zip')
        console.log('ZIP creation successful')
        toast.success('Export Complete', 'Your numbered tickets ZIP has been downloaded!')
      } else if (exportSettings!.exportFormat === 'pdf') {
        console.log('Creating PDF with', images.length, 'images')
        
        // Email-friendly batch size: max 50 tickets per PDF (~10-15MB depending on image complexity)
        const maxTicketsPerBatch = 50
        const needsBatching = dataUrls.length > maxTicketsPerBatch
        
        if (needsBatching) {
          // Create multiple smaller PDFs
          const batches = Math.ceil(dataUrls.length / maxTicketsPerBatch)
          console.log(`Batching into ${batches} separate PDFs (${maxTicketsPerBatch} tickets each)`)
          
          for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
            const startTicket = batchIndex * maxTicketsPerBatch
            const endTicket = Math.min(startTicket + maxTicketsPerBatch, dataUrls.length)
            const batchSize = endTicket - startTicket
            
            console.log(`Generating batch ${batchIndex + 1}/${batches}: tickets ${exportSettings!.startNumber + startTicket}-${exportSettings!.startNumber + endTicket - 1}`)
            
            const pdfBytes = await export3UpLetterPDF({
              imageSrc: uploadedImage!,
              totalTickets: batchSize,
              startNumber: exportSettings!.startNumber + startTicket,
              numberFormat: exportSettings!.numberFormat,
              width: imageDimensions!.width,
              height: imageDimensions!.height,
              fx: exportSettings!.fx,
              fy: exportSettings!.fy,
              fontSize: exportSettings!.fontSize,
              fontColor: exportSettings!.fontColor,
              fontFamily: exportSettings!.fontFamily
            })
            
            const filename = `tickets_${exportSettings!.startNumber + startTicket}-${exportSettings!.startNumber + endTicket - 1}_batch${batchIndex + 1}of${batches}.pdf`
            downloadPDF(pdfBytes, filename)
            
            // Small delay between downloads to prevent browser blocking
            if (batchIndex < batches - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
          
          toast.success('Export Complete', `${batches} PDF files downloaded (email-friendly batches of ${maxTicketsPerBatch} tickets each)`)
        } else {
          // Single PDF for smaller batches
          const pdfBytes = await export3UpLetterPDF({
            imageSrc: uploadedImage!,
            totalTickets: dataUrls.length,
            startNumber: exportSettings!.startNumber,
            numberFormat: exportSettings!.numberFormat,
            width: imageDimensions!.width,
            height: imageDimensions!.height,
            fx: exportSettings!.fx,
            fy: exportSettings!.fy,
            fontSize: exportSettings!.fontSize,
            fontColor: exportSettings!.fontColor,
            fontFamily: exportSettings!.fontFamily
          })
          downloadPDF(pdfBytes, `numbered_tickets_${exportSettings!.startNumber}-${exportSettings!.startNumber + dataUrls.length - 1}.pdf`)
          toast.success('Export Complete', 'Your numbered tickets PDF has been downloaded!')
        }
      } else if (exportSettings!.exportFormat === 'individual') {
        console.log('Downloading individual files')
        // Download each file individually with a small delay between downloads
        for (let i = 0; i < images.length; i++) {
          const { dataUrl, filename } = images[i]
          const response = await fetch(dataUrl)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          // Small delay to prevent browser blocking multiple downloads
          if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        toast.success('Export Complete', `${images.length} individual ticket files have been downloaded!`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export Failed', 'Failed to export files. Please try again.')
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
              Upload your Canva design (PNG @ 300 DPI) and add sequential numbering
            </p>
            <p className="text-sm text-gray-500 mt-1">
              💡 Export from Canva: Share → Download → PNG (Maximum Quality)
            </p>
          </div>

          <CanvaImport
            onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            imageDimensions={imageDimensions}
            numberPosition={numberPosition}
            onPositionChange={setNumberPosition}
            previewDataUrl={previewDataUrl}
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

          {/* Preview Section - REMOVED, now shown in CanvaImport */}
        </div>
      </div>

      {/* Modals */}
      <NumberingPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handlePreviewConfirm}
        imageSrc={uploadedImage || ''}
        imageDimensions={imageDimensions}
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
          imageDimensions={imageDimensions}
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
