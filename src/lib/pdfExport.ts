import jsPDF from 'jspdf'
import { TicketData } from '@/types/ticket'

export async function exportTicketAsPDF(
  imageDataUrl: string,
  ticketData: TicketData
): Promise<Blob> {
  // Create PDF with exact 2" x 5" dimensions at 300 DPI
  // 2" x 5" = 600 x 1500 pixels at 300 DPI
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [600, 1500], // Exact pixel dimensions
    compress: true
  })

  // Convert data URL to image and add to PDF
  const img = new Image()
  img.src = imageDataUrl

  await new Promise((resolve) => {
    img.onload = resolve
  })

  // Add image to PDF at exact dimensions
  pdf.addImage(img, 'PNG', 0, 0, 600, 1500)

  // Add metadata
  pdf.setProperties({
    title: `Ticket ${ticketData.number}`,
    subject: ticketData.title || 'Ticket',
    creator: 'Ticket Builder',
    keywords: 'ticket, print'
  })

  return pdf.output('blob')
}

export async function createMultiPagePDF(
  imageDataUrls: string[],
  filename: string = 'tickets.pdf'
): Promise<void> {
  if (imageDataUrls.length === 0) return

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [600, 1500],
    compress: true
  })

  for (let i = 0; i < imageDataUrls.length; i++) {
    if (i > 0) {
      pdf.addPage([600, 1500])
    }

    const img = new Image()
    img.src = imageDataUrls[i]

    await new Promise((resolve) => {
      img.onload = resolve
    })

    pdf.addImage(img, 'PNG', 0, 0, 600, 1500)
  }

  pdf.save(filename)
}