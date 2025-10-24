
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  customers as mockCustomers,
  serviceCharges,
  fabricStock,
  readyMadeStock,
} from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Customer } from "@/app/dashboard/customers/page";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const orderSchema = z.object({
  customerType: z.enum(['existing', 'new']),
  customerId: z.string().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhone: z.string().optional(),
  orderType: z.enum(["stitching", "readymade", "fabric"]),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  
  // Stitching fields
  stitchingService: z.string().optional(),
  measurements: z.object({
    length: z.string().optional(),
    chest: z.string().optional(),
    sleeve: z.string().optional(),
    shoulder: z.string().optional(),
    waist: z.string().optional(),
    hip: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  
  // Ready-made fields
  readymadeId: z.string().optional(),
  readymadeSize: z.string().optional(),

  // Fabric fields
  fabricId: z.string().optional(),
  fabricLength: z.coerce.number().optional(),

  sellingPrice: z.coerce.number().min(1, "Selling price is required"),
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

const measurementFields: { [key: string]: string[] } = {
    'Shirt': ['length', 'chest', 'sleeve', 'shoulder', 'notes'],
    'Pant': ['length', 'waist', 'hip', 'notes'],
    'Kurta+Pyjama': ['length', 'chest', 'sleeve', 'shoulder', 'waist', 'hip', 'notes'],
    'Kurta': ['length', 'chest', 'sleeve', 'shoulder', 'notes'],
    'Pyjama': ['length', 'waist', 'hip', 'notes'],
    '3pc Suit': ['length', 'chest', 'sleeve', 'shoulder', 'waist', 'hip', 'notes'],
    '2pc Suit': ['length', 'chest', 'sleeve', 'shoulder', 'waist', 'hip', 'notes'],
    'Blazer': ['length', 'chest', 'sleeve', 'shoulder', 'notes'],
    'Sherwani': ['length', 'chest', 'sleeve', 'shoulder', 'notes'],
};

export default function NewOrderPage() {
  const [receipt, setReceipt] = useState<Partial<OrderFormValues> | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

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

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerType: 'existing',
      orderType: "stitching",
      deliveryDate: "",
      sellingPrice: 0,
    },
  });

  const orderType = form.watch("orderType");
  const stitchingService = form.watch("stitchingService");
  const customerType = form.watch("customerType");

  const onSubmit = (data: OrderFormValues) => {
    console.log(data);
    // Here you would typically handle adding the new customer to your database
    // if data.customerType === 'new'
    setReceipt(data);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getCustomerName = (receiptData: Partial<OrderFormValues> | null) => {
    if (!receiptData) return 'N/A';
    if (receiptData.customerType === 'new') return receiptData.newCustomerName || 'N/A';
    return customers.find(c => c.id === receiptData.customerId)?.name || "N/A";
  }
  
  const renderMeasurementFields = () => {
      if (!stitchingService || !measurementFields[stitchingService]) return null;
      
      return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline">Measurements</CardTitle>
                <CardDescription>Enter measurements for the {stitchingService}.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {measurementFields[stitchingService].map(field => 
                    field !== 'notes' ? (
                     <FormField
                        key={field}
                        control={form.control}
                        name={`measurements.${field as keyof OrderFormValues['measurements']}`}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel className="capitalize">{field}</FormLabel>
                                <FormControl>
                                    <Input placeholder="..." {...formField} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                        />
                    ) : null
                )}
                {measurementFields[stitchingService].includes('notes') && (
                     <div className="col-span-2 md:col-span-4">
                        <FormField
                            control={form.control}
                            name="measurements.notes"
                            render={({ field: formField }) => (
                                <FormItem>
                                    <FormLabel>Special Instructions</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any special notes or instructions..." {...formField} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
         </Card>
      )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="New Order" subtitle="Create a new order and generate a receipt."/>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="existing" />
                              </FormControl>
                              <FormLabel className="font-normal">Existing Customer</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="new" />
                              </FormControl>
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
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select an existing customer" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="newCustomerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Customer Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter customer's full name" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="newCustomerPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Customer Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter customer's phone number" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date</FormLabel>
                        <FormControl>
                           <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="orderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select the type of order" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="stitching">Stitching Service</SelectItem>
                                <SelectItem value="readymade">Sell Ready-Made Item</SelectItem>
                                <SelectItem value="fabric">Sell Fabric Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {orderType === 'stitching' && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Service & Fabric</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="stitchingService"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stitching Service</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a stitching service" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.keys(serviceCharges).map((service) => (
                                            <SelectItem key={service} value={service}>{service}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="fabricId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Fabric (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select fabric from stock" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {fabricStock.map(f => <SelectItem key={f.id} value={f.id}>{f.type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                {renderMeasurementFields()}
                </>
            )}

            {orderType === 'readymade' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Ready-Made Item Details</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="readymadeId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Item</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {readyMadeStock.map(i => <SelectItem key={i.id} value={i.id}>{i.item}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="readymadeSize"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Size</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter size" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

            {orderType === 'fabric' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Fabric Sale Details</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="fabricId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fabric</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a fabric" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {fabricStock.map(f => <SelectItem key={f.id} value={f.id}>{f.type}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fabricLength"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Length (mtrs)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Enter length" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Total Selling Price</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Enter final price" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-1">
              <Card className="sticky top-24">
                  <CardHeader>
                      <CardTitle className="font-headline">Order Summary</CardTitle>
                      <CardDescription>Preview of the order details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 font-mono text-sm">
                      <div className="flex justify-between"><span>Order ID:</span> <span>ORD-2407-004</span></div>
                      <div className="flex justify-between"><span>Customer:</span> <span>{getCustomerName(receipt)}</span></div>
                      <div className="flex justify-between"><span>Delivery:</span> <span>{form.watch('deliveryDate')}</span></div>
                      <Separator/>
                      <p className="font-semibold uppercase">{receipt?.orderType || 'N/A'}</p>
                      
                       {receipt?.orderType === 'stitching' && receipt.stitchingService && (
                            <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                                <p className="font-sans font-semibold pb-2">{receipt.stitchingService}</p>
                                {receipt.measurements && Object.entries(receipt.measurements).map(([key, value]) => value && (
                                   <div key={key} className="flex justify-between">
                                       <span className="capitalize">{key}:</span>
                                       <span>{value}</span>
                                   </div>
                                ))}
                            </div>
                       )}
                       {receipt?.orderType === 'readymade' && (
                           <div className="p-4 bg-muted rounded-md">
                               <p>{readyMadeStock.find(i => i.id === receipt.readymadeId)?.item}</p>
                               <p className="text-xs">Size: {receipt.readymadeSize}</p>
                           </div>
                       )}
                        {receipt?.orderType === 'fabric' && (
                           <div className="p-4 bg-muted rounded-md">
                               <p>{fabricStock.find(f => f.id === receipt.fabricId)?.type}</p>
                               <p className="text-xs">Length: {receipt.fabricLength} mtrs</p>
                           </div>
                       )}

                       <Separator/>
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold"><span>Total Bill:</span> <span>{formatCurrency(receipt?.sellingPrice || 0)}</span></div>
                      </div>
                      <Button type="submit" className="w-full">Generate Receipt & Invoice</Button>
                  </CardContent>
              </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
