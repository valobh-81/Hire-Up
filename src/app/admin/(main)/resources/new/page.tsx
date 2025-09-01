
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
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStudentEmailCount, sendBulkNotification, type EmailStatus } from "@/lib/actions";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  url: z.string().url("Please enter a valid URL."),
  type: z.string().min(1, "Type is required, e.g., 'Video' or 'Article'"),
});

export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [studentCount, setStudentCount] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      type: ""
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
    startTransition(async () => {
        try {
            await addDoc(collection(db, "resources"), {
                ...values,
                createdAt: serverTimestamp(),
            });

            // This is a placeholder for the actual email sending logic
            const emailSubject = `New Resource Added: ${values.title}`;
            const emailContent = `A new resource has been added: ${values.title}. You can view it here: ${values.url}`;
            // const data = await sendBulkNotification(emailSubject, emailContent);
            // setResults(data);

            toast({
              title: "Resource Added!",
              description: "The new resource has been saved.",
            });
            router.push("/admin/resources");
        } catch (error) {
             toast({
                title: "Error",
                description: "Could not add the resource.",
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
            <CardDescription>This will be available to all students immediately upon creation.</CardDescription>
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
                                        This resource will be visible to <strong>{studentCount}</strong> student(s).
                                    </p>
                                    <p className="text-sm text-muted-foreground">Email notifications for new resources are not yet active.</p>
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
                                <FormLabel>Type</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 'Video' or 'PDF'" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Adding...</> : 'Add Resource'}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
