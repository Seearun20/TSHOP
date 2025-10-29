
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
import { MoreHorizontal, PlusCircle, Printer } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useMemo, Suspense } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@/components/dashboard/invoice";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Customer } from "@/app/dashboard/customers/page";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export interface Payment {
    date: string;
    amount: number;
}

export interface OrderItem {
  type: 'stitching' | 'readymade' | 'fabric' | 'accessory';
  name: string;
  price: number;
  quantity: number;
  details?: any;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  deliveryDate?: { seconds: number; nanoseconds: number; } | null;
  items: OrderItem[];
  subtotal: number;
  advance: number;
  balance: number;
  status: "In Progress" | "Ready" | "Delivered" | "Cancelled";
  createdAt: { seconds: number; nanoseconds: number; };
  payments?: Payment[];
  // Properties to be added from customer data
  customerName?: string;
  customerPhone?: string;
}

function OrderDetailsDialog({ order, setOpen }: { order: Order; setOpen: (open: boolean) => void; }) {
    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

    const renderMeasurementValue = (label: string, value: string) => (
        value ? <div className="text-xs"><span className="text-muted-foreground">{label}:</span> {value}</div> : null
    );

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Order #{order.orderNumber}</DialogTitle>
                <DialogDescription>
                    Details for order placed on {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto space-y-4 p-1">
                {/* Customer and Date Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <Label className="text-muted-foreground">Customer</Label>
                        <p>{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Delivery Date</Label>
                        <p>{order.deliveryDate ? new Date((order.deliveryDate as any).seconds * 1000).toLocaleDateString() : 'Not set'}</p>
                    </div>
                </div>

                <Separator />
                
                {/* Items */}
                <div>
                    <h4 className="font-medium mb-2">Order Items</h4>
                    <div className="space-y-3">
                        {order.items.map((item, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                                    </div>
                                    <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
                                </div>
                                {item.type === 'stitching' && item.details?.measurements && (
                                    <div className="mt-2 pt-2 border-t">
                                        <h5 className="text-xs font-semibold text-muted-foreground">Measurements:</h5>
                                        <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-1">
                                            {Object.entries(item.details.measurements).map(([key, value]) =>
                                                renderMeasurementValue(key, value as string)
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Financial Summary */}
                <div>
                    <h4 className="font-medium mb-2">Payment Details</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Advance Paid</span>
                            <span>{formatCurrency(order.advance)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                            <span>Balance Due</span>
                            <span className={order.balance > 0 ? "text-destructive" : ""}>{formatCurrency(order.balance)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {order.payments && order.payments.length > 0 && (
                     <div>
                        <Separator />
                        <h4 className="font-medium my-2">Payment History</h4>
                         <div className="space-y-2">
                             {order.payments.map((payment, index) => (
                                 <div key={index} className="flex justify-between items-center p-2 border rounded-md text-sm">
                                     <div>
                                        <p>Paid on {new Date(payment.date).toLocaleString()}</p>
                                     </div>
                                     <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    );
}

function UpdateStatusDialog({ order, setOpen, onUpdate }: { order: Order; setOpen: (open: boolean) => void; onUpdate: (id: string, status: Order['status']) => void; }) {
  const [status, setStatus] = useState(order.status);
  
  const handleUpdate = () => {
    onUpdate(order.id, status);
    setOpen(false);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Change the status for order #{order.orderNumber}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="status">New Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as Order['status'])}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
       <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={handleUpdate}>Update Status</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ReceivePaymentDialog({ order, setOpen }: { order: Order, setOpen: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | ''>('');
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
  
  const handlePayment = async () => {
      if (!amount || amount <= 0) {
          toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a valid payment amount." });
          return;
      }
      if (amount > order.balance) {
          toast({ variant: 'destructive', title: "Amount Exceeds Balance", description: `Payment cannot be more than the due amount of ${formatCurrency(order.balance)}.` });
          return;
      }

      const orderDoc = doc(db, "orders", order.id);
      const newPayment: Payment = {
          date: new Date().toISOString(),
          amount: Number(amount)
      };
      const newAdvance = order.advance + Number(amount);
      const newBalance = order.subtotal - newAdvance;

      try {
          await updateDoc(orderDoc, {
              advance: newAdvance,
              balance: newBalance,
              payments: arrayUnion(newPayment)
          });
          toast({
              title: "Payment Received!",
              description: `${formatCurrency(Number(amount))} received for order #${order.orderNumber}. New balance: ${formatCurrency(newBalance)}.`,
          });
          setOpen(false);
      } catch (error) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderDoc.path, operation: 'update' }));
      }
  };

  return (
      <DialogContent>
          <DialogHeader>
              <DialogTitle>Receive Payment for Order #{order.orderNumber}</DialogTitle>
              <DialogDescription>
                  Current balance due: <span className="font-medium text-destructive">{formatCurrency(order.balance)}</span>
              </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <Input id="payment-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount received" />
              </div>
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handlePayment} disabled={!amount || amount <= 0}>Confirm Payment</Button>
          </DialogFooter>
      </DialogContent>
  );
}

function OrdersPageClient() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [dialogs, setDialogs] = useState({
      details: false,
      status: false,
      receipt: false,
      cancel: false,
      payment: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const ordersUnsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'orders', operation: 'list'}));
    });

    const customersUnsub = onSnapshot(collection(db, "customers"), (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'customers', operation: 'list'}));
    });
    
    return () => {
      ordersUnsub();
      customersUnsub();
    }
  }, []);

  const combinedOrders = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c]));
    const allOrders = orders.map(order => {
      const customer = customerMap.get(order.customerId);
      return {
        ...order,
        customerName: customer?.name || "Unknown Customer",
        customerPhone: customer?.phone || "",
      };
    }).sort((a,b) => b.orderNumber - a.orderNumber);

    if (!searchQuery) {
      return allOrders;
    }

    return allOrders.filter(order => {
      const query = searchQuery.toLowerCase();
      const customerName = order.customerName?.toLowerCase() || '';
      const orderNumber = String(order.orderNumber);
      const customerPhone = order.customerPhone || '';
      return customerName.includes(query) || orderNumber.includes(query) || customerPhone.includes(query);
    });

  }, [orders, customers, searchQuery]);


  useEffect(() => {
    const invoiceId = searchParams.get('invoice');
    const receiptId = searchParams.get('receipt');
    
    if ((invoiceId || receiptId) && combinedOrders.length > 0) {
      const url = new URL(window.location.href);
      let orderToOpen;

      if (invoiceId) {
        orderToOpen = combinedOrders.find(o => o.id === invoiceId);
        if (orderToOpen) handleActionClick(orderToOpen, 'invoice');
        url.searchParams.delete('invoice');
      }

      if (receiptId) {
        orderToOpen = combinedOrders.find(o => o.id === receiptId);
        if (orderToOpen) handleActionClick(orderToOpen, 'receipt');
        url.searchParams.delete('receipt');
      }

      router.replace(url.toString(), { scroll: false });
    }
  }, [searchParams, combinedOrders, router]);


  const handleActionClick = (order: Order, dialog: keyof typeof dialogs) => {
    setCurrentOrder(order);
    if (dialog === 'invoice') {
        const url = `/print/invoice/${order.id}`;
        window.open(url, '_blank');
        return;
    }
    if (dialog === 'receipt') {
        const url = `/print/receipt/${order.id}`;
        window.open(url, '_blank');
        return;
    }
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };
  
  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    const orderDoc = doc(db, "orders", id);
    try {
        await updateDoc(orderDoc, { status });
        toast({
            title: "Status Updated!",
            description: `Order #${currentOrder?.orderNumber} has been marked as ${status}.`,
        });
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({path: orderDoc.path, operation: 'update'}));
    }
  }

  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    
    const orderDoc = doc(db, "orders", currentOrder.id);
    try {
        await deleteDoc(orderDoc);
        toast({
            variant: "destructive",
            title: "Order Cancelled",
            description: `Order ${currentOrder.orderNumber} has been cancelled.`
        })
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({path: orderDoc.path, operation: 'delete'}));
    }
    setDialogs(prev => ({ ...prev, cancel: false }));
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };
  
  const getItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return items[0].name;
    return `${items.length} items`;
  }
  
  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'secondary';
        case 'Cancelled': return 'destructive';
        case 'Ready': return 'default';
        default: return 'outline';
    }
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="All Orders"
        subtitle="Manage all customer orders and invoices."
      >
        <Link href="/dashboard/orders/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            A list of all past and present orders.
          </CardDescription>
          <div className="pt-2">
            <Input
              placeholder="Search by Order #, Customer Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedOrders.map((order) => (
                <TableRow key={order.id} onClick={() => handleActionClick(order, 'details')} className="cursor-pointer">
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getItemsSummary(order.items)}
                  </TableCell>
                  <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                  <TableCell
                    className={order.balance > 0 ? "text-destructive" : ""}
                  >
                    {formatCurrency(order.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(order.status)}
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'details')}>View Details</DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => handleActionClick(order, 'payment')} disabled={order.balance <= 0}>
                            Receive Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'invoice')}>
                            Generate Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'receipt')}>
                            Generate Measurement Slip
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'status')}>
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem className="text-destructive" onSelect={() => handleActionClick(order, 'cancel')}>
                                Cancel Order
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

      {currentOrder && (
         <>
            <Dialog open={dialogs.details} onOpenChange={(open) => setDialogs(p => ({...p, details: open}))}>
                <OrderDetailsDialog order={currentOrder} setOpen={(open) => setDialogs(p => ({...p, details: open}))} />
            </Dialog>
            <Dialog open={dialogs.status} onOpenChange={(open) => setDialogs(p => ({...p, status: open}))}>
               <UpdateStatusDialog order={currentOrder} setOpen={(open) => setDialogs(p => ({...p, status: open}))} onUpdate={handleUpdateStatus}/>
            </Dialog>
            <Dialog open={dialogs.payment} onOpenChange={(open) => setDialogs(p => ({...p, payment: open}))}>
               <ReceivePaymentDialog order={currentOrder} setOpen={(open) => setDialogs(p => ({...p, payment: open}))} />
            </Dialog>
            <AlertDialog open={dialogs.cancel} onOpenChange={(open) => setDialogs(p => ({...p, cancel: open}))}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently cancel the order #{currentOrder.orderNumber}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">
                        Yes, Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
         </>
      )}

    </div>
  );
}


export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersPageClient />
    </Suspense>
  );
}
