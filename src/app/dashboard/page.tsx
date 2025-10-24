
"use client";

import { PageHeader } from "@/components/page-header";
import { FinancialCards } from "@/components/dashboard/financial-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Order, OrderItem } from "./orders/page";
import { Customer } from "./customers/page";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
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

  const recentOrders = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return orders.map(order => ({
      ...order,
      customerName: customerMap.get(order.customerId)?.name || "Unknown",
      customerEmail: customerMap.get(order.customerId)?.email || "",
    }));
  }, [orders, customers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };
  
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
      <PageHeader title="Dashboard" subtitle="Welcome back, Raghav!" />

      <FinancialCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        #{order.orderNumber}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(order.subtotal)}</TableCell>
                    <TableCell>
                       <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        className="capitalize"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
