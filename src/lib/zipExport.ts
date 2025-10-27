import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function createZipFromDataUrls(
  dataUrls: Array<{ dataUrl: string; filename: string }>,
  zipFilename: string = 'tickets.zip'
): Promise<void> {
  console.log('createZipFromDataUrls called with', dataUrls.length, 'files')
  const zip = new JSZip()

  // Add each data URL to the zip
  for (const { dataUrl, filename } of dataUrls) {
    console.log('Adding to zip:', filename)
    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Add to zip
    zip.file(filename, blob)
  }

  // Generate and download the zip
  console.log('Generating ZIP blob...')
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  console.log('ZIP blob size:', zipBlob.size, 'bytes')
  console.log('Triggering download:', zipFilename)
  saveAs(zipBlob, zipFilename)
  console.log('Download triggered successfully')
}

export async function createZipFromBlobs(
  blobs: Array<{ blob: Blob; filename: string }>,
  zipFilename: string = 'tickets.zip'
): Promise<void> {
  const zip = new JSZip()

  // Add each blob to the zip
  for (const { blob, filename } of blobs) {
    zip.file(filename, blob)
  }

  // Generate and download the zip
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, zipFilename)
}

export function estimateZipSize(dataUrls: string[]): number {
  // Rough estimate: data URLs are about 33% larger than raw binary
  // This is a conservative estimate for memory planning
  const averageDataUrlSize = 100000 // 100KB average per ticket
  return dataUrls.length * averageDataUrlSize * 1.5
}

export async function exportTicketWithNumber(
  imageSrc: string,
  number: string,
  position: { x: number; y: number },
  ticketWidth: number = 600, // 2" at 300 DPI
  ticketHeight: number = 1500 // 5" at 300 DPI
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = ticketWidth
    canvas.height = ticketHeight
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Draw the background image
      ctx.drawImage(img, 0, 0, ticketWidth, ticketHeight)

      // Draw the number
      ctx.fillStyle = 'black'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(number, position.x, position.y)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.98)
      resolve(dataUrl)
    }
    img.src = imageSrc
  })
}