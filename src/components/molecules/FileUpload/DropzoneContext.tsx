import {
  DropzoneAction,
  DropzoneItem,
  dropzoneReducer,
} from './dropzoneReducer'
import {
  createContext,
  Dispatch,
  FC,
  PropsWithChildren,
  useContext,
  useReducer,
} from 'react'

type DropzoneContextType = readonly DropzoneItem[]
export const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined
)

type DropzoneDispatchContextType = Dispatch<DropzoneAction>
export const DropzoneDispatchContext = createContext<
  DropzoneDispatchContextType | undefined
>(undefined)

interface DropzoneProviderProps {
  initialFiles?: readonly DropzoneItem[]
}

export const DropzoneProvider: FC<PropsWithChildren<DropzoneProviderProps>> = ({
  initialFiles,
  children,
}) => {
  const [files, dispatch] = useReducer(dropzoneReducer, initialFiles ?? [])

  return (
    <DropzoneContext value={files}>
      <DropzoneDispatchContext value={dispatch}>
        {children}
      </DropzoneDispatchContext>
    </DropzoneContext>
  )
}

export const useDropzoneContext = (): DropzoneContextType => {
  const context = useContext(DropzoneContext)

  if (!context) {
    throw new Error('useDropzoneContext must be used within a DropzoneContext')
  }
  return context
}

export const useDropzoneDispatchContext = (): DropzoneDispatchContextType => {
  const context = useContext(DropzoneDispatchContext)

  if (!context) {
    throw new Error(
      'useDropzoneDispatchContext must be used within a DropzoneDispatchContext'
    )
  }

  return context
}
