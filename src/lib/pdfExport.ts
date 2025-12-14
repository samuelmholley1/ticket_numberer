/**
 * PDF Export utilities for print-ready ticket output
 * Supports single-ticket multi-page and 8-up US Letter formats
 */

import { PDFDocument, rgb } from 'pdf-lib'
import { renderTicketToDataUrl, formatTicketNumber } from './ticketRenderer'

export interface PDFExportSettings {
  imageSrc: string
  backImageSrc?: string // Optional back image for double-sided tickets
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
 * Export tickets as 3-up US Letter PDF (optimized for 2000×647px landscape tickets)
 * 3 tickets stacked vertically per page with crop marks and padding
 */
export async function export3UpLetterPDF(
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

  console.log(`Ticket dimensions: ${ticketWidthPt.toFixed(2)}pt × ${ticketHeightPt.toFixed(2)}pt (${widthInches.toFixed(2)}" × ${heightInches.toFixed(2)}")`)

  // 3-up layout: 3 tickets stacked vertically with padding
  const ticketsPerPage = 3
  const paddingBetweenTickets = 14 // 14pt = ~0.19" padding between tickets

  // Calculate total height needed including padding
  const totalContentHeight = (ticketsPerPage * ticketHeightPt) + ((ticketsPerPage - 1) * paddingBetweenTickets)
  
  // Calculate margins to center the tickets
  const marginX = (pageWidthPt - ticketWidthPt) / 2
  const marginY = (pageHeightPt - totalContentHeight) / 2

  console.log(`Margins: X=${marginX.toFixed(2)}pt, Y=${marginY.toFixed(2)}pt, Padding=${paddingBetweenTickets}pt`)

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
  console.log(`Total pages: ${totalPages}`)

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    const startTicket = pageIndex * ticketsPerPage
    const endTicket = Math.min(startTicket + ticketsPerPage, settings.totalTickets)

    for (let i = startTicket; i < endTicket; i++) {
      const positionOnPage = i - startTicket

      // Calculate position (Y is from bottom in PDF) - add padding between tickets
      const x = marginX
      const y = pageHeightPt - marginY - (positionOnPage * (ticketHeightPt + paddingBetweenTickets)) - ticketHeightPt

      // Embed and draw ticket
      const pngImageBytes = await fetch(renderedTickets[i]).then(res => res.arrayBuffer())
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      page.drawImage(pngImage, {
        x,
        y,
        width: ticketWidthPt,
        height: ticketHeightPt
      })

      // Draw crop marks (light gray, 0.5pt stroke)
      const cropMarkLength = 18 // 0.25"
      const cropMarkOffset = 3 // 3pt from edge

      // Top-left
      page.drawLine({
        start: { x: x - cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Top-right
      page.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-left
      page.drawLine({
        start: { x: x - cropMarkOffset, y: y },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x, y: y - cropMarkOffset },
        end: { x: x, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-right
      page.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x + ticketWidthPt, y: y - cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  const sizeInMB = (pdfBytes.length / 1024 / 1024).toFixed(2)
  console.log(`PDF size: ${sizeInMB}MB`)
  
  return pdfBytes
}

/**
 * Export tickets as 4-up US Letter PDF (optimized for landscape tickets)
 * 4 tickets stacked vertically per page with crop marks and padding
 */
export async function export4UpLetterPDF(
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

  console.log(`Ticket dimensions: ${ticketWidthPt.toFixed(2)}pt × ${ticketHeightPt.toFixed(2)}pt (${widthInches.toFixed(2)}" × ${heightInches.toFixed(2)}")`)

  // 4-up layout: 4 tickets stacked vertically with padding
  const ticketsPerPage = 4
  const paddingBetweenTickets = 10 // 10pt = ~0.14" padding between tickets

  // Calculate total height needed including padding
  const totalContentHeight = (ticketsPerPage * ticketHeightPt) + ((ticketsPerPage - 1) * paddingBetweenTickets)
  
  // Calculate margins to center the tickets
  const marginX = (pageWidthPt - ticketWidthPt) / 2
  const marginY = (pageHeightPt - totalContentHeight) / 2

  console.log(`Margins: X=${marginX.toFixed(2)}pt, Y=${marginY.toFixed(2)}pt, Padding=${paddingBetweenTickets}pt`)

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
  console.log(`Total pages: ${totalPages}`)

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    const startTicket = pageIndex * ticketsPerPage
    const endTicket = Math.min(startTicket + ticketsPerPage, settings.totalTickets)

    for (let i = startTicket; i < endTicket; i++) {
      const positionOnPage = i - startTicket

      // Calculate position (Y is from bottom in PDF) - add padding between tickets
      const x = marginX
      const y = pageHeightPt - marginY - (positionOnPage * (ticketHeightPt + paddingBetweenTickets)) - ticketHeightPt

      // Embed and draw ticket
      const pngImageBytes = await fetch(renderedTickets[i]).then(res => res.arrayBuffer())
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      page.drawImage(pngImage, {
        x,
        y,
        width: ticketWidthPt,
        height: ticketHeightPt
      })

      // Draw crop marks (light gray, 0.5pt stroke)
      const cropMarkLength = 18 // 0.25"
      const cropMarkOffset = 3 // 3pt from edge

      // Top-left
      page.drawLine({
        start: { x: x - cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Top-right
      page.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-left
      page.drawLine({
        start: { x: x - cropMarkOffset, y: y },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x, y: y - cropMarkOffset },
        end: { x: x, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-right
      page.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      page.drawLine({
        start: { x: x + ticketWidthPt, y: y - cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  const sizeInMB = (pdfBytes.length / 1024 / 1024).toFixed(2)
  console.log(`PDF size: ${sizeInMB}MB`)
  
  return pdfBytes
}

/**
 * Export double-sided tickets as 4-up US Letter PDF
 * 4 tickets stacked vertically per page, with front on odd pages and back on even pages
 * Designed for duplex printing (print on both sides, flip on short edge)
 */
export async function export4UpDoubleSidedPDF(
  settings: PDFExportSettings,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  if (!settings.backImageSrc) {
    throw new Error('Back image is required for double-sided export')
  }

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

  console.log(`Ticket dimensions: ${ticketWidthPt.toFixed(2)}pt × ${ticketHeightPt.toFixed(2)}pt (${widthInches.toFixed(2)}" × ${heightInches.toFixed(2)}")`)

  // 4-up layout: 4 tickets stacked vertically with padding
  const ticketsPerPage = 4
  const paddingBetweenTickets = 10 // 10pt = ~0.14" padding between tickets

  // Calculate total height needed including padding
  const totalContentHeight = (ticketsPerPage * ticketHeightPt) + ((ticketsPerPage - 1) * paddingBetweenTickets)
  
  // Calculate margins to center the tickets
  const marginX = (pageWidthPt - ticketWidthPt) / 2
  const marginY = (pageHeightPt - totalContentHeight) / 2

  console.log(`Margins: X=${marginX.toFixed(2)}pt, Y=${marginY.toFixed(2)}pt, Padding=${paddingBetweenTickets}pt`)

  // Pre-render all front tickets with numbering
  console.log('Rendering front tickets with numbers...')
  const renderedFronts: string[] = []
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
    renderedFronts.push(dataUrl)
    
    if (onProgress) {
      onProgress(i + 1, settings.totalTickets * 2) // *2 because we have both front and back
    }
  }

  // Load the back image once and render it to the correct size (no numbering)
  console.log('Preparing back image (static, no numbering)...')
  const backImageCanvas = document.createElement('canvas')
  backImageCanvas.width = settings.width
  backImageCanvas.height = settings.height
  const backCtx = backImageCanvas.getContext('2d')!
  
  const backImg = new Image()
  backImg.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    backImg.onload = () => resolve()
    backImg.onerror = reject
    backImg.src = settings.backImageSrc!
  })
  
  backCtx.drawImage(backImg, 0, 0, settings.width, settings.height)
  const backDataUrl = backImageCanvas.toDataURL('image/png', 0.98)
  console.log('Back image prepared')

  // Layout tickets on pages (front and back alternating)
  const totalPages = Math.ceil(settings.totalTickets / ticketsPerPage) * 2 // *2 for front and back
  console.log(`Total pages: ${totalPages} (${totalPages / 2} front + ${totalPages / 2} back)`)

  const totalSheets = Math.ceil(settings.totalTickets / ticketsPerPage)

  for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
    const startTicket = sheetIndex * ticketsPerPage
    const endTicket = Math.min(startTicket + ticketsPerPage, settings.totalTickets)

    // FRONT PAGE (odd page)
    const frontPage = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    for (let i = startTicket; i < endTicket; i++) {
      const positionOnPage = i - startTicket

      // Calculate position (Y is from bottom in PDF)
      const x = marginX
      const y = pageHeightPt - marginY - (positionOnPage * (ticketHeightPt + paddingBetweenTickets)) - ticketHeightPt

      // Embed and draw front ticket
      const pngImageBytes = await fetch(renderedFronts[i]).then(res => res.arrayBuffer())
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      frontPage.drawImage(pngImage, {
        x,
        y,
        width: ticketWidthPt,
        height: ticketHeightPt
      })

      // Draw crop marks
      const cropMarkLength = 18
      const cropMarkOffset = 3

      // Top-left
      frontPage.drawLine({
        start: { x: x - cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      frontPage.drawLine({
        start: { x: x, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Top-right
      frontPage.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      frontPage.drawLine({
        start: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-left
      frontPage.drawLine({
        start: { x: x - cropMarkOffset, y: y },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      frontPage.drawLine({
        start: { x: x, y: y - cropMarkOffset },
        end: { x: x, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-right
      frontPage.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      frontPage.drawLine({
        start: { x: x + ticketWidthPt, y: y - cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
    }

    // BACK PAGE (even page)
    // For duplex printing with flip on short edge, the backs should be in the same position
    // All backs use the same static image (no numbering)
    const backPage = pdfDoc.addPage([pageWidthPt, pageHeightPt])

    // Embed the back image once per page (it's the same for all tickets)
    const backImageBytes = await fetch(backDataUrl).then(res => res.arrayBuffer())
    const backPngImage = await pdfDoc.embedPng(backImageBytes)

    for (let i = startTicket; i < endTicket; i++) {
      const positionOnPage = i - startTicket

      // Calculate position (same as front)
      const x = marginX
      const y = pageHeightPt - marginY - (positionOnPage * (ticketHeightPt + paddingBetweenTickets)) - ticketHeightPt

      // Draw the same back image for each ticket position
      backPage.drawImage(backPngImage, {
        x,
        y,
        width: ticketWidthPt,
        height: ticketHeightPt
      })

      // Draw crop marks on back too
      const cropMarkLength = 18
      const cropMarkOffset = 3

      // Top-left
      backPage.drawLine({
        start: { x: x - cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      backPage.drawLine({
        start: { x: x, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Top-right
      backPage.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y + ticketHeightPt },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y + ticketHeightPt },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      backPage.drawLine({
        start: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y + ticketHeightPt + cropMarkOffset + cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-left
      backPage.drawLine({
        start: { x: x - cropMarkOffset, y: y },
        end: { x: x - cropMarkOffset - cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      backPage.drawLine({
        start: { x: x, y: y - cropMarkOffset },
        end: { x: x, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Bottom-right
      backPage.drawLine({
        start: { x: x + ticketWidthPt + cropMarkOffset, y: y },
        end: { x: x + ticketWidthPt + cropMarkOffset + cropMarkLength, y: y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
      backPage.drawLine({
        start: { x: x + ticketWidthPt, y: y - cropMarkOffset },
        end: { x: x + ticketWidthPt, y: y - cropMarkOffset - cropMarkLength },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4)
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  const sizeInMB = (pdfBytes.length / 1024 / 1024).toFixed(2)
  console.log(`PDF size: ${sizeInMB}MB`)
  
  return pdfBytes
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