

"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { collection, onSnapshot, doc, addDoc, updateDoc, runTransaction, getDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle, Printer, Trash2, X, History } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ReadyMadeStockItem } from "@/app/dashboard/stock/readymade/page";
import { FabricStockItem } from "@/app/dashboard/stock/fabric/page";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Order } from "../page";
import { Textarea } from "@/components/ui/textarea";
import { apparelMeasurements } from "@/lib/data";


const orderItemSchema = z.object({
  type: z.enum(['stitching', 'readymade', 'fabric', 'accessory']),
  name: z.string(),
  price: z.coerce.number().positive("Price must be positive"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  details: z.any().optional(),
});

const orderSchema = z.object({
  customerType: z.enum(['existing', 'new']),
  customerId: z.string().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhone: z.string().optional(),
  deliveryDate: z.date().optional(),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item."),
  advance: z.coerce.number().min(0).optional(),
}).refine(data => data.customerType !== 'existing' || !!data.customerId, {
    message: "Please select an existing customer.",
    path: ['customerId'],
}).refine(data => data.customerType !== 'new' || (!!data.newCustomerName && !!data.newCustomerPhone), {
    message: "New customer name and phone are required.",
    path: ['newCustomerName'],
});

type OrderFormValues = z.infer<typeof orderSchema>;
type OrderItem = z.infer<typeof orderItemSchema>;


function StitchingServiceDialog({ onAddItem, customerId, orders }: { onAddItem: (item: OrderItem) => void; customerId?: string; orders: Order[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [apparel, setApparel] = useState('');
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isOwnFabric, setIsOwnFabric] = useState(false);
    const [measurements, setMeasurements] = useState<Record<string, string>>({});
    const [remarks, setRemarks] = useState('');
    
    const measurementFields = apparel ? Object.keys(apparelMeasurements[apparel as keyof typeof apparelMeasurements]?.shape || {}) : [];

    const previousMeasurement = useMemo(() => {
        if (!customerId || !apparel || !orders.length) return null;

        const customerOrders = orders
            .filter(o => o.customerId === customerId)
            .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

        for (const order of customerOrders) {
            const item = order.items.find(i => i.type === 'stitching' && i.details.apparel === apparel);
            if (item && item.details.measurements) {
                return item.details.measurements;
            }
        }
        return null;
    }, [customerId, apparel, orders]);

    const handleFetchMeasurements = () => {
        if (previousMeasurement) {
            setMeasurements(previousMeasurement);
            toast({
                title: "Measurements Fetched",
                description: `Loaded previous measurements for ${apparel}.`
            });
        }
    };
    
    const handleAdd = () => {
        if (!apparel || price <= 0 || quantity <= 0) {
            // Basic validation
            return;
        }

        onAddItem({
            type: 'stitching',
            name: `${apparel} Stitching`,
            price: price,
            quantity: quantity,
            details: { apparel, measurements, isOwnFabric, remarks }
        });
        setOpen(false);
        setApparel('');
        setPrice(0);
        setQuantity(1);
        setMeasurements({});
        setIsOwnFabric(false);
        setRemarks('');
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button"><PlusCircle className="mr-2"/>Add Stitching Service</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Stitching Service</DialogTitle>
                    <DialogDescription>Select apparel, enter measurements and price.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <Label>Apparel Type</Label>
                           <Select onValueChange={setApparel} value={apparel}>
                               <SelectTrigger><SelectValue placeholder="Select apparel"/></SelectTrigger>
                               <SelectContent>
                                   {Object.keys(apparelMeasurements).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                               </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Stitching Price</Label>
                            <Input type="text" inputMode="numeric" value={price || ''} onChange={e => setPrice(Number(e.target.value.replace(/[^0-9]/g, '')))} placeholder="Enter price"/>
                        </div>
                         <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input type="text" inputMode="numeric" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value.replace(/[^0-9]/g, '')))} placeholder="Qty"/>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="own-fabric" checked={isOwnFabric} onCheckedChange={setIsOwnFabric}/>
                        <Label htmlFor="own-fabric">Customer's own fabric</Label>
                    </div>

                    {apparel && <Separator/>}

                    {apparel && measurementFields.length > 0 && (
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Measurements ({apparel})</h4>
                                {previousMeasurement && (
                                    <Button type="button" variant="outline" size="sm" onClick={handleFetchMeasurements}>
                                        <History className="mr-2 h-4 w-4"/>
                                        Fetch Previous
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {measurementFields.map(field => (
                                     <div key={field} className="space-y-2">
                                        <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                                        <Input 
                                            value={measurements[field] || ''} 
                                            onChange={e => setMeasurements(m => ({...m, [field]: e.target.value}))}
                                            placeholder="..."
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {apparel && (
                        <div className="pt-4 space-y-2">
                            <Label>Additional Remarks</Label>
                            <Textarea 
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="e.g., Cross-pocket, specific button style..."
                            />
                        </div>
                    )}

                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleAdd}>Add to Order</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function NewOrderPage() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStockItem[]>([]);
    const [fabricStock, setFabricStock] = useState<FabricStockItem[]>([]);
    const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
    const [showMeasurementSlipDialog, setShowMeasurementSlipDialog] = useState(false);

    const [selectedReadyMade, setSelectedReadyMade] = useState<{item: ReadyMadeStockItem, quantity: number, price: number} | null>(null);
    const [selectedFabric, setSelectedFabric] = useState<{item: FabricStockItem, length: number, price: number} | null>(null);
    const [accessory, setAccessory] = useState<{name: string, quantity: number, price: number} | null>(null);

    useEffect(() => {
        const collections = {
            customers: setCustomers,
            orders: setOrders,
            readyMadeStock: setReadyMadeStock,
            fabricStock: setFabricStock,
        };
        const unsubscribes = Object.entries(collections).map(([name, setter]) => {
            const q = collection(db, name);
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data as any);
            }, (error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: q.path, operation: 'list' }));
            });
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
          customerType: 'existing',
          customerId: '',
          newCustomerName: '',
          newCustomerPhone: '',
          deliveryDate: undefined,
          items: [],
          advance: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
    const watchedItems = form.watch("items");
    const customerType = form.watch("customerType");
    const watchedCustomerId = form.watch("customerId");

    const subtotal = useMemo(() => watchedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [watchedItems]);
    const advance = form.watch("advance") || 0;
    const balance = subtotal - advance;

    const handleAddItem = (item: OrderItem) => {
        append(item);
    }
    
    const handleAddReadyMade = () => {
        if(selectedReadyMade && selectedReadyMade.item && selectedReadyMade.quantity > 0 && selectedReadyMade.price > 0) {
            handleAddItem({
                type: 'readymade',
                name: `${selectedReadyMade.item.item} (${selectedReadyMade.item.size})`,
                price: selectedReadyMade.price,
                quantity: selectedReadyMade.quantity,
                details: { stockId: selectedReadyMade.item.id }
            });
            setSelectedReadyMade(null);
        }
    }

    const handleAddFabric = () => {
        if(selectedFabric && selectedFabric.item && selectedFabric.length > 0 && selectedFabric.price > 0) {
            handleAddItem({
                type: 'fabric',
                name: `${selectedFabric.item.type} Fabric`,
                price: selectedFabric.price,
                quantity: selectedFabric.length, // Using quantity to store length
                details: { stockId: selectedFabric.item.id }
            });
            setSelectedFabric(null);
        }
    }

    const handleAddAccessory = () => {
        if(accessory && accessory.name && accessory.quantity > 0 && accessory.price > 0) {
            handleAddItem({
                type: 'accessory',
                name: accessory.name,
                price: accessory.price,
                quantity: accessory.quantity,
            });
            setAccessory(null);
        }
    }
    
    const onSubmit = (values: OrderFormValues) => {
      runTransaction(db, async (transaction) => {
        // --- 1. READS ---
        const counterRef = doc(db, "counters", "orders");
        let counterDoc;
        try {
            counterDoc = await transaction.get(counterRef);
        } catch (e) {
            // Handle case where counter doc doesn't exist yet, especially for permission errors on get
            console.warn("Counter document might not exist or there was a permission error on get. Assuming starting from scratch.");
        }


        const stockRefs = values.items
            .filter(item => (item.type === 'readymade' || item.type === 'fabric') && item.details.stockId)
            .map(item => {
                const stockCollectionName = item.type === 'readymade' ? 'readyMadeStock' : 'fabricStock';
                return doc(db, stockCollectionName, item.details.stockId);
            });

        const stockDocs = await Promise.all(stockRefs.map(ref => transaction.get(ref)));

        // --- 2. WRITES (will be staged) ---
        let newOrderNumber = 1001;
        if (counterDoc?.exists()) {
          newOrderNumber = counterDoc.data().lastOrderNumber + 1;
        }

        let finalCustomerId = values.customerId;
        let finalCustomerName = customers.find(c => c.id === values.customerId)?.name;
        
        if (values.customerType === 'new' && values.newCustomerName && values.newCustomerPhone) {
          const newCustomerRef = doc(collection(db, "customers"));
          transaction.set(newCustomerRef, {
            name: values.newCustomerName,
            phone: values.newCustomerPhone,
            email: '',
            measurements: {}
          });
          finalCustomerId = newCustomerRef.id;
          finalCustomerName = values.newCustomerName;
        }

        if (!finalCustomerId) {
          throw new Error("Customer not selected or created.");
        }
        
        const orderDocRef = doc(collection(db, "orders"));
        const newOrderData = {
          orderNumber: newOrderNumber,
          customerId: finalCustomerId,
          deliveryDate: values.deliveryDate || null,
          items: values.items,
          subtotal: subtotal,
          advance: advance,
          balance: balance,
          status: "In Progress" as const,
          createdAt: new Date(),
        };
        transaction.set(orderDocRef, newOrderData);

        if (counterDoc?.exists()) {
            transaction.update(counterRef, { lastOrderNumber: newOrderNumber });
        } else {
            transaction.set(counterRef, { lastOrderNumber: newOrderNumber });
        }

        stockDocs.forEach((stockDoc, index) => {
            const item = values.items.filter(i => (i.type === 'readymade' || i.type === 'fabric') && i.details.stockId)[index];
            if (stockDoc.exists()) {
                const stockData = stockDoc.data();
                const fieldToUpdate = item.type === 'readymade' ? 'quantity' : 'length';
                const currentStock = stockData[fieldToUpdate];
                const newQuantity = currentStock - item.quantity;
                transaction.update(stockDoc.ref, { [fieldToUpdate]: newQuantity });
            }
        });
        
        // Save measurements to customer profile
        const stitchingItems = values.items.filter(item => item.type === 'stitching');
        if (stitchingItems.length > 0) {
            const customerRef = doc(db, 'customers', finalCustomerId);
            const customerSnap = await transaction.get(customerRef);
            if (customerSnap.exists()) {
                const customerData = customerSnap.data() as Customer;
                const updatedMeasurements = customerData.measurements || {};
                let measurementsUpdated = false;

                stitchingItems.forEach(item => {
                    const { apparel, measurements } = item.details;
                    if (apparel && measurements && Object.keys(measurements).length > 0) {
                        updatedMeasurements[apparel] = measurements;
                        measurementsUpdated = true;
                    }
                });
                
                if (measurementsUpdated) {
                    transaction.update(customerRef, { measurements: updatedMeasurements });
                }
            }
        }


        return {
          id: orderDocRef.id,
          customerName: finalCustomerName,
          ...newOrderData,
        } as Order;

      }).then((savedOrder) => {
        setLastCreatedOrder(savedOrder);

        toast({
          title: "Order Created Successfully!",
          description: `Order #${savedOrder.orderNumber} has been saved.`,
        });
        
        window.open(`/print/invoice/${savedOrder.id}`, '_blank');
        
        const hasStitchingItem = savedOrder.items.some((item: OrderItem) => item.type === 'stitching');
        if (hasStitchingItem) {
          setShowMeasurementSlipDialog(true);
        }

        form.reset({
          customerType: 'existing',
          customerId: '',
          newCustomerName: '',
          newCustomerPhone: '',
          deliveryDate: undefined,
          items: [],
          advance: 0,
        });
      }).catch((error: any) => {
        console.error("Transaction failed: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders', 
          operation: 'create',
          requestResourceData: values,
        }));
      });
  }

    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

    const handlePrintMeasurementSlip = () => {
      if (!lastCreatedOrder) return;
      window.open(`/print/receipt/${lastCreatedOrder.id}`, '_blank');
      setShowMeasurementSlipDialog(false);
    }

    return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <PageHeader title="New Sale" subtitle="Create a new order and generate an invoice."/>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Customer Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Delivery</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="customerType" render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="existing" /></FormControl><FormLabel className="font-normal">Existing Customer</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="new" /></FormControl><FormLabel className="font-normal">New Customer</FormLabel></FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                             )}/>
                            {customerType === 'existing' ? (
                                <FormField control={form.control} name="customerId" render={({ field }) => (
                                    <FormItem><FormLabel>Select Customer</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an existing customer" /></SelectTrigger></FormControl><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <FormField control={form.control} name="newCustomerName" render={({ field }) => (<FormItem><FormLabel>New Customer Name</FormLabel><FormControl><Input placeholder="Full name" {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)} />
                                    <FormField control={form.control} name="newCustomerPhone" render={({ field }) => (<FormItem><FormLabel>New Customer Phone</FormLabel><FormControl><Input placeholder="Phone number" {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)} />
                                </div>
                            )}
                             <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Expected Delivery Date</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl></PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus /></PopoverContent>
                                </Popover><FormMessage /></FormItem>
                             )}/>
                        </CardContent>
                    </Card>

                    {/* Add Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Items to Order</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Stitching Service */}
                            <div className="p-4 border rounded-md">
                               <StitchingServiceDialog onAddItem={handleAddItem} customerId={watchedCustomerId} orders={orders} />
                            </div>
                            
                            {/* Ready-Made */}
                            <div className="p-4 border rounded-md space-y-2">
                               <h4 className="font-medium">Ready-Made Garment</h4>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Select onValueChange={id => setSelectedReadyMade(s => ({ item: readyMadeStock.find(i => i.id === id)!, quantity: 1, price: 0 }))}>
                                       <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Select ready-made item..."/></SelectTrigger>
                                       <SelectContent>{readyMadeStock.map(s => <SelectItem key={s.id} value={s.id} disabled={s.quantity <= 0}>{s.item} - {s.size} ({s.quantity} left)</SelectItem>)}</SelectContent>
                                   </Select>
                                   <Input type="text" inputMode="numeric" value={selectedReadyMade?.quantity || ''} onChange={e => setSelectedReadyMade(s => ({...s!, quantity: Number(e.target.value.replace(/[^0-9]/g, '')) }))} placeholder="Qty" disabled={!selectedReadyMade}/>
                                   <Input type="text" inputMode="numeric" value={selectedReadyMade?.price || ''} onChange={e => setSelectedReadyMade(s => ({...s!, price: Number(e.target.value.replace(/[^0-9]/g, '')) }))} placeholder="Selling Price" disabled={!selectedReadyMade}/>
                               </div>
                               <Button type="button" size="sm" onClick={handleAddReadyMade} disabled={!selectedReadyMade || !selectedReadyMade.price}>Add to Order</Button>
                            </div>
                            
                            {/* Fabric */}
                             <div className="p-4 border rounded-md space-y-2">
                               <h4 className="font-medium">Fabric</h4>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Select onValueChange={id => setSelectedFabric(s => ({ item: fabricStock.find(i => i.id === id)!, length: 1, price: 0 }))}>
                                       <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Select fabric..."/></SelectTrigger>
                                       <SelectContent>{fabricStock.map(s => <SelectItem key={s.id} value={s.id} disabled={s.length <= 0}>{s.type} ({s.length}m left)</SelectItem>)}</SelectContent>
                                   </Select>
                                   <Input type="text" inputMode="numeric" value={selectedFabric?.length || ''} onChange={e => setSelectedFabric(s => ({...s!, length: Number(e.target.value.replace(/[^0-9.]/g, '')) }))} placeholder="Length (m)" disabled={!selectedFabric}/>
                                   <Input type="text" inputMode="numeric" value={selectedFabric?.price || ''} onChange={e => setSelectedFabric(s => ({...s!, price: Number(e.target.value.replace(/[^0-9]/g, '')) }))} placeholder="Total Price" disabled={!selectedFabric}/>
                               </div>
                               <Button type="button" size="sm" onClick={handleAddFabric} disabled={!selectedFabric || !selectedFabric.price}>Add to Order</Button>
                            </div>

                             {/* Accessory */}
                             <div className="p-4 border rounded-md space-y-2">
                               <h4 className="font-medium">Accessory</h4>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Input value={accessory?.name || ''} onChange={e => setAccessory(s => ({ ...s!, name: e.target.value, quantity: s?.quantity || 1, price: s?.price || 0 }))} placeholder="Accessory Name" className="md:col-span-2"/>
                                   <Input type="text" inputMode="numeric" value={accessory?.quantity || ''} onChange={e => setAccessory(s => ({...s!, quantity: Number(e.target.value.replace(/[^0-9]/g, '')) }))} placeholder="Qty"/>
                                   <Input type="text" inputMode="numeric" value={accessory?.price || ''} onChange={e => setAccessory(s => ({...s!, price: Number(e.target.value.replace(/[^0-9]/g, '')) }))} placeholder="Price per item"/>
                               </div>
                               <Button type="button" size="sm" onClick={handleAddAccessory} disabled={!accessory || !accessory.price}>Add to Order</Button>
                            </div>

                        </CardContent>
                    </Card>

                    {fields.length > 0 && (
                        <Card>
                             <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
                             <CardContent>
                                 <div className="space-y-4">
                                     {fields.map((item, index) => (
                                         <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                                             <div>
                                                 <p className="font-medium">{item.name}</p>
                                                 <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </CardContent>
                        </Card>
                    )}

                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1 space-y-8">
                     <Card className="sticky top-4">
                         <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                         <CardContent className="space-y-4">
                             <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                             <div className="space-y-2">
                                <FormField control={form.control} name="advance" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Advance Paid</FormLabel>
                                        <FormControl><Input type="text" inputMode="numeric" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value.replace(/[^0-9]/g, ''))} value={field.value ?? ''}/></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                             </div>
                             <Separator/>
                             <div className="flex justify-between font-bold text-lg"><span>Balance Due</span><span>{formatCurrency(balance)}</span></div>
                             
                             <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || watchedItems.length === 0}>
                                {form.formState.isSubmitting ? "Creating Order..." : "Create Order & Generate Invoice"}
                             </Button>
                             <FormField control={form.control} name="items" render={() => <FormMessage/>}/>
                         </CardContent>
                     </Card>
                </div>
            </div>

            <AlertDialog open={showMeasurementSlipDialog} onOpenChange={setShowMeasurementSlipDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Print Measurement Slip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This order contains stitching items. Would you like to print the measurement slip for the tailor?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Later</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePrintMeasurementSlip}>Print Slip</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </form>
    </Form>
    );
}
