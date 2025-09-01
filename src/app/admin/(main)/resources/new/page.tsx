
"use client";

import { useState, useTransition, useEffect } from "react";
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
import { ArrowLeft, Link as LinkIcon, File as FileIcon, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendBulkNotification, getStudentEmailCount, type EmailStatus } from "@/lib/actions";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL."),
  type: z.enum(['File', 'Video']),
});


export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<EmailStatus[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      type: 'File',
    },
  });

  useEffect(() => {
    const fetchCount = async () => {
        const count = await getStudentEmailCount();
        setStudentCount(count);
    };
    fetchCount();
  }, []);


  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setResults([]);
    if (studentCount === 0) {
        toast({
            variant: "destructive",
            title: "No Students",
            description: "There are no students to notify.",
        });
        return;
    }
    startTransition(async () => {
        try {
            // 1. Add the resource to the database
            await addDoc(collection(db, "resources"), {
                ...values,
                createdAt: serverTimestamp(),
            });

            // 2. Trigger the bulk email server action to notify students
            const emailSubject = `New Resource Added: ${values.title}`;
            const emailContent = `A new preparation resource has been uploaded.<br/><br/>
                                  <strong>Title:</strong> ${values.title}<br/>
                                  <strong>Description:</strong> ${values.description || 'No description provided.'}<br/>
                                  <strong>Type:</strong> ${values.type}<br/><br/>
                                  You can access it here: <a href="${values.url}">${values.url}</a>`;

            const data = await sendBulkNotification(emailSubject, emailContent);
            setResults(data);
            const successes = data.filter(r => r.status === 'success').length;
            const failures = data.filter(r => r.status === 'failed').length;
            
            toast({
              title: "Dispatch Complete",
              description: `Resource added. ${successes} emails sent, ${failures} failed.`,
            });
            
            if (successes > 0 && failures === 0) {
                 setTimeout(() => router.push("/admin/resources"), 2000);
            }
        } catch (error) {
             console.error("Error adding resource: ", error);
             toast({
                title: "Submission Failed",
                description: "There was an error creating the resource.",
                variant: "destructive",
            });
        }
    });
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/admin/resources">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Resources
            </Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">New Resource</h1>
        <p className="text-muted-foreground">Add a new preparation resource for students.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Resource Details</CardTitle>
            <CardDescription>Adding a resource will trigger an email notification to all registered students.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form className="grid gap-6 pt-4" onSubmit={form.handleSubmit(handleSubmit)}>
                    <Card className="bg-muted/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Users className="w-6 h-6 text-primary"/>
                                <div>
                                    <p className="font-semibold">
                                        An alert for this resource will be sent to <strong>{studentCount}</strong> student(s).
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
                                    <Input placeholder="e.g., System Design Tutorial" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A short description of the resource." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Resource URL</FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://youtube.com/watch?v=..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Resource Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select resource type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="File"><FileIcon className="mr-2 h-4 w-4 inline-block" />File (PDF, Doc, etc.)</SelectItem>
                                        <SelectItem value="Video"><LinkIcon className="mr-2 h-4 w-4 inline-block" />Video/Web Link</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending || studentCount === 0}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Adding...</> : 'Add Resource & Notify'}
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
