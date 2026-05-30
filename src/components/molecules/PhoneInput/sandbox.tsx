import { useForm } from '@tanstack/react-form'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { PhoneInput } from './PhoneInput'
import { Text } from '../../atoms'

export const PhoneInputSandbox = () => {
  const form = useForm({
    defaultValues: {
      phone: '',
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <Text as="h3">Phone Input Form</Text>

      <form className="flex flex-col gap-4">
        <form.Field
          name="phone"
          validators={{
            onBlur: ({ value }) =>
              value && !isValidPhoneNumber(value)
                ? 'Invalid phone number'
                : undefined,
          }}
        >
          {(field) => (
            <div>
              <PhoneInput
                defaultCountry="PH"
                international={true}
                countryCallingCodeEditable={false}
                limitMaxLength={true}
                datatype="tel"
                value={field.state.value}
                onChange={(val) => field.handleChange(val || '')}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors && (
                <Text className="text-destructive text-sm mt-1">
                  {field.state.meta.errors[0]}
                </Text>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="phone"
          validators={{
            onBlur: ({ value }) =>
              value && !isValidPhoneNumber(value)
                ? 'Invalid phone number'
                : undefined,
          }}
        >
          {(field) => (
            <div>
              <PhoneInput
                size="xl"
                defaultCountry="PH"
                international={true}
                countryCallingCodeEditable={false}
                limitMaxLength={true}
                datatype="tel"
                value={field.state.value}
                onChange={(val) => field.handleChange(val || '')}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors && (
                <Text className="text-destructive text-sm mt-1">
                  {field.state.meta.errors[0]}
                </Text>
              )}
            </div>
          )}
        </form.Field>
      </form>
    </div>
  )
}
