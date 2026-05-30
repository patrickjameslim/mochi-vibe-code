import { CaretRightIcon, Icon } from '@phosphor-icons/react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Link,
} from '../../atoms'
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  Sidebar,
} from '../../molecules'
import { JSX } from 'react'
import { cn } from '../../utils'

interface Page<TUrl extends string = string> {
  icon?: Icon
  title: string
  url: TUrl
  isActive?: boolean
  excludePathsFromActive?: TUrl[]
}

export interface Route<TUrl extends string = string> {
  icon?: Icon
  title: string
  url?: TUrl
  isActive?: boolean
  subpages?: readonly Page<TUrl>[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  routes: readonly Route[]
  header?: JSX.Element
}

const SidebarButtonLabel = ({
  icon: Icon,
  title,
}: {
  icon?: Icon
  title: string
}) => (
  <div className="flex gap-3 items-center">
    {Icon && <Icon size={22} />}
    {title}
  </div>
)

const AppSidebarMenuButton = ({
  isActive,
  className,
  children,
}: React.PropsWithChildren<{ isActive?: boolean; className?: string }>) => (
  <SidebarMenuButton
    className={cn('py-6 px-3', className)}
    asChild
    isActive={isActive}
  >
    {children}
  </SidebarMenuButton>
)

export const AppSidebar = ({ routes, header, ...props }: AppSidebarProps) => {
  return (
    <Sidebar {...props}>
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent
        className={cn('gap-0', !header && 'py-2', 'font-heading')}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {routes.map((page) => (
                <SidebarMenuItem key={`${page.title}-${page.isActive}`}>
                  {page?.subpages ? (
                    <Collapsible
                      title={page.title}
                      className={cn(
                        'group/collapsible',
                        page?.isActive && 'bg-primary/6 rounded-md'
                      )}
                      defaultOpen={page?.isActive}
                    >
                      <AppSidebarMenuButton>
                        <CollapsibleTrigger
                          className={cn(
                            'hover:text-sidebar-accent-foreground',
                            page?.isActive &&
                              'text-sidebar-accent-foreground font-medium'
                          )}
                        >
                          <SidebarButtonLabel
                            title={page.title}
                            icon={page.icon}
                          />
                          <CaretRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                      </AppSidebarMenuButton>

                      <CollapsibleContent className="flex flex-col gap-0">
                        {page.subpages.map((subpage) => (
                          <AppSidebarMenuButton
                            key={subpage.title}
                            className="pl-11.5"
                            isActive={subpage.isActive}
                          >
                            <Link href={subpage.url}>
                              <SidebarButtonLabel
                                title={subpage.title}
                                icon={subpage.icon}
                              />
                            </Link>
                          </AppSidebarMenuButton>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : page.url ? (
                    <AppSidebarMenuButton isActive={page.isActive}>
                      <Link href={page.url}>
                        <SidebarButtonLabel
                          title={page.title}
                          icon={page.icon}
                        />
                      </Link>
                    </AppSidebarMenuButton>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
