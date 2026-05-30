import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationContent,
  PaginationPrevious,
  PaginationEllipsis,
} from '../../atoms'
import { getPageItems, isEllipsis } from './utils'

interface PaginateProps {
  totalPages: number
  currentPage: number
  onGoToPage: (page: number) => void
  onNext: () => void
  onPrev: () => void
}

export const Paginate = ({
  currentPage,
  totalPages,
  onGoToPage,
  onNext,
  onPrev,
}: PaginateProps) => {
  const pageItems = getPageItems({ currentPage, totalPages })

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={onPrev} />
        </PaginationItem>

        {pageItems.map((pageItem, index) =>
          isEllipsis(pageItem) ? (
            <PaginationItem key={`${pageItem}-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageItem}>
              <PaginationLink
                isActive={pageItem === currentPage}
                onClick={() => onGoToPage(pageItem)}
              >
                {pageItem}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext onClick={onNext} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
