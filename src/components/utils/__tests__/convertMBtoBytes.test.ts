import { describe, it, expect } from 'vitest'
import { convertMBtoBytes } from '../convertMBtoBytes'

describe('convertMBtoBytes', () => {
  it('returns converted bytes from MB', () => {
    expect(convertMBtoBytes(5)).toBe(5242880)
    expect(convertMBtoBytes(10)).toBe(10485760)
    expect(convertMBtoBytes(25)).toBe(26214400)
  })
})
