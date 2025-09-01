
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import {
  Bell,
  BookOpen,
  Home,
  LogOut,
  User,
  PanelLeft,
  Megaphone,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface Student {
    fullName: string;
    rollNumber: string;
    email: string;
}

const COURSES = ["MCA", "MBA", "MA", "MCom", "MSc"];

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
  const isActive = pathname.startsWith(href);

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

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setLoading(true);
        let studentData: Student | null = null;
        for (const course of COURSES) {
            const studentQuery = query(collection(db, `Students-list/Course/${course}`), where("email", "==", user.email), limit(1));
            const querySnapshot = await getDocs(studentQuery);
            if (!querySnapshot.empty) {
                studentData = querySnapshot.docs[0].data() as Student;
                break;
            }
        }
        setStudent(studentData);
        setLoading(false);
      } else {
        setLoading(false);
        setStudent(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Link href="/student/dashboard" aria-label="Home">
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
            <h2 className="text-lg font-semibold tracking-tight font-headline">HireUp Student</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavLink href="/student/dashboard" icon={<Home />}>Dashboard</NavLink>
            <NavLink href="/student/notifications" icon={<Bell />}>Notifications</NavLink>
            <NavLink href="/student/announcements" icon={<Megaphone />}>Announcements</NavLink>
            <NavLink href="/student/resources" icon={<BookOpen />}>Resources</NavLink>
            <NavLink href="/student/profile" icon={<User />}>Profile</NavLink>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="p-2">
                <div className="flex items-center gap-3 p-2 rounded-md bg-muted">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="profile picture" />
                        <AvatarFallback>{loading ? <Skeleton className="h-full w-full rounded-full"/> : getInitials(student?.fullName)}</AvatarFallback>
                    </Avatar>
                     {loading ? (
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28"/>
                            <Skeleton className="h-3 w-20"/>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate">{student?.fullName || "Student Name"}</span>
                            <span className="text-xs text-muted-foreground">{student?.rollNumber || "Roll Number"}</span>
                        </div>
                    )}
                </div>
            </div>
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
        </header>
        <main className="p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    