'use client'

import { useState, useEffect, useRef } from 'react'
import { renderTicketToDataUrl, formatTicketNumber } from '@/lib/ticketRenderer'

interface NumberingPreviewProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (settings: ExportSettings) => void
  imageSrc: string
  imageDimensions: { width: number; height: number } | null
  position: { fx: number; fy: number }
  ticketCount: number
  numberFormat: string
}

export interface ExportSettings {
  startNumber: number
  numberFormat: string
  ticketWidth: number
  ticketHeight: number
  fx: number // Normalized x position
  fy: number // Normalized y position
  fontSize: number
  fontColor: string
  fontFamily: string
  exportFormat: 'zip' | 'pdf' | 'individual'
  backgroundColor?: string
}

export function NumberingPreview({
  isOpen,
  onClose,
  onConfirm,
  imageSrc,
  imageDimensions,
  position,
  ticketCount,
  numberFormat
}: NumberingPreviewProps) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Get actual image dimensions or use defaults
  const imgWidth = imageDimensions?.width || 600
  const imgHeight = imageDimensions?.height || 1500
  
  const [settings, setSettings] = useState<ExportSettings>({
    startNumber: 1,
    numberFormat,
    ticketWidth: imgWidth,
    ticketHeight: imgHeight,
    fx: position.fx,
    fy: position.fy,
    fontSize: 48,
    fontColor: '#000000',
    fontFamily: 'Arial',
    exportFormat: 'zip'
  })

  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Update settings when image dimensions change
  useEffect(() => {
    if (imageDimensions) {
      setSettings(prev => ({
        ...prev,
        ticketWidth: imageDimensions.width,
        ticketHeight: imageDimensions.height
      }))
    }
  }, [imageDimensions])

  // Update settings when position changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      fx: position.fx,
      fy: position.fy
    }))
  }, [position])

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement
      setTimeout(() => modalRef.current?.focus(), 100)
    } else {
      // Restore focus when closing
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && imageSrc) {
      generatePreview()
    }
  }, [isOpen, imageSrc, position, settings])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const generatePreview = async () => {
    setIsGenerating(true)
    try {
      // Use the unified ticket renderer
      const dataUrl = await renderTicketToDataUrl(imageSrc, settings.startNumber, {
        width: imgWidth,
        height: imgHeight,
        fx: settings.fx,
        fy: settings.fy,
        fontSize: settings.fontSize,
        fontColor: settings.fontColor,
        fontFamily: settings.fontFamily,
        numberFormat: settings.numberFormat,
        startNumber: settings.startNumber
      })
      
      setPreviewDataUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(settings)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          tabIndex={-1}
          className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all focus:outline-none"
        >
          <div className="p-6">
            {/* Title */}
            <h3
              id="preview-title"
              className="text-center text-2xl font-bold text-gray-900 mb-2"
            >
              Preview Numbered Tickets
            </h3>

            {/* Message */}
            <p className="text-center text-sm text-gray-600">
              You&apos;re about to generate {ticketCount} numbered tickets. Here&apos;s a preview of ticket #{formatTicketNumber(settings.startNumber, settings.numberFormat)}.
            </p>

            <div className="mt-6 space-y-4">
              {/* Preview Image */}
              <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Generating preview...</span>
                  </div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Ticket preview"
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '60vh' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Failed to generate preview
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.startNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number Format
                  </label>
                  <select
                    value={settings.numberFormat}
                    onChange={(e) => setSettings(prev => ({ ...prev, numberFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="001">001, 002, 003...</option>
                    <option value="0001">0001, 0002, 0003...</option>
                    <option value="1">1, 2, 3...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="120"
                    value={settings.fontSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 48 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export Format
                  </label>
                  <select
                    value={settings.exportFormat}
                    onChange={(e) => setSettings(prev => ({ ...prev, exportFormat: e.target.value as 'zip' | 'pdf' | 'individual' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="zip">ZIP (All tickets in one file)</option>
                    <option value="pdf">PDF (3-up US Letter, print-ready)</option>
                    <option value="individual">Individual PNGs (Download separately)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X ({Math.round(settings.fx * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.fx}
                    onChange={(e) => setSettings(prev => ({ ...prev, fx: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y ({Math.round(settings.fy * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.fy}
                    onChange={(e) => setSettings(prev => ({ ...prev, fy: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div>Tickets to generate: {ticketCount}</div>
                  <div>Number range: {formatTicketNumber(settings.startNumber, settings.numberFormat)} - {formatTicketNumber(settings.startNumber + ticketCount - 1, settings.numberFormat)}</div>
                  <div>Estimated ZIP size: ~{Math.round((ticketCount * 150) / 1024)}MB</div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {settings.exportFormat === 'zip' && 'Generate ZIP'}
                {settings.exportFormat === 'pdf' && 'Generate PDF'}
                {settings.exportFormat === 'individual' && 'Download Individual Files'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}