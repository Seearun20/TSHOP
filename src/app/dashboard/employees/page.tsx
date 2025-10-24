
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
import { MoreHorizontal, PlusCircle, Loader2, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Leave {
    date: string;
    description: string;
}

export interface Payment {
    date: string;
    amount: number;
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    salary: number;
    balance: number;
    leaves: Leave[];
    paycheckDay: number;
    lastSalaryUpdate: Timestamp;
    payments: Payment[];
}

const employeeSchema = z.object({
    name: z.string().min(1, "Employee name is required"),
    role: z.string().min(1, "Role is required"),
    salary: z.coerce.number().min(1, "Salary must be greater than 0"),
    paycheckDay: z.coerce.number().min(1).max(28, "Paycheck day must be between 1 and 28"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(amount);
};


function EmployeeForm({ setOpen, employee }: { setOpen: (open: boolean) => void; employee?: Employee | null }) {
    const { toast } = useToast();
    const isEditMode = !!employee;

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: employee ? {
            name: employee.name,
            role: employee.role,
            salary: employee.salary,
            paycheckDay: employee.paycheckDay,
        } : {
            name: "",
            role: "",
            salary: 0,
            paycheckDay: 1,
        },
    });

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (values: EmployeeFormValues) => {
        try {
            if (isEditMode && employee) {
                const employeeDoc = doc(db, "employees", employee.id);
                await updateDoc(employeeDoc, values);
                 toast({
                    title: "Employee Updated!",
                    description: `Successfully updated ${values.name}.`,
                });
            } else {
                const newEmployee = { 
                    ...values, 
                    balance: values.salary, // Initial balance is the salary
                    leaves: [],
                    payments: [],
                    lastSalaryUpdate: Timestamp.now(),
                };
                await addDoc(collection(db, "employees"), newEmployee);
                toast({
                    title: "Employee Added!",
                    description: `Successfully added ${values.name}.`,
                });
            }
            setOpen(false);
            form.reset();
        } catch (error) {
            const path = isEditMode && employee ? doc(db, "employees", employee.id).path : collection(db, "employees").path;
            const permissionError = new FirestorePermissionError({
                path,
                operation: isEditMode ? "update" : "create",
                requestResourceData: values,
            });
            errorEmitter.emit("permission-error", permissionError);
        }
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
                 <FormField
                    control={form.control}
                    name="paycheckDay"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paycheck Day of Month</FormLabel>
                            <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a day" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                        <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add Employee")}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function ManageLeavesDialog({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void; }) {
    const { toast } = useToast();
    const [description, setDescription] = useState('');

    const handleAddLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) return;
        const employeeDoc = doc(db, "employees", employee.id);
        const newLeave = {
            date: new Date().toISOString(),
            description: description
        };
        try {
            await updateDoc(employeeDoc, { leaves: arrayUnion(newLeave) });
            toast({
                title: "Leave Added",
                description: `A new leave has been recorded for ${employee.name}.`
            });
            setDescription('');
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: employeeDoc.path, operation: 'update' }));
        }
    };

    const handleRemoveLeave = async (leave: Leave) => {
        const employeeDoc = doc(db, "employees", employee.id);
        try {
            await updateDoc(employeeDoc, { leaves: arrayRemove(leave) });
            toast({
                variant: 'destructive',
                title: "Leave Removed",
                description: `A leave has been removed for ${employee.name}.`
            });
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: employeeDoc.path, operation: 'update' }));
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Leaves</DialogTitle>
                <DialogDescription>Add or remove leaves for {employee.name}. Current leaves: {employee.leaves?.length || 0}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLeave} className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="leave-description">Leave Description</Label>
                    <Textarea id="leave-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Family emergency" />
                </div>
                <Button type="submit" disabled={!description}>Add Leave</Button>
            </form>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                <h4 className="font-medium">Leave History</h4>
                {employee.leaves && employee.leaves.length > 0 ? (
                    employee.leaves.map((leave, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                                <p className="text-sm">{leave.description}</p>
                                <p className="text-xs text-muted-foreground">{new Date(leave.date).toLocaleDateString()}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLeave(leave)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No leaves recorded.</p>
                )}
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    );
}

function MakePaymentDialog({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void; }) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<number | ''>('');

    const handlePayment = async () => {
        if (!amount || amount <= 0) {
            toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid payment amount." });
            return;
        }
        if (amount > employee.balance) {
            toast({ variant: 'destructive', title: "Amount Exceeds Balance", description: `Payment cannot be more than the due amount of ${formatCurrency(employee.balance)}.` });
            return;
        }

        const employeeDoc = doc(db, "employees", employee.id);
        const newPayment: Payment = {
            date: new Date().toISOString(),
            amount: Number(amount)
        };
        const newBalance = employee.balance - Number(amount);

        try {
            await updateDoc(employeeDoc, {
                balance: newBalance,
                payments: arrayUnion(newPayment)
            });
            toast({
                title: "Payment Recorded!",
                description: `${formatCurrency(Number(amount))} paid to ${employee.name}. New balance: ${formatCurrency(newBalance)}.`,
            });
            setOpen(false);
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: employeeDoc.path, operation: 'update' }));
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Make Payment to {employee.name}</DialogTitle>
                <DialogDescription>
                    Current balance due: <span className="font-medium text-destructive">{formatCurrency(employee.balance)}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="payment-amount">Payment Amount</Label>
                    <Input id="payment-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount to pay" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handlePayment} disabled={!amount || amount <= 0}>Confirm Payment</Button>
            </DialogFooter>
        </DialogContent>
    );
}

