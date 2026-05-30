import { FC } from 'react'
import { Text } from '../Text'
import { Progress } from './Progress'

export const ProgressSandbox: FC = () => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-2">
      <Text as="h3">Progress</Text>
    </div>

    <div className="flex flex-col gap-2">
      <div>
        <Text className="font-semibold">Primary/Default</Text>
        <Progress color={'success'} value={50} />
      </div>

      <div>
        <Text className="font-semibold">Danger</Text>
        <Progress color={'danger'} value={50} />
      </div>
    </div>
  </div>
)
