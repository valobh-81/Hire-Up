
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, FileText, Video, X, Trash2, Eye, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, onSnapshot, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";


interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'File' | 'Video';
    url: string;
    createdAt: Timestamp;
}


export default function ResourcesPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "resources"), (snapshot) => {
        const resourcesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        resourcesData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setResources(resourcesData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(timestamp.toDate());
  }
  
  const handleViewDetails = (resource: Resource) => {
    setSelectedResource(resource);
    setIsViewDialogOpen(true);
  }

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (resourceToDelete) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "resources", resourceToDelete.id));
        toast({
          title: "Deleted!",
          description: "The resource has been deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not delete the resource.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setResourceToDelete(null);
        setIsDeleting(false);
      }
    }
  }


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Prep Resources</h1>
            <p className="text-muted-foreground">Upload and manage resources for students.</p>
        </div>
        <Button asChild>
            <Link href="/admin/resources/new"><PlusCircle className="mr-2 h-4 w-4"/>New Resource</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Resources</CardTitle>
          <CardDescription>A list of all available preparation materials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Uploaded</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : resources.length > 0 ? (
                resources.map((resource) => (
                <TableRow key={resource.id} onClick={() => handleViewDetails(resource)} className="cursor-pointer">
                  <TableCell className="font-medium">{resource.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                        {resource.type === 'File' ? <FileText className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                        {resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(resource.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleViewDetails(resource)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeleteClick(resource)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No resources found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* View Details Dialog */}
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
      
       {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource titled "{resourceToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    