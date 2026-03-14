import * as React from "react"
import {
  LayoutDashboard,
  Ticket,
  Settings,
  Home,
  LogOut,
  ChevronRight,
  User,
  Bell,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const data = {
  user: {
    name: "Senior Console Admin",
    email: "admin@acme.com",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    {
      title: "Control Center",
      url: "/back-office",
      icon: LayoutDashboard,
      isActive: true,
    },
  ],
  admin: [
    {
      name: "Node Settings",
      url: "#",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/back-office" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground italic font-black text-xs">
                A.
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight uppercase font-black tracking-tight">
                <span className="truncate italic">ACME<span className="text-primary not-italic">.</span></span>
                <span className="truncate text-[9px] font-black opacity-40 -mt-0.5 tracking-[0.2em]">Senior Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} className="font-bold" render={<Link href={item.url} />}>
                  {item.icon && <item.icon />}
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarMenu>
            {data.admin.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton render={<a href={item.url} />}>
                  <item.icon className="text-muted-foreground/60 transition-colors group-hover:text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={data.user.avatar} alt={data.user.name} />
                  <AvatarFallback className="rounded-lg">AU</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight font-bold">
                  <span className="truncate">{data.user.name}</span>
                  <span className="truncate text-[10px] font-medium opacity-50 uppercase tracking-widest">{data.user.email}</span>
                </div>
                <ChevronRight className="ml-auto size-4 rotate-90" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--sidebar-width) min-w-56 rounded-2xl p-2 glass border-primary/10"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={data.user.avatar} alt={data.user.name} />
                      <AvatarFallback className="rounded-lg">AU</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{data.user.name}</span>
                      <span className="truncate text-xs">{data.user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3">
                  <User className="size-4" />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/api/auth/signout" />} className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="size-4" />
                    Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
