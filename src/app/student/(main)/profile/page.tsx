
"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface StudentProfile {
    fullName: string;
    email: string;
    rollNumber: string;
    course: string;
    mobileNumber: string;
}

export default function StudentProfilePage() {
    const { toast } = useToast();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "Students", user.email!);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as StudentProfile;
                    setProfile(data);
                    setFullName(data.fullName);
                    setMobileNumber(data.mobileNumber || '');
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSubmitting(true);

        const docRef = doc(db, "Students", profile.email);
        try {
            await updateDoc(docRef, {
                fullName: fullName,
                mobileNumber: mobileNumber,
            });
            toast({
                title: "Success!",
                description: "Your profile has been updated.",
            });
        } catch (error) {
            console.error("Error updating profile: ", error);
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Student Profile</h1>
                <p className="text-muted-foreground">View and update your personal information.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                    <CardDescription>Keep your information up to date.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                    ) : (
                        <form className="grid gap-6" onSubmit={handleUpdate}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="roll-number">Roll Number</Label>
                                    <Input id="roll-number" value={profile?.rollNumber || ''} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Input id="course" value={profile?.course || ''} disabled />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={profile?.email || ''} disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="full-name">Full Name</Label>
                                <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="mobile-number">Mobile Number</Label>
                                <Input id="mobile-number" type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
