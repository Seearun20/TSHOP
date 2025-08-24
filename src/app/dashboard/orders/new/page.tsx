import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { customers, serviceCharges, fabricStock } from "@/lib/data";
import { Separator } from "@/components/ui/separator";

export default function NewOrderPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="New Order" subtitle="Create a new order and generate a measurement receipt."/>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Customer & Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                  <Label htmlFor="customer">Select Customer</Label>
                  <Select>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select an existing customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}
                    </SelectContent>
                  </Select>
                 </div>
                 <div>
                    <Label htmlFor="delivery-date">Delivery Date</Label>
                    <Input id="delivery-date" type="date" />
                 </div>
              </div>
              <div>
                  <Label htmlFor="service">Service Required</Label>
                  <Select>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select a stitching service" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceCharges).map(([service, charge]) => (
                        <SelectItem key={service} value={service}>{service} - {formatCurrency(charge)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
               <div>
                  <Label htmlFor="fabric">Fabric from Store (Optional)</Label>
                  <Select>
                    <SelectTrigger id="fabric">
                      <SelectValue placeholder="Select fabric from stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricStock.map(f => <SelectItem key={f.id} value={f.id}>{f.type} - {formatCurrency(f.costPerMtr)}/mtr</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="font-headline">Measurements</CardTitle>
                <CardDescription>Enter measurements for the stitching job.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Textarea placeholder="Enter all measurements here, e.g., Shirt: Length - 29, Chest - 42, Sleeve - 25..."/>
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="font-headline">Measurement Receipt</CardTitle>
                    <CardDescription>Preview of the receipt for your tailor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between"><span>Order ID:</span> <span>ORD-2407-001</span></div>
                    <div className="flex justify-between"><span>Customer:</span> <span>Rohan Verma</span></div>
                    <div className="flex justify-between"><span>Delivery:</span> <span>2024-08-18</span></div>
                    <Separator/>
                    <p className="font-semibold uppercase">Item: Shirt</p>
                    <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                    L: 29
                    C: 44
                    SL: 26
                    Shoulder: 18.5
                    </div>
                     <Separator/>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Stitching:</span> <span>{formatCurrency(500)}</span></div>
                      <div className="flex justify-between font-bold"><span>Total Bill:</span> <span>{formatCurrency(500)}</span></div>
                    </div>
                    <Button className="w-full">Generate Receipt & Invoice</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
