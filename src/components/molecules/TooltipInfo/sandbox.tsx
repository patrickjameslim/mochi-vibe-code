import { Text } from '../../atoms'
import { TooltipInfo } from './TooltipInfo'

export const TooltipInfoSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <Text as="h3">Tooltip Info</Text>

      <div className="flex gap-2">
        <Text>Default</Text>
        <TooltipInfo content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." />
      </div>

      <div className="flex gap-2">
        <Text>With example</Text>
        <TooltipInfo
          content="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          examples={['lorem', 'ipsum', 'dolor']}
        />
      </div>
    </div>
  )
}
