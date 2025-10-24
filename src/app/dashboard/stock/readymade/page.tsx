
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, deleteDoc, DocumentData } from "firebase/firestore";

export interface ReadyMadeStockItem {
    id: string;
    item: string;
    size: string;
    quantity: number;
    cost: number;
    supplier: string;
    supplierPhone: string;
}

const addStockSchema = z.object({
  item: z.string().min(1, { message: "Item name is required" }),
  customItem: z.string().optional(),
  size: z.string().min(1, { message: "Size is required" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  cost: z.coerce.number().min(1, { message: "Cost is required" }),
  supplier: z.string().min(1, { message: "Supplier name is required" }),
  supplierPhone: z.string().min(10, { message: "Supplier phone must be at least 10 digits" }),
}).refine(data => {
    if (data.item === 'Custom' && !data.customItem) {
        return false;
    }
    return true;
}, {
    message: "Custom item name is required",
    path: ["customItem"],
});

function AddStockForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof addStockSchema>>({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      item: "",
      customItem: "",
      size: "",
      quantity: 1,
      cost: 0,
      supplier: "",
      supplierPhone: "",
    },
  });

  const watchedItem = form.watch("item");
  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof addStockSchema>) => {
    try {
        const finalValues = {
          ...values,
          item: values.item === 'Custom' ? values.customItem : values.item,
        };
        delete (finalValues as Partial<typeof finalValues>).customItem;
        
        await addDoc(collection(db, "readyMadeStock"), finalValues);

        toast({
            title: "Success!",
            description: `Successfully added ${finalValues.quantity} of ${finalValues.item} to stock.`,
        });
        setOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error adding stock: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "There was a problem adding the stock item.",
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sherwani">Sherwani</SelectItem>
                      <SelectItem value="3pc Suit">3pc Suit</SelectItem>
                      <SelectItem value="2pc Suit">2pc Suit</SelectItem>
                      <SelectItem value="Blazer">Blazer</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedItem === 'Custom' && (
                <FormField
                    control={form.control}
                    name="customItem"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Custom Item Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Enter custom item name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., 42 or L" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="Cost per item" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Gupta Textiles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplierPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Add to Inventory"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function ReadyMadeStockPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStockItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ReadyMadeStockItem | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "readyMadeStock"), (snapshot) => {
        const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadyMadeStockItem));
        setReadyMadeStock(stockData);
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    try {
        await deleteDoc(doc(db, "readyMadeStock", currentItem.id));
        toast({
            variant: "destructive",
            title: "Item Deleted",
            description: `${currentItem.item} has been removed from your inventory.`
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete item."
        })
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ready-Made Stock"
        subtitle="Manage your sherwanis, suits, and blazers."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ready-Made Stock</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new item to your inventory.
              </DialogDescription>
            </DialogHeader>
            <AddStockForm setOpen={setOpen} />
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>
            A list of all ready-made items in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyMadeStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.cost)}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    <AlertDialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentItem(item)}>
                                Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the item.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                Yes, Delete Item
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
