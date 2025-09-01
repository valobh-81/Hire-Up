
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
import { ArrowLeft, Link as LinkIcon, File as FileIcon, Users, Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudentEmailCount } from "@/lib/actions";
import { sendResourceNotification, type EmailStatus } from "@/ai/flows/send-resource-notification-flow";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  type: z.enum(['File', 'Video/Web Link']),
});


export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<EmailStatus[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      type: 'File',
    },
  });

  const resourceType = form.watch("type");

  useEffect(() => {
    const fetchCount = async () => {
        const count = await getStudentEmailCount();
        setStudentCount(count);
    };
    fetchCount();
  }, []);


  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.type === 'File' && !selectedFile) {
        toast({
            variant: "destructive",
            title: "File Required",
            description: "Please select a file to upload.",
        });
        return;
    }
    if (values.type === 'Video/Web Link' && !values.url) {
        toast({
            variant: "destructive",
            title: "URL Required",
            description: "Please enter a valid URL for the resource.",
        });
        return;
    }

    setResults([]);
    startTransition(async () => {
        try {
            let resourceUrl = values.url || "";
            
            // 1. If file, upload to storage
            if (values.type === 'File' && selectedFile) {
                const storageRef = ref(storage, `resources/${Date.now()}_${selectedFile.name}`);
                const uploadResult = await uploadBytes(storageRef, selectedFile);
                resourceUrl = await getDownloadURL(uploadResult.ref);
            }
            
            // 2. Add the resource to the database
            await addDoc(collection(db, "resources"), {
                title: values.title,
                description: values.description,
                url: resourceUrl,
                type: values.type,
                createdAt: serverTimestamp(),
            });

            // 3. Trigger the bulk email server action to notify students
            const data = await sendResourceNotification({
              title: values.title,
              description: values.description,
              url: resourceUrl,
              type: values.type,
            });

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
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Resource Type</FormLabel>
                                <Select onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue('url', '');
                                    setSelectedFile(null);
                                }} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select resource type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="File"><FileIcon className="mr-2 h-4 w-4 inline-block" />File (PDF, Doc, etc.)</SelectItem>
                                        <SelectItem value="Video/Web Link"><LinkIcon className="mr-2 h-4 w-4 inline-block" />Video/Web Link</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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

                    {resourceType === "Video/Web Link" && (
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
                    )}
                   
                   {resourceType === "File" && (
                        <FormItem>
                            <FormLabel>Upload File</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-4">
                                     <label htmlFor="file-upload" className="flex-grow">
                                        <div className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border rounded-md cursor-pointer border-input bg-background hover:bg-accent hover:text-accent-foreground">
                                           <Upload className="w-4 h-4 mr-2"/>
                                           <span>{selectedFile ? 'Change file' : 'Choose a file'}</span>
                                        </div>
                                        <Input 
                                            id="file-upload" 
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </label>
                                </div>
                            </FormControl>
                            {selectedFile && <p className="text-sm text-muted-foreground mt-2">Selected: {selectedFile.name}</p>}
                            <FormMessage />
                        </FormItem>
                   )}

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
