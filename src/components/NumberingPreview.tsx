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
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<{ fx: number; fy: number } | null>(null)
  const [isEditingLocation, setIsEditingLocation] = useState(true)
  const previewImageRef = useRef<HTMLDivElement>(null)
  
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

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewImageRef.current) return
    
    const rect = previewImageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Convert to normalized coordinates
    const fx = x / rect.width
    const fy = y / rect.height
    
    setSettings(prev => ({ ...prev, fx, fy }))
  }

  const handlePreviewDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !previewImageRef.current) return
    
    const rect = previewImageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Clamp to bounds
    const fx = Math.max(0, Math.min(1, x / rect.width))
    const fy = Math.max(0, Math.min(1, y / rect.height))
    
    // Update temporary drag position without triggering preview regeneration
    setDragPosition({ fx, fy })
  }

  const handleMouseUp = () => {
    if (isDragging && dragPosition) {
      // Apply the final drag position to settings
      setSettings(prev => ({ ...prev, fx: dragPosition.fx, fy: dragPosition.fy }))
      setDragPosition(null)
    }
    setIsDragging(false)
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
              {/* Preview Image with Position Controls */}
              <div className="flex gap-4 items-start">
                {/* Y-axis slider on the left - aligned with image */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">Position Y</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={1 - settings.fy} // Invert for correct orientation (0 at top, 1 at bottom)
                    onChange={(e) => setSettings(prev => ({ ...prev, fy: 1 - parseFloat(e.target.value) }))}
                    className="cursor-pointer"
                    style={{ WebkitAppearance: 'slider-vertical' as any, width: '20px', height: '400px' }}
                  />
                  <span className="text-xs text-gray-500">{Math.round(settings.fy * 100)}%</span>
                </div>

                {/* Preview image with click/drag positioning */}
                <div className="flex-1">
                  <div 
                    ref={previewImageRef}
                    className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative cursor-crosshair"
                    onClick={handlePreviewClick}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handlePreviewDrag}
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Generating preview...</span>
                      </div>
                    ) : previewDataUrl ? (
                      <>
                        <img
                          src={previewDataUrl}
                          alt="Ticket preview"
                          className="w-full h-auto object-contain pointer-events-none"
                          style={{ maxHeight: '60vh' }}
                        />
                        {/* Position indicator - transparent text box with outline */}
                        {!isDragging && isEditingLocation && (
                          <div
                            className="absolute border-2 border-gray-600 rounded px-2 py-1 pointer-events-none flex items-center gap-2"
                            style={{
                              left: `${settings.fx * 100}%`,
                              top: `${settings.fy * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <span className="text-sm font-bold text-gray-800">
                              {formatTicketNumber(settings.startNumber, settings.numberFormat)}
                            </span>
                          </div>
                        )}
                        
                        {/* Cursor hint text next to text box */}
                        {!isDragging && isEditingLocation && (
                          <div
                            className="absolute bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs pointer-events-none"
                            style={{
                              left: `${settings.fx * 100}%`,
                              top: `${settings.fy * 100}%`,
                              transform: 'translate(20px, -50%)' // Position to the right of the text box
                            }}
                          >
                            Click here to adjust position
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        Failed to generate preview
                      </div>
                    )}
                  </div>
                  
                  {/* Edit/Save Location Button */}
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={() => setIsEditingLocation(!isEditingLocation)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      {isEditingLocation ? 'Save Location' : 'Edit Number Location'}
                    </button>
                  </div>
                  
                  {/* X-axis slider below */}
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.fx}
                      onChange={(e) => setSettings(prev => ({ ...prev, fx: parseFloat(e.target.value) }))}
                      className="w-full cursor-pointer"
                    />
                    <div className="flex justify-between w-full text-xs text-gray-500">
                      <span>Position X: {Math.round(settings.fx * 100)}%</span>
                    </div>
                  </div>
                </div>
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
                    Font Color
                  </label>
                  <input
                    type="color"
                    value={settings.fontColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
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