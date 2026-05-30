import { useState } from 'react'

/**
 * Hook for managing pagination state locally within the component.
 */
export const usePaginateStateLocal = () => {
  const [currentPage, setCurrentPage] = useState<number>(1)

  const handlePageChange = (page?: number): void => {
    if (!page || page === currentPage) {
      return
    }

    setCurrentPage(page)
  }

  return {
    currentPage,
    handlePageChange,
  }
}
