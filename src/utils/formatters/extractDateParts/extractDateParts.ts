import dayjs from 'dayjs'

export const extractDateParts = (dateString: string) => {
  const date = dayjs(dateString)

  return {
    month: date.format('MMM').toUpperCase(),
    day: date.date(),
    year: date.year(),
  }
}
