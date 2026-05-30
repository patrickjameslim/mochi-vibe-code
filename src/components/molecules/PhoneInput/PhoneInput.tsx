import * as React from 'react'
import { CheckIcon, CaretUpDownIcon } from '@phosphor-icons/react'
import * as RPNInput from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../Command'
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from '../../atoms'
import { defaultInputGroupSize } from '../InputGroup'
import type { InputGroupSize } from '../InputGroup/context'
import { cn } from '../../utils'

type PhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value' | 'ref' | 'size'
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
    onChange?: (value: RPNInput.Value) => void
    size?: InputGroupSize
  }

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<
    React.ComponentRef<typeof RPNInput.default>,
    PhoneInputProps
  >(
    (
      { className, onChange, value, size = defaultInputGroupSize, ...props },
      ref
    ) => {
      const CustomInputComponent = React.useMemo(
        () => (inputProps: InputComponentProps) => {
          const { size: htmlSize, ...restInputProps } = inputProps
          return <InputComponent {...restInputProps} size={size} />
        },
        [size]
      )

      const CustomCountrySelect = React.useMemo(
        () => (countryProps: CountrySelectProps) =>
          <CountrySelect {...countryProps} size={size} />,
        [size]
      )

      return (
        <RPNInput.default
          ref={ref}
          className={cn('flex', className)}
          flagComponent={FlagComponent}
          countrySelectComponent={CustomCountrySelect}
          inputComponent={CustomInputComponent}
          smartCaret={false}
          value={value || undefined}
          /**
           * Handles the onChange event.
           *
           * react-phone-number-input might trigger the onChange event as undefined
           * when a valid phone number is not entered. To prevent this,
           * the value is coerced to an empty string.
           *
           * @param {E164Number | undefined} value - The entered value
           */
          onChange={(value) => onChange?.(value || ('' as RPNInput.Value))}
          {...props}
        />
      )
    }
  )
PhoneInput.displayName = 'PhoneInput'

type InputComponentProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  size?: InputGroupSize
}

const InputComponent = React.forwardRef<HTMLInputElement, InputComponentProps>(
  ({ className, size = defaultInputGroupSize, ...props }, ref) => {
    return (
      <Input
        className={cn('rounded-e-lg rounded-s-none', className)}
        size={size}
        {...props}
        ref={ref}
      />
    )
  }
)

InputComponent.displayName = 'InputComponent'

type CountryEntry = { label: string; value: RPNInput.Country | undefined }

type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  options: CountryEntry[]
  onChange: (country: RPNInput.Country) => void
  size?: InputGroupSize
}

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
  size = defaultInputGroupSize,
}: CountrySelectProps) => {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open)
        open && setSearchValue('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          size={size}
          variant="outline"
          colorScheme="secondary"
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
          disabled={disabled}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <CaretUpDownIcon
            className={cn(
              '-mr-2 size-4 opacity-50',
              disabled ? 'hidden' : 'opacity-100'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const selectedEl = document.querySelector(
            `[data-country="${selectedCountry}"]`
          ) as HTMLElement | null
          if (selectedEl) {
            selectedEl.focus()
            selectedEl.scrollIntoView({ block: 'nearest' })
          }
        }}
      >
        <Command value={selectedCountry}>
          <CommandInput
            value={searchValue}
            onValueChange={(value: string) => {
              setSearchValue(value)
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    '[data-radix-scroll-area-viewport]'
                  )
                  if (viewportElement) {
                    viewportElement.scrollTop = 0
                  }
                }
              }, 0)
            }}
            placeholder="Search country..."
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={onChange}
                      onSelectComplete={() => setIsOpen(false)}
                    />
                  ) : null
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country
  onChange: (country: RPNInput.Country) => void
  onSelectComplete: () => void
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country)
    onSelectComplete()
  }
  const isSelected = country === selectedCountry
  return (
    <CommandItem
      className="gap-2"
      onSelect={handleSelect}
      data-country={country}
      data-state={isSelected ? 'checked' : undefined}
      aria-selected={isSelected}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(
        country
      )}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${
          country === selectedCountry ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </CommandItem>
  )
}

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country]

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  )
}

export { PhoneInput }
