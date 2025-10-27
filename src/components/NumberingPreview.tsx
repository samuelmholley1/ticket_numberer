'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface NumberingPreviewProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (settings: ExportSettings) => void
  imageSrc: string
  position: { x: number; y: number }
  ticketCount: number
  numberFormat: string
}

export interface ExportSettings {
  startNumber: number
  numberFormat: string
  ticketWidth: number
  ticketHeight: number
  fontSize: number
  fontColor: string
  backgroundColor?: string
}

export function NumberingPreview({
  isOpen,
  onClose,
  onConfirm,
  imageSrc,
  position,
  ticketCount,
  numberFormat
}: NumberingPreviewProps) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [settings, setSettings] = useState<ExportSettings>({
    startNumber: 1,
    numberFormat,
    ticketWidth: 600,
    ticketHeight: 1500,
    fontSize: 48,
    fontColor: '#000000'
  })

  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

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
      const canvas = document.createElement('canvas')
      canvas.width = settings.ticketWidth
      canvas.height = settings.ticketHeight
      const ctx = canvas.getContext('2d')!

      const img = new window.Image()
      img.crossOrigin = 'anonymous'

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageSrc
      })

      // Draw the background image
      ctx.drawImage(img, 0, 0, settings.ticketWidth, settings.ticketHeight)

      // Draw the number
      ctx.fillStyle = settings.fontColor
      ctx.font = `bold ${settings.fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Format the preview number
      const previewNumber = formatNumber(settings.startNumber, settings.numberFormat)
      ctx.fillText(previewNumber, position.x, position.y)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.98)
      setPreviewDataUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      setIsGenerating(false)
    }
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
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all focus:outline-none"
        >
          <div className="p-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <Image
                src="/gather_logo.png"
                alt="Gather Kitchen"
                width={120}
                height={48}
                className="h-12 w-auto"
                priority
              />
            </div>

            {/* Title */}
            <h3
              id="preview-title"
              className="text-center text-lg font-bold text-gray-900"
            >
              Preview Numbered Tickets
            </h3>

            {/* Message */}
            <p className="mt-2 text-center text-sm text-gray-600">
              You're about to generate {ticketCount} numbered tickets. Here's a preview of ticket #{formatNumber(settings.startNumber, settings.numberFormat)}.
            </p>

            <div className="mt-6 space-y-4">
              {/* Preview Image */}
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Generating preview...</span>
                  </div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Ticket preview"
                    className="w-full h-auto max-h-64 object-contain"
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
                  <div>Number range: {formatNumber(settings.startNumber, settings.numberFormat)} - {formatNumber(settings.startNumber + ticketCount - 1, settings.numberFormat)}</div>
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
                Generate ZIP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}