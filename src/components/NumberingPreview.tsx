'use client'

import { useState, useEffect, useRef } from 'react'
import { renderTicketToDataUrl, formatTicketNumber } from '@/lib/ticketRenderer'
import { toast } from '@/components/Toast'

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
  const [isEditingLocation, setIsEditingLocation] = useState(false) // Default to saved/preview mode
  const [imageHeight, setImageHeight] = useState<number>(400)
  const [imageTop, setImageTop] = useState<number>(0)
  const previewImageRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  
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
    exportFormat: 'pdf'
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

  // Match slider height to actual rendered image height
  useEffect(() => {
    const updateImageDimensions = () => {
      if (!previewImageRef.current || !previewContainerRef.current) return
      const img = previewImageRef.current.querySelector('img')
      if (img) {
        const rect = img.getBoundingClientRect()
        const containerRect = previewContainerRef.current.getBoundingClientRect()
        setImageHeight(Math.max(100, Math.round(rect.height)))
        // Calculate offset from the flex container (items-start reference point)
        setImageTop(Math.round(rect.top - containerRect.top))
      }
    }
    
    if (isOpen && previewDataUrl) {
      // Wait for image to render
      setTimeout(updateImageDimensions, 100)
      
      // Set up observer for dynamic updates
      const observer = new ResizeObserver(updateImageDimensions)
      if (previewImageRef.current) {
        observer.observe(previewImageRef.current)
      }
      
      window.addEventListener('resize', updateImageDimensions)
      
      return () => {
        observer.disconnect()
        window.removeEventListener('resize', updateImageDimensions)
      }
    }
  }, [isOpen, previewDataUrl])

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
    if (!isDragging || !isEditingLocation || !previewImageRef.current) return
    
    const rect = previewImageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Clamp to bounds
    const fx = Math.max(0, Math.min(1, x / rect.width))
    const fy = Math.max(0, Math.min(1, y / rect.height))
    
    // Update temporary drag position for live preview
    setDragPosition({ fx, fy })
  }

  const handleMouseUp = () => {
    if (isDragging && isEditingLocation && dragPosition) {
      // Apply the final drag position to settings
      setSettings(prev => ({ ...prev, fx: dragPosition.fx, fy: dragPosition.fy }))
      setDragPosition(null)
    }
    setIsDragging(false)
  }
  
  // Calculate smart hint text position to avoid cutoff
  const getHintPosition = (fx: number, fy: number) => {
    // Default: right of text box
    let translateX = '20px'
    let translateY = '-50%'
    
    // If too far right (> 70%), position to the left
    if (fx > 0.7) {
      translateX = 'calc(-100% - 20px)'
    }
    
    // If too close to top (< 15%), position below
    if (fy < 0.15) {
      translateY = '20px'
    }
    // If too close to bottom (> 85%), position above
    else if (fy > 0.85) {
      translateY = 'calc(-100% - 20px)'
    }
    
    return { translateX, translateY }
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
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          aria-describedby="preview-description"
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

            {/* Description */}
            <p
              id="preview-description"
              className="text-center text-sm text-gray-600"
            >
              You&apos;re about to generate {ticketCount} numbered tickets. Here&apos;s a preview of ticket #{formatTicketNumber(settings.startNumber, settings.numberFormat)}.
            </p>

            <div className="mt-6 space-y-4">
              {/* Preview Image with Position Controls */}
              <div ref={previewContainerRef} className="flex gap-4 items-start">
                {/* Y-axis slider on the left - aligned with image */}
                <div className="flex flex-col items-center gap-2" style={{ marginTop: `${imageTop}px` }}>
                  <input
                    id="position-y-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={1 - settings.fy} // Invert for correct orientation (0 at top, 1 at bottom)
                    onChange={(e) => setSettings(prev => ({ ...prev, fy: 1 - parseFloat(e.target.value) }))}
                    className="cursor-pointer"
                    style={{ WebkitAppearance: 'slider-vertical' as any, width: '20px', height: `${imageHeight}px` }}
                    disabled={!isEditingLocation}
                    aria-label="Vertical position of ticket number"
                    aria-describedby="position-y-help"
                  />
                  <span className="text-xs font-medium text-gray-700 mt-1">Position Y</span>
                  <div className="flex items-center gap-0.5">
                    <input
                      id="position-y-input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={Math.round(settings.fy * 100)}
                      onChange={(e) => setSettings(prev => ({ ...prev, fy: parseFloat(e.target.value) / 100 }))}
                      className="w-10 text-xs text-center border border-gray-300 rounded px-1 py-0.5"
                      disabled={!isEditingLocation}
                      aria-label="Vertical position percentage"
                      aria-describedby="position-y-help"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <div id="position-y-help" className="sr-only">
                    Adjust the vertical position of the ticket number on the template
                  </div>
                </div>

                {/* Preview image with click/drag positioning */}
                <div className="flex-1">
                  {/* Edit/Save Location Button - moved above ticket */}
                  <div className="mb-4 flex justify-center">
                    <button
                      onClick={() => setIsEditingLocation(!isEditingLocation)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      aria-pressed={isEditingLocation}
                      aria-describedby="edit-location-help"
                    >
                      {isEditingLocation ? 'Save Number Location' : 'Edit Number Location'}
                    </button>
                    <div id="edit-location-help" className="sr-only">
                      Toggle between editing and saving the position of the ticket number on the template
                    </div>
                  </div>
                  
                  <div 
                    ref={previewImageRef}
                    className="border rounded-lg bg-gray-50 flex items-center justify-center relative"
                    style={{ cursor: isEditingLocation ? 'crosshair' : 'default' }}
                    onClick={isEditingLocation ? handlePreviewClick : undefined}
                    onMouseDown={isEditingLocation ? () => setIsDragging(true) : undefined}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handlePreviewDrag}
                    role={isEditingLocation ? "button" : "img"}
                    tabIndex={isEditingLocation ? 0 : -1}
                    aria-label={isEditingLocation ? "Click to position ticket number on template" : "Ticket preview"}
                    aria-describedby={isEditingLocation ? "preview-position-help" : undefined}
                    onKeyDown={(e) => {
                      if (!isEditingLocation) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        // Simulate click at center for keyboard users
                        const rect = previewImageRef.current?.getBoundingClientRect()
                        if (rect) {
                          const fakeEvent = {
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2
                          } as React.MouseEvent<HTMLDivElement>
                          handlePreviewClick(fakeEvent)
                        }
                      }
                    }}
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Generating preview...</span>
                      </div>
                    ) : previewDataUrl ? (
                      <>
                        {/* Show base image in edit mode, rendered preview in saved mode */}
                        <img
                          src={isEditingLocation ? imageSrc : previewDataUrl}
                          alt="Ticket preview"
                          className="w-full h-auto object-contain pointer-events-none"
                          style={{ 
                            maxHeight: '60vh',
                            opacity: 1,
                            filter: 'none'
                          }}
                        />
                        
                        {/* Dynamic number overlay - visible in edit mode (both when idle and dragging) */}
                        {isEditingLocation && (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: `${(dragPosition?.fx ?? settings.fx) * 100}%`,
                              top: `${(dragPosition?.fy ?? settings.fy) * 100}%`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 10
                            }}
                          >
                            <div 
                              className="font-bold text-gray-900 border-2 border-dashed border-blue-500 px-3 py-2 rounded bg-white bg-opacity-90"
                              style={{
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: settings.fontFamily,
                                color: settings.fontColor,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {formatTicketNumber(settings.startNumber, settings.numberFormat)}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        Failed to generate preview
                      </div>
                    )}
                  </div>
                  
                  {/* Help text for positioning */}
                  {isEditingLocation && (
                    <div id="preview-position-help" className="sr-only">
                      Click on the image to position the ticket number. Use the sliders below to fine-tune the position.
                    </div>
                  )}
                  
                  {/* X-axis slider below */}
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <input
                      id="position-x-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.fx}
                      onChange={(e) => setSettings(prev => ({ ...prev, fx: parseFloat(e.target.value) }))}
                      className="w-full cursor-pointer"
                      disabled={!isEditingLocation}
                      aria-label="Horizontal position of ticket number"
                      aria-describedby="position-x-help"
                    />
                    <div className="flex justify-between w-full text-xs text-gray-500">
                      <span></span>
                      <div className="flex items-center gap-1">
                        <span>Position X:</span>
                        <input
                          id="position-x-input"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={Math.round(settings.fx * 100)}
                          onChange={(e) => setSettings(prev => ({ ...prev, fx: parseFloat(e.target.value) / 100 }))}
                          className="w-10 text-xs text-center border border-gray-300 rounded px-1 py-0.5"
                          disabled={!isEditingLocation}
                          aria-label="Horizontal position percentage"
                          aria-describedby="position-x-help"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div id="position-x-help" className="sr-only">
                      Adjust the horizontal position of the ticket number on the template
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <fieldset className="grid grid-cols-2 gap-4">
                <legend className="sr-only">Ticket Numbering Settings</legend>

                <div>
                  <label 
                    htmlFor="start-number" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Number
                  </label>
                  <input
                    id="start-number"
                    type="number"
                    min="1"
                    max="999999"
                    value={settings.startNumber}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      if (value < 1) {
                        toast.warning('Start number must be at least 1')
                        return
                      }
                      if (value > 999999) {
                        toast.warning('Start number cannot exceed 999,999')
                        return
                      }
                      setSettings(prev => ({ ...prev, startNumber: value }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-describedby="start-number-help"
                  />
                  <div id="start-number-help" className="sr-only">
                    The number to start numbering tickets from
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="number-format" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Number Format
                  </label>
                  <select
                    id="number-format"
                    value={settings.numberFormat}
                    onChange={(e) => setSettings(prev => ({ ...prev, numberFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-describedby="number-format-help"
                  >
                    <option value="001">001, 002, 003...</option>
                    <option value="0001">0001, 0002, 0003...</option>
                    <option value="1">1, 2, 3...</option>
                  </select>
                  <div id="number-format-help" className="sr-only">
                    Choose the numbering format for your tickets
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="font-family" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Font Family
                  </label>
                  <select
                    id="font-family"
                    value={settings.fontFamily}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-describedby="font-family-help"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Impact">Impact</option>
                  </select>
                  <div id="font-family-help" className="sr-only">
                    Select the font family for ticket numbers
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="font-size" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Font Size
                  </label>
                  <input
                    id="font-size"
                    type="number"
                    min="12"
                    max="120"
                    value={settings.fontSize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 48
                      if (value < 12) {
                        toast.warning('Font size must be at least 12px')
                        return
                      }
                      if (value > 120) {
                        toast.warning('Font size cannot exceed 120px')
                        return
                      }
                      setSettings(prev => ({ ...prev, fontSize: value }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-describedby="font-size-help"
                  />
                  <div id="font-size-help" className="sr-only">
                    Font size in pixels, between 12 and 120
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="export-format" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Export Format
                  </label>
                  <select
                    id="export-format"
                    value={settings.exportFormat}
                    onChange={(e) => setSettings(prev => ({ ...prev, exportFormat: e.target.value as 'zip' | 'pdf' | 'individual' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-describedby="export-format-help"
                  >
                    <option value="zip">ZIP (All tickets in one file)</option>
                    <option value="pdf">PDFs (3-up US Letter, print-ready)</option>
                    <option value="individual">Individual PNGs (Download separately)</option>
                  </select>
                  <div id="export-format-help" className="sr-only">
                    Choose how to export your numbered tickets
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="font-color" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Font Color
                  </label>
                  <input
                    id="font-color"
                    type="color"
                    value={settings.fontColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-describedby="font-color-help"
                  />
                  <div id="font-color-help" className="sr-only">
                    Select the color for ticket numbers
                  </div>
                </div>
              </fieldset>

              {/* Summary */}
              <div className="bg-gray-50 p-3 rounded-lg" role="region" aria-labelledby="summary-heading">
                <h4 id="summary-heading" className="sr-only">Export Summary</h4>
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
                aria-describedby="cancel-help"
              >
                Cancel
              </button>
              <div id="cancel-help" className="sr-only">
                Close this dialog without generating tickets
              </div>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-describedby="confirm-help"
              >
                {settings.exportFormat === 'zip' && 'Generate ZIP'}
                {settings.exportFormat === 'pdf' && 'Generate PDFs'}
                {settings.exportFormat === 'individual' && 'Download Individual Files'}
              </button>
              <div id="confirm-help" className="sr-only">
                Generate and download the numbered tickets with current settings
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}