
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { employees as mockEmployees, type Employee } from "@/lib/data";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const employeeSchema = z.object({
    name: z.string().min(1, "Employee name is required"),
    role: z.string().min(1, "Role is required"),
    salary: z.coerce.number().min(1, "Salary must be greater than 0"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;


function EmployeeForm({ setOpen, employee }: { setOpen: (open: boolean) => void; employee?: Employee | null }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!employee;
    const [employees, setEmployees] = useState(mockEmployees);

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            name: employee?.name || "",
            role: employee?.role || "",
            salary: employee?.salary || 0,
        },
    });

    const onSubmit = (values: EmployeeFormValues) => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            if (isEditMode && employee) {
                setEmployees(employees.map(e => e.id === employee.id ? {...e, ...values} : e));
            } else {
                const newEmployee = { ...values, id: `EMP${employees.length + 1}`, balance: 0, leaves: 0 };
                setEmployees([...employees, newEmployee]);
            }
            toast({
                title: isEditMode ? "Employee Updated!" : "Employee Added!",
                description: `Successfully ${isEditMode ? 'updated' : 'added'} ${values.name}.`,
            });
            setIsSubmitting(false);
            setOpen(false);
        }, 1000);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="Employee's full name" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <FormControl><Input placeholder="e.g., Master Tailor" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salary</FormLabel>
                                <FormControl><Input type="number" placeholder="Monthly salary" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add Employee")}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function EmployeesPage() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState(mockEmployees);
    const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
    const [dialogs, setDialogs] = useState({
        add: false,
        edit: false,
        delete: false,
        pay: false,
        leaves: false,
    });
    
    const handleActionClick = (employee: Employee, dialog: keyof typeof dialogs) => {
        setCurrentEmployee(employee);
        setDialogs(prev => ({ ...prev, [dialog]: true }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };
    
    const handlePaySalary = () => {
        if(!currentEmployee) return;
        setEmployees(employees.map(e => e.id === currentEmployee.id ? {...e, balance: 0} : e));
         toast({
            title: "Salary Paid!",
            description: `Salary paid to ${currentEmployee.name}. Balance is now zero.`,
        });
        setDialogs(p => ({...p, pay: false}));
    }

    const handleUpdateLeaves = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentEmployee) return;
        const form = event.currentTarget;
        const newLeaves = (form.elements.namedItem('leaves') as HTMLInputElement).value;
        setEmployees(employees.map(e => e.id === currentEmployee.id ? {...e, leaves: parseInt(newLeaves) } : e));
         toast({
            title: "Leaves Updated",
            description: `Leave balance updated for ${currentEmployee.name}.`,
        });
        console.log(`Updating leaves for ${currentEmployee.name} to ${newLeaves}`);
        setDialogs(p => ({...p, leaves: false}));
    }

    const handleRemoveEmployee = () => {
        if (!currentEmployee) return;
        setEmployees(employees.filter(e => e.id !== currentEmployee.id));
        toast({
            variant: "destructive",
            title: "Employee Removed",
            description: `${currentEmployee.name} has been removed from your records.`
        });
    }

    return (
        <div className="space-y-8">
            <PageHeader title="Employees" subtitle="Manage your staff, salaries, and leaves.">
                <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({ ...p, add: open }))}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to add a new employee to your payroll.
                            </DialogDescription>
                        </DialogHeader>
                        <EmployeeForm setOpen={(open) => setDialogs(p => ({ ...p, add: open }))} />
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Staff List</CardTitle>
                    <CardDescription>
                        A list of all employees at your store.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Salary</TableHead>
                                <TableHead>Balance Due</TableHead>
                                <TableHead>Leaves Taken</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{employee.role}</Badge>
                                    </TableCell>
                                    <TableCell>{formatCurrency(employee.salary)}</TableCell>
                                    <TableCell className={employee.balance > 0 ? "text-destructive" : ""}>{formatCurrency(employee.balance)}</TableCell>
                                    <TableCell>{employee.leaves}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'edit')}>Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'pay')}>Pay Salary</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'leaves')}>Manage Leaves</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentEmployee(employee)}>
                                                            Remove Employee
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently remove {currentEmployee?.name} from your records.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Back</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleRemoveEmployee}>
                                                        Yes, Remove Employee
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {currentEmployee && (
                <>
                    <Dialog open={dialogs.edit} onOpenChange={(open) => setDialogs(p => ({ ...p, edit: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Employee Details</DialogTitle>
                                <DialogDescription>Update the details for {currentEmployee.name}.</DialogDescription>
                            </DialogHeader>
                            <EmployeeForm setOpen={(open) => setDialogs(p => ({ ...p, edit: open }))} employee={currentEmployee} />
                        </DialogContent>
                    </Dialog>
                    
                    <Dialog open={dialogs.pay} onOpenChange={(open) => setDialogs(p => ({ ...p, pay: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Pay Salary</DialogTitle>
                                <DialogDescription>Pay outstanding balance for {currentEmployee.name}.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <p>Outstanding balance for <span className="font-medium">{currentEmployee.name}</span> is <span className="font-mono text-destructive">{formatCurrency(currentEmployee.balance)}</span>.</p>
                                <p className="text-sm text-muted-foreground mt-2">Paying this will reset the balance to zero.</p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogs(p => ({ ...p, pay: false }))}>Cancel</Button>
                                <Button onClick={handlePaySalary}>Confirm Payment</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={dialogs.leaves} onOpenChange={(open) => setDialogs(p => ({ ...p, leaves: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Manage Leaves</DialogTitle>
                                <DialogDescription>Update the leave balance for {currentEmployee.name}.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateLeaves} className="py-4 space-y-4">
                               <div className="space-y-2">
                                <Label htmlFor="leaves">Leaves Taken</Label>
                                <Input id="leaves" name="leaves" type="number" defaultValue={currentEmployee.leaves}/>
                               </div>
                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setDialogs(p => ({ ...p, leaves: false }))}>Cancel</Button>
                                    <Button type="submit">Update Leaves</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </>
            )}

        </div>
    );
}
