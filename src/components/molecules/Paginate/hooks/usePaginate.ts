import { getPageNumber, PaginateActionKind } from './getPageNumber'

interface UsePaginateProps {
  /**
   * Current active page number (1-indexed)
   */
  currentPage: number
  /**
   *  Callback function called when page changes
   */
  onPageChange: (page?: number) => void
  /**
   * Total number of pages available
   */
  totalPages: number
}

/**
 * Hook for handling the Paginate component actions and state management.
 *
 * This hook provides pagination functionality with navigation methods (next, previous, go to page)
 * and can be used with different state management strategies.
 *
 * @example
 * // Use Case 1: Synced with URL
 * // Use this when you want pagination state to be reflected in the URL query parameters
 * import { usePaginateActions, usePaginateStateUrl } from '@mochi/components'
 *
 * const MyComponent = () => {
 *   const { currentPage, handlePageChange } = usePaginateStateUrl({ queryKey: 'page' })
 *
 *   const paginateProps = usePaginateActions({
 *     currentPage,
 *     onPageChange: handlePageChange,
 *     totalPages: 10,
 *   })
 *
 *   return (
 *     <Paginate {...paginateProps} currentPage={currentPage} />
 *   )
 * }
 *
 * @example
 * // Use Case 2: Local only
 * // Use this when you want pagination state managed locally without URL synchronization
 * import { usePaginateActions, usePaginateStateLocal } from '@mochi/components'
 *
 * const MyComponent = () => {
 *   const { currentPage, handlePageChange } = usePaginateStateLocal()
 *
 *   const paginateProps = usePaginateActions({
 *     currentPage,
 *     onPageChange: handlePageChange,
 *     totalPages: 5,
 *   })
 *
 *   return (
 *     <Paginate {...paginateProps} currentPage={currentPage} />
 *   )
 * }
 *
 * @example
 * // Use Case 3: Custom state management
 * // You can implement your own state management logic for specific use cases
 * // (e.g., Redux, Zustand, server state, or any custom logic)
 * import { usePaginate } from '@mochi/components'
 * import { useMyCustomPaginationState } from './custom-hooks'
 *
 * const MyComponent = () => {
 *   // Custom implementation - could be Redux, Zustand, server state, etc.
 *   const { currentPage, handlePageChange } = useMyCustomPaginationState()
 *
 *   const paginateProps = usePaginate({
 *     currentPage,
 *     onPageChange: handlePageChange,
 *     totalPages: 15,
 *   })
 *
 *   return (
 *     <Paginate {...paginateProps} />
 *   )
 * }
 */
export const usePaginate = ({
  totalPages,
  onPageChange,
  currentPage,
}: UsePaginateProps) => {
  const onGoToPage = (page: number) =>
    onPageChange(
      getPageNumber({
        type: PaginateActionKind.SET_PAGE,
        payload: { page, totalPages },
      })
    )

  const onNext = () =>
    onPageChange(
      getPageNumber({
        type: PaginateActionKind.NEXT,
        payload: { currentPage, totalPages },
      })
    )

  const onPrev = () =>
    onPageChange(
      getPageNumber({
        type: PaginateActionKind.PREV,
        payload: { currentPage },
      })
    )

  return {
    currentPage,
    onGoToPage,
    onNext,
    onPrev,
    totalPages,
  }
}
