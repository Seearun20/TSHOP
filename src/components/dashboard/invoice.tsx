

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StitchSavvyLogo } from "@/components/stitch-savvy-logo";
import { Order } from "@/app/dashboard/orders/page";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";
import { Customer } from "@/app/dashboard/customers/page";

interface InvoiceProps {
    order: Order;
    customer?: Customer;
}

export function Invoice({ order, customer }: InvoiceProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };
    
    const handlePrint = () => {
        setTimeout(() => window.print(), 100);
    }

    return (
        <DialogContent className="max-w-2xl p-0" onOpenAutoFocus={handlePrint}>
            <div className="p-8 print-p-0 print-content">
                <Card className="print:shadow-none print:border-none">
                    <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <StitchSavvyLogo className="w-16 h-16 text-primary" />
                                <h1 className="text-2xl font-bold font-headline mt-2">Raghav Tailors & Fabrics</h1>
                                <p className="text-muted-foreground">123 Fashion Street, New Delhi, 110001</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-primary font-headline">Invoice</h2>
                                <p className="text-muted-foreground">#{order.id.substring(0,6)}</p>
                                <p>Date: {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold">Bill To:</h3>
                            <p>{customer?.name}</p>
                            <p>{customer?.phone}</p>
                            <p>{customer?.email}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 font-semibold py-2 bg-muted rounded-t-lg px-2">
                            <div className="col-span-2">Item Description</div>
                            <div className="text-right">Price</div>
                            <div className="text-right">Qty</div>
                            <div className="text-right">Amount</div>
                        </div>
                        <div className="space-y-2">
                        {order.items.map((item, index) => (
                             <div key={index} className="grid grid-cols-5 border-b px-2 py-1">
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
                        <Separator />
                        <div className="grid grid-cols-5">
                            <div className="col-span-4 text-right font-bold p-2 text-lg">Balance Due</div>
                            <div className="text-right p-2 font-bold text-lg">{formatCurrency(order.balance)}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4 p-8 pt-0 print:p-8">
                        <div className="text-sm text-muted-foreground">
                            <p className="font-semibold">Terms & Conditions</p>
                            <ul className="list-disc list-inside">
                                <li>Goods once sold will not be taken back.</li>
                                {order.deliveryDate && <li>Delivery by: {new Date(order.deliveryDate.seconds * 1000).toLocaleDateString()}</li>}
                                <li>Alterations will be charged extra.</li>
                            </ul>
                        </div>
                        <Button onClick={handlePrint} className="w-full print:hidden">
                            <Printer className="mr-2"/>
                            Print Invoice
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </DialogContent>
    )
}

    