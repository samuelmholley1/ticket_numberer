import { SequenceConfig } from '@/types/ticket'

export function generateSequence(config: SequenceConfig): string[] {
  const { start, end, step, prefix, suffix, series, padding = 0 } = config
  const numbers: string[] = []

  if (series && series.length > 0) {
    // Use series if provided
    return series.map(item => `${prefix}${item}${suffix}`)
  }

  // Generate sequential numbers
  for (let i = start; i <= end; i += step) {
    const paddedNumber = padding > 0 ? i.toString().padStart(padding, '0') : i.toString()
    numbers.push(`${prefix}${paddedNumber}${suffix}`)
  }

  return numbers
}

export function validateSequence(config: SequenceConfig): { valid: boolean; error?: string } {
  const { start, end, step, series } = config

  if (series && series.length > 0) {
    return { valid: true }
  }

  if (start > end) {
    return { valid: false, error: 'Start number must be less than or equal to end number' }
  }

  if (step <= 0) {
    return { valid: false, error: 'Step must be greater than 0' }
  }

  const count = Math.floor((end - start) / step) + 1
  if (count > 10000) {
    return { valid: false, error: 'Sequence would generate more than 10,000 tickets. Please reduce the range or increase the step.' }
  }

  return { valid: true }
}