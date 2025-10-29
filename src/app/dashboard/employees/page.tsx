
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
import { MoreHorizontal, PlusCircle, Loader2, Trash2, Briefcase } from "lucide-react";
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

export interface WorkItem {
    date: string;
    orderNumber: string;
    apparel: string;
    fee: number;
}

export interface Payment {
    date: string;
    amount: number;
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    balance: number;
    workHistory: WorkItem[];
    payments: Payment[];
}

const employeeSchema = z.object({
    name: z.string().min(1, "Employee name is required"),
    role: z.string().min(1, "Role is required"),
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
        } : {
            name: "",
            role: "",
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
                    balance: 0,
                    workHistory: [],
                    payments: [],
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
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add Employee")}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function AssignWorkDialog({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void; }) {
    const { toast } = useToast();
    const [orderNumber, setOrderNumber] = useState('');
    const [apparel, setApparel] = useState('');
    const [fee, setFee] = useState<number | ''>('');

    const handleAssignWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber || !apparel || !fee || fee <= 0) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill all fields with valid values." });
            return;
        }

        const employeeDoc = doc(db, "employees", employee.id);
        const newWorkItem: WorkItem = {
            date: new Date().toISOString(),
            orderNumber,
            apparel,
            fee: Number(fee)
        };
        const newBalance = (employee.balance || 0) + Number(fee);

        try {
            await updateDoc(employeeDoc, {
                workHistory: arrayUnion(newWorkItem),
                balance: newBalance
            });
            toast({
                title: "Work Assigned",
                description: `${apparel} for Order #${orderNumber} has been assigned to ${employee.name}.`
            });
            setOpen(false);
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: employeeDoc.path, operation: 'update' }));
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assign Work to {employee.name}</DialogTitle>
                <DialogDescription>Enter the details of the work item to assign.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignWork} className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="order-number">Order #</Label>
                    <Input id="order-number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g., 1024" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apparel-name">Apparel Name</Label>
                    <Input id="apparel-name" value={apparel} onChange={(e) => setApparel(e.target.value)} placeholder="e.g., 2pc Suit" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fee">Fee</Label>
                    <Input id="fee" type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} placeholder="Enter agreed fee" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Assign</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

function ViewWorkHistoryDialog({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void; }) {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Work History for {employee.name}</DialogTitle>
                <DialogDescription>Total pieces assigned: {employee.workHistory?.length || 0}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto py-4">
                {employee.workHistory && employee.workHistory.length > 0 ? (
                    [...employee.workHistory].reverse().map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                                <p className="text-sm font-medium">{item.apparel} (Order #{item.orderNumber})</p>
                                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                            </div>
                            <p className="font-medium text-sm">{formatCurrency(item.fee)}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No work items recorded.</p>
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
                    Current balance due from assigned work: <span className="font-medium text-destructive">{formatCurrency(employee.balance)}</span>
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
        assignWork: false,
        workHistory: false,
        paymentHistory: false,
    });
    const { toast } = useToast();

    useEffect(() => {
        const employeesCollection = collection(db, "employees");
        const unsubscribe = onSnapshot(employeesCollection, (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            setEmployees(employeesData);
        },
        (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'employees', operation: 'list'}));
        });

        return () => unsubscribe();
    }, []);

    const handleActionClick = (employee: Employee, dialog: keyof Omit<typeof dialogs, 'add' | 'delete'>) => {
        setCurrentEmployee(employee);
        setDialogs(prev => ({ ...prev, [dialog]: true }));
    };
    
    const openDialog = (dialog: keyof typeof dialogs, employee?: Employee | null) => {
        setCurrentEmployee(employee || null);
        setDialogs(prev => ({ ...prev, [dialog]: true }));
    }


    const handleRemoveEmployee = async () => {
        if (!currentEmployee) return;
        const employeeDoc = doc(db, "employees", currentEmployee.id);
        try {
            await deleteDoc(employeeDoc);
            toast({
                variant: "destructive",
                title: "Employee Removed",
                description: `${currentEmployee.name} has been removed from your records.`
            });
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({path: employeeDoc.path, operation: 'delete'}));
        }
        setDialogs(prev => ({ ...prev, delete: false }));
    };

    return (
        <div className="space-y-8">
            <PageHeader title="Employees" subtitle="Manage your staff and their assigned work.">
                <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({ ...p, add: open }))}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog('add', null)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to add a new employee.
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
                        A list of all employees and their pending payments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Balance Due</TableHead>
                                <TableHead>Pieces Assigned</TableHead>
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
                                    <TableCell className={employee.balance > 0 ? "text-destructive font-medium" : ""}>{formatCurrency(employee.balance)}</TableCell>
                                    <TableCell>{employee.workHistory?.length || 0}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'assignWork')}>
                                                    <Briefcase className="mr-2 h-4 w-4" /> Assign Work
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onSelect={() => handleActionClick(employee, 'payment')} disabled={(employee.balance || 0) <= 0}>
                                                    Make Payment
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'workHistory')}>View Work History</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'paymentHistory')}>View Payments</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleActionClick(employee, 'edit')}>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onSelect={() => openDialog('delete', employee)}>
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
                    
                    <Dialog open={dialogs.payment} onOpenChange={(open) => setDialogs(p => ({...p, payment: open}))}>
                       <MakePaymentDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, payment: open}))} />
                    </Dialog>

                     <Dialog open={dialogs.assignWork} onOpenChange={(open) => setDialogs(p => ({...p, assignWork: open}))}>
                       <AssignWorkDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, assignWork: open}))} />
                    </Dialog>
                    
                     <Dialog open={dialogs.workHistory} onOpenChange={(open) => setDialogs(p => ({...p, workHistory: open}))}>
                       <ViewWorkHistoryDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, workHistory: open}))} />
                    </Dialog>

                     <Dialog open={dialogs.paymentHistory} onOpenChange={(open) => setDialogs(p => ({...p, paymentHistory: open}))}>
                       <ViewPaymentsDialog employee={currentEmployee} setOpen={(open) => setDialogs(p => ({...p, paymentHistory: open}))} />
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

    