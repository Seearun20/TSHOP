
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/app/dashboard/orders/page";
import { Customer } from "@/app/dashboard/customers/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StitchSavvyLogo } from "@/components/stitch-savvy-logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicePrintPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const fetchOrder = async () => {
        setLoading(true);
        const orderDocRef = doc(db, "orders", params.id);
        const orderSnap = await getDoc(orderDocRef);

        if (orderSnap.exists()) {
          const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
          setOrder(orderData);

          if (orderData.customerId) {
            const customerDocRef = doc(db, "customers", orderData.customerId);
            const customerSnap = await getDoc(customerDocRef);
            if (customerSnap.exists()) {
              setCustomer({ id: customerSnap.id, ...customerSnap.data() } as Customer);
            }
          }
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, [params.id]);

  useEffect(() => {
    if (!loading && order) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, order]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
        <div className="p-8">
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!order) {
    return <div className="p-8">Order not found.</div>;
  }

  return (
    <div className="p-8 print-p-0 print-content bg-white text-black">
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <StitchSavvyLogo className="w-16 h-16 text-black" />
              <h1 className="text-2xl font-bold font-headline mt-2">Raghav Tailors & Fabrics</h1>
              <p className="text-gray-600">123 Fashion Street, New Delhi, 110001</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-black font-headline">Invoice</h2>
              <p className="text-gray-600">#{order.orderNumber}</p>
              <p>Date: {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
            </div>
          </div>
          <Separator className="bg-gray-300"/>
          <div>
            <h3 className="font-semibold">Bill To:</h3>
            <p>{customer?.name}</p>
            <p>{customer?.phone}</p>
            <p>{customer?.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 font-semibold py-2 bg-gray-100 rounded-t-lg px-2">
            <div className="col-span-2">Item Description</div>
            <div className="text-right">Price</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Amount</div>
          </div>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="grid grid-cols-5 border-b border-gray-200 px-2 py-1">
                <div className="col-span-2">{item.name}</div>
                <div className="text-right">{formatCurrency(item.price)}</div>
                <div className="text-right">{item.quantity}</div>
                <div className="text-right">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 mt-4">
            <div className="col-span-4 text-right font-semibold p-2">Subtotal</div>
            <div className="text-right p-2">{formatCurrency(order.subtotal)}</div>
          </div>
          <div className="grid grid-cols-5">
            <div className="col-span-4 text-right font-semibold p-2">Advance Paid</div>
            <div className="text-right p-2">{formatCurrency(order.advance)}</div>
          </div>
          <Separator className="bg-gray-300" />
          <div className="grid grid-cols-5">
            <div className="col-span-4 text-right font-bold p-2 text-lg">Balance Due</div>
            <div className="text-right p-2 font-bold text-lg">{formatCurrency(order.balance)}</div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 p-8 pt-0 print:p-8">
          <div className="text-sm text-gray-600">
            <p className="font-semibold">Terms & Conditions</p>
            <ul className="list-disc list-inside">
              <li>Goods once sold will not be taken back.</li>
              {order.deliveryDate && <li>Delivery by: {new Date((order.deliveryDate as any).seconds * 1000).toLocaleDateString()}</li>}
              <li>Alterations will be charged extra.</li>
            </ul>
          </div>
        </CardFooter>
      </Card>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
