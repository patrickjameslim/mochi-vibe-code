import * as React from 'react'

export type InputGroupSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const inputGroupSizeVariants: Record<InputGroupSize, string> = {
  xs: 'h-xs text-xs',
  sm: 'h-sm text-sm',
  md: 'h-md text-sm',
  lg: 'h-lg text-base',
  xl: 'h-xl text-lg',
}

const defaultInputGroupSize: InputGroupSize = 'md'

const InputGroupContext = React.createContext<{ size?: InputGroupSize } | null>(
  null
)

const useInputGroupContext = () => React.useContext(InputGroupContext)

export {
  useInputGroupContext,
  inputGroupSizeVariants,
  InputGroupContext,
  defaultInputGroupSize,
}
