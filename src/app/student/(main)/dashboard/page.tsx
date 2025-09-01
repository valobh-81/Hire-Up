
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Video, Bell, BookOpen, Download, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, getDocs, Timestamp, orderBy, limit, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Notification {
    id: string;
    title: string;
    createdAt: Timestamp;
    target: string;
    status: 'Published' | 'Draft';
}

interface Announcement {
    id: string;
    title: string;
    createdAt: Timestamp;
}

interface Resource {
    id: string;
    title: string;
    type: 'File' | 'Video/Web Link';
    url: string;
}

interface Student {
    fullName: string;
    course: string;
    rollNumber: string;
}

const COURSES = ["MCA", "MBA", "MA", "MCom", "MSc"];

export default function StudentDashboardPage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
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

                // Get Notifications
                const notifQuery = query(
                    collection(db, "notifications"),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                const unsubscribeNotifs = onSnapshot(notifQuery, (snapshot) => {
                    const allRecent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
                    const filteredNotifs = allRecent
                        .filter(n => n.status === 'Published')
                        .filter(n => n.target === "All Students" || n.target === studentData?.course)
                        .slice(0, 3);
                    setNotifications(filteredNotifs);
                });

                // Get Announcements
                const announcementQuery = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(3));
                const unsubscribeAnnouncements = onSnapshot(announcementQuery, (snapshot) => {
                    const announcementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
                    setAnnouncements(announcementsData);
                });


                // Get Resources
                const resourceQuery = query(collection(db, "resources"), orderBy("createdAt", "desc"), limit(3));
                 const unsubscribeResources = onSnapshot(resourceQuery, (snapshot) => {
                    const resourcesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
                    setResources(resourcesData);
                });

                setLoading(false);

                return () => {
                    unsubscribeNotifs();
                    unsubscribeResources();
                    unsubscribeAnnouncements();
                }

            } else {
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric'
        }).format(timestamp.toDate());
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                    {loading ? <Skeleton className="h-8 w-64" /> : `Welcome, ${student?.fullName || 'Student'}!`}
                </h1>
                <p className="text-muted-foreground">Here are your latest updates and resources.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Notifications Section */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-6 w-6 text-primary"/>
                            <CardTitle>Recent Notifications</CardTitle>
                        </div>
                        <CardDescription>Stay updated with the latest placement news.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-4">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <li key={i} className="flex items-start gap-4 p-3 rounded-lg">
                                        <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                                        <div className="flex-grow space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </li>
                                ))
                            ) : notifications.length > 0 ? (
                                notifications.map(item => (
                                    <li key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                        <div className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-accent" />
                                        <div className="flex-grow">
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-center text-muted-foreground p-4">No new notifications.</li>
                            )}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/student/notifications">View all notifications <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
                
                {/* Announcements Section */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Megaphone className="h-6 w-6 text-primary"/>
                            <CardTitle>Recent Announcements</CardTitle>
                        </div>
                        <CardDescription>General news and campus-wide updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-4">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <li key={i} className="flex items-start gap-4 p-3 rounded-lg">
                                        <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                                        <div className="flex-grow space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </li>
                                ))
                            ) : announcements.length > 0 ? (
                                announcements.map(item => (
                                    <li key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                        <div className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-accent" />
                                        <div className="flex-grow">
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-center text-muted-foreground p-4">No new announcements.</li>
                            )}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/student/announcements">View all announcements <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>


                {/* Resources Section */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary"/>
                            <CardTitle>Prep Resources</CardTitle>
                        </div>
                        <CardDescription>Get ahead with these essential materials.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <ul className="space-y-4">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                     <li key={i} className="flex items-center gap-4 p-3">
                                        <Skeleton className="h-5 w-5" />
                                        <div className="flex-grow space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </li>
                                ))
                            ) : resources.map(item => (
                                <li key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex-shrink-0">
                                        {item.type === 'File' ? <FileText className="h-5 w-5 text-muted-foreground" /> : <Video className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-medium">{item.title}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                            {item.type === 'File' ? <Download className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                        </a>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/student/resources">View all resources <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

    
