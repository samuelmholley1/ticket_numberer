export interface TicketData {
  id: string
  number: string
  title?: string
  subtitle?: string
  logoUrl?: string
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  customFields?: Record<string, string>
}

export interface SequenceConfig {
  start: number
  end: number
  step: number
  prefix: string
  suffix: string
  series: string[]
  padding?: number
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'pdf'
  quality?: number
  pixelRatio?: number
  includeZip?: boolean
}

export interface ExportConfig {
  sequence: SequenceConfig
  options: ExportOptions
  template: Omit<TicketData, 'id' | 'number'>
}

export interface ExportProgress {
  current: number
  total: number
  status: 'idle' | 'exporting' | 'zipping' | 'complete' | 'error'
  message?: string
  error?: string
}

export interface BatchExportResult {
  success: boolean
  exportedCount: number
  totalCount: number
  zipUrl?: string
  errors?: string[]
}