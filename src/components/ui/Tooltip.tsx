import * as RadixTooltip from '@radix-ui/react-tooltip';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function Tooltip({ content, children, wide = false }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={300}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side="top"
          sideOffset={6}
          className={[
            'z-50 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md',
            wide ? 'max-w-xs whitespace-normal leading-relaxed' : 'whitespace-nowrap',
          ].join(' ')}
        >
          {content}
          <RadixTooltip.Arrow className="fill-gray-900" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>
  );
}
