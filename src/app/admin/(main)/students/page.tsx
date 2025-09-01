
"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Student {
  id: string;
  fullName: string;
  course: string;
  rollNumber: string;
  email: string;
}

const COURSES = ["MCA", "MBA", "MA", "MCom", "MSc"];

export default function StudentsPage() {
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
        let studentsData: Student[] = [];
        const coursesToFetch = selectedCourse === 'all' ? COURSES : [selectedCourse];

        const coursePromises = coursesToFetch.map(course => 
            getDocs(collection(db, `Students-list/Course/${course}`))
        );
        const courseSnapshots = await Promise.all(coursePromises);
        
        courseSnapshots.forEach(snapshot => {
            const courseStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
            studentsData.push(...courseStudents);
        });
        
        setAllStudents(studentsData);
        setFilteredStudents(studentsData);

    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({
          title: "Error",
          description: "Failed to fetch student data.",
          variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let students = allStudents;
    
    if (searchTerm) {
        students = students.filter(student =>
            student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    setFilteredStudents(students);
  }, [searchTerm, allStudents]);

    
  const handleExport = () => {
    setIsExporting(true);
    if (filteredStudents.length === 0) {
        toast({
            title: "No Data",
            description: "There is no data to export.",
            variant: "destructive"
        });
        setIsExporting(false);
        return;
    }
    try {
        const worksheet = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({
            "Roll Number": s.rollNumber,
            "Name": s.fullName,
            "Course": s.course,
            "Email": s.email
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "students_export.xlsx");

        toast({
            title: "Export Successful",
            description: `Student list (${selectedCourse === 'all' ? 'All Courses' : selectedCourse}) has been exported.`
        });
    } catch (error) {
         toast({
            title: "Export Failed",
            description: "An error occurred while exporting the data.",
            variant: "destructive"
        });
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Student Management</h1>
            <p className="text-muted-foreground">View and export student data.</p>
        </div>
        <Button onClick={handleExport} disabled={loading || isExporting || filteredStudents.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
            {isExporting ? 'Exporting...' : 'Export as Excel'}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>A list of all registered students.</CardDescription>
           <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search by name, roll, or email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={loading}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {COURSES.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                </SelectContent>
             </Select>
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono">{student.rollNumber}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.course}</Badge>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No students found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    