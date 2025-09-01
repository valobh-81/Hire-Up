
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Video, BookOpen, Search, ArrowRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/skeleton";
import { collection, onSnapshot, Timestamp, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'File' | 'Video/Web Link';
    url: string;
    createdAt: Timestamp;
}

export default function AllResourcesPage() {
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resourcesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
            setAllResources(resourcesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredResources = allResources.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewDetails = (resource: Resource) => {
        setSelectedResource(resource);
        setIsViewDialogOpen(true);
    }
    
    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(timestamp.toDate());
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">All Resources</h1>
                <p className="text-muted-foreground">Your complete library of preparation materials.</p>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5"/>
                        <CardTitle>Resource Library</CardTitle>
                    </div>
                    <CardDescription>Browse through all available resources.</CardDescription>
                    <div className="pt-4 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search resources..." 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="flex flex-col">
                                    <CardHeader>
                                        <Skeleton className="h-8 w-8" />
                                        <div className="space-y-2 pt-4">
                                          <Skeleton className="h-6 w-3/4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-1/2 mt-2" />
                                    </CardContent>
                                    <CardContent>
                                       <Skeleton className="h-10 w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredResources.length > 0 ? (
                         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredResources.map(item => (
                                <Card key={item.id} className="flex flex-col cursor-pointer" onClick={() => handleViewDetails(item)}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            {item.type === 'File' ? <FileText className="h-8 w-8 text-muted-foreground" /> : <Video className="h-8 w-8 text-muted-foreground" />}
                                        </div>
                                        <CardTitle className="pt-4 text-lg">{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                                    </CardContent>
                                    <CardContent>
                                        <Button className="w-full" onClick={(e) => e.stopPropagation()} asChild>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                {item.type === 'File' ? <Download className="mr-2 h-4 w-4"/> : <ArrowRight className="mr-2 h-4 w-4"/>}
                                                {item.type === 'File' ? 'View/Download' : 'Open Link'}
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No resources found matching your search.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{selectedResource?.title}</DialogTitle>
                    <DialogDescription>
                        Uploaded on {formatDate(selectedResource?.createdAt)}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedResource?.description || "No description provided."}</p>
                    </div>
                    <div>
                    <h3 className="font-semibold mb-1">Type</h3>
                    <Badge variant="secondary" className="gap-1">
                            {selectedResource?.type === 'File' ? <FileText className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            {selectedResource?.type}
                        </Badge>
                    </div>
                    <div>
                    <h3 className="font-semibold mb-1">Link</h3>
                    <a href={selectedResource?.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">
                        {selectedResource?.url}
                    </a>
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
