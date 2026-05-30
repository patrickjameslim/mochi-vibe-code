export enum PaginateActionKind {
  NEXT = 'NEXT',
  PREV = 'PREV',
  SET_PAGE = 'SET_PAGE',
}

export const getPageNumber = (action: PaginateAction): number | undefined => {
  switch (action.type) {
    case PaginateActionKind.NEXT: {
      const nextPage = action.payload.currentPage + 1

      return nextPage > action.payload.totalPages ? undefined : nextPage
    }
    case PaginateActionKind.PREV: {
      const previousPage = action.payload.currentPage - 1

      return previousPage < 1 ? undefined : previousPage
    }
    case PaginateActionKind.SET_PAGE: {
      const { page, totalPages } = action.payload

      if (page < 1 || page > totalPages) {
        return undefined
      }

      return page
    }
    default:
      return undefined
  }
}

interface PaginateNextAction {
  type: PaginateActionKind.NEXT
  payload: {
    currentPage: number
    totalPages: number
  }
}

interface PaginatePrevAction {
  type: PaginateActionKind.PREV
  payload: {
    currentPage: number
  }
}

interface PaginateSetPageAction {
  type: PaginateActionKind.SET_PAGE
  payload: {
    page: number
    totalPages: number
  }
}

type PaginateAction =
  | PaginateNextAction
  | PaginatePrevAction
  | PaginateSetPageAction
