const rules = new Intl.PluralRules('en', { type: 'ordinal' })
const suffixes: Record<Intl.LDMLPluralRule, string> = {
  zero: '',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
}

export const formatNumberToOrdinal = (number: number) =>
  `${number}${suffixes[rules.select(number)]}`
