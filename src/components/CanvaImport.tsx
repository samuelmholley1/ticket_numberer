import { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import { toPng } from 'html-to-image'

interface CanvaImportProps {
  onImageUpload: (file: File) => void
  uploadedImage: string | null
  numberPosition: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}

export function CanvaImport({
  onImageUpload,
  uploadedImage,
  numberPosition,
  onPositionChange,
}: CanvaImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.type.startsWith('image/')) {
        onImageUpload(file)
      }
    },
    [onImageUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
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
    if (file) handleFileSelect(file)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700">Upload Canva Design</div>

      {!uploadedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
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
              Drop your Canva PNG/JPEG here
            </div>
            <div className="text-sm">or click to browse files</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Design uploaded. Click on the preview to position the ticket number.
          </div>

          <div className="relative inline-block border rounded-lg overflow-hidden">
            <img
              src={uploadedImage}
              alt="Canva design"
              className="max-w-full h-auto cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                onPositionChange({ x, y })
              }}
            />
            {numberPosition && (
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
            )}
          </div>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              onImageUpload(null as any)
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remove design
          </button>
        </div>
      )}
    </div>
  )
}