
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
}

export default function AllAnnouncementsPage() {
    const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, "announcements"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const announcementsData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
            setAllAnnouncements(announcementsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching announcements:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredAnnouncements = allAnnouncements.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(timestamp.toDate());
    }

    const handleViewDetails = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setIsViewDialogOpen(true);
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">All Announcements</h1>
                <p className="text-muted-foreground">Your complete archive of all general announcements.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5"/>
                        <CardTitle>Announcements</CardTitle>
                    </div>
                    <CardDescription>Browse through all posted announcements.</CardDescription>
                    <div className="pt-4">
                      <Input 
                        placeholder="Search announcements..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <li key={i} className="flex items-start gap-4 border-b pb-4 last:border-b-0">
                                    <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                                    <div className="flex-grow space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </li>
                            ))
                        ) : filteredAnnouncements.length > 0 ? (
                            filteredAnnouncements.map(item => (
                                <li key={item.id} className="flex items-start gap-4 border-b pb-4 last:border-b-0 cursor-pointer hover:bg-muted/50 -mx-6 px-6" onClick={() => handleViewDetails(item)}>
                                    <div className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-primary" />
                                    <div className="flex-grow">
                                        <p className="font-medium text-base">{item.title}</p>
                                        <p className="text-sm text-muted-foreground mb-2">{formatDate(item.createdAt)}</p>
                                        <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-2">
                                            {item.content}
                                        </p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="text-center text-muted-foreground p-4">
                                No announcements found.
                            </li>
                        )}
                    </ul>
                </CardContent>
            </Card>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
                    <DialogDescription>
                        Posted on {formatDate(selectedAnnouncement?.createdAt)}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                    <h3 className="font-semibold mb-1">Content</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAnnouncement?.content || "No content."}</p>
                    </div>
                </div>
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}
