
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StitchSavvyLogo } from "@/components/stitch-savvy-logo";
import { Order } from "@/lib/data";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";

interface InvoiceProps {
    order: Order;
}

export function Invoice({ order }: InvoiceProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };
    
    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="p-8 print:p-0">
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
                            <p className="text-muted-foreground">#{order.id}</p>
                            <p>Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                     <Separator />
                    <div>
                        <h3 className="font-semibold">Bill To:</h3>
                        <p>{order.customerName}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 font-semibold py-2 bg-muted rounded-t-lg">
                        <div className="col-span-2 p-2">Item Description</div>
                        <div className="p-2 text-right">Rate</div>
                        <div className="p-2 text-right">Amount</div>
                    </div>
                     <div className="grid grid-cols-4 border-b">
                        <div className="col-span-2 p-2">{order.items}</div>
                        <div className="p-2 text-right">{formatCurrency(order.total)}</div>
                        <div className="p-2 text-right">{formatCurrency(order.total)}</div>
                    </div>
                    <div className="grid grid-cols-4 mt-4">
                        <div className="col-span-3 text-right font-semibold p-2">Subtotal</div>
                        <div className="text-right p-2">{formatCurrency(order.total)}</div>
                    </div>
                     <div className="grid grid-cols-4">
                        <div className="col-span-3 text-right font-semibold p-2">Advance Paid</div>
                        <div className="text-right p-2">{formatCurrency(order.paid)}</div>
                    </div>
                     <Separator />
                      <div className="grid grid-cols-4">
                        <div className="col-span-3 text-right font-bold p-2 text-lg">Balance Due</div>
                        <div className="text-right p-2 font-bold text-lg">{formatCurrency(order.balance)}</div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                     <div className="text-sm text-muted-foreground">
                        <p className="font-semibold">Terms & Conditions</p>
                        <ul className="list-disc list-inside">
                            <li>Goods once sold will not be taken back.</li>
                            <li>Delivery by: {order.deliveryDate}</li>
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
    )
}
