import { Text } from '../Text'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion'

export const AccordionSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <Text as="h3">Accordion</Text>

      <Text as="h4">Single</Text>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that matches the other components
            aesthetic.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Is it animated?</AccordionTrigger>
          <AccordionContent>
            Yes. It's animated by default, but you can disable it if you prefer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Text as="h4">Multiple</Text>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Can I open multiple items?</AccordionTrigger>
          <AccordionContent>
            Yes! With type="multiple", you can have multiple items open at the
            same time.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>What about styling?</AccordionTrigger>
          <AccordionContent>
            You can customize the styling using className props on any
            component.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Is it responsive?</AccordionTrigger>
          <AccordionContent>
            Yes, the accordion is fully responsive and works great on all screen
            sizes.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Text as="h4">With Default Value</Text>
      <Accordion
        type="single"
        collapsible
        defaultValue="item-2"
        className="w-full"
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>First Item</AccordionTrigger>
          <AccordionContent>
            This is the first item, but it's closed by default.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Second Item (Open by Default)</AccordionTrigger>
          <AccordionContent>
            This item is open by default because we set defaultValue="item-2".
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Third Item</AccordionTrigger>
          <AccordionContent>
            This is the third item, also closed by default.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
