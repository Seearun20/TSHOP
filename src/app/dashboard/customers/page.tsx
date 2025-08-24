
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
import { useState, useEffect } from "react";
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

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    measurements: string;
}

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  measurements: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function CustomerForm({ setOpen, customer, onSave }: { setOpen: (open: boolean) => void; customer?: Customer | null, onSave: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      measurements: customer?.measurements || "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
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
      onSave();
      setOpen(false);
    } catch (error) {
      console.error("Error saving customer: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem saving the customer details.",
      });
    } finally {
      setIsSubmitting(false);
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
         <FormField
            control={form.control}
            name="measurements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Measurements</FormLabel>
                <FormControl><Textarea placeholder="e.g., Shirt: L-28, C-42, SL-25..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add Customer")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}


export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [dialogs, setDialogs] = useState({
      add: false,
      edit: false,
      delete: false,
  });

  const fetchCustomers = () => {
     const unsubscribe = onSnapshot(collection(db, "customers"), (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
    });
    return unsubscribe;
  }

  useEffect(() => {
    const unsubscribe = fetchCustomers();
    return () => unsubscribe();
  }, []);

  const handleActionClick = (customer: Customer, dialog: keyof typeof dialogs) => {
    setCurrentCustomer(customer);
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };

  const handleDelete = async () => {
    if (!currentCustomer) return;
    try {
        await deleteDoc(doc(db, "customers", currentCustomer.id));
        toast({
            variant: "destructive",
            title: "Customer Deleted",
            description: `${currentCustomer.name} has been removed from your records.`
        });
        fetchCustomers();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete customer."
        })
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Customers" subtitle="Manage your customer database and measurements.">
         <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({...p, add: open}))}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                    Fill in the details below to add a new customer to your records.
                </DialogDescription>
                </DialogHeader>
                <CustomerForm setOpen={(open) => setDialogs(p => ({...p, add: open}))} onSave={fetchCustomers} />
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
                  <TableCell className="font-mono text-xs whitespace-pre-wrap">{customer.measurements}</TableCell>
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                    <DialogDescription>Update the details for {currentCustomer.name}.</DialogDescription>
                </DialogHeader>
                <CustomerForm setOpen={(open) => setDialogs(p => ({...p, edit: open}))} customer={currentCustomer} onSave={fetchCustomers} />
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
