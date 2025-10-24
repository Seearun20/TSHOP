
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serviceCharges } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useMemo, memo } from "react";
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
import { ReadyMadeStockItem } from "@/app/dashboard/stock/readymade/page";
import { FabricStockItem } from "@/app/dashboard/stock/fabric/page";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Loader2, PlusCircle, Ruler, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const orderSchema = z.object({
  customerType: z.enum(['existing', 'new']),
  customerId: z.string().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhone: z.string().optional(),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  advancePaid: z.coerce.number().min(0).optional(),
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

interface CartItem {
    id: string;
    name: string;
    type: 'Stitching' | 'Ready-Made' | 'Fabric' | 'Accessory';
    price: number;
    quantity: number;
    details?: string;
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
type MeasurementFormValues = z.infer<typeof measurementSchema>;


const StitchingServiceForm = memo(function StitchingServiceForm({ customer, onAddToCart, setOpen }: { customer?: Customer, onAddToCart: (item: CartItem, measurements?: MeasurementFormValues) => void, setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const [apparelType, setApparelType] = useState('');
    const [price, setPrice] = useState(0);
    const [isOwnFabric, setIsOwnFabric] = useState(false);
    
    const form = useForm<MeasurementFormValues>({
        resolver: zodResolver(measurementSchema),
        defaultValues: customer?.measurements || {},
    });

    useEffect(() => {
        form.reset(customer?.measurements || {});
    }, [customer, form]);

    const showField = (fieldName: keyof MeasurementFormValues) => {
        const type = apparelType.toLowerCase();
        if (!type) return false;
        if (type.includes('shirt') || type.includes('kurta')) {
            return ['shirtLength', 'chest', 'sleeve', 'shoulder', 'notes'].includes(fieldName);
        }
        if (type.includes('pant') || type.includes('pyjama')) {
            return ['pantLength', 'waist', 'hip', 'notes'].includes(fieldName);
        }
        if (type.includes('suit') || type.includes('sherwani') || type.includes('blazer')) {
            return true; // Show all fields for suits/sherwanis
        }
        return false;
    }

    const fields: {name: keyof MeasurementFormValues, label: string}[] = [
      { name: "shirtLength", label: "Shirt Length" },
      { name: "sleeve", label: "Sleeve" },
      { name: "shoulder", label: "Shoulder" },
      { name: "chest", label: "Chest" },
      { name: "pantLength", label: "Pant Length" },
      { name: "waist", label: "Waist" },
      { name: "hip", label: "Hip" },
    ];

    const visibleFields = fields.filter(f => showField(f.name));

    const handleSubmit = (measurements: MeasurementFormValues) => {
        if (!apparelType || price <= 0) {
            toast({
                variant: "destructive",
                title: "Missing Details",
                description: "Please select an apparel type and set a price."
            });
            return;
        }

        const newItem: CartItem = {
            id: `serv-${apparelType}-${Date.now()}`,
            name: apparelType,
            type: 'Stitching',
            price: price,
            quantity: 1,
            details: `Stitching Service ${isOwnFabric ? '(Own Fabric)' : ''}`,
        };

        onAddToCart(newItem, measurements);
        setOpen(false);
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <DialogHeader>
                    <DialogTitle>Add Stitching Service</DialogTitle>
                    <DialogDescription>Record measurements and charges for tailoring.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <FormItem>
                        <FormLabel>Apparel Type</FormLabel>
                        <Select value={apparelType} onValueChange={setApparelType}>
                            <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(serviceCharges).map((service) => (
                                    <SelectItem key={service} value={service}>{service}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                    
                    {visibleFields.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {visibleFields.map(f => (
                                <FormField key={f.name} control={form.control} name={f.name}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{f.label}</FormLabel>
                                        <FormControl><Input placeholder="in inches" {...field} /></FormControl>
                                    </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {showField('notes') && (
                        <FormField control={form.control} name="notes"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl><Textarea placeholder="Any other specific instructions..." {...field} /></FormControl>
                            </FormItem>
                            )}
                        />
                    )}

                    <FormItem>
                        <FormLabel>Stitching Price</FormLabel>
                        <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="Stitching charges"/>
                    </FormItem>
                    
                    <div className="flex items-center space-x-2">
                        <Switch id="own-fabric" checked={isOwnFabric} onCheckedChange={setIsOwnFabric}/>
                        <Label htmlFor="own-fabric">Customer's own fabric</Label>
                    </div>

                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={!apparelType || !customer}>
                        Add to Cart
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
});


export default function NewOrderPage() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStockItem[]>([]);
    const [fabricStock, setFabricStock] = useState<FabricStockItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Dialog state
    const [stitchingDialog, setStitchingDialog] = useState(false);

    // Item selection state
    const [selectedReadyMade, setSelectedReadyMade] = useState('');
    const [sellingPrice, setSellingPrice] = useState(0);
    
    const [selectedFabric, setSelectedFabric] = useState('');
    const [fabricLength, setFabricLength] = useState(1);
    const [fabricPrice, setFabricPrice] = useState(0);

    const [accessoryName, setAccessoryName] = useState('');
    const [accessoryPrice, setAccessoryPrice] = useState(0);


    useEffect(() => {
        const collections = {
            customers: setCustomers,
            readyMadeStock: setReadyMadeStock,
            fabricStock: setFabricStock,
        };

        const unsubscribes = Object.entries(collections).map(([name, setter]) => {
            const collRef = collection(db, name);
            return onSnapshot(collRef, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data as any);
            }, (error) => {
                const permissionError = new FirestorePermissionError({ path: collRef.path, operation: 'list' });
                errorEmitter.emit('permission-error', permissionError);
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
          customerType: 'existing',
          deliveryDate: "",
          advancePaid: 0,
        },
    });

    const customerType = form.watch("customerType");
    const customerId = form.watch("customerId");
    const advancePaid = form.watch("advancePaid") || 0;

    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price, 0), [cart]);
    const balanceDue = useMemo(() => subtotal - advancePaid, [subtotal, advancePaid]);
    
    const selectedCustomer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);

    const handleAddToCart = (type: CartItem['type']) => {
        let newItem: CartItem | null = null;
        if (type === 'Ready-Made' && selectedReadyMade && sellingPrice > 0) {
            const stockItem = readyMadeStock.find(i => i.id === selectedReadyMade);
            if (stockItem) {
                newItem = { id: stockItem.id, name: stockItem.item, type, price: sellingPrice, quantity: 1, details: `Size: ${stockItem.size}` };
                setSelectedReadyMade('');
                setSellingPrice(0);
            }
        } else if (type === 'Fabric' && selectedFabric && fabricPrice > 0) {
            const stockItem = fabricStock.find(f => f.id === selectedFabric);
            if (stockItem && fabricLength > 0) {
                newItem = { id: stockItem.id, name: stockItem.type, type, price: fabricPrice, quantity: fabricLength, details: `${fabricLength} mtr` };
                setSelectedFabric('');
                setFabricLength(1);
                setFabricPrice(0);
            }
        } else if (type === 'Accessory' && accessoryName && accessoryPrice > 0) {
            newItem = { id: `acc-${accessoryName}-${Date.now()}`, name: accessoryName, type, price: accessoryPrice, quantity: 1, details: 'Accessory' };
            setAccessoryName('');
            setAccessoryPrice(0);
        }

        if (newItem) {
            if (cart.find(item => item.id === newItem!.id && item.type === newItem!.type)) {
                toast({ variant: 'destructive', title: "Item already in cart" });
                return;
            }
            setCart(prev => [...prev, newItem!]);
        } else {
             toast({ variant: 'destructive', title: "Missing Details", description: "Please fill in all details for the item." });
        }
    };
    
    const handleStitchingAddToCart = async (item: CartItem, measurements?: MeasurementFormValues) => {
        if (cart.find(cartItem => cartItem.id === item.id)) {
            toast({ variant: 'destructive', title: "Item already in cart" });
            return;
        }
        setCart(prev => [...prev, item]);

        if (measurements && selectedCustomer) {
            const customerDoc = doc(db, "customers", selectedCustomer.id);
            const updatedMeasurements = { ...selectedCustomer.measurements, ...measurements };
            try {
                await updateDoc(customerDoc, { measurements: updatedMeasurements });
                toast({
                    title: "Measurements Saved",
                    description: `Measurements for ${selectedCustomer.name} have been updated.`,
                });
            } catch (error) {
                const permissionError = new FirestorePermissionError({
                    path: customerDoc.path,
                    operation: "update",
                    requestResourceData: { measurements: updatedMeasurements },
                });
                errorEmitter.emit("permission-error", permissionError);
            }
        }
    };


    const handleRemoveFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const onSubmit = async (data: OrderFormValues) => {
        if (cart.length === 0) {
            toast({ variant: 'destructive', title: "Cart is empty", description: "Please add items to the order before generating a receipt." });
            return;
        }

        setIsSubmitting(true);
        const orderData = {
            ...data,
            items: cart,
            subtotal,
            balanceDue,
            status: 'In Progress',
            createdAt: new Date().toISOString(),
        };

        const ordersCollection = collection(db, "orders");
        try {
            await addDoc(ordersCollection, orderData);
            toast({
                title: "Order Generated!",
                description: "The order has been successfully created.",
            });
            form.reset();
            setCart([]);
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: ordersCollection.path,
                operation: "create",
                requestResourceData: orderData,
            });
            errorEmitter.emit("permission-error", permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };
  
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    };

    const getCustomerName = () => {
        const values = form.getValues();
        if (values.customerType === 'new') return values.newCustomerName || 'N/A';
        if (values.customerId) {
            return customers.find(c => c.id === values.customerId)?.name || "N/A";
        }
        return 'N/A';
    }

    return (
        <div className="space-y-8">
            <PageHeader title="New Order" subtitle="Create a new order by adding items to the cart."/>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Customer Details */}
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

                    {/* Item Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Add Items to Order</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Stitching Service */}
                            <Dialog open={stitchingDialog} onOpenChange={setStitchingDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full" disabled={!selectedCustomer} onClick={() => setStitchingDialog(true)}>
                                        <Ruler className="mr-2 h-4 w-4"/> Add Stitching Service
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <StitchingServiceForm customer={selectedCustomer} onAddToCart={handleStitchingAddToCart} setOpen={setStitchingDialog}/>
                                </DialogContent>
                            </Dialog>
                            
                            {/* Add Ready Made */}
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <Label>Ready-Made Item</Label>
                                    <Select value={selectedReadyMade} onValueChange={setSelectedReadyMade}>
                                        <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                                        <SelectContent>
                                            {readyMadeStock.map(i => <SelectItem key={i.id} value={i.id}>{i.item} ({i.size})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-32">
                                    <Label>Selling Price</Label>
                                    <Input type="number" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} placeholder="Price" />
                                </div>
                                <Button type="button" onClick={() => handleAddToCart('Ready-Made')} disabled={!selectedReadyMade}><PlusCircle className="mr-2"/> Add</Button>
                            </div>
                            
                            {/* Add Fabric */}
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <Label>Fabric</Label>
                                    <Select value={selectedFabric} onValueChange={setSelectedFabric}>
                                        <SelectTrigger><SelectValue placeholder="Select a fabric" /></SelectTrigger>
                                        <SelectContent>
                                            {fabricStock.map(f => <SelectItem key={f.id} value={f.id}>{f.type} - {formatCurrency(f.costPerMtr)}/mtr</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24">
                                     <Label>Length (m)</Label>
                                     <Input type="number" value={fabricLength} onChange={(e) => setFabricLength(Number(e.target.value))} min="0.1" step="0.1" />
                                </div>
                                <div className="w-32">
                                     <Label>Total Price</Label>
                                     <Input type="number" value={fabricPrice} onChange={(e) => setFabricPrice(Number(e.target.value))} placeholder="Price"/>
                                </div>
                                <Button type="button" onClick={() => handleAddToCart('Fabric')} disabled={!selectedFabric || fabricLength <= 0}><PlusCircle className="mr-2"/> Add</Button>
                            </div>

                             {/* Add Accessory */}
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <Label>Accessory</Label>
                                    <Input value={accessoryName} onChange={e => setAccessoryName(e.target.value)} placeholder="Accessory name, e.g. Buttons" />
                                </div>
                                <div className="w-32">
                                     <Label>Price</Label>
                                     <Input type="number" value={accessoryPrice} onChange={(e) => setAccessoryPrice(Number(e.target.value))} placeholder="Price"/>
                                </div>
                                <Button type="button" onClick={() => handleAddToCart('Accessory')} disabled={!accessoryName || accessoryPrice <= 0}><PlusCircle className="mr-2"/> Add</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cart Items */}
                     {cart.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Order Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">{item.details}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-mono text-sm">{formatCurrency(item.price)}</p>
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveFromCart(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div>

                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="font-headline">Order Summary</CardTitle>
                            <CardDescription>Final bill and details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="deliveryDate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delivery Date</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Separator/>
                            <div className="space-y-2 font-mono text-sm">
                                <div className="flex justify-between"><span>Customer:</span> <span>{getCustomerName()}</span></div>
                                <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between font-bold text-base">
                                    <span>Balance Due:</span> 
                                    <span>{formatCurrency(balanceDue)}</span>
                                </div>
                            </div>
                             <FormField
                                control={form.control}
                                name="advancePaid"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Advance Paid</FormLabel>
                                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isSubmitting || cart.length === 0}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Generate Receipt & Invoice"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                </form>
            </Form>
        </div>
    );
}

    