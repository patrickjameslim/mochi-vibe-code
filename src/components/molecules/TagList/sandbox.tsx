import { Text } from '../../atoms'
import { BadgeVariants } from '../../atoms/Badge/Badge'
import { TagList } from './TagList'

const SAMPLE_TAGS = [
  ['Design', 'Development', 'Marketing'],
  ['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL'],
  [
    'Urgent',
    'High Priority',
    'Bug',
    'Feature Request',
    'Documentation',
    'Performance',
  ],
  ['Q1', 'Q2', 'Q3', 'Q4', 'Annual', 'Monthly', 'Weekly', 'Daily'],
  ['Frontend'],
] as const

const COLOR_SCHEMES: BadgeVariants['colorScheme'][] = [
  'primary',
  'secondary',
  'panda',
  'emerald',
  'red',
  'yellow',
  'blue',
  'amber',
  'violet',
] as const

export const TagListSandbox = () => (
  <div className="flex flex-col gap-8">
    <div>
      <Text as="h3">Tag List</Text>
      <Text>
        A reusable component that displays a list of tags with overflow
        handling. Shows only a specified number of tags and displays remaining
        tags in a tooltip.
      </Text>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Default behavior (max 2 visible tags)</Text>
      <div className="flex flex-col gap-4">
        {SAMPLE_TAGS.map((tags) => (
          <div key={tags.join('-')} className="flex flex-col gap-2">
            <Text className="text-sm text-muted-foreground">
              {tags.length} tag{tags.length !== 1 ? 's' : ''}: {tags.join(', ')}
            </Text>
            <TagList tags={[...tags]} />
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Custom max visible tags</Text>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">maxVisible=3</Text>
          <TagList
            tags={['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL']}
            maxVisible={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">maxVisible=4</Text>
          <TagList
            tags={[
              'Urgent',
              'High Priority',
              'Bug',
              'Feature Request',
              'Documentation',
            ]}
            maxVisible={4}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">maxVisible=1</Text>
          <TagList
            tags={['Design', 'Development', 'Marketing', 'Sales']}
            maxVisible={1}
          />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Different color schemes</Text>
      <div className="flex flex-col gap-4">
        {COLOR_SCHEMES.map((colorScheme) => (
          <div key={colorScheme} className="flex flex-col gap-2">
            <Text className="text-sm text-muted-foreground capitalize">
              {colorScheme}
            </Text>
            <TagList
              tags={['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4']}
              badgeColorScheme={colorScheme}
            />
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Empty state</Text>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Default empty text
          </Text>
          <TagList tags={[]} />
        </div>
        <div className="flex flex-col gap-2">
          <Text className="text-sm text-muted-foreground">
            Custom empty text
          </Text>
          <TagList tags={[]} emptyText="No tags available" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <Text as="h4">Table usage example</Text>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Name</th>
              <th className="text-left p-3 text-sm font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">Project Alpha</td>
              <td className="p-3">
                <TagList tags={['Design', 'Development', 'Marketing']} />
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Project Beta</td>
              <td className="p-3">
                <TagList
                  tags={[
                    'React',
                    'TypeScript',
                    'Node.js',
                    'GraphQL',
                    'PostgreSQL',
                  ]}
                />
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Project Gamma</td>
              <td className="p-3">
                <TagList tags={['Frontend']} />
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Project Delta</td>
              <td className="p-3">
                <TagList tags={[]} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
