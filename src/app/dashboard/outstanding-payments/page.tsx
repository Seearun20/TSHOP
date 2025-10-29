
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Customer } from "@/app/dashboard/customers/page";
import { Order, OrderItem } from "@/app/dashboard/orders/page";
import { Input } from "@/components/ui/input";

function OutstandingPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // We only need to fetch orders where balance > 0
    const ordersQuery = query(collection(db, "orders"), where("balance", ">", 0));
    const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
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

  const outstandingOrders = useMemo(() => {
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

  const totalOutstanding = useMemo(() => {
    return outstandingOrders.reduce((sum, order) => sum + order.balance, 0);
  }, [outstandingOrders]);

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Outstanding Payments"
        subtitle="A list of all orders with a pending balance."
      />
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Orders</CardTitle>
          <CardDescription>
            Total amount due from all customers: <span className="font-bold text-destructive">{formatCurrency(totalOutstanding)}</span>
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
                <TableHead>Balance Due</TableHead>
                <TableHead>Order Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getItemsSummary(order.items)}
                  </TableCell>
                  <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                  <TableCell className="font-medium text-destructive">
                    {formatCurrency(order.balance)}
                  </TableCell>
                   <TableCell>
                    {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {outstandingOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No orders with outstanding payments found.
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OutstandingPaymentsPage;
