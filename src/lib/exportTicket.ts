import html2canvas from 'html2canvas'
import { toPng, toJpeg } from 'html-to-image'
import { ExportOptions, TicketData } from '@/types/ticket'

export async function exportTicketAsImage(
  element: HTMLElement,
  ticketData: TicketData,
  options: ExportOptions
): Promise<string> {
  const { format, quality = 1.0, pixelRatio = 3 } = options

  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement

  // Apply clone neutralization to prevent layout shifts
  neutralizeClone(clone)

  try {
    let dataUrl: string

    if (format === 'png') {
      dataUrl = await toPng(clone, {
        quality,
        pixelRatio,
        backgroundColor: 'white'
      })
    } else {
      dataUrl = await toJpeg(clone, {
        quality,
        pixelRatio,
        backgroundColor: 'white'
      })
    }

    return dataUrl
  } catch (error) {
    console.warn('html-to-image failed, falling back to html2canvas', error)

    // Fallback to html2canvas
    const canvas = await html2canvas(clone, {
      scale: pixelRatio,
      useCORS: true,
      allowTaint: false,
      backgroundColor: 'white',
      width: 600,
      height: 1500
    })

    return canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', quality)
  }
}

function neutralizeClone(clone: HTMLElement): void {
  // Remove transforms that could cause coordinate drift
  clone.style.transform = 'none'
  clone.style.transformOrigin = 'initial'

  // Reset positioning that might be affected
  clone.style.position = 'relative'
  clone.style.top = '0'
  clone.style.left = '0'

  // Ensure overflow is visible
  clone.style.overflow = 'visible'

  // Remove any sticky positioning
  clone.style.position = 'relative'

  // Ensure all child elements are also neutralized
  const allElements = clone.querySelectorAll('*')
  allElements.forEach((el: Element) => {
    const element = el as HTMLElement
    element.style.transform = 'none'
    element.style.transformOrigin = 'initial'
    element.style.position = 'relative'
    element.style.top = '0'
    element.style.left = '0'
  })
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the data URL to free memory
  URL.revokeObjectURL(dataUrl)
}

export function createFilename(ticketData: TicketData, format: string): string {
  const { number, title } = ticketData
  const baseName = title ? `${title}_${number}` : `ticket_${number}`
  return `${baseName}.${format}`
}