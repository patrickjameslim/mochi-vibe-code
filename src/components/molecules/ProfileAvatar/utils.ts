export const getInitials = ({
  name,
  noOfInitials = 2,
}: {
  name: string
  noOfInitials?: number
}) =>
  name
    .split(' ')
    .slice(0, noOfInitials)
    .map((i) => i[0])
    .join('')
    .toUpperCase()

export const generateAvatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const h = hash % 360
  // Sets to pastel color range
  const s = 75
  const l = 85

  return {
    backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
    textColor: `hsl(${h}, ${s}%, 30%)`,
  }
}
