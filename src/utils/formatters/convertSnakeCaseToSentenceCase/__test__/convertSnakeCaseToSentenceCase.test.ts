import { convertSnakeCaseToSentenceCase } from '../convertSnakeCaseToSentenceCase.js'

describe('convertSnakeCaseToSentenceCase', () => {
  it('should format snake case string to sentence case', () => {
    expect(convertSnakeCaseToSentenceCase('i_am_a_string')).toBe(
      'I am a string'
    )
  })

  it('should format enum values snake case to sentence case', () => {
    enum TestEnum {
      FIRST_VALUE = 'FIRST_VALUE',
      SECOND_VALUE = 'SECOND_VALUE',
      THIRD_VALUE = 'THIRD_VALUE',
    }

    expect(
      Object.values(TestEnum).map((str) => convertSnakeCaseToSentenceCase(str))
    ).toEqual(['First value', 'Second value', 'Third value'])
  })
})
