
"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Users, PlusCircle, Megaphone } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const [adminName, setAdminName] = useState("");
  const [stats, setStats] = useState({
    students: 0,
    notifications: 0,
    resources: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const adminDocRef = doc(db, "Admins", user.email!);
                const adminDocSnap = await getDoc(adminDocRef);
                if (adminDocSnap.exists()) {
                    setAdminName(adminDocSnap.data().fullName);
                }

                // Use onSnapshot for real-time updates on counts
                const unsubStudents = onSnapshot(collection(db, "student-emails"), (snap) => {
                    setStats(prev => ({...prev, students: snap.size}));
                });

                const unsubNotifications = onSnapshot(collection(db, "notifications"), (snap) => {
                    setStats(prev => ({...prev, notifications: snap.size}));
                });
                
                const unsubResources = onSnapshot(collection(db, "resources"), (snap) => {
                    setStats(prev => ({...prev, resources: snap.size}));
                });

                const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snap) => {
                    setStats(prev => ({...prev, announcements: snap.size}));
                });


                setLoading(false);
                
                // Return a cleanup function to unsubscribe from listeners
                return () => {
                    unsubStudents();
                    unsubNotifications();
                    unsubResources();
                    unsubAnnouncements();
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    });

    return () => {
        if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const statCards = [
    { title: "Total Students", value: stats.students, icon: <Users className="h-6 w-6 text-muted-foreground" /> },
    { title: "Notifications Sent", value: stats.notifications, icon: <Bell className="h-6 w-6 text-muted-foreground" /> },
    { title: "Resources Uploaded", value: stats.resources, icon: <BookOpen className="h-6 w-6 text-muted-foreground" /> },
    { title: "Announcements Made", value: stats.announcements, icon: <Megaphone className="h-6 w-6 text-muted-foreground" /> },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
        <div className="text-muted-foreground h-5">
            {loading ? <Skeleton className="h-full w-48" /> : `Welcome back, ${adminName || 'Admin'}! Here's a summary of your portal.`}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Quickly create new items.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href="/admin/notifications/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Notification
                </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href="/admin/resources/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Resource
                </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href="/admin/announcements">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
