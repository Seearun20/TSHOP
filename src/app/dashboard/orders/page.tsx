
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
import { orders, type Order } from "@/lib/data";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
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

function UpdateStatusDialog({ order, setOpen }: { order: Order; setOpen: (open: boolean) => void }) {
  const [status, setStatus] = useState(order.status);
  const { toast } = useToast();

  const handleUpdate = () => {
    // Here you would typically make an API call to update the status
    console.log(`Updating status for order ${order.id} to ${status}`);
    toast({
      title: "Status Updated!",
      description: `Order ${order.id} has been marked as ${status}.`,
    });
    setOpen(false);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Change the status for order #{order.id}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="status">New Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleUpdate}>Update Status</Button>
    </DialogContent>
  );
}

function MeasurementReceiptDialog({ order }: { order: Order }) {
    if (!order.measurements) {
        return (
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>No Measurements</DialogTitle>
                    <DialogDescription>There are no measurements recorded for order #{order.id}.</DialogDescription>
                </DialogHeader>
             </DialogContent>
        )
    }
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Measurement Receipt for #{order.id}</DialogTitle>
        <DialogDescription>Customer: {order.customerName}</DialogDescription>
      </DialogHeader>
      <div className="font-mono text-sm space-y-2 pt-4">
         {Object.entries(order.measurements).map(([key, value]) => value && (
            <div key={key} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{key}:</span>
                <span>{value}</span>
            </div>
         ))}
      </div>
    </DialogContent>
  );
}

export default function OrdersPage() {
  const { toast } = useToast();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [dialogs, setDialogs] = useState({
      invoice: false,
      status: false,
      receipt: false,
  });

  const handleActionClick = (order: Order, dialog: keyof typeof dialogs) => {
    setCurrentOrder(order);
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };
  
  const handleCancelOrder = () => {
    if (!currentOrder) return;
    console.log(`Cancelling order ${currentOrder.id}`);
    toast({
        variant: "destructive",
        title: "Order Cancelled",
        description: `Order ${currentOrder.id} has been cancelled.`
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.items}
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell
                    className={order.balance > 0 ? "text-destructive" : ""}
                  >
                    {formatCurrency(order.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "Delivered" ? "secondary" : "outline"
                      }
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
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
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'invoice')}>
                            Generate Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'receipt')}>
                            View Measurement Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(order, 'status')}>
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentOrder(order)}>
                                Cancel Order
                            </DropdownMenuItem>
                           </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently cancel the order #{currentOrder?.id}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancelOrder}>
                              Yes, Cancel Order
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

      {currentOrder && (
         <>
            <Dialog open={dialogs.invoice} onOpenChange={(open) => setDialogs(p => ({...p, invoice: open}))}>
                <DialogContent className="max-w-3xl p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Invoice #{currentOrder.id}</DialogTitle>
                        <DialogDescription>
                            Review the invoice details below before printing.
                        </DialogDescription>
                    </DialogHeader>
                    <Invoice order={currentOrder} />
                </DialogContent>
            </Dialog>
            <Dialog open={dialogs.status} onOpenChange={(open) => setDialogs(p => ({...p, status: open}))}>
               <UpdateStatusDialog order={currentOrder} setOpen={(open) => setDialogs(p => ({...p, status: open}))} />
            </Dialog>
            <Dialog open={dialogs.receipt} onOpenChange={(open) => setDialogs(p => ({...p, receipt: open}))}>
                <MeasurementReceiptDialog order={currentOrder} />
            </Dialog>
         </>
      )}

    </div>
  );
}
