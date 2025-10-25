

"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/app/dashboard/orders/page";
import { Customer } from "@/app/dashboard/customers/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apparelMeasurements, blazerMeasurements, pantMeasurements, shirtMeasurements } from "@/lib/data";

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
      const stitchingItems = order.items.filter(item => item.type === 'stitching');
      if (stitchingItems.length > 0) {
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
    return <div className="p-8 text-center text-gray-600">Order not found.</div>;
  }
  
  const stitchingItems = order.items.filter(item => item.type === 'stitching');
    
  if (stitchingItems.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Measurements</CardTitle>
            <CardDescription>
              There are no stitching items with measurements recorded for order #{order.orderNumber}.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // One item per slip for better printing
  const ITEMS_PER_SLIP = 1;
  const slips: typeof stitchingItems[][] = [];
  for (let i = 0; i < stitchingItems.length; i += ITEMS_PER_SLIP) {
    slips.push(stitchingItems.slice(i, i + ITEMS_PER_SLIP));
  }
  
  const renderMeasurementGrid = (measurements: Record<string, string>, schema: z.ZodObject<any>) => {
    if (!measurements || Object.keys(measurements).length === 0) return null;

    const relevantMeasurements = Object.keys(schema.shape)
        .map(key => ({ key, value: measurements[key] }))
        .filter(item => item.value);

    if (relevantMeasurements.length === 0) return null;

    return (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {relevantMeasurements.map(item => (
                 <div 
                    key={item.key} 
                    className="flex justify-between items-center border-b border-dotted border-gray-400 pb-0.5"
                    >
                    <span className="text-[10px] text-gray-600 font-medium capitalize">
                        {item.key.replace(/([A-Z])/g, ' $1').replace(/^(coat|basket)\s/, '').trim()}:
                    </span>
                    <span className="text-xs font-bold text-gray-900">{item.value as string}</span>
                </div>
            ))}
        </div>
    );
  };

  const renderSuitMeasurements = (item: OrderItem) => {
    const { apparel, measurements } = item.details;
    return (
        <div className="space-y-3">
            <div>
                <h5 className="font-semibold text-xs text-center uppercase text-gray-500 tracking-wider">Coat</h5>
                {renderMeasurementGrid(measurements, blazerMeasurements)}
            </div>
            <div>
                <h5 className="font-semibold text-xs text-center uppercase text-gray-500 tracking-wider">Pant</h5>
                {renderMeasurementGrid(measurements, pantMeasurements)}
            </div>
            {apparel === '3pc Suit' && measurements.basketLength && (
                <div>
                    <h5 className="font-semibold text-xs text-center uppercase text-gray-500 tracking-wider">Basket</h5>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <div className="flex justify-between items-center border-b border-dotted border-gray-400 pb-0.5">
                            <span className="text-[10px] text-gray-600 font-medium capitalize">Length:</span>
                            <span className="text-xs font-bold text-gray-900">{measurements.basketLength}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
  }

  const renderKurtaPyjamaMeasurements = (item: OrderItem) => {
    const { measurements } = item.details;
    return (
        <div className="space-y-3">
            <div>
                <h5 className="font-semibold text-xs text-center uppercase text-gray-500 tracking-wider">Kurta</h5>
                {renderMeasurementGrid(measurements, shirtMeasurements)}
            </div>
            <div>
                <h5 className="font-semibold text-xs text-center uppercase text-gray-500 tracking-wider">Pyjama</h5>
                {renderMeasurementGrid(measurements, pantMeasurements)}
            </div>
        </div>
    )
  }


  return (
    <div className="print-content bg-gray-100 print:bg-white">
      {slips.map((slipItems, slipIndex) => (
        <div 
          key={slipIndex}
          className="receipt-page bg-white mx-auto print:mx-0"
          style={{ width: '5in', minHeight: '5in' }}
        >
          <div className="h-full flex flex-col p-4 border-4 border-dashed border-gray-800 print:border-gray-800">
            {/* Header */}
            <div className="text-center mb-3 pb-3 border-b-2 border-gray-800">
              <div className="bg-gray-900 text-white py-2 px-4 rounded-lg inline-block">
                <h1 className="font-bold text-base uppercase tracking-wide">Measurement Slip</h1>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-sm font-bold text-gray-900">Order #{order.orderNumber}</p>
                <p className="text-[10px] text-gray-600">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-100 p-3 rounded-lg mb-3 print:bg-gray-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600 font-semibold">Customer:</span>
                  <p className="font-bold text-gray-900">{customer?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-600 font-semibold">Delivery:</span>
                  <p className="font-bold text-gray-900">
                    {order.deliveryDate 
                      ? new Date((order.deliveryDate as any).seconds * 1000).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short"
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
              {customer?.phone && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-600 font-semibold">Phone:</span>
                  <span className="font-bold text-gray-900 ml-1">{customer.phone}</span>
                </div>
              )}
            </div>

            {/* Measurements */}
            <div className="flex-1 space-y-4">
              {slipItems.map((item, index) => {
                const apparelSchema = apparelMeasurements[item.details.apparel];
                if (!apparelSchema) return null;

                const isSuit = item.details.apparel === '2pc Suit' || item.details.apparel === '3pc Suit' || item.details.apparel === 'Sherwani';
                const isKurtaPyjama = item.details.apparel === 'Kurta Pyjama';
                
                return (
                  <div 
                    key={index} 
                    className="bg-white border-2 border-gray-300 rounded-lg p-3 print:border-gray-300"
                  >
                    <div className="bg-gray-900 text-white text-center py-1.5 px-3 rounded mb-2">
                      <h4 className="font-bold uppercase tracking-wider text-sm">
                        {item.details.apparel} (Qty: {item.quantity})
                      </h4>
                    </div>
                    
                    {isKurtaPyjama
                        ? renderKurtaPyjamaMeasurements(item)
                        : isSuit 
                            ? renderSuitMeasurements(item)
                            : renderMeasurementGrid(item.details.measurements, apparelSchema)
                    }
                    
                    {item.details.remarks && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2 print:bg-blue-50">
                        <p className="text-[10px] font-bold text-blue-800">
                          <span className="font-extrabold">Remarks:</span> {item.details.remarks}
                        </p>
                      </div>
                    )}

                    {item.details.isOwnFabric && (
                      <div className="mt-2 bg-yellow-100 border border-yellow-400 rounded px-2 py-1 print:bg-yellow-100">
                        <p className="text-[10px] font-bold text-center text-yellow-800">
                          ⚠️ Customer's Own Fabric
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {slips.length > 1 && (
                <div className="text-center mt-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Slip {slipIndex + 1} of {slips.length}
                  </p>
                </div>
              )}
            </div>

           
          </div>
        </div>
      ))}

      <style jsx global>{`
        @media print {
          @page {
            size: 5in 8in;
            margin: 0.2in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          .receipt-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .receipt-page:last-child {
            page-break-after: auto;
          }
        }
        @media screen {
          .print-content {
            min-height: 100vh;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
