export type DropzoneAction =
  | AddAction
  | SetAction
  | SetErrorsAction
  | SetProgressAction
  | RemoveAction
  | RemoveAllAction

export interface DropzoneItem {
  errors?: readonly string[]
  file?: File
  isExistingFile?: boolean
  name: string
  progress?: number
  s3Key: string
  size: number
  type: string
  url?: string
}

export enum DropzoneActionKind {
  ADD = 'ADD',
  SET = 'SET',
  SET_ERRORS = 'SET_ERRORS',
  SET_PROGRESS = 'SET_PROGRESS',
  REMOVE = 'REMOVE',
  REMOVE_ALL = 'REMOVE_ALL',
}

interface AddAction {
  type: DropzoneActionKind.ADD
  payload: readonly {
    file: File
    name: string
    progress?: number
    s3Key: string
    size: number
    url?: string
    type: string
    errors?: readonly string[]
  }[]
}

interface SetAction {
  type: DropzoneActionKind.SET
  payload: readonly {
    file: File
    name: string
    progress?: number
    s3Key: string
    size: number
    url?: string
    type: string
    errors?: readonly string[]
  }[]
}

interface SetErrorsAction {
  type: DropzoneActionKind.SET_ERRORS
  payload: {
    s3Key: string
    errors: readonly string[]
  }
}

interface SetProgressAction {
  type: DropzoneActionKind.SET_PROGRESS
  payload: {
    s3Key: string
    progress: number
  }
}

interface RemoveAction {
  type: DropzoneActionKind.REMOVE
  payload: {
    s3Key: string
  }
}

interface RemoveAllAction {
  type: DropzoneActionKind.REMOVE_ALL
}

type DropzoneState = readonly DropzoneItem[]

export const dropzoneReducer = (
  state: DropzoneState,
  action: DropzoneAction
): DropzoneState => {
  const { type } = action
  switch (type) {
    case DropzoneActionKind.REMOVE_ALL: {
      return []
    }
    case DropzoneActionKind.ADD: {
      return [...state, ...action.payload]
    }
    case DropzoneActionKind.SET: {
      return [...action.payload]
    }
    case DropzoneActionKind.SET_ERRORS: {
      const { s3Key, errors } = action.payload
      return state.map((item) => {
        if (item.s3Key === s3Key) {
          item.errors = errors
        }
        return item
      })
    }
    case DropzoneActionKind.SET_PROGRESS: {
      const { s3Key, progress } = action.payload
      return state.map((item) => {
        if (item.s3Key === s3Key) {
          item.progress = progress
        }
        return item
      })
    }
    case DropzoneActionKind.REMOVE: {
      return state.filter((item) => item.s3Key !== action.payload.s3Key)
    }
    default: {
      return state
    }
  }
}
