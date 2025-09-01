
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GraduationCap, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const COURSES = ["MCA", "MBA", "MA", "MCom", "MSc"];

const formSchema = z.object({
    fullName: z.string().min(1, "Full name is required."),
    rollNumber: z.string().min(1, "Roll number is required.").toUpperCase(),
    course: z.string().min(1, "Please select your course."),
    email: z.string().email("Invalid email address."),
    mobileNumber: z.string().min(1, "Mobile number is required."),
    password: z.string()
        .min(6, "Password must be at least 6 characters.")
        .max(16, "Password must be at most 16 characters.")
        .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});


export default function StudentSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      rollNumber: "",
      course: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleSignUp = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Check for duplicate roll number in the specific course
      const studentQuery = query(collection(db, `Students-list/Course/${values.course}`), where("rollNumber", "==", values.rollNumber), limit(1));
      const querySnapshot = await getDocs(studentQuery);
      if (!querySnapshot.empty) {
        toast({
            title: "Registration Failed",
            description: "A student with this roll number is already registered in this course.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
        
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      const studentDetailDocRef = doc(db, `Students-list/Course/${values.course}`, user.uid);
      await setDoc(studentDetailDocRef, {
        uid: user.uid,
        fullName: values.fullName,
        email: values.email,
        rollNumber: values.rollNumber,
        course: values.course,
        mobileNumber: values.mobileNumber
      });

      const studentRootDocRef = doc(db, 'Students', values.email);
      await setDoc(studentRootDocRef, {
        uid: user.uid,
        fullName: values.fullName,
        email: values.email,
        rollNumber: values.rollNumber,
        course: values.course,
      });

      const emailDocRef = doc(db, "student-emails", user.uid);
      await setDoc(emailDocRef, { email: values.email });

      toast({
        title: "Registration Successful!",
        description: "Please log in with your new credentials.",
      });

      router.push('/student/login');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({
                title: "Registration Failed",
                description: "This email address is already in use by another account.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Error signing up",
                description: error.message,
                variant: "destructive",
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-background/80 py-12">
      <Card className="mx-auto max-w-sm w-full shadow-2xl relative">
        <Button variant="ghost" size="sm" asChild className="absolute top-4 left-4">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Link>
        </Button>
        <CardHeader className="text-center pt-16">
            <div className="inline-block bg-primary/10 p-3 rounded-full mx-auto mb-4 w-fit">
                <GraduationCap className="w-8 h-8 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">Student Registration</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Max Robinson" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="rollNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl><Input placeholder="CS2025001" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="course" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your course" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {COURSES.map(courseName => (
                                    <SelectItem key={courseName} value={courseName}>{courseName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input type="tel" placeholder="123-456-7890" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                            <FormControl><Input type={showPassword ? "text" : "password"} {...field} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(prev => !prev)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <div className="relative">
                            <FormControl><Input type={showConfirmPassword ? "text" : "password"} {...field} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword(prev => !prev)}>
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Creating account...</> : 'Create an account'}
                </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/student/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
