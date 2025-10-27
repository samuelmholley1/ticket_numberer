/**
 * Unified ticket rendering utilities
 * Ensures consistent rendering across preview and export
 */

export interface DrawParams {
  img: HTMLImageElement | ImageBitmap
  imgW: number
  imgH: number
  fx: number // Normalized x position (0-1)
  fy: number // Normalized y position (0-1)
  text: string
  fontPx: number
  color: string
  fontFamily: string
}

/**
 * Draw a ticket with number overlay
 * Uses normalized coordinates for consistent placement at any size
 */
export function drawTicket(ctx: CanvasRenderingContext2D, params: DrawParams): void {
  const { img, imgW, imgH, fx, fy, text, fontPx, color, fontFamily } = params

  // Clear and draw background
  ctx.clearRect(0, 0, imgW, imgH)
  ctx.drawImage(img, 0, 0, imgW, imgH)

  // Convert normalized position to absolute pixels
  const x = Math.round(fx * imgW)
  const y = Math.round(fy * imgH)

  // Draw the number
  ctx.font = `bold ${fontPx}px ${fontFamily}, sans-serif`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/**
 * Format ticket number based on format string
 */
export function formatTicketNumber(num: number, format: string): string {
  switch (format) {
    case '001':
      return num.toString().padStart(3, '0')
    case '0001':
      return num.toString().padStart(4, '0')
    case '1':
      return num.toString()
    default:
      return num.toString().padStart(3, '0')
  }
}

/**
 * Load an image from a data URL or URL
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Render a single ticket to a canvas and return data URL
 */
export async function renderTicketToDataUrl(
  imageSrc: string,
  ticketNumber: number,
  settings: {
    width: number
    height: number
    fx: number
    fy: number
    fontSize: number
    fontColor: string
    fontFamily?: string
    numberFormat: string
    startNumber: number
  }
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = settings.width
  canvas.height = settings.height
  const ctx = canvas.getContext('2d')!

  const img = await loadImage(imageSrc)

  const formattedNumber = formatTicketNumber(ticketNumber, settings.numberFormat)

  drawTicket(ctx, {
    img,
    imgW: settings.width,
    imgH: settings.height,
    fx: settings.fx,
    fy: settings.fy,
    text: formattedNumber,
    fontPx: settings.fontSize,
    color: settings.fontColor,
    fontFamily: settings.fontFamily || 'Arial'
  })

  return canvas.toDataURL('image/png', 0.98)
}
