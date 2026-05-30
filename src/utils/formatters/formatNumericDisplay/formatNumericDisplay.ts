export const formatNumericDisplay = (data: number): string =>
  data.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: data === 0 ? 0 : 2,
  })
