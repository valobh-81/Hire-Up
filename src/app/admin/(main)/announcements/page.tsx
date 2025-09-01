
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle, Users, Megaphone, Trash2, Eye, MoreHorizontal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendBulkNotification, getStudentEmailCount, type EmailStatus } from "@/lib/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
});

interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
}

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState<EmailStatus[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    const fetchCount = async () => {
        const count = await getStudentEmailCount();
        setStudentCount(count);
    };
    fetchCount();
    
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const announcementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setAnnouncements(announcementsData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePublish = async (values: z.infer<typeof formSchema>) => {
    setResults([]);
    startTransition(async () => {
      try {
        await addDoc(collection(db, "announcements"), {
          ...values,
          createdAt: serverTimestamp(),
        });
        
        const data = await sendBulkNotification(values.title, values.content);
        setResults(data);
        const successes = data.filter(r => r.status === 'success').length;
        const failures = data.filter(r => r.status === 'failed').length;
        
        toast({
          title: "Dispatch Complete",
          description: `${successes} emails sent, ${failures} failed.`,
        });

        if (successes > 0 && failures === 0) {
            form.reset();
        }

      } catch (error) {
        toast({
          variant: "destructive",
          title: "An error occurred",
          description: "Could not process your request. Please try again.",
        });
      }
    });
  };

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

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    if (announcementToDelete) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "announcements", announcementToDelete.id));
        toast({
          title: "Deleted!",
          description: "The announcement has been deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not delete the announcement.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setAnnouncementToDelete(null);
        setIsDeleting(false);
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Compose and send mass announcements to all students.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card>
            <CardHeader>
                <CardTitle>New Announcement</CardTitle>
                <CardDescription>This will be sent as an email to all registered students.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form className="grid gap-6" onSubmit={form.handleSubmit(handlePublish)}>
                    <Card className="bg-muted/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Users className="w-6 h-6 text-primary"/>
                                <div>
                                    <p className="font-semibold">
                                        This announcement will be sent to <strong>{studentCount}</strong> student(s).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Campus Event Reminder" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Enter the full announcement details here..." className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={isPending || studentCount === 0}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : 'Publish & Send Emails'}
                        </Button>
                    </div>
                </form>
            </Form>

            {results.length > 0 && (
            <div className="mt-8 pt-8 border-t animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold mb-4">Dispatch Results</h3>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-4">
                {results.map((result) => (
                    <li key={result.email} className="flex items-start p-3 rounded-md bg-muted/50">
                    {result.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-grow">
                        <p className="font-medium">{result.email}</p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                    </li>
                ))}
                </ul>
            </div>
            )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
            <CardTitle>Sent Announcements</CardTitle>
            <CardDescription>A list of all sent announcements.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                    ))
                ) : announcements.length > 0 ? (
                    announcements.map((ann) => (
                    <TableRow key={ann.id} onClick={() => handleViewDetails(ann)} className="cursor-pointer">
                    <TableCell className="font-medium">{ann.title}</TableCell>
                    <TableCell>{formatDate(ann.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleViewDetails(ann)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDeleteClick(ann)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">No announcements found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>

       {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription>
                Sent on {formatDate(selectedAnnouncement?.createdAt)}
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
      
       {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the announcement titled "{announcementToDelete?.title}".
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

    