import { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import { toPng } from 'html-to-image'

interface CanvaImportProps {
  onImageUpload: (file: File) => void
  uploadedImage: string | null
  imageDimensions: { width: number; height: number } | null
  numberPosition: { fx: number; fy: number }
  onPositionChange: (position: { fx: number; fy: number }) => void
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'error' | 'success'

interface UploadError {
  type: 'invalid_format' | 'file_too_large' | 'processing_failed' | 'unknown'
  message: string
}

export function CanvaImport({
  onImageUpload,
  uploadedImage,
  imageDimensions,
  numberPosition,
  onPositionChange,
}: CanvaImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadError, setUploadError] = useState<UploadError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

  const validateFile = (file: File): UploadError | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        type: 'invalid_format',
        message: 'Please upload a PNG or JPEG image file'
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        type: 'file_too_large',
        message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }
    }

    return null
  }

  const processFile = async (file: File): Promise<void> => {
    const validationError = validateFile(file)
    if (validationError) {
      throw validationError
    }

    setUploadState('processing')

    try {
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file)

      // Wait a bit to simulate processing (in real app, might do image analysis)
      await new Promise(resolve => setTimeout(resolve, 500))

      onImageUpload(file)
      setUploadState('success')
      setUploadError(null)
      setRetryCount(0)
    } catch (error) {
      console.error('File processing error:', error)
      throw {
        type: 'processing_failed',
        message: 'Failed to process the image. Please try again.'
      } as UploadError
    }
  }

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadState('uploading')
      setUploadError(null)

      try {
        await processFile(file)
      } catch (error) {
        setUploadState('error')
        setUploadError(error as UploadError)
      }
    },
    [onImageUpload]
  )

  const handleRetry = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setRetryCount(prev => prev + 1)
    await handleFileSelect(fileInputRef.current.files[0])
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) await handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFileSelect(file)
  }

  const resetUpload = () => {
    setUploadState('idle')
    setUploadError(null)
    setRetryCount(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageUpload(null as any)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700">Upload Canva Design</div>

      {!uploadedImage ? (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : uploadState === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {uploadState === 'uploading' || uploadState === 'processing' ? (
              <div className="text-gray-500">
                <div className="mx-auto h-12 w-12 mb-4 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <div className="text-lg font-medium mb-2">
                  {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
                </div>
                <div className="text-sm">Please wait</div>
              </div>
            ) : uploadState === 'error' ? (
              <div className="text-red-600">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-lg font-medium mb-2">
                  Upload Failed
                </div>
                <div className="text-sm mb-4">{uploadError?.message}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRetry()
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-lg font-medium mb-2">
                  Drop your Canva PNG here
                </div>
                <div className="text-sm">or click to browse files (PNG recommended for best quality)</div>
                <div className="text-xs text-gray-400 mt-2">
                  Max file size: {MAX_FILE_SIZE / (1024 * 1024)}MB • Also accepts JPEG
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploadState === 'uploading' || uploadState === 'processing'}
            />
          </div>

          {uploadState === 'error' && retryCount > 0 && (
            <div className="text-sm text-gray-600 text-center">
              Retry attempts: {retryCount}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Design uploaded successfully. Click on the preview to position the ticket number.
            </div>
            <button
              onClick={resetUpload}
              className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-2 py-1 rounded"
            >
              Remove design
            </button>
          </div>

          <div className="relative inline-block border rounded-lg overflow-hidden">
            <img
              ref={imageRef}
              src={uploadedImage}
              alt="Canva design"
              className="max-w-full h-auto cursor-crosshair"
              onClick={(e) => {
                const img = e.currentTarget
                const rect = img.getBoundingClientRect()
                const clickX = e.clientX - rect.left
                const clickY = e.clientY - rect.top
                
                // Get natural dimensions
                const imgW = img.naturalWidth
                const imgH = img.naturalHeight
                
                // Compute contain fit matrix
                const scale = Math.min(rect.width / imgW, rect.height / imgH)
                const offsetX = Math.floor((rect.width - imgW * scale) / 2)
                const offsetY = Math.floor((rect.height - imgH * scale) / 2)
                
                // Convert screen click to image coordinates
                const imgX = (clickX - offsetX) / scale
                const imgY = (clickY - offsetY) / scale
                
                // Store as normalized fractions
                const fx = imgX / imgW
                const fy = imgY / imgH
                
                onPositionChange({ fx, fy })
              }}
            />
            {numberPosition && imageDimensions && (
              <div
                className="absolute text-4xl font-bold text-black bg-white bg-opacity-80 px-2 py-1 rounded pointer-events-none"
                style={{
                  left: `${numberPosition.fx * 100}%`,
                  top: `${numberPosition.fy * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                001
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}