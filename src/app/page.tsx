'use client'

import { useState, useCallback } from 'react'
import { CanvaImport } from '@/components/CanvaImport'
import { createZipFromDataUrls } from '@/lib/zipExport'
import { exportTicketWithNumber } from '@/lib/zipExport'

export default function TicketBuilder() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [numberPosition, setNumberPosition] = useState({ x: 300, y: 750 }) // Center bottom
  const [count, setCount] = useState(3)
  const [prefix, setPrefix] = useState('')
  const [padding, setPadding] = useState(3)
  const [isExporting, setIsExporting] = useState(false)

  const handleImageUpload = useCallback((file: File | null) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setUploadedImage(null)
    }
  }, [])

  const handleExport = async () => {
    if (!uploadedImage) return

    setIsExporting(true)

    try {
      const images: { dataUrl: string; filename: string }[] = []

      for (let i = 1; i <= count; i++) {
        const number = String(i).padStart(padding, '0')
        const fullNumber = prefix + number

        const dataUrl = await exportTicketWithNumber(
          uploadedImage,
          fullNumber,
          numberPosition
        )

        const filename = `ticket_${fullNumber}.png`
        images.push({ dataUrl, filename })
      }

      await createZipFromDataUrls(images, 'tickets.zip')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎫 Ticket Numberer
          </h1>
          <p className="text-gray-600">
            Upload your Canva design and add sequential numbering
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
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
                      Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Padding
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={padding}
                      onChange={(e) => setPadding(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefix (optional)
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g., A-, VIP-"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isExporting ? 'Exporting...' : `Export ${count} Tickets`}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  Will generate: {Array.from({ length: count }, (_, i) =>
                    `${prefix}${String(i + 1).padStart(padding, '0')}`
                  ).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Preview</h2>

            {uploadedImage ? (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-4">
                  Sample ticket with number 001
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
                <div className="text-xs text-gray-500 mt-2 text-center">
                  600×1500px (2″×5″ @ 300 DPI)
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <div className="text-6xl mb-4">🎫</div>
                <div>Upload a design to see preview</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
