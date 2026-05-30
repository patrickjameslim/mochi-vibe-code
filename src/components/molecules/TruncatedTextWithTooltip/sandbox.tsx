import { Text } from '../../atoms'
import { TruncatedTextWithTooltip } from './TruncatedTextWithTooltip'

const SHORT_TEXT = 'This is a short text'
const MEDIUM_TEXT =
  'This is a medium length text that might be truncated depending on the container width'
const LONG_TEXT =
  'This is a very long text that will definitely be truncated in most cases. It contains multiple sentences and should demonstrate the tooltip functionality very well. You can hover over the truncated text to see the full content in a tooltip. This makes it perfect for displaying long descriptions, comments, or any text content that needs to be constrained to a specific width while still being accessible to users.'

export const TruncatedTextWithTooltipSandbox = () => (
  <div className="flex flex-col gap-8">
    <div>
      <Text as="h3">Truncated Text With Tooltip</Text>
      <Text>
        A smart component that displays single-line text with automatic
        truncation detection. Shows a tooltip with the full text only when the
        content is actually truncated.
      </Text>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Basic usage (default max width)</Text>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Short text (no tooltip)
          </Text>
          <TruncatedTextWithTooltip text={SHORT_TEXT} />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Medium text (may show tooltip)
          </Text>
          <TruncatedTextWithTooltip text={MEDIUM_TEXT} />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Long text (shows tooltip)
          </Text>
          <TruncatedTextWithTooltip text={LONG_TEXT} />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Custom max width</Text>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">max-w-20</Text>
          <TruncatedTextWithTooltip text={MEDIUM_TEXT} className="max-w-20" />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">max-w-40</Text>
          <TruncatedTextWithTooltip text={MEDIUM_TEXT} className="max-w-40" />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">max-w-80</Text>
          <TruncatedTextWithTooltip text={MEDIUM_TEXT} className="max-w-80" />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            max-w-full (no truncation)
          </Text>
          <TruncatedTextWithTooltip text={MEDIUM_TEXT} className="max-w-full" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Empty state</Text>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Default empty text
          </Text>
          <TruncatedTextWithTooltip text="" />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Custom empty text
          </Text>
          <TruncatedTextWithTooltip
            text=""
            emptyText="No description available"
          />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Table usage example</Text>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-sm font-medium w-32">
                Product
              </th>
              <th className="text-left p-3 text-sm font-medium">Description</th>
              <th className="text-left p-3 text-sm font-medium w-40">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">Product A</td>
              <td className="p-3">
                <TruncatedTextWithTooltip
                  text="High-quality product with excellent features"
                  className="max-w-60"
                />
              </td>
              <td className="p-3">
                <TruncatedTextWithTooltip
                  text={SHORT_TEXT}
                  className="italic text-muted-foreground max-w-36"
                />
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Product B</td>
              <td className="p-3">
                <TruncatedTextWithTooltip
                  text={MEDIUM_TEXT}
                  className="max-w-60"
                />
              </td>
              <td className="p-3">
                <TruncatedTextWithTooltip
                  text={LONG_TEXT}
                  className="italic text-muted-foreground max-w-36"
                />
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Product C</td>
              <td className="p-3">
                <TruncatedTextWithTooltip
                  text={LONG_TEXT}
                  className="max-w-60"
                />
              </td>
              <td className="p-3">
                <TruncatedTextWithTooltip
                  text=""
                  className="italic text-muted-foreground max-w-36"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
