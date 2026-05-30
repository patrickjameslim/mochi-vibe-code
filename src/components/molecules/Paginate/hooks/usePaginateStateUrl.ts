import { useNavigate, useSearch } from '@tanstack/react-router'

interface UsePaginateStateUrlProps {
  /**
   * Query parameter key to sync the current page number with the URL.
   * @default 'page'
   */
  queryKey?: string
}

/**
 * Hook for managing pagination state synchronized with URL query parameters.
 */
export const usePaginateStateUrl = ({
  queryKey = 'page',
}: UsePaginateStateUrlProps) => {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const currentPage: number = search[queryKey] ?? 1

  const handlePageChange = (page?: number): void => {
    if (!page || page === currentPage) {
      return
    }

    const newSearch = { ...search }

    if (page === 1) {
      delete newSearch[queryKey]
    } else {
      newSearch[queryKey] = page
    }

    navigate({
      search: newSearch,
      resetScroll: false,
    })
  }

  return {
    currentPage,
    handlePageChange,
  }
}
