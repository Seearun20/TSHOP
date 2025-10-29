
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/app/dashboard/orders/page";
import { Customer } from "@/app/dashboard/customers/page";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/app-logo";
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
    return <div className="p-8 text-center text-gray-600">Order not found.</div>;
  }

  // Split items into pages - approximately 12 items per page to be safe
  const ITEMS_PER_PAGE = 12;
  const pages: typeof order.items[][] = [];
  for (let i = 0; i < order.items.length; i += ITEMS_PER_PAGE) {
    pages.push(order.items.slice(i, i + ITEMS_PER_PAGE));
  }

  const InvoiceHeader = () => (
    <CardHeader className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-white print:bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AppLogo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-headline leading-tight">
                Raghav Tailor & Fabric
              </h1>
              <p className="text-[10px] text-gray-500">Professional Tailoring Services</p>
            </div>
          </div>
          <div className="text-[10px] text-gray-600 space-y-0.5 ml-1">
            <p className="font-medium">Main Market Dineshpur, U.S.Nagar 263152</p>
            <p className="flex items-center gap-1">
              <span className="font-semibold">Phone:</span> 8766877348
            </p>
            <p className="flex items-center gap-1">
              <span className="font-semibold">Instagram:</span> @raghavproffesional
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg">
            <h2 className="text-xl font-bold font-headline">INVOICE</h2>
          </div>
          <div className="mt-2 space-y-0.5">
            <p className="text-xs font-bold text-gray-900">#{order.orderNumber}</p>
            <p className="text-[10px] text-gray-600">
              <span className="font-semibold">Date:</span>{" "}
              {new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
        </div>
      </div>
      
      <Separator className="bg-gray-300" />
      
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 print:bg-gray-50">
        <h3 className="text-xs font-bold text-gray-900 mb-1.5">BILL TO:</h3>
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-gray-900">{customer?.name || "N/A"}</p>
          {customer?.phone && <p className="text-gray-700">📞 {customer.phone}</p>}
          {customer?.email && <p className="text-gray-700">✉️ {customer.email}</p>}
        </div>
      </div>
    </CardHeader>
  );

  const InvoiceFooter = ({ showTotals = false }: { showTotals?: boolean }) => (
    <CardFooter className="flex-col items-start gap-3 p-4 pt-0 border-t border-gray-200 mt-3">
      {showTotals && (
        <div className="w-full space-y-1.5 mb-3">
          <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded">
            <span className="text-xs font-semibold text-gray-700">Subtotal</span>
            <span className="text-xs font-bold text-gray-900">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded">
            <span className="text-xs font-semibold text-gray-700">Advance Paid</span>
            <span className="text-xs font-bold text-green-600">- {formatCurrency(order.advance)}</span>
          </div>
          <Separator className="bg-gray-300" />
          <div className="flex justify-between items-center px-3 py-2 bg-gray-900 text-white rounded-lg">
            <span className="text-sm font-bold">BALANCE DUE</span>
            <span className="text-base font-bold">{formatCurrency(order.balance)}</span>
          </div>
        </div>
      )}
      
      <div className="w-full">
        <h3 className="text-xs font-bold text-gray-900 mb-1.5">TERMS & CONDITIONS</h3>
        <ul className="space-y-0.5 text-[10px] text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-gray-900 font-bold">•</span>
            <span>Goods once sold will not be taken back or exchanged.</span>
          </li>
          {order.deliveryDate && (
            <li className="flex items-start gap-2">
              <span className="text-gray-900 font-bold">•</span>
              <span>
                <span className="font-semibold">Expected Delivery:</span>{" "}
                {new Date((order.deliveryDate as any).seconds * 1000).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-gray-900 font-bold">•</span>
            <span>Any alterations after delivery will be charged extra.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-900 font-bold">•</span>
            <span>Please collect your order within 30 days of completion.</span>
          </li>
        </ul>
      </div>
      
      <Separator className="bg-gray-300 w-full" />
      
      <div className="w-full text-center">
        <p className="text-[10px] text-gray-600 font-medium">
          Thank you for your business! | Follow us: @raghavproffesional
        </p>
      </div>
    </CardFooter>
  );

  return (
    <div className="print-content bg-gray-100 print:bg-white">
      {pages.map((pageItems, pageIndex) => (
        <div 
          key={pageIndex} 
          className="invoice-page bg-white mx-auto print:mx-0" 
          style={{ width: '5in', minHeight: '8in' }}
        >
          <Card className="shadow-lg border-2 border-gray-200 print:shadow-none print:border print:border-gray-300 h-full flex flex-col">
            <InvoiceHeader />

            <CardContent className="p-4 pt-0 flex-1">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 font-bold text-[10px] bg-gray-900 text-white px-3 py-2">
                  <div className="col-span-5">ITEM DESCRIPTION</div>
                  <div className="col-span-2 text-right">PRICE</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-3 text-right">AMOUNT</div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {pageItems.map((item, index) => {
                    const isStitchingWithFabric = item.type === 'stitching' && item.details?.fabricPrice > 0;

                    return (
                      <div 
                        key={index} 
                        className="grid grid-cols-12 gap-2 px-3 py-2 text-xs hover:bg-gray-50 print:hover:bg-transparent"
                      >
                        <div className="col-span-5 font-medium text-gray-900">
                          {item.name}
                          {isStitchingWithFabric && (
                              <div className="text-[10px] text-gray-500 pl-2">
                                  <div>Stitching: {formatCurrency(item.details.stitchingPrice)}</div>
                                  <div>Fabric: {formatCurrency(item.details.fabricPrice)}</div>
                              </div>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-gray-700">{formatCurrency(item.price)}</div>
                        <div className="col-span-2 text-center text-gray-700">{item.quantity}</div>
                        <div className="col-span-3 text-right font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {pageIndex === pages.length - 1 && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded">
                    <span className="text-xs font-semibold text-gray-700">Subtotal</span>
                    <span className="text-xs font-bold text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded">
                    <span className="text-xs font-semibold text-gray-700">Advance Paid</span>
                    <span className="text-xs font-bold text-green-600">- {formatCurrency(order.advance)}</span>
                  </div>
                  <Separator className="bg-gray-300" />
                  <div className="flex justify-between items-center px-3 py-2 bg-gray-900 text-white rounded-lg">
                    <span className="text-sm font-bold">BALANCE DUE</span>
                    <span className="text-base font-bold">{formatCurrency(order.balance)}</span>
                  </div>
                </div>
              )}

              {pageIndex < pages.length - 1 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600 font-semibold">
                    Continued on next page... (Page {pageIndex + 1} of {pages.length})
                  </p>
                </div>
              )}
            </CardContent>

            {pageIndex === pages.length - 1 && <InvoiceFooter />}
          </Card>
        </div>
      ))}

      <style jsx global>{`
        @media print {
          @page {
            size: 5in 8in;
            margin: 0.25in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          .invoice-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .invoice-page:last-child {
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
