interface GetMiddlePagesProps {
  currentPage: number
  totalPages: number
}

export const getPageItems = ({
  currentPage,
  totalPages,
}: GetMiddlePagesProps): readonly PageItem[] => {
  // Handles edge cases when the currentPage or totalPages is less than or equal to 0
  if (currentPage <= 0 || totalPages <= 0) {
    return [1]
  }

  if (totalPages <= NUMBER_OF_ITEMS_TO_SHOW) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  // Near the beginning
  if (currentPage <= NUMBER_OF_ITEMS_TO_SHOW - 2) {
    return [1, 2, 3, 4, 5, ELLIPSIS, totalPages]
  }

  // Near the end
  if (currentPage >= totalPages - 4) {
    return [
      1,
      ELLIPSIS,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  // In the middle
  return [
    1,
    ELLIPSIS,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    ELLIPSIS,
    totalPages,
  ]
}

const ELLIPSIS = 'ellipsis' as const
const NUMBER_OF_ITEMS_TO_SHOW = 7 as const
type PageItem = number | 'ellipsis'

export const isEllipsis = (item: PageItem): item is 'ellipsis' =>
  item === ELLIPSIS
