
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Home,
  LogOut,
  Users,
  PanelLeft,
  Megaphone,
  User,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const NavLink = ({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <Link href={href}>
        <SidebarMenuButton isActive={isActive} className="gap-2">
          {icon}
          <span className="truncate">{children}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Link href="/admin/dashboard" aria-label="Home">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M15.22 5.38a1.5 1.5 0 0 0-2.44 0l-3.56 4.32a2.5 2.5 0 0 0 0 3.82l3.56 4.32a1.5 1.5 0 0 0 2.44 0l3.56-4.32a2.5 2.5 0 0 0 0-3.82z" />
                  <path d="M8.78 9.7a1.5 1.5 0 0 0-1.22-.68H5.5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.06a1.5 1.5 0 0 0 1.22-.68" />
                </svg>
              </Link>
            </Button>
            <h2 className="text-lg font-semibold tracking-tight font-headline">HireUp Admin</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavLink href="/admin/dashboard" icon={<Home />}>Dashboard</NavLink>
            <NavLink href="/admin/notifications" icon={<Bell />}>Notifications</NavLink>
            <NavLink href="/admin/announcements" icon={<Megaphone />}>Announcements</NavLink>
            <NavLink href="/admin/resources" icon={<BookOpen />}>Resources</NavLink>
            <NavLink href="/admin/students" icon={<Users />}>Students</NavLink>
            <NavLink href="/admin/profile" icon={<User />}>Profile</NavLink>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton className="gap-2">
                  <LogOut />
                  <span className="truncate">Logout</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger>
                <PanelLeft />
            </SidebarTrigger>
            <div>
            {/* User Profile Dropdown could go here */}
            </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

