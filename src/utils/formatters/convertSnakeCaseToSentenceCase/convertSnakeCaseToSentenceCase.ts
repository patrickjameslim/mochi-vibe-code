/**
 * @param str snake case value to convert to sentence case
 * @returns string
 */
export const convertSnakeCaseToSentenceCase = (str: string): string => {
  const text = str.split('_').join(' ')

  return text.charAt(0).toUpperCase() + text.toLowerCase().slice(1)
}
