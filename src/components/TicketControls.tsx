'use client'

import { useState } from 'react'
import { SequenceConfig, ExportOptions, ExportConfig } from '@/types/ticket'

interface TicketControlsProps {
  onExport: (config: ExportConfig) => void
  isExporting: boolean
}

export default function TicketControls({ onExport, isExporting }: TicketControlsProps) {
  const [sequence, setSequence] = useState<SequenceConfig>({
    start: 1,
    end: 10,
    step: 1,
    prefix: '',
    suffix: '',
    series: [],
    padding: 0
  })

  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1.0,
    pixelRatio: 3,
    includeZip: true
  })

  const handleSequenceChange = (field: keyof SequenceConfig, value: any) => {
    setSequence(prev => ({ ...prev, [field]: value }))
  }

  const handleOptionsChange = (field: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }))
  }

  const handleExport = () => {
    const config: ExportConfig = {
      sequence,
      options,
      template: {} // Template data will come from the main component
    }
    onExport(config)
  }

  const estimatedCount = sequence.series && sequence.series.length > 0
    ? sequence.series.length
    : Math.max(0, Math.floor((sequence.end - sequence.start) / sequence.step) + 1)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Batch Export Configuration</h2>

      {/* Numbering Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Ticket Numbering</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Number
            </label>
            <input
              type="number"
              value={sequence.start}
              onChange={(e) => handleSequenceChange('start', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Number
            </label>
            <input
              type="number"
              value={sequence.end}
              onChange={(e) => handleSequenceChange('end', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step
            </label>
            <input
              type="number"
              value={sequence.step}
              onChange={(e) => handleSequenceChange('step', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Padding (zeros)
            </label>
            <input
              type="number"
              value={sequence.padding}
              onChange={(e) => handleSequenceChange('padding', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={sequence.prefix}
              onChange={(e) => handleSequenceChange('prefix', e.target.value)}
              placeholder="e.g., TICKET-"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suffix
            </label>
            <input
              type="text"
              value={sequence.suffix}
              onChange={(e) => handleSequenceChange('suffix', e.target.value)}
              placeholder="e.g., -2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>Preview:</strong> {sequence.prefix}
            {sequence.start.toString().padStart(sequence.padding || 0, '0')}
            {sequence.suffix} to {sequence.prefix}
            {sequence.end.toString().padStart(sequence.padding || 0, '0')}
            {sequence.suffix}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Will generate {estimatedCount} ticket{estimatedCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Export Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={options.format}
              onChange={(e) => handleOptionsChange('format', e.target.value as 'png' | 'jpeg' | 'pdf')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="png">PNG (High Quality)</option>
              <option value="jpeg">JPEG (Smaller)</option>
              <option value="pdf">PDF (Print Ready)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality
            </label>
            <select
              value={options.quality}
              onChange={(e) => handleOptionsChange('quality', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1.0">Maximum (1.0)</option>
              <option value="0.9">High (0.9)</option>
              <option value="0.8">Good (0.8)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeZip"
            checked={options.includeZip}
            onChange={(e) => handleOptionsChange('includeZip', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="includeZip" className="text-sm font-medium text-gray-700">
            Bundle all tickets in ZIP file (recommended for {estimatedCount > 10 ? 'large' : 'multiple'} exports)
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleExport}
          disabled={isExporting || estimatedCount === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold flex items-center justify-center space-x-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export {estimatedCount} Ticket{estimatedCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}