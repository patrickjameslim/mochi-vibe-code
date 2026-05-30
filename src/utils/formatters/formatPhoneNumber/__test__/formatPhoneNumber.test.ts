import { formatPhoneNumber } from '../formatPhoneNumber.js'

describe('formatPhoneNumber', () => {
  it('should format phone number to PH by default if valid', () => {
    expect(formatPhoneNumber('9177234567')).toBe('+63 917 723 4567')
    expect(formatPhoneNumber('+639177234567')).toBe('+63 917 723 4567')
  })

  it('should format phone number to specific country code if valid', () => {
    expect(formatPhoneNumber('12133734253', 'US')).toBe('+1 213 373 4253')
  })

  it('should return N/A if phone number is empty', () => {
    expect(formatPhoneNumber('')).toBe('N/A')
  })

  it('should return original phone number if it is not a valid phone number', () => {
    expect(formatPhoneNumber('912345678990')).toBe('912345678990')
    expect(formatPhoneNumber('12')).toBe('12')
    expect(formatPhoneNumber('1213373425377', 'US')).toBe('1213373425377')
  })
})
