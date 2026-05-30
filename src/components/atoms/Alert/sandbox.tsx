import { Text } from '../Text'
import { Alert, AlertDescription, AlertTitle } from './Alert'

export const AlertSandbox = () => {
  return (
    <div className="flex flex-col gap-4">
      <Text as="h3">Alert</Text>

      <Alert>
        <AlertTitle>This is the default alert variant</AlertTitle>
        <AlertDescription>
          Email notifications are disabled for this invoice.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>This is the destructive alert variant</AlertTitle>
        <AlertDescription>
          Email notifications are disabled for this invoice.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>This is the warning alert variant</AlertTitle>
        <AlertDescription>
          Email notifications are disabled for this invoice.
        </AlertDescription>
      </Alert>

      <Text as="h4">Customizations</Text>
      <Alert>
        <AlertTitle>Title only</AlertTitle>
      </Alert>
    </div>
  )
}
