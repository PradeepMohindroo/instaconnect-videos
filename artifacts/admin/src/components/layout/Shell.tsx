import { Link, useLocation } from "wouter";
import { LayoutDashboard, Video, LayoutTemplate, Code2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Video Library", url: "/videos", icon: Video },
  { title: "Widgets", url: "/widgets", icon: LayoutTemplate },
  { title: "Embed Guide", url: "/embed-guide", icon: Code2 },
];

const settingsItems = [
  { title: "Shopify", url: "/shopify", icon: Store },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full">
        <Sidebar className="border-r border-border bg-sidebar h-full z-10 shrink-0">
          <SidebarHeader className="p-4 border-b border-border">
            <h1 className="text-xl font-bold tracking-tight text-primary">Shoppable</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}>
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.startsWith(item.url)}>
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="h-14 border-b border-border bg-background flex items-center px-4 shrink-0 lg:hidden gap-2">
            <SidebarTrigger />
            <h1 className="font-semibold">Shoppable</h1>
          </header>
          <main className="flex-1 overflow-auto bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}