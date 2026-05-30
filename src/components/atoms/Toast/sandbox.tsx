import { toast } from 'sonner'
import { Button } from '../Button'
import { Text } from '../Text'

export const ToastSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text as="h3">Toast</Text>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => toast('Event has been created')}
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success('Event has been created')}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info('Be at the area 10 minutes before the event time')
          }
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning('Event start time cannot be earlier than 8am')
          }
        >
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error('Event has not been created')}
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.promise<{ name: string }>(
              () =>
                new Promise((resolve) =>
                  setTimeout(() => resolve({ name: 'Event' }), 2000)
                ),
              {
                loading: 'Loading...',
                success: (data) => `${data.name} has been created`,
                error: 'Error',
              }
            )
          }}
        >
          Promise
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast('Event has been created', {
              description: 'Sunday, December 03, 2023 at 9:00 AM',
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            })
          }
        >
          Action Toast
        </Button>
      </div>
    </div>
  )
}
