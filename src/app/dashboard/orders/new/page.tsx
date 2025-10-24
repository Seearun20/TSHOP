
"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
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
import { collection, onSnapshot, doc, addDoc, updateDoc, writeBatch } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle, Trash2, X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

// Measurement Schemas
const pantMeasurements = z.object({ 
    length: z.string().optional(), 
    waist: z.string().optional(), 
    hip: z.string().optional(), 
    thigh: z.string().optional(),
    bottom: z.string().optional(),
    latak: z.string().optional(),
    mori: z.string().optional(),
});
const shirtMeasurements = z.object({ 
    length: z.string().optional(), 
    shoulder: z.string().optional(),
    sleeve: z.string().optional(),
    chest: z.string().optional(), 
    waist: z.string().optional(), 
    hip: z.string().optional(),
    collar: z.string().optional(),
});
const blazerMeasurements = z.object({
    length: z.string().optional(),
    shoulder: z.string().optional(),
    sleeve: z.string().optional(),
    chest: z.string().optional(),
    waist: z.string().optional(),
    hip: z.string().optional(),
    collar: z.string().optional(),
});
const pyjamaMeasurements = z.object({
    length: z.string().optional(),
    waist: z.string().optional(),
    hip: z.string().optional(),
    mori: z.string().optional(),
    latak: z.string().optional(),
    bottom: z.string().optional(),
});


const suitMeasurements = z.object({ ...pantMeasurements.shape, ...blazerMeasurements.shape });
const sherwaniMeasurements = z.object({ ...suitMeasurements.shape, innerKurtaLength: z.string().optional() });


const apparelMeasurements: Record<string, z.ZodObject<any>> = {
  'Pant': pantMeasurements,
  'Shirt': shirtMeasurements,
  'Kurta Pyjama': pyjamaMeasurements,
  '3pc Suit': suitMeasurements,
  '2pc Suit': suitMeasurements,
  'Sherwani': sherwaniMeasurements,
  'Blazer': blazerMeasurements,
};

