'use client'

import { useEffect } from 'react'
import { ExportProgress } from '@/types/ticket'

interface BatchExportProgressProps {
  progress: ExportProgress
  onCancel: () => void
  isOpen: boolean
  onClose: () => void
}

export default function BatchExportProgress({
  progress,
  onCancel,
  isOpen,
  onClose
}: BatchExportProgressProps) {
  const { current, total, status, message, error } = progress

  const progressPercentage = total > 0 ? Math.round((current / total) * 100) : 0
  const estimatedTimeRemaining = status === 'exporting' && current > 0
    ? Math.round(((total - current) / current) * 2) // Rough estimate: 2 seconds per ticket
    : 0

  useEffect(() => {
    if (status === 'complete' || status === 'error') {
      // Auto-close after 3 seconds on success, or keep open on error
      if (status === 'complete') {
        const timer = setTimeout(() => {
          onClose()
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [status, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {status === 'exporting' && 'Exporting Tickets'}
            {status === 'zipping' && 'Creating ZIP File'}
            {status === 'complete' && 'Export Complete!'}
            {status === 'error' && 'Export Failed'}
            {status === 'idle' && 'Ready to Export'}
          </h3>
          {(status === 'complete' || status === 'error') && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{current} of {total} tickets</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                status === 'error' ? 'bg-red-500' :
                status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Estimated Time */}
        {status === 'exporting' && estimatedTimeRemaining > 0 && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              Estimated time remaining: {estimatedTimeRemaining} second{estimatedTimeRemaining !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Success Message */}
        {status === 'complete' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-800 font-medium">
                Successfully exported {total} ticket{total !== 1 ? 's' : ''}!
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {status === 'exporting' && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Cancel Export
            </button>
          )}

          {status === 'complete' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Done
            </button>
          )}

          {status === 'error' && (
            <div className="flex space-x-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}