
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
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Order } from "./orders/page";
import { Customer } from "./customers/page";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { ReadyMadeStockItem } from "./stock/readymade/page";
import { FabricStockItem } from "./stock/fabric/page";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStockItem[]>([]);
  const [fabricStock, setFabricStock] = useState<FabricStockItem[]>([]);

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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

    const readyMadeUnsub = onSnapshot(collection(db, "readyMadeStock"), (snapshot) => {
      const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadyMadeStockItem));
      setReadyMadeStock(stockData);
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'readyMadeStock', operation: 'list'}));
    });

    const fabricUnsub = onSnapshot(collection(db, "fabricStock"), (snapshot) => {
      const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricStockItem));
      setFabricStock(stockData);
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({path: 'fabricStock', operation: 'list'}));
    });
    
    return () => {
      ordersUnsub();
      customersUnsub();
      readyMadeUnsub();
      fabricUnsub();
    }
  }, []);

  const monthlySalesData = useMemo(() => {
    const salesByMonth: { [key: string]: number } = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };
    
    orders.forEach(order => {
      if (order.createdAt && typeof order.createdAt.seconds === 'number') {
        const orderDate = new Date(order.createdAt.seconds * 1000);
        const month = orderDate.toLocaleString('default', { month: 'short' });
        if (salesByMonth.hasOwnProperty(month)) {
          salesByMonth[month] += order.subtotal;
        }
      }
    });

    return Object.keys(salesByMonth).map(month => ({
      month,
      sales: salesByMonth[month]
    }));
  }, [orders]);


  const financialSummary = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + order.subtotal, 0);
    
    const readyMadePurchases = readyMadeStock.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const fabricPurchases = fabricStock.reduce((sum, item) => sum + (item.costPerMtr * item.length), 0);
    const totalPurchases = readyMadePurchases + fabricPurchases;
    
    const totalProfit = totalSales - totalPurchases;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newOrders = orders.filter(order => {
      if (order.createdAt && typeof order.createdAt.seconds === 'number') {
        const orderDate = new Date(order.createdAt.seconds * 1000);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }
      return false;
    }).length;

    return { totalSales, totalPurchases, totalProfit, newOrders };
  }, [orders, readyMadeStock, fabricStock]);


  const recentOrders = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c]));
    return orders.slice(0, 5).map(order => ({
      ...order,
      customerName: customerMap.get(order.customerId)?.name || "Unknown",
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

      <FinancialCards summary={financialSummary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart data={monthlySalesData} />
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