function ViewPaymentsDialog({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void; }) {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Payment History</DialogTitle>
                <DialogDescription>Showing all payments made to {employee.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto py-4">
                {employee.payments && employee.payments.length > 0 ? (
                    [...employee.payments].reverse().map((payment, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                                <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                                <p className="text-xs text-muted-foreground">{new Date(payment.date).toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No payments recorded.</p>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    );
}


export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
    const [dialogs, setDialogs] = useState({
        add: false,
        edit: false,
        delete: false,
        payment: false,
        leaves: false,
        history: false,
    });
    
    const updateSalaryBalances = useCallback(async (employeesData: Employee[]) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        for (const employee of employeesData) {
            if (!employee.lastSalaryUpdate || !employee.paycheckDay) continue;

            const lastUpdateDate = employee.lastSalaryUpdate.toDate();
            const lastUpdateMonth = lastUpdateDate.getMonth();
            const lastUpdateYear = lastUpdateDate.getFullYear();

            const isPaycheckDayPassed = currentDay >= employee.paycheckDay;
            const isNewMonth = currentYear > lastUpdateYear || (currentYear === lastUpdateYear && currentMonth > lastUpdateMonth);

            if (isPaycheckDayPassed && isNewMonth) {
                const employeeDoc = doc(db, "employees", employee.id);
                const newBalance = (employee.balance || 0) + employee.salary;
                try {
                    await updateDoc(employeeDoc, {
                        balance: newBalance,
                        lastSalaryUpdate: Timestamp.now()
                    });
                    console.log(`Updated balance for ${employee.name}`);
                } catch (error) {
                    console.error(`Failed to update balance for ${employee.name}:`, error);
                    // Optionally emit a specific, non-blocking error here
                }
            }
        }
    }, []);

    useEffect(() => {
        const employeesCollection = collection(db, "employees");
        const unsubscribe = onSnapshot(employeesCollection, (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            updateSalaryBalances(employeesData);
            setEmployees(employeesData);
        },
        (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'employees', operation: 'list'}));
        });

        return () => unsubscribe();
    }, [updateSalaryBalances]);

    const handleActionClick = (employee: Employee, dialog: keyof typeof dialogs) => {
        setCurrentEmployee(employee);
        setDialogs(prev => ({ ...prev, [dialog]: true }));
    };

    const handleRemoveEmployee = async () => {
        if (!currentEmployee) return;
        const employeeDoc = doc(db, "employees", currentEmployee.id);
        try {
            await deleteDoc(employeeDoc);
            useToast().toast({
                variant: "destructive",
                title: "Employee Removed",
                description: `${currentEmployee.name} has been removed from your records.`
            });
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({path: employeeDoc.path, operation: 'delete'}));
        }
        setDialogs(prev => ({ ...prev, delete: false }));
    }

    return (
        <div className="space-y-8">
            <PageHeader title="Employees" subtitle="Manage your staff, salaries, and leaves.">
                <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({ ...p, add: open }))}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setCurrentEmployee(null)}>
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
                                    <TableCell>{employee.leaves?.length || 0}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'payment')}>Make Payment</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'history')}>View Payments</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'leaves')}>Manage Leaves</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'edit')}>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onSelect={() => handleActionClick(employee, 'delete')}>
                                                    Remove Employee
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                    
                    <Dialog open={dialogs.payment} onOpenChange={(open) => setDialogs(p => ({ ...p, payment: open }))}>
                       <MakePaymentDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, payment: open}))} />
                    </Dialog>

                     <Dialog open={dialogs.history} onOpenChange={(open) => setDialogs(p => ({...p, history: open}))}>
                       <ViewPaymentsDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, history: open}))} />
                    </Dialog>

                    <Dialog open={dialogs.leaves} onOpenChange={(open) => setDialogs(p => ({...p, leaves: open}))}>
                        <ManageLeavesDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, leaves: open}))}/>
                    </Dialog>

                    <AlertDialog open={dialogs.delete} onOpenChange={(open) => setDialogs(p => ({ ...p, delete: open }))}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently remove {currentEmployee.name} from your records.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRemoveEmployee} className="bg-destructive hover:bg-destructive/90">
                                    Yes, Remove Employee
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}

        </div>
    );
}

    

    