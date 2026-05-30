export enum ButtonVariant {
  FILLED = 'filled',
  OUTLINE = 'outline',
  GHOST = 'ghost',
  LINK = 'link',
  ROUND_ICON = 'roundIcon',
}

export enum ButtonColorScheme {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DESTRUCTIVE = 'destructive',
  ORANGE = 'orange',
}

export enum ButtonSize {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  ICON = 'icon',
}

type ButtonVariantType = `${ButtonVariant}`
type ButtonColorSchemeType = `${ButtonColorScheme}`
type ButtonSizeType = `${ButtonSize}`

export type CompoundVariant = {
  variant: ButtonVariantType
  colorScheme: ButtonColorSchemeType
  size?: ButtonSizeType
  className: string
}

export const primaryCompoundVariants: CompoundVariant[] = (
  [
    {
      variant: ButtonVariant.FILLED,
      className: 'bg-primary text-primary-foreground hover:bg-primary-600',
    },
    {
      variant: ButtonVariant.OUTLINE,
      className:
        'border border-button-outline hover:border-button-outline-accent hover:bg-accent text-primary-600 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
    },
    {
      variant: ButtonVariant.GHOST,
      className: 'hover:bg-accent text-primary dark:hover:bg-accent/50',
    },
    {
      variant: ButtonVariant.LINK,
      className: 'text-primary p-0 rounded-xs ',
    },
  ] as const
).map((variant) => ({ colorScheme: 'primary', ...variant }))

export const secondaryCompoundVariants: CompoundVariant[] = (
  [
    {
      variant: ButtonVariant.FILLED,
      className:
        'bg-secondary text-secondary-foreground hover:bg-secondary-600/80',
    },
    {
      variant: ButtonVariant.OUTLINE,
      className:
        'border hover:border-secondary-600/80 text-secondary-foreground hover:bg-secondary/70 dark:border-secondary/50 dark:hover:bg-secondary/10 focus-visible:border-secondary-600',
    },
    {
      variant: ButtonVariant.GHOST,
      className:
        'hover:bg-secondary/50 text-secondary-foreground dark:hover:bg-secondary/20',
    },
    {
      variant: ButtonVariant.LINK,
      className: 'text-secondary-foreground p-0 rounded-xs ',
    },
  ] as const
).map((variant) => ({ colorScheme: 'secondary', ...variant }))

export const destructiveCompoundVariants: CompoundVariant[] = (
  [
    {
      variant: ButtonVariant.FILLED,
      className:
        'bg-destructive text-white hover:bg-destructive-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
    },
    {
      variant: ButtonVariant.OUTLINE,
      className:
        'border hover:border-destructive hover:bg-destructive/5 text-destructive dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 focus-visible:border-destructive',
    },
    {
      variant: ButtonVariant.GHOST,
      className:
        'hover:bg-destructive/5 text-destructive dark:hover:bg-accent/50 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
    },
    {
      variant: ButtonVariant.LINK,
      className:
        'text-destructive p-0 rounded-xs focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
    },
  ] as const
).map((variant) => ({ colorScheme: 'destructive', ...variant }))

export const orangeCompoundVariants: CompoundVariant[] = (
  [
    {
      variant: ButtonVariant.FILLED,
      className:
        'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-600/30 focus-visible:border-orange-700',
    },
    {
      variant: ButtonVariant.OUTLINE,
      className:
        'border bg-white hover:border-orange-600/30 hover:bg-orange-600/5 text-orange-700 focus-visible:ring-orange-600/20 focus-visible:border-orange-600',
    },
    {
      variant: ButtonVariant.GHOST,
      className:
        'hover:bg-orange-100 text-orange-700 focus-visible:ring-orange-600/20',
    },
    {
      variant: ButtonVariant.LINK,
      className:
        'text-orange-700 hover:text-orange-800 p-0 rounded-xs focus-visible:ring-orange-600/20',
    },
  ] as const
).map((variant) => ({ colorScheme: 'orange', ...variant }))
