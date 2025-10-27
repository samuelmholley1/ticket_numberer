import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function createZipFromDataUrls(
  dataUrls: Array<{ dataUrl: string; filename: string }>,
  zipFilename: string = 'tickets.zip'
): Promise<void> {
  const zip = new JSZip()

  // Add each data URL to the zip
  for (const { dataUrl, filename } of dataUrls) {
    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Add to zip
    zip.file(filename, blob)
  }

  // Generate and download the zip
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, zipFilename)
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