function StitchingServiceDialog({ onAddItem, customerId }: { onAddItem: (item: OrderItem) => void, customerId?: string }) {
    const [open, setOpen] = useState(false);
    const [apparel, setApparel] = useState('');
    const [price, setPrice] = useState(0);
    const [isOwnFabric, setIsOwnFabric] = useState(false);
    const [measurements, setMeasurements] = useState<Record<string, string>>({});
    const measurementFields = apparel ? Object.keys(apparelMeasurements[apparel]?.shape || {}) : [];

    const handleAdd = async () => {
        if (!apparel || price <= 0) {
            // Basic validation
            return;
        }

        // Save measurements to customer if a customer is selected
        if (customerId && Object.keys(measurements).length > 0) {
            const customerDoc = doc(db, "customers", customerId);
            await updateDoc(customerDoc, { 
                [`measurements.${apparel.replace(/ /g, '_')}`]: measurements 
            }, { merge: true });
        }

        onAddItem({
            type: 'stitching',
            name: `${apparel} Stitching`,
            price: price,
            quantity: 1,
            details: { apparel, measurements, isOwnFabric }
        });
        setOpen(false);
        setApparel('');
        setPrice(0);
        setMeasurements({});
        setIsOwnFabric(false);
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Apparel Type</Label>
                           <Select onValueChange={setApparel}>
                               <SelectTrigger><SelectValue placeholder="Select apparel"/></SelectTrigger>
                               <SelectContent>
                                   {Object.keys(apparelMeasurements).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                               </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Stitching Price</Label>
                            <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="Enter price"/>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="own-fabric" checked={isOwnFabric} onCheckedChange={setIsOwnFabric}/>
                        <Label htmlFor="own-fabric">Customer's own fabric</Label>
                    </div>

                    {apparel && <Separator/>}

                    {apparel && measurementFields.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2">Measurements ({apparel})</h4>
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
    const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStockItem[]>([]);
    const [fabricStock, setFabricStock] = useState<FabricStockItem[]>([]);

    const [selectedReadyMade, setSelectedReadyMade] = useState<{item: ReadyMadeStockItem, quantity: number, price: number} | null>(null);
    const [selectedFabric, setSelectedFabric] = useState<{item: FabricStockItem, length: number, price: number} | null>(null);
    const [accessory, setAccessory] = useState<{name: string, quantity: number, price: number} | null>(null);

    useEffect(() => {
        const collections = {
            customers: setCustomers,
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
          items: [],
          advance: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
    const watchedItems = form.watch("items");
    const customerType = form.watch("customerType");
    const customerId = form.watch("customerId");

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
    
    const onSubmit = async (values: OrderFormValues) => {
        let finalCustomerId = values.customerId;

        // Create new customer if needed
        if (values.customerType === 'new' && values.newCustomerName && values.newCustomerPhone) {
            try {
                const newCustomerDoc = await addDoc(collection(db, "customers"), {
                    name: values.newCustomerName,
                    phone: values.newCustomerPhone,
                    email: '',
                    measurements: {}
                });
                finalCustomerId = newCustomerDoc.id;
            } catch (error) {
                errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'customers', operation: 'create'}));
                return;
            }
        }

        if (!finalCustomerId) {
            toast({ variant: 'destructive', title: "Error", description: "Customer not selected or created."});
            return;
        }

        const batch = writeBatch(db);

        // Update stock levels
        values.items.forEach(item => {
            if ((item.type === 'readymade' || item.type === 'fabric') && item.details.stockId) {
                const stockRef = doc(db, item.type === 'readymade' ? 'readyMadeStock' : 'fabricStock', item.details.stockId);
                const stockItem = (item.type === 'readymade' ? readyMadeStock : fabricStock).find(s => s.id === item.details.stockId);
                if (stockItem) {
                    const newQuantity = (item.type === 'readymade' ? (stockItem as ReadyMadeStockItem).quantity : (stockItem as FabricStockItem).length) - item.quantity;
                     batch.update(stockRef, { [item.type === 'readymade' ? 'quantity' : 'length']: newQuantity });
                }
            }
        });

        // Create order document
        const orderDocRef = doc(collection(db, "orders"));
        batch.set(orderDocRef, {
            customerId: finalCustomerId,
            deliveryDate: values.deliveryDate || null,
            items: values.items,
            subtotal: subtotal,
            advance: advance,
            balance: balance,
            status: "In Progress",
            createdAt: new Date(),
        });
        
        try {
            await batch.commit();
            toast({ title: "Order Created!", description: `Order #${orderDocRef.id.substring(0, 6)} has been successfully created.`});
            form.reset();
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'orders', operation: 'create'}));
        }
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

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
                                    <FormField control={form.control} name="newCustomerName" render={({ field }) => (<FormItem><FormLabel>New Customer Name</FormLabel><FormControl><Input placeholder="Full name" {...field} /></FormControl><FormMessage/></FormItem>)} />
                                    <FormField control={form.control} name="newCustomerPhone" render={({ field }) => (<FormItem><FormLabel>New Customer Phone</FormLabel><FormControl><Input placeholder="Phone number" {...field} /></FormControl><FormMessage/></FormItem>)} />
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
                               <StitchingServiceDialog onAddItem={handleAddItem} customerId={customerId}/>
                            </div>
                            
                            {/* Ready-Made */}
                            <div className="p-4 border rounded-md space-y-2">
                               <h4 className="font-medium">Ready-Made Garment</h4>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Select onValueChange={id => setSelectedReadyMade(s => ({ ...s, item: readyMadeStock.find(i => i.id === id)!, quantity: 1, price: 0 }))}>
                                       <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Select ready-made item..."/></SelectTrigger>
                                       <SelectContent>{readyMadeStock.map(s => <SelectItem key={s.id} value={s.id}>{s.item} - {s.size} ({s.quantity} left)</SelectItem>)}</SelectContent>
                                   </Select>
                                   <Input type="number" value={selectedReadyMade?.quantity || ''} onChange={e => setSelectedReadyMade(s => ({...s!, quantity: Number(e.target.value) }))} placeholder="Qty" disabled={!selectedReadyMade}/>
                                   <Input type="number" value={selectedReadyMade?.price || ''} onChange={e => setSelectedReadyMade(s => ({...s!, price: Number(e.target.value) }))} placeholder="Selling Price" disabled={!selectedReadyMade}/>
                               </div>
                               <Button type="button" size="sm" onClick={handleAddReadyMade} disabled={!selectedReadyMade || !selectedReadyMade.price}>Add to Order</Button>
                            </div>
                            
                            {/* Fabric */}
                             <div className="p-4 border rounded-md space-y-2">
                               <h4 className="font-medium">Fabric</h4>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Select onValueChange={id => setSelectedFabric(s => ({ ...s, item: fabricStock.find(i => i.id === id)!, length: 1, price: 0 }))}>
                                       <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Select fabric..."/></SelectTrigger>
                                       <SelectContent>{fabricStock.map(s => <SelectItem key={s.id} value={s.id}>{s.type} ({s.length}m left)</SelectItem>)}</SelectContent>
                                   </Select>
                                   <Input type="number" value={selectedFabric?.length || ''} onChange={e => setSelectedFabric(s => ({...s!, length: Number(e.target.value) }))} placeholder="Length (m)" disabled={!selectedFabric}/>
                                   <Input type="number" value={selectedFabric?.price || ''} onChange={e => setSelectedFabric(s => ({...s!, price: Number(e.target.value) }))} placeholder="Total Price" disabled={!selectedFabric}/>
                               </div>
                               <Button type="button" size="sm" onClick={handleAddFabric} disabled={!selectedFabric || !selectedFabric.price}>Add to Order</Button>
                            </div>

                             {/* Accessory */}
                             <div className="p-4 border rounded-md space-y-2">
                               <h4 className="font-medium">Accessory</h4>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Input value={accessory?.name || ''} onChange={e => setAccessory(s => ({ ...s!, name: e.target.value }))} placeholder="Accessory Name" className="md:col-span-2"/>
                                   <Input type="number" value={accessory?.quantity || ''} onChange={e => setAccessory(s => ({...s!, quantity: Number(e.target.value) }))} placeholder="Qty"/>
                                   <Input type="number" value={accessory?.price || ''} onChange={e => setAccessory(s => ({...s!, price: Number(e.target.value) }))} placeholder="Price per item"/>
                               </div>
                               <Button type="button" size="sm" onClick={handleAddAccessory} disabled={!accessory || !accessory.price}>Add to Order</Button>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Order Items */}
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
                                        <FormControl><Input type="number" placeholder="0.00" {...field}/></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                             </div>
                             <Separator/>
                             <div className="flex justify-between font-bold text-lg"><span>Balance Due</span><span>{formatCurrency(balance)}</span></div>
                             
                             <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || watchedItems.length === 0}>
                                {form.formState.isSubmitting ? "Creating Order..." : "Create Order"}
                             </Button>
                             <FormField control={form.control} name="items" render={() => <FormMessage/>}/>
                         </CardContent>
                     </Card>
                </div>
            </div>

        </form>
    </Form>
    );
}


    