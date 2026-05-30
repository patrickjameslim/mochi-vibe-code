import { Button, Input, RadioGroup, RadioGroupItem, Text } from '../../atoms'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from './Field'

export const FieldSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Text as="h3">Basic Field</Text>
      </div>
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Profile</FieldLegend>
            <FieldDescription>
              This appears on invoices and emails.
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" autoComplete="off" placeholder="Evil Rabbit" />
                <FieldDescription>
                  This appears on invoices and emails.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input id="username" autoComplete="off" aria-invalid />
                <FieldError>Choose another username.</FieldError>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Subscription Plan</FieldLegend>
            <FieldDescription>
              Yearly and lifetime plans offer significant savings.
            </FieldDescription>
            <RadioGroup>
              <Field orientation="horizontal">
                <RadioGroupItem
                  value="monthly"
                  id="plan-monthly"
                  aria-invalid
                />
                <FieldLabel htmlFor="plan-monthly" className="font-normal">
                  Monthly ($9.99/month)
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="yearly" id="plan-yearly" aria-invalid />
                <FieldLabel htmlFor="plan-yearly" className="font-normal">
                  Yearly ($99.99/year)
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem
                  value="lifetime"
                  id="plan-lifetime"
                  aria-invalid
                />
                <FieldLabel htmlFor="plan-lifetime" className="font-normal">
                  Lifetime ($299.99)
                </FieldLabel>
              </Field>
            </RadioGroup>
            <FieldError>Select atleast one option</FieldError>
          </FieldSet>
        </FieldGroup>
      </form>
      <div>
        <Text as="h3">Responsive Field</Text>
      </div>
      <FieldResponsive />
    </div>
  )
}

export const FieldResponsive = () => {
  return (
    <div className="w-full">
      <form>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  Provide your full name for identification
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Name" required />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="lastName">Short Message</FieldLabel>
                <FieldDescription>
                  You can write your short message here. Keep it short,
                  preferably under 100 characters.
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Short message" required />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
