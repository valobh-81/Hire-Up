
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendBulkNotification, getStudentEmailCount, type EmailStatus } from "@/lib/actions";

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
  target: z.string().min(1, "Target is required."),
});

export default function NewNotificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<EmailStatus[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      target: "All Students",
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoadingCourses(true);
        try {
            const courseQuery = await getDocs(collection(db, "Courses"));
            const courseNames = courseQuery.docs.map(doc => doc.id);
            setCourses(courseNames);
            const count = await getStudentEmailCount();
            setStudentCount(count);
        } catch (error) {
            console.error("Error fetching data: ", error);
            toast({
                title: "Error",
                description: "Failed to fetch necessary data.",
                variant: "destructive"
            });
        } finally {
            setLoadingCourses(false);
        }
    };
    fetchInitialData();
  }, [toast]);

  const handleSaveDraft = async (values: z.infer<typeof formSchema>) => {
     startTransition(async () => {
        try {
            await addDoc(collection(db, "notifications"), {
                ...values,
                status: 'Draft',
                createdAt: serverTimestamp(),
            });
            toast({
                title: "Draft Saved!",
                description: "The notification has been saved as a draft.",
            });
            router.push("/admin/notifications");
        } catch (error) {
             console.error("Error saving draft: ", error);
             toast({
                title: "Error",
                description: "Could not save the draft.",
                variant: "destructive",
            });
        }
     });
  }

  const handlePublish = async (values: z.infer<typeof formSchema>) => {
    setResults([]);
    startTransition(async () => {
      try {
        // 1. Save notification to DB
        await addDoc(collection(db, "notifications"), {
          ...values,
          status: 'Published',
          createdAt: serverTimestamp(),
        });
        
        // 2. Send emails
        const data = await sendBulkNotification(values.title, values.content);
        setResults(data);
        const successes = data.filter(r => r.status === 'success').length;
        const failures = data.filter(r => r.status === 'failed').length;
        
        toast({
          title: "Dispatch Complete",
          description: `${successes} emails sent, ${failures} failed.`,
        });

        if (successes > 0 && failures === 0) {
            // Optionally redirect on full success
            setTimeout(() => router.push("/admin/notifications"), 2000);
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/admin/notifications">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notifications
            </Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">New Notification</h1>
        <p className="text-muted-foreground">Compose and send announcements to students.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Notification Details</CardTitle>
            <CardDescription>Fill in the details below. Publishing will send a real email to all students.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-6">
                <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Users className="w-6 h-6 text-primary"/>
                            <div>
                                <p className="font-semibold">
                                    This notification will be sent to <strong>{studentCount}</strong> student(s).
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    This count is based on all registered students.
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
                        <Input placeholder="e.g., Upcoming Placement Drive" {...field} />
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
                        <Textarea placeholder="Enter the full notification details here..." className="min-h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCourses}>
                         <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target audience" />
                            </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                            <SelectItem value="All Students">All Students</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                         </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={form.handleSubmit(handleSaveDraft)} disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Draft'}
                    </Button>
                    <Button onClick={form.handleSubmit(handlePublish)} disabled={isPending}>
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
    </div>
  );
}
