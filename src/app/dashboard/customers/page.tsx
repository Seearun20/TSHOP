
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
import { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, DocumentData } from "firebase/firestore";
import { Separator } from "@/components/ui/separator";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    measurements?: {
        shirtLength?: string;
        pantLength?: string;
        chest?: string;
        sleeve?: string;
        shoulder?: string;
        waist?: string;
        hip?: string;
        notes?: string;
    };
}

const measurementSchema = z.object({
  shirtLength: z.string().optional(),
  pantLength: z.string().optional(),
  chest: z.string().optional(),
  sleeve: z.string().optional(),
  shoulder: z.string().optional(),
  waist: z.string().optional(),
  hip: z.string().optional(),
  notes: z.string().optional(),
});

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  measurements: measurementSchema.optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CustomerForm = memo(function CustomerForm({ setOpen, customer }: { setOpen: (open: boolean) => void; customer?: Customer | null }) {
  const { toast } = useToast();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: "",
      phone: "",
      email: "",
      measurements: {
        shirtLength: "",
        pantLength: "",
        chest: "",
        sleeve: "",
        shoulder: "",
        waist: "",
        hip: "",
        notes: "",
      },
    },
  });

  const { formState: { isSubmitting } } = form;
  const isEditMode = !!customer;

  const onSubmit = async (values: CustomerFormValues) => {
    try {
        if (isEditMode && customer) {
            const customerDoc = doc(db, "customers", customer.id);
            await updateDoc(customerDoc, values);
            toast({
                title: "Customer Updated!",
                description: `Successfully updated ${values.name}.`,
            });
        } else {
            await addDoc(collection(db, "customers"), values);
            toast({
                title: "Customer Added!",
                description: `Successfully added ${values.name}.`,
            });
        }
        setOpen(false);
        form.reset();
    } catch (error) {
        const path = isEditMode && customer ? doc(db, "customers", customer.id).path : collection(db, "customers").path;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Customer's full name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="10-digit phone number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl><Input placeholder="customer@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
            <div>
              <h3 className="text-sm font-medium mb-2">Optional Measurements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="measurements.shirtLength" render={({ field }) => (<FormItem><FormLabel>Shirt L</FormLabel><FormControl><Input placeholder="e.g. 28" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="measurements.pantLength" render={({ field }) => (<FormItem><FormLabel>Pant L</FormLabel><FormControl><Input placeholder="e.g. 40" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="measurements.chest" render={({ field }) => (<FormItem><FormLabel>Chest</FormLabel><FormControl><Input placeholder="e.g. 42" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="measurements.sleeve" render={({ field }) => (<FormItem><FormLabel>Sleeve</FormLabel><FormControl><Input placeholder="e.g. 25" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="measurements.shoulder" render={({ field }) => (<FormItem><FormLabel>Shoulder</FormLabel><FormControl><Input placeholder="e.g. 18" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="measurements.waist" render={({ field }) => (<FormItem><FormLabel>Waist</FormLabel><FormControl><Input placeholder="e.g. 36" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="measurements.hip" render={({ field }) => (<FormItem><FormLabel>Hip</FormLabel><FormControl><Input placeholder="e.g. 44" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="mt-4">
                <FormField control={form.control} name="measurements.notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Any other notes..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add Customer")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
});


export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [dialogs, setDialogs] = useState({
      add: false,
      edit: false,
      delete: false,
  });

  useEffect(() => {
    const customersCollection = collection(db, "customers");
    const unsubscribe = onSnapshot(customersCollection, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
    },
    async (error) => {
        const permissionError = new FirestorePermissionError({
          path: customersCollection.path,
          operation: "list",
        });
        errorEmitter.emit("permission-error", permissionError);
    });
    return () => unsubscribe();
  }, []);

  const handleActionClick = (customer: Customer, dialog: keyof typeof dialogs) => {
    setCurrentCustomer(customer);
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };

  const handleDelete = async () => {
    if (!currentCustomer) return;
    const customerDoc = doc(db, "customers", currentCustomer.id);
    deleteDoc(customerDoc)
        .then(() => {
            toast({
                variant: "destructive",
                title: "Customer Deleted",
                description: `${currentCustomer.name} has been removed from your records.`
            });
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: customerDoc.path,
                operation: "delete",
            });
            errorEmitter.emit("permission-error", permissionError);
        });
  }

  const formatMeasurements = (measurements: Customer['measurements']) => {
    if (!measurements) return 'N/A';
    return Object.entries(measurements)
      .filter(([, value]) => value)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `${label}: ${value}`;
      })
      .join('\n');
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Customers" subtitle="Manage your customer database and measurements.">
         <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({...p, add: open}))}>
            <DialogTrigger asChild>
                <Button onClick={() => { setCurrentCustomer(null); setDialogs(p => ({...p, add: true})) }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                    Fill in the details below to add a new customer to your records.
                </DialogDescription>
                </DialogHeader>
                <CustomerForm setOpen={(open) => setDialogs(p => ({...p, add: open}))} />
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            A list of all your valued customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Measurements</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div>{customer.phone}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-pre-wrap">{formatMeasurements(customer.measurements)}</TableCell>
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
                          <DropdownMenuItem onSelect={() => handleActionClick(customer, 'edit')}>Edit Customer</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(customer, 'edit')}>Update Measurements</DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href="/dashboard/orders">View Order History</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentCustomer(customer)}>
                              Delete Customer
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete {currentCustomer?.name} and all their associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Yes, Delete Customer
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

      {currentCustomer && (
        <Dialog open={dialogs.edit} onOpenChange={(open) => setDialogs(p => ({...p, edit: open}))}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                    <DialogDescription>Update the details for {currentCustomer.name}.</DialogDescription>
                </DialogHeader>
                <CustomerForm setOpen={(open) => setDialogs(p => ({...p, edit: open}))} customer={currentCustomer} />
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
