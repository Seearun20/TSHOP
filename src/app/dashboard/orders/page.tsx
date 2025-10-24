
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
import { useState, useEffect, useMemo } from "react";
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
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Customer } from "@/app/dashboard/customers/page";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

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
  // Properties to be added from customer data
  customerName?: string;
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

function MeasurementReceiptDialog({ order, customer }: { order: Order, customer?: Customer }) {
    const stitchingItems = order.items.filter(item => item.type === 'stitching' && item.details?.measurements);
    
    const handlePrint = () => {
        setTimeout(() => window.print(), 100);
    }
    
    if (stitchingItems.length === 0) {
        return (
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>No Measurements</DialogTitle>
                    <DialogDescription>There are no stitching items with measurements recorded for order #{order.orderNumber}.</DialogDescription>
                </DialogHeader>
             </DialogContent>
        )
    }

  return (
    <DialogContent className="max-w-md" onOpenAutoFocus={handlePrint}>
      <div className="print-content text-black p-4">
        <DialogHeader className="text-center">
            <DialogTitle className="font-bold text-xl">Measurement Slip</DialogTitle>
            <DialogDescription className="!text-black">Order #{order.orderNumber}</DialogDescription>
        </DialogHeader>
        <div className="my-4 border-t border-dashed border-black"></div>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Customer:</span><span className="font-medium">{customer?.name}</span></div>
            <div className="flex justify-between"><span>Delivery:</span><span className="font-medium">{order.deliveryDate ? new Date(order.deliveryDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
        </div>
        <div className="my-4 border-t border-dashed border-black"></div>
        
        {stitchingItems.map((item, index) => (
            <div key={index} className="space-y-3 mt-4 break-inside-avoid">
                <h4 className="font-semibold text-center uppercase tracking-wider">{item.details.apparel}</h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-sm">
                    {Object.entries(item.details.measurements).map(([key, value]) => value && (
                        <div key={key} className="flex justify-between items-end border-b border-dotted">
                            <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-bold">{value as string}</span>
                        </div>
                    ))}
                </div>
                 {item.details.isOwnFabric && <p className="text-center text-xs font-semibold pt-2">(Customer's Own Fabric)</p>}
            </div>
        ))}
         <div className="my-4 border-t border-dashed border-black"></div>
         <p className="text-xs text-center text-gray-500">Raghav Tailor & Fabric | {new Date().toLocaleString()}</p>
      </div>
      <Button onClick={handlePrint} className="w-full print:hidden mt-4">
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </DialogContent>
  );
}

export default function OrdersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [dialogs, setDialogs] = useState({
      invoice: false,
      status: false,
      receipt: false,
      cancel: false,
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
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const allOrders = orders.map(order => ({
      ...order,
      customerName: customerMap.get(order.customerId) || "Unknown Customer"
    })).sort((a,b) => b.orderNumber - a.orderNumber);

    if (!searchQuery) {
      return allOrders;
    }

    return allOrders.filter(order => {
      const query = searchQuery.toLowerCase();
      const customerName = order.customerName?.toLowerCase() || '';
      const orderNumber = String(order.orderNumber);
      return customerName.includes(query) || orderNumber.includes(query);
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
              placeholder="Search by Order # or Customer Name..."
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
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
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
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
            <Dialog open={dialogs.status} onOpenChange={(open) => setDialogs(p => ({...p, status: open}))}>
               <UpdateStatusDialog order={currentOrder} setOpen={(open) => setDialogs(p => ({...p, status: open}))} onUpdate={handleUpdateStatus}/>
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
