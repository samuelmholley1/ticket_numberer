import { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import { toPng } from 'html-to-image'

interface CanvaImportProps {
  onImageUpload: (file: File) => void
  uploadedImage: string | null
  imageDimensions: { width: number; height: number } | null
  numberPosition: { fx: number; fy: number }
  onPositionChange: (position: { fx: number; fy: number }) => void
  previewDataUrl: string | null
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
  previewDataUrl,
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleTemplateSelect = async () => {
    setUploadState('processing')
    setUploadError(null)

    try {
      // Load the template image - using the updated front ticket
      const response = await fetch('/12.12.25 AATR 2026 TICKET FRONT.png')
      const blob = await response.blob()
      
      // Create a File object from the blob
      const templateFile = new File([blob], '12.12.25 AATR 2026 TICKET FRONT.png', { type: 'image/png' })
      
      // Process it like a regular upload
      await processFile(templateFile)
    } catch (error) {
      console.error('Template loading error:', error)
      setUploadState('error')
      setUploadError({
        type: 'processing_failed',
        message: 'Failed to load template. Please try uploading manually.'
      } as UploadError)
    }
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
    <section className="space-y-4" aria-labelledby="design-section-heading">
      <h2 id="design-section-heading" className="text-sm font-medium text-gray-700">Choose a Design</h2>

      {!uploadedImage ? (
        <div className="space-y-4">
          {/* Template Option */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200" role="region" aria-labelledby="template-heading">
            <h3 id="template-heading" className="text-sm font-medium text-blue-900 mb-2">Quick Start Template</h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <img
                  src="/12.12.25 AATR 2026 TICKET FRONT.png"
                  alt="An Affair to Remember 2026 Ticket Template Front"
                  className="w-20 h-12 object-cover rounded border"
                />
                <img
                  src="/12.12.25 AATR 2026 TICKET BACK.png"
                  alt="An Affair to Remember 2026 Ticket Template Back"
                  className="w-20 h-12 object-cover rounded border"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm text-blue-800 font-medium">An Affair to Remember 2026 Ticket</div>
                <div className="text-xs text-blue-600">Double-sided ticket template • 4 tickets per page • Ready to number & print</div>
              </div>
              <button
                onClick={handleTemplateSelect}
                disabled={uploadState === 'uploading' || uploadState === 'processing'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                aria-describedby="template-button-status"
              >
                Use Template
              </button>
              <div id="template-button-status" className="sr-only" aria-live="polite">
                {uploadState === 'uploading' || uploadState === 'processing' ? 'Loading template...' : 'Ready to use template'}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>📄 Printing Instructions:</strong> Export as PDF, then print with <strong>duplex (double-sided)</strong> on, flip on <strong>short edge</strong>. 
                Page 1 = tickets 1-4 front, Page 2 = tickets 1-4 back, Page 3 = tickets 5-8 front, etc.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative" role="separator" aria-label="or">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Upload Option */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Upload Your Own Design</h3>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick()
                }
              }}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : uploadState === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              role="button"
              tabIndex={0}
              aria-label="Upload image file by clicking or dragging and dropping"
              aria-describedby="upload-instructions upload-status"
            >
              {uploadState === 'uploading' || uploadState === 'processing' ? (
                <div className="text-gray-500" role="status" aria-live="polite">
                  <div className="mx-auto h-12 w-12 mb-4 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" aria-hidden="true"></div>
                  <div className="text-lg font-medium mb-2">
                    {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
                  </div>
                  <div className="text-sm">Please wait</div>
                </div>
              ) : uploadState === 'error' ? (
                <div className="text-red-600" role="alert">
                  <svg
                    className="mx-auto h-12 w-12 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Retry file upload"
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
                    aria-hidden="true"
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
                  <div id="upload-instructions" className="text-xs text-gray-400 mt-2">
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
                aria-label="Select image file to upload"
              />
            </div>
            <div id="upload-status" className="sr-only" aria-live="polite">
              {uploadState === 'uploading' && 'Uploading file...'}
              {uploadState === 'processing' && 'Processing image...'}
              {uploadState === 'error' && `Upload failed: ${uploadError?.message}`}
              {uploadState === 'success' && 'File uploaded successfully'}
            </div>

            {uploadState === 'error' && retryCount > 0 && (
              <div className="text-sm text-gray-600 text-center" aria-live="polite">
                Retry attempts: {retryCount}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4" role="region" aria-labelledby="uploaded-design-heading">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600" id="uploaded-design-heading">
              Design uploaded successfully. Click &quot;Generate&quot; below to open the numbering editor.
            </div>
            <button
              onClick={resetUpload}
              className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-2 py-1 rounded"
              aria-label="Remove uploaded design and start over"
            >
              Remove design
            </button>
          </div>

          <figure className="relative inline-block border rounded-lg overflow-hidden">
            {previewDataUrl ? (
              <img
                ref={imageRef}
                src={previewDataUrl}
                alt="Numbered ticket preview showing your uploaded design with sample numbering"
                className="max-w-full h-auto"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center" role="status" aria-live="polite">
                <div className="text-gray-500">Generating preview...</div>
              </div>
            )}
            {/* Position marker removed - positioning happens in the modal editor */}
          </figure>
        </div>
      )}
    </section>
  )
}