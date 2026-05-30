import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'

dayjs.extend(localizedFormat)

/**
 * Formats a date into a human-readable date string ("MMM DD, YYYY")
 */
export const formatDate = (date: string | number | Date): string =>
  dayjs(date).format('ll')
