import { Text } from './Text'

export const TextSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text as="h3">Text</Text>

        <Text as="h1">Heading 1</Text>
        <Text as="h2">Heading 2</Text>
        <Text as="h3">Heading 3</Text>
        <Text as="h4">Heading 4</Text>
        <Text>paragraph</Text>
        <Text as="muted">muted</Text>
      </div>

      <div className="flex flex-col gap-2">
        <Text as="h3">Font weight</Text>

        <Text as="span" className="font-extralight">
          Extralight: 200
        </Text>
        <Text as="span" className="font-light">
          Light: 300
        </Text>
        <Text as="span">Normal: 400</Text>
        <Text as="span" className="font-medium">
          Medium: 500
        </Text>
        <Text as="span" className="font-semibold">
          Semibold: 600
        </Text>
        <Text as="span" className="font-bold">
          Bold: 700
        </Text>
        <Text as="span" className="font-extrabold">
          Extrabold: 800
        </Text>
      </div>
    </div>
  )
}
