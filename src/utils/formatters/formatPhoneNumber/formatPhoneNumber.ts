import { CountryCode } from 'libphonenumber-js/core'
import {
  formatPhoneNumberIntl,
  getCountryCallingCode,
  isValidPhoneNumber,
} from 'react-phone-number-input'

export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode: CountryCode = 'PH'
): string => {
  if (phoneNumber.trim() === '') {
    return 'N/A'
  }

  const callingCode = getCountryCallingCode(countryCode)
  const formattedPhoneNumber =
    countryCode === 'PH' && phoneNumber.startsWith('+63')
      ? phoneNumber
      : `+${callingCode}${phoneNumber}`

  if (!isValidPhoneNumber(phoneNumber, countryCode)) {
    return phoneNumber
  }

  return formatPhoneNumberIntl(formattedPhoneNumber)
}
