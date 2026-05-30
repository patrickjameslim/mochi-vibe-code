import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
} from '../../atoms'
import { cn } from '../../utils'
import {
  createContext,
  useContext,
  ReactNode,
  PropsWithChildren,
  FC,
} from 'react'

interface AccordionCardContextValue {
  displayStepNumber?: boolean
  currentIndex: number
}

const AccordionCardContext = createContext<AccordionCardContextValue | null>(
  null
)

const useAccordionCardContext = () => {
  const context = useContext(AccordionCardContext)
  if (!context) {
    throw new Error(
      'AccordionCard compound components must be used within AccordionCard'
    )
  }
  return context
}

interface AccordionCardProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  displayStepNumber?: boolean
  children: ReactNode
  className?: string
}

interface AccordionCardItemProps {
  value: string
  children: ReactNode
  disabled?: boolean
}

interface AccordionCardContentProps {
  children: ReactNode
  className?: string
}

type AccordionCardComponent = FC<AccordionCardProps> & {
  Item: typeof AccordionCardItem
  Trigger: typeof AccordionCardTrigger
  Content: typeof AccordionCardContent
}

export const AccordionCard: AccordionCardComponent = ({
  value,
  onValueChange,
  defaultValue,
  displayStepNumber,
  children,
  className,
}: AccordionCardProps) => {
  const items = Array.isArray(children) ? children : [children]

  return (
    <div className={cn('w-full', className)}>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultValue}
        className="space-y-4"
        value={value}
        onValueChange={onValueChange}
      >
        {items.map((child, index) => (
          <AccordionCardContext.Provider
            key={index}
            value={{ displayStepNumber, currentIndex: index }}
          >
            {child}
          </AccordionCardContext.Provider>
        ))}
      </Accordion>
    </div>
  )
}

const AccordionCardItem = ({
  value,
  disabled,
  children,
}: AccordionCardItemProps) => {
  useAccordionCardContext()

  return (
    <AccordionItem value={value} className="border-none" disabled={disabled}>
      <Card className="shadow-none py-3">
        <CardContent>{children}</CardContent>
      </Card>
    </AccordionItem>
  )
}

const AccordionCardTrigger = ({ children }: PropsWithChildren) => {
  const { displayStepNumber, currentIndex } = useAccordionCardContext()

  return (
    <AccordionTrigger className="flex items-start gap-4 flex-1 hover:no-underline">
      {displayStepNumber && (
        <div className="flex items-center justify-center size-10 rounded-full bg-card border text-muted-foreground font-semibold shrink-0">
          {currentIndex + 1}
        </div>
      )}
      <div className="space-y-1 flex-1">{children}</div>
    </AccordionTrigger>
  )
}

const AccordionCardContent = ({
  children,
  className,
}: AccordionCardContentProps) => {
  useAccordionCardContext()

  return (
    <AccordionContent
      className={cn('h-full flex flex-col w-full pt-4', className)}
    >
      {children}
    </AccordionContent>
  )
}

AccordionCard.Item = AccordionCardItem
AccordionCard.Trigger = AccordionCardTrigger
AccordionCard.Content = AccordionCardContent
