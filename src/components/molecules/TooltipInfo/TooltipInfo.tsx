import { InfoIcon } from '@phosphor-icons/react'

import { Text, Tooltip, TooltipContent, TooltipTrigger } from '../../atoms'
import { cn } from '../../utils'

export interface TooltipInfoProps {
  content: string
  examples?: readonly string[]
  className?: string
}

export const TooltipInfo = ({
  content,
  examples,
  className,
}: TooltipInfoProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <InfoIcon
        className={cn('text-primary', className)}
        aria-label={content}
        tabIndex={0}
        onClick={(e) => e.preventDefault()}
        onKeyDown={(e) => e.preventDefault()}
      />
    </TooltipTrigger>

    <TooltipContent className="max-w-80 text-wrap">
      <div className="flex flex-col justify-center gap-2">
        <Text className="leading-4">{content}</Text>

        {examples && (
          <ul className="list-disc list-outside pl-3 space-y-1">
            {examples.map((example, index) => (
              <li key={index}>{example}</li>
            ))}
          </ul>
        )}
      </div>
    </TooltipContent>
  </Tooltip>
)
