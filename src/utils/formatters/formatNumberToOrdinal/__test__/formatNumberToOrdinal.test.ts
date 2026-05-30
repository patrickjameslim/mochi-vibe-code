import { formatNumberToOrdinal } from '../formatNumberToOrdinal.js'

describe('formatNumberToOrdinal', () => {
  it('should append "st" to numbers ending in 1', () => {
    expect(formatNumberToOrdinal(1)).toBe('1st')
    expect(formatNumberToOrdinal(21)).toBe('21st')
    expect(formatNumberToOrdinal(101)).toBe('101st')
  })

  it('should append "nd" to numbers ending in 2', () => {
    expect(formatNumberToOrdinal(2)).toBe('2nd')
    expect(formatNumberToOrdinal(22)).toBe('22nd')
    expect(formatNumberToOrdinal(102)).toBe('102nd')
  })

  it('should append "rd" to numbers ending in 3', () => {
    expect(formatNumberToOrdinal(3)).toBe('3rd')
    expect(formatNumberToOrdinal(23)).toBe('23rd')
    expect(formatNumberToOrdinal(103)).toBe('103rd')
  })

  it('should append "th" to numbers 10-13', () => {
    expect(formatNumberToOrdinal(10)).toBe('10th')
    expect(formatNumberToOrdinal(11)).toBe('11th')
    expect(formatNumberToOrdinal(12)).toBe('12th')
    expect(formatNumberToOrdinal(13)).toBe('13th')
  })

  it('should append "th" to numbers ending in 4–9', () => {
    expect(formatNumberToOrdinal(4)).toBe('4th')
    expect(formatNumberToOrdinal(5)).toBe('5th')
    expect(formatNumberToOrdinal(6)).toBe('6th')
    expect(formatNumberToOrdinal(7)).toBe('7th')
    expect(formatNumberToOrdinal(8)).toBe('8th')
    expect(formatNumberToOrdinal(9)).toBe('9th')
  })
})
