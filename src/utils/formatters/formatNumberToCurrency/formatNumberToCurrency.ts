import { formatNumericDisplay } from '../formatNumericDisplay/formatNumericDisplay.js'

export enum CurrencyCode {
  PHP = 'PHP',
  USD = 'USD',
}

export const CurrencyData: Record<
  CurrencyCode,
  { name: string; symbol: string }
> = {
  [CurrencyCode.PHP]: {
    name: 'Philippine Peso',
    symbol: '₱',
  },
  [CurrencyCode.USD]: {
    name: 'US Dollar',
    symbol: '$',
  },
}

interface FormatNumberToCurrencyProps {
  data: number
  currencyCode: CurrencyCode
  useCurrencyCode?: boolean
}

export const formatNumberToCurrency = ({
  data,
  currencyCode,
  useCurrencyCode,
}: FormatNumberToCurrencyProps): string =>
  `${
    useCurrencyCode ? currencyCode : CurrencyData[currencyCode].symbol
  } ${formatNumericDisplay(data)}`
