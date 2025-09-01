
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold font-headline text-primary tracking-tight">
          Welcome to Hire Up
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Stay connected, stay ahead.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">For Admins</CardTitle>
            <CardDescription>Manage notifications, resources, and student data.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg" className="w-full">
              <Link href="/admin/login">Admin Login</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl">
          <CardHeader className="items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">For Students</CardTitle>
            <CardDescription>Access notifications and resource materials.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg" className="w-full">
              <Link href="/student/login">Student Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
