import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('should handle false conditionals', () => {
    const isActive = false
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class')
  })

  it('should merge conflicting tailwind classes', () => {
    // twMerge should handle conflicting padding classes
    const result = cn('px-4', 'px-8')
    expect(result).toBe('px-8')
  })

  it('should handle arrays', () => {
    const result = cn(['px-4', 'py-2'])
    expect(result).toBe('px-4 py-2')
  })

  it('should handle objects', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
    })
    expect(result).toBe('text-red-500')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })
})
