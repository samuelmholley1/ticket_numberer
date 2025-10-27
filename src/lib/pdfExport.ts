/**
 * PDF Export utilities for print-ready ticket output
 * Supports single-ticket multi-page and 8-up US Letter formats
 */

import { PDFDocument, rgb } from 'pdf-lib'
import { renderTicketToDataUrl, formatTicketNumber } from './ticketRenderer'

export interface PDFExportSettings {
  imageSrc: string
  totalTickets: number
  startNumber: number
  numberFormat: string
  width: number // Image width in pixels
  height: number // Image height in pixels
  fx: number // Normalized x position
  fy: number // Normalized y position
  fontSize: number
  fontColor: string
  fontFamily?: string
}

/**
 * Export tickets as single-ticket multi-page PDF
 * One ticket per page at exact dimensions
 */
export async function exportSingleTicketPDF(
  settings: PDFExportSettings,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // Calculate page size in points (1 inch = 72 points)
  const dpi = 300
  const widthInches = settings.width / dpi
  const heightInches = settings.height / dpi
  const pageWidthPt = widthInches * 72
  const pageHeightPt = heightInches * 72

  for (let i = 0; i < settings.totalTickets; i++) {
    const ticketNumber = settings.startNumber + i

    // Render ticket
    const dataUrl = await renderTicketToDataUrl(settings.imageSrc, ticketNumber, {
      width: settings.width,
      height: settings.height,
      fx: settings.fx,
      fy: settings.fy,
      fontSize: settings.fontSize,
      fontColor: settings.fontColor,
      fontFamily: settings.fontFamily,
      numberFormat: settings.numberFormat,
      startNumber: settings.startNumber
    })

    // Add page
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    // Embed PNG
    const pngImageBytes = await fetch(dataUrl).then(res => res.arrayBuffer())
    const pngImage = await pdfDoc.embedPng(pngImageBytes)

    // Draw image to fill entire page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt
    })

    if (onProgress) {
      onProgress(i + 1, settings.totalTickets)
    }
  }

  return await pdfDoc.save()
}

/**
 * Export tickets as 8-up US Letter PDF with crop marks
 * 4 columns × 2 rows per page
 */
export async function export8UpLetterPDF(
  settings: PDFExportSettings,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // US Letter size in points
  const pageWidthPt = 612 // 8.5"
  const pageHeightPt = 792 // 11"

  // Calculate ticket dimensions in points
  const dpi = 300
  const widthInches = settings.width / dpi
  const heightInches = settings.height / dpi
  const ticketWidthPt = widthInches * 72
  const ticketHeightPt = heightInches * 72

  // Calculate grid layout
  const cols = 4
  const rows = 2
  const ticketsPerPage = cols * rows

  // Calculate margins to center the grid
  const totalGridWidth = cols * ticketWidthPt
  const totalGridHeight = rows * ticketHeightPt
  const marginX = (pageWidthPt - totalGridWidth) / 2
  const marginY = (pageHeightPt - totalGridHeight) / 2

  // Pre-render all tickets
  const renderedTickets: string[] = []
  for (let i = 0; i < settings.totalTickets; i++) {
    const ticketNumber = settings.startNumber + i
    const dataUrl = await renderTicketToDataUrl(settings.imageSrc, ticketNumber, {
      width: settings.width,
      height: settings.height,
      fx: settings.fx,
      fy: settings.fy,
      fontSize: settings.fontSize,
      fontColor: settings.fontColor,
      fontFamily: settings.fontFamily,
      numberFormat: settings.numberFormat,
      startNumber: settings.startNumber
    })
    renderedTickets.push(dataUrl)
    
    if (onProgress) {
      onProgress(i + 1, settings.totalTickets)
    }
  }

  // Layout tickets on pages
  const totalPages = Math.ceil(settings.totalTickets / ticketsPerPage)

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    const startTicket = pageIndex * ticketsPerPage
    const endTicket = Math.min(startTicket + ticketsPerPage, settings.totalTickets)

    for (let i = startTicket; i < endTicket; i++) {
      const positionOnPage = i - startTicket
      const col = positionOnPage % cols
      const row = Math.floor(positionOnPage / cols)

      // Calculate position (Y is from bottom in PDF)
      const x = marginX + col * ticketWidthPt
      const y = pageHeightPt - marginY - (row + 1) * ticketHeightPt

      // Embed and draw ticket
      const pngImageBytes = await fetch(renderedTickets[i]).then(res => res.arrayBuffer())
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      page.drawImage(pngImage, {
        x,
        y,
        width: ticketWidthPt,
        height: ticketHeightPt
      })

      // Draw crop marks (light gray, 0.25pt stroke)
      const cropMarkLength = 18 // 0.25"
      const cropMarkOffset = 2 // 2pt from edge

      page.drawLine({
        start: { x: x - cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.25,
        color: rgb(0.5, 0.5, 0.5)
      })

      page.drawLine({
        start: { x: x, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.25,
        color: rgb(0.5, 0.5, 0.5)
      })

      page.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.25,
        color: rgb(0.5, 0.5, 0.5)
      })

      page.drawLine({
        start: { x: x, y: y - cropMarkOffset },
        end: { x: x, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.25,
        color: rgb(0.5, 0.5, 0.5)
      })
    }
  }

  return await pdfDoc.save()
}

/**
 * Download a PDF file
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  // @ts-ignore - TypeScript has issues with Uint8Array in Blob constructor but it works correctly
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}