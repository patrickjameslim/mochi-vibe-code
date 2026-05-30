import { Text } from '../../atoms'
import { AccordionCard } from './AccordionCard'

export const AccordionCardSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <Text as="h3">Accordion Card</Text>

      <Text as="h4">Basic</Text>
      <AccordionCard defaultValue="item-1">
        <AccordionCard.Item value="item-1">
          <AccordionCard.Trigger>
            <div className="space-y-1">
              <Text className="font-medium">What is AccordionCard?</Text>
              <Text className="text-sm text-muted-foreground">
                Learn about the AccordionCard component
              </Text>
            </div>
          </AccordionCard.Trigger>
          <AccordionCard.Content>
            <Text>
              AccordionCard is a styled accordion component that wraps items in
              cards for a more modern look. It's perfect for FAQs, settings
              panels, and multi-step forms.
            </Text>
          </AccordionCard.Content>
        </AccordionCard.Item>

        <AccordionCard.Item value="item-2">
          <AccordionCard.Trigger>
            <div className="space-y-1">
              <Text className="font-medium">
                How is it different from Accordion?
              </Text>
              <Text className="text-sm text-muted-foreground">
                Understanding the differences
              </Text>
            </div>
          </AccordionCard.Trigger>
          <AccordionCard.Content>
            <Text>
              Unlike the basic Accordion, AccordionCard includes card styling,
              optional step numbers, and a cleaner visual hierarchy. It's
              designed for more complex content layouts.
            </Text>
          </AccordionCard.Content>
        </AccordionCard.Item>

        <AccordionCard.Item value="item-3">
          <AccordionCard.Trigger>
            <div className="space-y-1">
              <Text className="font-medium">Can I customize it?</Text>
              <Text className="text-sm text-muted-foreground">
                Customization options available
              </Text>
            </div>
          </AccordionCard.Trigger>
          <AccordionCard.Content>
            <Text>
              Yes! You can customize the appearance using className props, add
              step numbers, and include any React components in the content
              area.
            </Text>
          </AccordionCard.Content>
        </AccordionCard.Item>
      </AccordionCard>

      <Text as="h4">With Step Numbers</Text>
      <AccordionCard defaultValue="step-1" displayStepNumber>
        <AccordionCard.Item value="step-1">
          <AccordionCard.Trigger>
            <div className="space-y-1">
              <Text className="font-medium">Create your account</Text>
              <Text className="text-sm text-muted-foreground">
                Get started by creating a new account
              </Text>
            </div>
          </AccordionCard.Trigger>
          <AccordionCard.Content>
            <Text>
              Fill in your email, password, and basic information to create your
              account. You'll receive a verification email after registration.
            </Text>
          </AccordionCard.Content>
        </AccordionCard.Item>

        <AccordionCard.Item value="step-2">
          <AccordionCard.Trigger>
            <div className="space-y-1">
              <Text className="font-medium">Verify your email</Text>
              <Text className="text-sm text-muted-foreground">
                Check your inbox for the verification link
              </Text>
            </div>
          </AccordionCard.Trigger>
          <AccordionCard.Content>
            <Text>
              Click the verification link sent to your email address. If you
              don't see it, check your spam folder or request a new verification
              email.
            </Text>
          </AccordionCard.Content>
        </AccordionCard.Item>

        <AccordionCard.Item value="step-3">
          <AccordionCard.Trigger>
            <div className="space-y-1">
              <Text className="font-medium">Complete your profile</Text>
              <Text className="text-sm text-muted-foreground">
                Add additional information to personalize your experience
              </Text>
            </div>
          </AccordionCard.Trigger>
          <AccordionCard.Content>
            <Text>
              Upload a profile picture, add your bio, and configure your
              preferences. This helps us provide a better experience tailored to
              your needs.
            </Text>
          </AccordionCard.Content>
        </AccordionCard.Item>
      </AccordionCard>
    </div>
  )
}
