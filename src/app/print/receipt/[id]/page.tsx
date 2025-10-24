
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/app/dashboard/orders/page";
import { Customer } from "@/app/dashboard/customers/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReceiptPrintPage({ params }: { params: { id: string } }) {
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
        const stitchingItems = order.items.filter(item => item.type === 'stitching' && item.details?.measurements);
        if(stitchingItems.length > 0) {
            setTimeout(() => window.print(), 500);
        }
    }
  }, [loading, order]);

  if (loading) {
    return (
        <div className="p-8">
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="space-y-4">
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
  
  const stitchingItems = order.items.filter(item => item.type === 'stitching' && item.details?.measurements);
    
  if (stitchingItems.length === 0) {
      return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>No Measurements</CardTitle>
                        <CardDescription>There are no stitching items with measurements recorded for order #{order.orderNumber}.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
      )
  }

  return (
    <div className="print-content bg-white text-black p-4">
      <div className="text-center mb-4">
          <h1 className="font-bold text-xl">Measurement Slip</h1>
          <p className="text-sm">Order #{order.orderNumber}</p>
      </div>
      <div className="my-4 border-t border-dashed border-black"></div>
      <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Customer:</span><span className="font-medium">{customer?.name}</span></div>
          <div className="flex justify-between"><span>Delivery:</span><span className="font-medium">{order.deliveryDate ? new Date((order.deliveryDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
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
       <p className="text-xs text-center text-gray-500">StitchSavvy | {new Date().toLocaleString()}</p>
       <style jsx global>{`
        @media print {
          body {
            background-color: white;
          }
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
        }
      `}</style>
    </div>
  );
}
