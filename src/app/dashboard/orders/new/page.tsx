
"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Customer } from "@/app/dashboard/customers/page";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Input } from "@/components/ui/input";

const orderSchema = z.object({
  customerType: z.enum(['existing', 'new']),
  customerId: z.string().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhone: z.string().optional(),
}).refine(data => {
    if (data.customerType === 'existing' && !data.customerId) return false;
    return true;
}, {
    message: "Please select an existing customer.",
    path: ['customerId'],
}).refine(data => {
    if (data.customerType === 'new' && (!data.newCustomerName || !data.newCustomerPhone)) return false;
    return true;
}, {
    message: "New customer name and phone are required.",
    path: ['newCustomerName'],
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        const customersCollection = collection(db, "customers");
        const unsubscribe = onSnapshot(customersCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(data);
        }, (error) => {
            const permissionError = new FirestorePermissionError({ path: customersCollection.path, operation: 'list' });
            errorEmitter.emit('permission-error', permissionError);
        });

        return () => unsubscribe();
    }, []);

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
          customerType: 'existing',
        },
    });

    const customerType = form.watch("customerType");

    return (
        <div className="space-y-8">
            <PageHeader title="New Order" subtitle="Create a new order by selecting a customer."/>
            <Form {...form}>
                <form className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="customerType"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="existing" /></FormControl>
                                            <FormLabel className="font-normal">Existing Customer</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="new" /></FormControl>
                                            <FormLabel className="font-normal">New Customer</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {customerType === 'existing' ? (
                                <FormField
                                    control={form.control}
                                    name="customerId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Customer</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select an existing customer" /></SelectTrigger></FormControl>
                                            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <FormField control={form.control} name="newCustomerName" render={({ field }) => (<FormItem><FormLabel>New Customer Name</FormLabel><FormControl><Input placeholder="Full name" {...field} /></FormControl><FormMessage/></FormItem>)} />
                                    <FormField control={form.control} name="newCustomerPhone" render={({ field }) => (<FormItem><FormLabel>New Customer Phone</FormLabel><FormControl><Input placeholder="Phone number" {...field} /></FormControl><FormMessage/></FormItem>)} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
